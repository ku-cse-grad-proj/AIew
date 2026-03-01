from dotenv import load_dotenv
from langchain_core.runnables import RunnableConfig
from langfuse.langchain import CallbackHandler

load_dotenv()

langfuse_handler = CallbackHandler()


def build_langfuse_config(
    *, session_id: str, tags: list[str] | None = None
) -> RunnableConfig:
    return {
        "callbacks": [langfuse_handler],
        "metadata": {
            "langfuse_session_id": session_id,
            "langfuse_tags": tags or [],
        },
    }
