import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

PROMPT_BASE_DIR = (
    Path(__file__).resolve().parent.parent / "config" / "prompt"
).resolve()


def load_prompt_template(path: Path) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


# Groq 모델 선택 가이드
# - llama-3.1-8b-instant : 무료 티어 TPM 6K (24K+ 토큰 요청 시 413 오류 발생)
# - llama-3.3-70b-versatile : 무료 티어 TPM 12K, 응답 품질 우수, JSON mode 안정
# 실제 한도/가용성은 https://console.groq.com/docs/models 참조.
# 운영 중 모델 교체가 필요하면 환경변수 GROQ_MODEL 로 오버라이드.
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

llm = ChatGroq(
    model=GROQ_MODEL,
    temperature=0.8,
    max_tokens=2048,
    max_retries=2,
)
