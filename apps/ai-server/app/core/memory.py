from typing import Dict
from langchain.memory import ConversationBufferMemory


_memory_store: Dict[str, ConversationBufferMemory] = {}

def get_memory(session_id: str) -> ConversationBufferMemory:
    """세션 ID별로 LangChain Memory를 생성/반환"""
    if session_id not in _memory_store:
        _memory_store[session_id] = ConversationBufferMemory(
            memory_key="history",
            input_key="input",
            output_key="output",
            return_messages=False
        )
    return _memory_store[session_id]
