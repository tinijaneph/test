from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from services.search_service import PolicySearchService
from services.chat_service import ChatService
from services.firestore_service import FirestoreService
import uvicorn

app = FastAPI(title="Policy Navigator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Lock this down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

search_service = PolicySearchService()
chat_service = ChatService()
firestore_service = FirestoreService()


class ChatRequest(BaseModel):
    message: str
    session_id: str
    user_id: Optional[str] = "anonymous"


class ChatResponse(BaseModel):
    answer: str
    sources: list
    session_id: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Load conversation history from Firestore
        history = await firestore_service.get_session_history(request.session_id)

        # Search policy documents for relevant context
        search_results = await search_service.search(request.message)

        # Generate answer using Gemini with context
        answer = await chat_service.generate_answer(
            user_message=request.message,
            search_results=search_results,
            conversation_history=history
        )

        # Save to Firestore
        await firestore_service.save_message(
            session_id=request.session_id,
            user_id=request.user_id,
            user_message=request.message,
            assistant_message=answer["text"],
            sources=answer["sources"]
        )

        return ChatResponse(
            answer=answer["text"],
            sources=answer["sources"],
            session_id=request.session_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sessions/{user_id}")
async def get_sessions(user_id: str):
    sessions = await firestore_service.get_user_sessions(user_id)
    return {"sessions": sessions}


@app.get("/api/sessions/{session_id}/history")
async def get_history(session_id: str):
    history = await firestore_service.get_session_history(session_id)
    return {"history": history}


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    await firestore_service.delete_session(session_id)
    return {"message": "Session deleted"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
