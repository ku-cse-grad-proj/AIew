from fastapi import APIRouter, Depends
from langchain.memory import ConversationBufferMemory

from app.api.v1.endpoints.memory_debug import MemoryDep
from app.models.followup import Followup, FollowupRequest
from app.services.followup_generator import generate_followups

router = APIRouter()


@router.post("/followup-generating", response_model=Followup)
def generate_followup(
    req: FollowupRequest, memory: ConversationBufferMemory = Depends(MemoryDep)
):
    followup = generate_followups(req, memory)
    return followup
