import cv2
from fer import FER
import numpy as np

# 모델 초기화 (모듈 import 시 한 번만)
emotion_detector = FER(mtcnn=True)

def video_analysis(path: str, target_samples: int = 100):
    """
    영상 파일 경로를 입력받아 FER 분석 실행.
    약 target_samples 개의 프레임을 균등하게 샘플링하여 감정 분석 수행.
    
    반환: 
        results = [{frame, time, happy, sad, ...}, ...]
        taken = 분석된 프레임 개수
    """
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30  # 기본값 30
    sample_rate = max(1, total_frames // target_samples)  # 최소 1로 보장

    results = []
    frame_idx, taken = 0, 0

    fer_labels = ["happy", "sad", "neutral", "angry", "fear", "surprise"]

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_idx += 1
        if frame_idx % sample_rate != 0:
            continue

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        time_sec = frame_idx / fps

        fer_result = emotion_detector.detect_emotions(rgb)
        if fer_result:
            emotions = fer_result[0]["emotions"]
            result = {"frame": frame_idx, "time": round(time_sec, 2)}
            for label in fer_labels:
                result[label] = round(float(emotions.get(label, 0.0)), 3)
            results.append(result)
        taken += 1

    cap.release()
    return results, taken
