import json
import os
import re
from pathlib import Path
from typing import Dict, List

from dotenv import load_dotenv
from langchain.prompts import PromptTemplate
from langchain_core.runnables import Runnable
from langchain_openai import ChatOpenAI

from app.models.question import UserInfo

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

PROMPT_PATH = (
    Path(__file__).resolve().parent.parent / "config/prompt/question_prompt.txt"
).resolve()


def load_prompt_template(path: Path) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def generate_questions(user_info: UserInfo) -> List[Dict]:
    raw_prompt = load_prompt_template(PROMPT_PATH)
    prompt_template = PromptTemplate.from_template(raw_prompt)

    llm = ChatOpenAI(
        openai_api_key=OPENAI_API_KEY, temperature=0.3, model_name="gpt-4o"
    )

    chain: Runnable = prompt_template | llm

    prompt_vars = {
        "desired_role": user_info.desired_role,
        "core_values": user_info.core_values,
        "resume_text": user_info.resume_text,
        "portfolio_text": user_info.portfolio_text,
    }

    result = chain.invoke(prompt_vars)
    content = result.content if hasattr(result, "content") else str(result)

    # 응답이 json ... 형태의 코드 블록으로 출력될 경우, 해당 블록 안의 JOSN 문자열만 추출
    match = re.search(r"```json(.*?)```", content, re.DOTALL)
    json_text = match.group(1).strip() if match else content.strip()

    # JSON 문자열을 파싱하여 리스트로 변환
    try:
        questions = json.loads(json_text)
    except json.JSONDecodeError:
        raise ValueError("LLM 응답이 JSON 형식이 아닙니다.")

    return questions
