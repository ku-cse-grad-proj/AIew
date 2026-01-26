from typing import Any, Dict, List

from fastapi import (
    APIRouter,
    Depends,
    Header,
)
from langchain_core.chat_history import BaseChatMessageHistory

from app.models.memory import MemoryDump, Message
from app.services.memory_logger import MemoryManager

router = APIRouter()


@router.get(
    "/dump",
    response_model=MemoryDump,
    tags=["Session"],
    summary="Get Session Memory Dump",
)
def get_memory_dump(
    memory: BaseChatMessageHistory = Depends(MemoryManager.MemoryDep),
    x_session_id: str = Header(...),
) -> MemoryDump:
    messages_out: List[Message] = []
    history_parts: List[str] = []

    for m in memory.messages:
        # HumanMessage / AIMessage / SystemMessage 타입명으로 role 매핑
        t = type(m).__name__.lower()
        if "human" in t:
            role = "human"
        elif "ai" in t:
            role = "ai"
        elif "system" in t:
            role = "system"
        else:
            continue

        content = str(m.content)
        messages_out.append(Message(role=role, content=content))
        history_parts.append(f"{role.capitalize()}: {content}")

    history_str = "\n".join(history_parts)

    return MemoryDump(
        session_id=x_session_id, history_str=history_str, messages=messages_out
    )


@router.delete("/reset", tags=["Session"], summary="Reset Session Memory")
def reset_memory(
    memory: BaseChatMessageHistory = Depends(MemoryManager.MemoryDep),
) -> Dict[str, Any]:
    memory.clear()
    return {"ok": True, "message": "memory cleared"}
