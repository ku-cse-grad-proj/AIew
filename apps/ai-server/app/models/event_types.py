"""
랭체인 메모리 이벤트 타입 정의

이벤트 소싱 원칙에 따라 과거형으로 정의된 메시지 타입입니다.
모든 타입은 시스템 관점에서 "무엇이 일어났는가"를 나타냅니다.
"""


class EventType:
    """랭체인 메모리에 로깅되는 이벤트 타입"""

    # === 신규 타입 (3개 - 대화 흐름만) ===
    QUESTION_ASKED = "QUESTION_ASKED"  # 질문이 물어짐 (메인/꼬리 통합)
    ANSWER_RECEIVED = "ANSWER_RECEIVED"  # 답변이 수신됨
    ANSWER_EVALUATED = "ANSWER_EVALUATED"  # 답변이 평가됨

    # === Deprecated (하위 호환용 - Phase 5에서 제거 예정) ===
    TAIL_QUESTION = "TAIL_QUESTION"  # → QUESTION_ASKED
    QUESTION_SHOWN = "QUESTION_SHOWN"  # → QUESTION_ASKED
    USER_ANSWER = "USER_ANSWER"  # → ANSWER_RECEIVED
    ANSWER_EVALUATION = "ANSWER_EVALUATION"  # → ANSWER_EVALUATED
    PDF_PARSE = "PDF_PARSE"  # → 제거 (메모리에 로깅하지 않음)
