from typing import List

from fastapi import (
    APIRouter, 
    Depends,
    Header,
    Body
)
from langchain.memory import ConversationBufferMemory

from app.api.v1.endpoints.memory_debug import MemoryDep
from app.models.followup import (
    FollowupRequest,
    FollowupResponse
)
from app.services.followup_generator import FollowupGeneratorService

router = APIRouter()


@router.post(
    "/generate-followup", 
    response_model=List[FollowupResponse],
    tags=["Question"],
    summary="Generate Follow-up Question"
)
def generate_followup(
    x_session_id: str = Header(...),
    req: FollowupRequest = Body(...), 
    memory: ConversationBufferMemory = Depends(MemoryDep)
) -> List[FollowupResponse]:
    
    service = FollowupGeneratorService(
        memory=memory, 
        session_id=x_session_id
    )
    
    return service.generate_followups(
        req, 
        memory
    )