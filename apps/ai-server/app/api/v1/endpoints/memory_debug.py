from typing import (
    List, 
    Dict, 
    Any
)

from fastapi import (
    APIRouter, 
    Depends, 
    Header, 
)
from langchain.memory import ConversationBufferMemory

from app.models.memory import (
    Message,
    MemoryDump
)
from app.services.memory_logger import MemoryManager 

router = APIRouter()


@router.get(
    "/dump", 
    response_model=MemoryDump,
    tags=["Session"],
    summary="Get Session Memory Dump"
)
def get_memory_dump(
    memory: ConversationBufferMemory = Depends(MemoryManager.MemoryDep),
    x_session_id: str = Header(...),
) -> MemoryDump:
    
    vars = memory.load_memory_variables({})
    history_str = vars.get("history", "")

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

@router.delete(
    "/reset",
    tags=["Session"],
    summary="Reset Session Memory"
)
def reset_memory(
    memory: ConversationBufferMemory = Depends(MemoryManager.MemoryDep)
) -> Dict[str, Any]:

    memory.clear()
    return {
        "ok": True, 
        "message": "memory cleared"
    }
