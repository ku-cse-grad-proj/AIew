import json
from typing import Any, Dict, List
from langchain.memory import ConversationBufferMemory


def _log(memory: ConversationBufferMemory, title: str, payload: Dict[str, Any]) -> None:
    """텍스트 로그 + 구조화 JSON 함께 메모리에 저장"""
    pretty = json.dumps(payload, ensure_ascii=False)
    memory.save_context(
        {"input": f"[{title}]"},
        {"output": pretty[:4000]}  # 너무 긴 경우 4000자까지만
    )

def log_main_questions(memory: ConversationBufferMemory, questions: List[Dict[str, Any]]) -> None:
    _log(memory, "MAIN_QUESTIONS", {"count": len(questions), "items": questions})

def log_shown_question(memory: ConversationBufferMemory, q: Dict[str, Any]) -> None:
    _log(memory, "QUESTION_SHOWN", q)

def log_user_answer(memory: ConversationBufferMemory, question_id: str, answer: str, duration_sec: int) -> None:
    _log(memory, "USER_ANSWER", {
        "question_id": question_id,
        "answer": answer,
        "answer_duration_sec": duration_sec
    })

def log_evaluation(memory: ConversationBufferMemory, evaluation: Dict[str, Any]) -> None:
    _log(memory, "ANSWER_EVALUATION", evaluation)

def log_tail_question(memory: ConversationBufferMemory, followup: Dict[str, Any]) -> None:
    _log(memory, "TAIL_QUESTION", followup)
