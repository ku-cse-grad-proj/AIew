import json
from statistics import mean
from typing import Dict, List

from langchain_core.chat_history import BaseChatMessageHistory

from app.models.event_types import EventType


def extract_evaluation(memory: BaseChatMessageHistory) -> tuple[float, str]:
    """타입 필드 기반 평가 데이터 추출"""
    msgs = memory.messages
    qa_pairs: List[Dict] = []
    scores: List[float] = []
    conversation_blocks: List[str] = []

    # 마지막 답변 텍스트 추적 (ANSWER_RECEIVED에서)
    last_answer_text: str | None = None

    for m in msgs:
        if not isinstance(m.content, str):
            continue

        if m.type != "ai":
            continue

        content = m.content.strip()
        if not content.startswith("{"):
            continue

        try:
            event = json.loads(content)
            event_type = event.get("type")
            data = event.get("data", {})

            # ANSWER_RECEIVED: 답변 텍스트 저장
            if event_type == EventType.ANSWER_RECEIVED:
                last_answer_text = data.get("answer")

            # ANSWER_EVALUATED: 평가 데이터 추출
            elif event_type == EventType.ANSWER_EVALUATED:
                qid = data.get("aiQuestionId")
                score = data.get("overallScore")
                feedback = data.get("feedback")

                if qid is None:
                    continue

                qa = {
                    "aiQuestionId": qid,
                    "overallScore": score,
                    "answerText": last_answer_text or "",
                    "feedback": feedback or "",
                }
                qa_pairs.append(qa)

                if score is not None:
                    scores.append(score)

                block = (
                    f"QID: {qid}\n"
                    f"Answer: {last_answer_text or ''}\n"
                    f"Feedback: {feedback or ''}"
                )
                conversation_blocks.append(block)

                last_answer_text = None  # Reset after processing

        except json.JSONDecodeError:
            continue

    avg_score = round(mean(scores), 2) if scores else 0.0
    conversation_text = "\n\n".join(conversation_blocks)

    return float(avg_score), conversation_text
