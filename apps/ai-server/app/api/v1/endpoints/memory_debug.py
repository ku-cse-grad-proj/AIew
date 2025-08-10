from fastapi import APIRouter, Depends, Header, HTTPException
from langchain.memory import ConversationBufferMemory
from pydantic import BaseModel
from typing import List, Literal

from app.core.memory import get_memory


router = APIRouter()

# 세션별 메모리 주입 (X-Session-Id 헤더 사용)
def MemoryDep(x_session_id: str = Header(default=None)) -> ConversationBufferMemory:
    if not x_session_id:
        raise HTTPException(status_code=400, detail="X-Session-Id header required")
    return get_memory(x_session_id)

class Message(BaseModel):
    role: Literal["human", "ai", "system"] = "human"
    content: str

class MemoryDump(BaseModel):
    session_id: str
    history_str: str               # ConversationBufferMemory가 합쳐서 내주는 문자열
    messages: List[Message]        # 원본 메시지 배열 (role, content)

@router.get("/dump", response_model=MemoryDump)
def get_memory_dump(
    memory: ConversationBufferMemory = Depends(MemoryDep),
    x_session_id: str = Header(default=None),
):
    """
    현재 세션의 메모리 전체를 반환:
    - history_str: LangChain이 합쳐서 관리하는 히스토리 문자열
    - messages: 내부 메시지 배열(역직렬화 용이)
    """
    # history_str 가져오기
    vars = memory.load_memory_variables({"input": ""})
    history_str = vars.get("history", "")

    # 원본 messages 배열 가져오기
    msgs = getattr(memory, "chat_memory", None)
    messages_out: List[Message] = []
    if msgs and getattr(msgs, "messages", None):
        for m in msgs.messages:
            role = "human"
            # HumanMessage / AIMessage / SystemMessage 타입명으로 role 매핑
            t = type(m).__name__.lower()
            if "ai" in t:
                role = "ai"
            elif "system" in t:
                role = "system"
            messages_out.append(Message(role=role, content=str(m.content)))

    return MemoryDump(
        session_id=x_session_id, 
        history_str=history_str, 
        messages=messages_out
    )

@router.delete("/reset")
def reset_memory(memory: ConversationBufferMemory = Depends(MemoryDep)):
    """
    현재 세션 메모리를 초기화합니다.
    """
    memory.clear()
    return {"ok": True, "message": "memory cleared"}
