from google.cloud import firestore
from datetime import datetime
import uuid


class FirestoreService:
    def __init__(self):
        self.db = firestore.AsyncClient()

    async def save_message(
        self,
        session_id: str,
        user_id: str,
        user_message: str,
        assistant_message: str,
        sources: list
    ):
        session_ref = self.db.collection("chat_sessions").document(session_id)
        
        # Create or update session metadata
        await session_ref.set({
            "user_id": user_id,
            "session_id": session_id,
            "updated_at": datetime.utcnow(),
            "last_message": user_message[:100],
        }, merge=True)

        # Add messages to subcollection
        messages_ref = session_ref.collection("messages")
        
        await messages_ref.add({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.utcnow()
        })
        
        await messages_ref.add({
            "role": "assistant",
            "content": assistant_message,
            "sources": sources,
            "timestamp": datetime.utcnow()
        })

    async def get_session_history(self, session_id: str) -> list:
        messages_ref = (
            self.db.collection("chat_sessions")
            .document(session_id)
            .collection("messages")
            .order_by("timestamp")
            .limit(20)
        )
        
        docs = messages_ref.stream()
        history = []
        async for doc in docs:
            data = doc.to_dict()
            history.append({
                "role": data["role"],
                "content": data["content"],
                "timestamp": data.get("timestamp", ""),
                "sources": data.get("sources", [])
            })
        return history

    async def get_user_sessions(self, user_id: str) -> list:
        sessions_ref = (
            self.db.collection("chat_sessions")
            .where("user_id", "==", user_id)
            .order_by("updated_at", direction=firestore.Query.DESCENDING)
            .limit(20)
        )
        
        docs = sessions_ref.stream()
        sessions = []
        async for doc in docs:
            data = doc.to_dict()
            sessions.append({
                "session_id": data["session_id"],
                "last_message": data.get("last_message", ""),
                "updated_at": str(data.get("updated_at", "")),
            })
        return sessions

    async def delete_session(self, session_id: str):
        session_ref = self.db.collection("chat_sessions").document(session_id)
        
        # Delete all messages in subcollection first
        messages_ref = session_ref.collection("messages")
        docs = messages_ref.stream()
        async for doc in docs:
            await doc.reference.delete()
        
        await session_ref.delete()