import os

import httpx


EMBEDDING_DIMENSIONS = 2560


def embed_query(query: str) -> list[float]:
    endpoint = os.environ.get(
        "EMBEDDING_URL", "https://qwen-embedding-4b.tail877c9f.ts.net/v1/embeddings"
    )
    model = os.environ.get("EMBEDDING_MODEL", "Qwen/Qwen3-4B")
    with httpx.Client(timeout=30.0) as client:
        response = client.post(endpoint, json={"model": model, "input": query})
        response.raise_for_status()
        embedding = response.json()["data"][0]["embedding"]

    if (
        not isinstance(embedding, list)
        or len(embedding) != EMBEDDING_DIMENSIONS
        or any(isinstance(value, bool) or not isinstance(value, (int, float)) for value in embedding)
    ):
        raise ValueError(f"Embedding must contain {EMBEDDING_DIMENSIONS} numbers")
    return embedding
