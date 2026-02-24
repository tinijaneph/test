import vertexai
from vertexai.generative_models import GenerativeModel
import re
import os


class ChatService:
    def __init__(self):
        project_id = os.environ.get("PROJECT_ID")
        region = os.environ.get("REGION", "us-central1")
        vertexai.init(project=project_id, location=region)
        self.model = GenerativeModel("gemini-2.0-flash-001")

    def clean_answer(self, text: str) -> str:
        # Remove "Sources Referenced:" section entirely
        text = re.sub(r'\*?\*?Sources Referenced:?\*?\*?.*', '', text, flags=re.DOTALL | re.IGNORECASE)
        # Remove "[Source X: filename]" patterns  
        text = re.sub(r'\[Source \d+:\s*[^\]]+\]', '', text)
        # Remove excessive [Source X] — keep only first occurrence per sentence
        # Collapse multiple spaces/newlines
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    async def generate_answer(
        self,
        user_message: str,
        search_results: list,
        conversation_history: list
    ) -> dict:

        context_parts = []
        sources = []

        for i, result in enumerate(search_results):
            # Get the best available content
            snippet = ""
            if result.get("snippets"):
                snippet = " ".join(result["snippets"][:2])
            elif result.get("extractive_answers"):
                snippet = " ".join(result["extractive_answers"][:2])

            if snippet:
                context_parts.append(f"[Source {i+1}]\n{snippet}")
                sources.append({
                    "title": result["title"],
                    "link": result.get("link", ""),
                    "index": i + 1,
                    "snippet": snippet  # ← actual passage text
                })

        context = "\n\n".join(context_parts)

        history_text = ""
        for msg in conversation_history[-6:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_text += f"{role}: {msg['content']}\n"

        system_prompt = f"""You are a professional HR Policy Navigator assistant.

RULES:
1. Answer based ONLY on the provided policy context
2. Use [Source X] inline citation maximum ONCE per paragraph — not after every sentence
3. DO NOT add a "Sources Referenced" section — the UI handles sources separately
4. DO NOT list sources at the end of your response
5. Be concise and professional
6. If not found in context: "I couldn't find information about this in our current policy documents. Please contact HR directly."

POLICY CONTEXT:
{context}

CONVERSATION HISTORY:
{history_text}
"""

        prompt = f"{system_prompt}\n\nQuestion: {user_message}\n\nAnswer:"
        response = self.model.generate_content(prompt)

        # Clean the answer to remove any sources section Gemini adds anyway
        cleaned_answer = self.clean_answer(response.text)

        return {
            "text": cleaned_answer,
            "sources": sources
        }
