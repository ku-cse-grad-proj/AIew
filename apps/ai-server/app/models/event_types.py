"""
랭체인 메모리 이벤트 타입 정의

이벤트 소싱 원칙에 따라 과거형으로 정의된 메시지 타입입니다.
모든 타입은 시스템 관점에서 "무엇이 일어났는가"를 나타냅니다.
"""


class EventType:
    """랭체인 메모리에 로깅되는 이벤트 타입 (3개 - 대화 흐름만)"""

    QUESTION_ASKED = "QUESTION_ASKED"  # 질문이 물어짐 (메인/꼬리 통합)
    ANSWER_RECEIVED = "ANSWER_RECEIVED"  # 답변이 수신됨
    ANSWER_EVALUATED = "ANSWER_EVALUATED"  # 답변이 평가됨
