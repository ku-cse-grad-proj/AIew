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


llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.8,
    max_tokens=2048,
    max_retries=2,
)
