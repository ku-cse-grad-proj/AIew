from fastapi import APIRouter, Body, Depends, Header
from langchain_core.chat_history import BaseChatMessageHistory

from app.models.followup import FollowupRequest, FollowupResponse
from app.services.followup_generator import FollowupGeneratorService
from app.services.memory_logger import MemoryManager
from app.utils.langfuse_handler import build_langfuse_config

router = APIRouter()


@router.post(
    "/followup-generating",
    response_model=FollowupResponse,
    tags=["Question"],
    summary="Generate Follow-up Question",
)
def generate_followup(
    x_session_id: str = Header(...),
    req: FollowupRequest = Body(...),
    memory: BaseChatMessageHistory = Depends(MemoryManager.MemoryDep),
) -> FollowupResponse:
    service = FollowupGeneratorService(memory=memory, session_id=x_session_id)
    run_config = build_langfuse_config(session_id=x_session_id, tags=["followup-gen"])

    return service.generate_followups(req, run_config=run_config)
