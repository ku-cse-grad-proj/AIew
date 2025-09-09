import cv2
import mediapipe as mp
from app.models.face_expression import FaceExpressionResult, FaceExpressionsResponse
from typing import List
from langchain.memory import ConversationBufferMemory

class FaceEvaluationService:
    def __init__(self):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        self.holistic = mp.solutions.holistic.Holistic(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            refine_face_landmarks=True,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )

    def _analyze_frame(self, image):
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        face_results = self.face_mesh.process(image_rgb)
        holistic_results = self.holistic.process(image_rgb)

        frame_results: List[FaceExpressionResult] = []

        if not face_results.multi_face_landmarks:
            for metric in ["tension", "concentration", "naturalness", "gesture", "posture"]:
                frame_results.append(FaceExpressionResult(confidence=0.0, emotion="not_detected", metric=metric))
            return frame_results

        landmarks = face_results.multi_face_landmarks[0].landmark

        # 표정 분석 (긴장, 자신감, 불안, 무표정)
        upper_lip_y = landmarks[13].y
        lower_lip_y = landmarks[14].y
        mouth_opening = lower_lip_y - upper_lip_y

        if mouth_opening < 0.005:
            frame_results.append(FaceExpressionResult(confidence=0.9, emotion="expressionless", metric="tension"))
        elif mouth_opening < 0.01:
            frame_results.append(FaceExpressionResult(confidence=0.9, emotion="tense", metric="tension"))
        elif mouth_opening > 0.04:
            frame_results.append(FaceExpressionResult(confidence=0.9, emotion="surprised", metric="tension"))
        else:
            frame_results.append(FaceExpressionResult(confidence=0.9, emotion="confident", metric="tension"))

        # 시선 방향 (집중, 시선 회피, 혼란)
        left_iris = [landmarks[i] for i in range(474, 478)]
        right_iris = [landmarks[i] for i in range(469, 473)]
        left_iris_x = sum([pt.x for pt in left_iris]) / len(left_iris)
        right_iris_x = sum([pt.x for pt in right_iris]) / len(right_iris)

        if left_iris_x < 0.4 and right_iris_x < 0.4:
            frame_results.append(FaceExpressionResult(confidence=0.95, emotion="looking_left", metric="concentration"))
        elif left_iris_x > 0.6 and right_iris_x > 0.6:
            frame_results.append(FaceExpressionResult(confidence=0.95, emotion="looking_right", metric="concentration"))
        elif 0.45 <= left_iris_x <= 0.55 and 0.45 <= right_iris_x <= 0.55:
            frame_results.append(FaceExpressionResult(confidence=0.95, emotion="focused", metric="concentration"))
        else:
            frame_results.append(FaceExpressionResult(confidence=0.85, emotion="distracted", metric="concentration"))

        # 얼굴 자세 (자연스러움, 불안정함, 고개 기울임)
        nose = landmarks[1]
        left_eye = landmarks[33]
        right_eye = landmarks[263]
        eye_dx = abs(left_eye.x - right_eye.x)
        nose_offset = abs(nose.x - (left_eye.x + right_eye.x) / 2)

        if nose_offset < (eye_dx * 0.05):
            frame_results.append(FaceExpressionResult(confidence=0.9, emotion="balanced", metric="naturalness"))
        elif nose_offset < (eye_dx * 0.1):
            frame_results.append(FaceExpressionResult(confidence=0.8, emotion="slightly_tilted", metric="naturalness"))
        else:
            frame_results.append(FaceExpressionResult(confidence=0.7, emotion="tilted", metric="naturalness"))

        # 손 동작 평가 (적극적, 제한적, 없음)
        if holistic_results.left_hand_landmarks or holistic_results.right_hand_landmarks:
            left_visible = holistic_results.left_hand_landmarks is not None
            right_visible = holistic_results.right_hand_landmarks is not None

            if left_visible and right_visible:
                gesture_score = 0.95
                gesture_emotion = "very_active"
            else:
                gesture_score = 0.85
                gesture_emotion = "active"
        else:
            gesture_score = 0.6
            gesture_emotion = "inactive"

        frame_results.append(FaceExpressionResult(confidence=gesture_score, emotion=gesture_emotion, metric="gesture"))

        # 자세 평가 (안정, 불균형, 기울어짐)
        if holistic_results.pose_landmarks:
            left_shoulder = holistic_results.pose_landmarks.landmark[11]
            right_shoulder = holistic_results.pose_landmarks.landmark[12]
            shoulder_tilt = abs(left_shoulder.y - right_shoulder.y)

            if shoulder_tilt < 0.03:
                posture_score = 0.9
                posture_emotion = "stable"
            elif shoulder_tilt < 0.07:
                posture_score = 0.75
                posture_emotion = "unbalanced"
            else:
                posture_score = 0.6
                posture_emotion = "tilted"
        else:
            posture_score = 0.0
            posture_emotion = "not_detected"

        frame_results.append(FaceExpressionResult(confidence=posture_score, emotion=posture_emotion, metric="posture"))

        return frame_results

    def evaluate_video(self, video_path: str, image_id: str) -> FaceExpressionsResponse:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return FaceExpressionsResponse(results=[], image_id=image_id)

        frame_count = 0
        analyzed_frames = 0
        accumulated = {
            "tension": [],
            "concentration": [],
            "naturalness": [],
            "gesture": [],
            "posture": []
        }

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            if frame_count % 5 != 0:
                continue

            analyzed_frames += 1
            frame_results = self._analyze_frame(frame)
            for res in frame_results:
                accumulated[res.metric].append(res)

        print("Total frames:", frame_count, "Analyzed frames:", analyzed_frames)
        cap.release()

        final_results = []
        for metric, res_list in accumulated.items():
            if not res_list:
                final_results.append(FaceExpressionResult(confidence=0.0, emotion="not_detected", metric=metric))
                continue

            emotion_freq = {}
            confidence_total = 0.0
            for r in res_list:
                emotion_freq[r.emotion] = emotion_freq.get(r.emotion, 0) + 1
                confidence_total += r.confidence

            dominant_emotion = max(emotion_freq.items(), key=lambda x: x[1])[0]
            avg_confidence = confidence_total / len(res_list)

            final_results.append(FaceExpressionResult(
                confidence=round(avg_confidence, 3),
                emotion=dominant_emotion,
                metric=metric
            ))

        return FaceExpressionsResponse(results=final_results, image_id=image_id)
