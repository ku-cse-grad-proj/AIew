import os
import re
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

PROMPT_BASE_DIR = (
    Path(__file__).resolve().parent.parent / "config" / "prompt"
).resolve()


def load_prompt_template(path: Path) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


_JSON_FENCE_RE = re.compile(r"```json(.*?)```", re.DOTALL)


def strip_json(
    text: str
) -> str:
    m = _JSON_FENCE_RE.search(text)
    if m:
        return m.group(1).strip()
    text = text.strip()
    i, j = text.find("{"), text.rfind("}")
    return text[i : j + 1] if i != -1 and j != -1 and j > i else text


def _get_groq_client():
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise ValueError(
            "GROQ_API_KEY is not set in environment variables or .env file."
        )
    try:
        from groq import Groq

        return Groq(api_key=groq_key)
    except Exception as e:
        raise RuntimeError("Failed to import or create Groq client: %s" % e)


def groq_chat(
    prompt_text: str,
    model: str = "llama-3.1-8b-instant",
    max_tokens: int = 1024,
    temperature: float = 0.8,
    response_format: Optional[dict] = None,
) -> str:
    client = _get_groq_client()
    response_format = response_format or {"type": "json_object"}
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt_text}],
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        response_format=response_format,
    )
    content = chat_completion.choices[0].message.content
    if content is None:
        raise ValueError("Groq API returned no content.")
    return content
