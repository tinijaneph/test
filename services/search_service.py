from google.cloud import discoveryengine_v1beta as discoveryengine
import os


class PolicySearchService:
    def __init__(self):
        self.project_id = os.environ.get("PROJECT_ID")
        self.location = "global"
        self.data_store_id = os.environ.get("DATA_STORE_ID", "policy-datastore")
        self.client = discoveryengine.SearchServiceClient()
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
                extractive_content_spec=discoveryengine.SearchRequest.ContentSearchSpec.ExtractiveContentSpec(
                    max_extractive_answer_count=3,
                    max_extractive_segment_count=5,
                )
            ),
        )

        response = self.client.search(request)
        results = []

        for result in response.results:
            doc = result.document
            derived_data = dict(doc.derived_struct_data)
            
            snippets = []
            if "snippets" in derived_data:
                for s in derived_data["snippets"]:
                    if hasattr(s, "snippet"):
                        snippets.append(s.snippet)

            extractive_answers = []
            if "extractive_answers" in derived_data:
                for ea in derived_data["extractive_answers"]:
                    if hasattr(ea, "content"):
                        extractive_answers.append(ea.content)

            results.append({
                "id": doc.id,
                "title": derived_data.get("title", "Policy Document"),
                "link": derived_data.get("link", ""),
                "snippets": snippets,
                "extractive_answers": extractive_answers,
            })

        return results