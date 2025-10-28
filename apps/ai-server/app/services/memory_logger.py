import json
from typing import Any, Dict, List

from langchain.memory import ConversationBufferMemory


def _log(
    memory: ConversationBufferMemory = None, 
    title: str = "", 
    payload: Dict[str, Any] = {}
) -> None:
    
    pretty = json.dumps(payload, ensure_ascii=False, indent=4)
    memory.save_context(
        {"input": f"[{title}]"}, 
        {"output": pretty[:4000]} # prevent exceeding memory limit
    ) 


def log_main_questions(
    memory: ConversationBufferMemory = None, 
    questions: List[Dict[str, Any]] = []
) -> None:
    
    _log(memory, "MAIN_QUESTIONS", questions)


def log_shown_question(
    memory: ConversationBufferMemory = None, 
    questions: Dict[str, Any] = {}
) -> None:
    
    _log(memory, "QUESTION_SHOWN", questions)


def log_user_answer(
    memory: ConversationBufferMemory = None, 
    question_id: str = "", 
    answer: str = "", 
    duration_sec: int = 0
) -> None:
    
    _log(
        memory,
        "USER_ANSWER",
        {
            "question_id": question_id,
            "answer": answer,
            "answer_duration_sec": duration_sec,
        },
    )


def log_evaluation(
    memory: ConversationBufferMemory = None, 
    evaluation: Dict[str, Any] = {}
) -> None:
    
    _log(memory, "ANSWER_EVALUATION", evaluation)


def log_tail_question(
    memory: ConversationBufferMemory = None, 
    followup: Dict[str, Any] = {}
) -> None:
    
    _log(memory, "TAIL_QUESTION", followup)


def log_pdf_parsing(
    memory: ConversationBufferMemory = None,
    parsed_data: Dict[str, Any] = {}
) -> None:
    
    _log(memory, "PDF_PARSE", parsed_data)