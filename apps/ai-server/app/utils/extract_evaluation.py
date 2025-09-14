import json
from typing import Dict, List
from statistics import mean
from langchain.memory import ConversationBufferMemory


def extract_evaluation(memory: ConversationBufferMemory) -> tuple[float, str]:
    msgs = memory.chat_memory.messages
    qa_pairs: List[Dict] = []
    scores: List[float] = []
    conversation_blocks: List[str] = []

    last_human = None

    for m in msgs:
        if m.type == "human":
            last_human = m.content.strip()

        elif m.type == "ai":
            content = m.content.strip()
            if content.startswith("{") and '"overall_score"' in content:
                try:
                    parsed = json.loads(content)
                    qid = parsed.get("question_id")
                    score = parsed.get("overall_score")
                    feedback = parsed.get("feedback")

                    if qid is None:
                        continue
                        
                    qa = {
                        "question_id": qid,
                        "overall_score": score,
                        "answer_text": last_human or "",
                        "feedback": feedback or "",
                    }
                    qa_pairs.append(qa)

                    if score is not None:
                        scores.append(score)

                    block = (
                        f"QID: {qid}\n"
                        f"Answer: {last_human or ''}\n"
                        f"Feedback: {feedback or ''}"
                    )
                    conversation_blocks.append(block)

                    last_human = None # Reset after processing

                except json.JSONDecodeError:
                    continue
    
    avg_score = round(mean(scores), 2) 
    conversation_text = "\n\n".join(conversation_blocks)

    return float(avg_score), conversation_text
