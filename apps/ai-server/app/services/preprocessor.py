import re

def clean_text(text: str) -> str:
    """
    기본적인 텍스트 전처리 함수
    - 양쪽 공백 제거
    - 연속 공백 하나로 축소
    - 특수문자 일부 제거(예: 제어문자)
    """
    text = text.strip()
    text = re.sub(r'\s+', ' ', text)
    # 예: 특수문자 제거 (필요시 커스터마이징)
    text = re.sub(r'[^\w\s,.?!]', '', text)
    return text

def split_into_sentences(text: str) -> list[str]:
    """
    문장 단위로 분리 (간단한 마침표, 느낌표, 물음표 기준)
    """
    sentences = re.split(r'(?<=[.?!])\s+', text)
    return [s.strip() for s in sentences if s.strip()]

def preprocess_text(text: str) -> list[str]:
    cleaned = clean_text(text)
    sentences = split_into_sentences(cleaned)
    return sentences
