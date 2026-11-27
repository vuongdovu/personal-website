import httpx

EMBEDDING_ENDPOINT="https://qwen-embedding-4b.tail877c9f.ts.net/v1/embeddings"

def embed_query(query: str) -> list[float]:
    payload = {"model": "Qwen/Qwen3-4B", "input": query}
    with httpx.Client() as client:
        try:
            response = client.post(EMBEDDING_ENDPOINT, json=payload)
            response.raise_for_status() 
            return response.json()["data"][0]["embedding"]
        
        except httpx.HTTPStatusError as e:
            # Server responded with a 4xx or 5xx error (e.g., 422 Unprocessable Entity, 500 Internal Server Error)
            print(f"API error {e.response.status_code}: {e.response.text}")
            raise

        except httpx.RequestError as e:
            # Network-level failure (e.g., connection refused, timeout, DNS failure)
            print(f"Network error while connecting to {e.request.url}: {e}")
            raise

        except (KeyError, IndexError, ValueError) as e:
            # Response succeeded (200 OK), but the JSON body didn't match the expected OpenAI/vLLM format
            print(f"Unexpected response structure: {e}")
            raise
                    