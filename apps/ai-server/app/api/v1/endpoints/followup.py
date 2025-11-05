from typing import List

from fastapi import (
    APIRouter, 
    Depends,
    Header,
    Body
)
from langchain.memory import ConversationBufferMemory

from app.services.memory_logger import MemoryManager
from app.models.followup import (
    FollowupRequest,
    FollowupResponse
)
from app.services.followup_generator import FollowupGeneratorService

router = APIRouter()


@router.post(
    "/followup-generating", 
    response_model=List[FollowupResponse],
    tags=["Question"],
    summary="Generate Follow-up Question"
)
def generate_followup(
    x_session_id: str = Header(...),
    req: FollowupRequest = Body(...), 
    memory: ConversationBufferMemory = Depends(MemoryManager.MemoryDep)
) -> List[FollowupResponse]:
    
    service = FollowupGeneratorService(
        memory=memory, 
        session_id=x_session_id
    )
    
    return service.generate_followups(
        req, 
        memory
    )