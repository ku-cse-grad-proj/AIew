
from fastapi import APIRouter, Body, Depends, Header
from langchain.memory import ConversationBufferMemory

from app.models.followup import FollowupRequest, FollowupResponse
from app.services.followup_generator import FollowupGeneratorService
from app.services.memory_logger import MemoryManager

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
    memory: ConversationBufferMemory = Depends(MemoryManager.MemoryDep),
) -> FollowupResponse:
    service = FollowupGeneratorService(memory=memory, session_id=x_session_id)

    return service.generate_followups(req, memory)
