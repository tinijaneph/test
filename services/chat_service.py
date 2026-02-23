import vertexai
from vertexai.generative_models import GenerativeModel, Part
import os


class ChatService:
    def __init__(self):
        project_id = os.environ.get("PROJECT_ID")
        region = os.environ.get("REGION", "us-central1")
        vertexai.init(project=project_id, location=region)
        self.model = GenerativeModel("gemini-1.5-pro")

    async def generate_answer(
        self,
        user_message: str,
        search_results: list,
        conversation_history: list
    ) -> dict:
        
        # Build context from search results
        context_parts = []
        sources = []

        for i, result in enumerate(search_results):
            content = ""
            if result.get("extractive_answers"):
                content = " ".join(result["extractive_answers"][:2])
            elif result.get("snippets"):
                content = " ".join(result["snippets"][:2])

            if content:
                context_parts.append(f"[Source {i+1}: {result['title']}]\n{content}")
                sources.append({
                    "title": result["title"],
                    "link": result.get("link", ""),
                    "index": i + 1
                })

        context = "\n\n".join(context_parts)

        # Build conversation history string
        history_text = ""
        for msg in conversation_history[-6:]:  # Last 3 exchanges
            role = "User" if msg["role"] == "user" else "Assistant"
            history_text += f"{role}: {msg['content']}\n"

        system_prompt = f"""You are a helpful HR Policy Navigator assistant. Your role is to answer questions 
strictly based on the company policy documents provided. 

RULES:
- Only answer based on the provided policy context
- If the answer is not in the context, say "I couldn't find information about this in our current policy documents."
- Always cite which policy document your answer comes from using [Source X] notation
- Be concise but thorough
- Maintain a professional, helpful tone

POLICY CONTEXT:
{context}

CONVERSATION HISTORY:
{history_text}
"""

        prompt = f"{system_prompt}\n\nUser: {user_message}\nAssistant:"

        response = self.model.generate_content(prompt)
        
        return {
            "text": response.text,
            "sources": sources
        }