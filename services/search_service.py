from google.cloud import discoveryengine_v1beta as discoveryengine
import os


class PolicySearchService:
    def __init__(self):
        self.project_id = os.environ.get("PROJECT_ID")
        self.location = "us"
        self.data_store_id = os.environ.get("DATA_STORE_ID", "policy-docs-storage_1771827879381")
        
        self.client = discoveryengine.SearchServiceClient(
            client_options={"api_endpoint": "us-discoveryengine.googleapis.com"}
        )
        
        self.serving_config = (
            f"projects/{self.project_id}/locations/{self.location}/"
            f"collections/default_collection/dataStores/{self.data_store_id}/"
            f"servingConfigs/default_config"
        )

    async def search(self, query: str, max_results: int = 5) -> list:
        request = discoveryengine.SearchRequest(
            serving_config=self.serving_config,
            query=query,
            page_size=max_results,
            content_search_spec=discoveryengine.SearchRequest.ContentSearchSpec(
                snippet_spec=discoveryengine.SearchRequest.ContentSearchSpec.SnippetSpec(
                    return_snippet=True,
                    max_snippet_count=3,
                ),
                summary_spec=discoveryengine.SearchRequest.ContentSearchSpec.SummarySpec(
                    summary_result_count=5,
                    include_citations=True,
                    model_spec=discoveryengine.SearchRequest.ContentSearchSpec.SummarySpec.ModelSpec(
                        version="stable"
                    )
                ),
            ),
        )

        response = self.client.search(request)
        results = []

        # Extract summary from response if available
        summary_text = ""
        if hasattr(response, 'summary') and response.summary:
            summary_text = response.summary.summary_text

        for result in response.results:
            doc = result.document
            derived_data = dict(doc.derived_struct_data)

            # Debug: print all available keys
            print(f"DEBUG derived_data keys: {list(derived_data.keys())}")

            # Try all possible content fields
            snippets = []

            # Method 1: standard snippets
            if "snippets" in derived_data:
                for s in derived_data["snippets"]:
                    if hasattr(s, "snippet") and s.snippet:
                        snippets.append(s.snippet)

            # Method 2: chunks (used when chunking is enabled)
            if not snippets and "chunks" in derived_data:
                for chunk in derived_data["chunks"]:
                    if hasattr(chunk, "content") and chunk.content:
                        snippets.append(chunk.content)

            # Method 3: extractive segments
            if not snippets and "extractive_segments" in derived_data:
                for seg in derived_data["extractive_segments"]:
                    if hasattr(seg, "content") and seg.content:
                        snippets.append(seg.content)

            # Method 4: use summary as fallback
            if not snippets and summary_text:
                snippets.append(summary_text)

            # Method 5: get raw content from struct_data
            if not snippets and doc.struct_data:
                struct = dict(doc.struct_data)
                print(f"DEBUG struct_data keys: {list(struct.keys())}")
                if "content" in struct:
                    snippets.append(str(struct["content"]))

            print(f"DEBUG snippets found: {len(snippets)}")

            results.append({
                "id": doc.id,
                "title": derived_data.get("title", doc.id),
                "link": derived_data.get("link", ""),
                "snippets": snippets,
                "extractive_answers": [],
                "summary": summary_text
            })

        return results
