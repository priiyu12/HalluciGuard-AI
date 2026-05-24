import numpy as np
import re
from collections import Counter
from app.config import settings

class EmbeddingModelManager:
    def __init__(self):
        self.model = None
        self.model_mode = "unknown"
        self._initialized = False

    def initialize(self):
        if self._initialized:
            return
        
        if settings.DISABLE_TRANSFORMERS:
            self._setup_tfidf_fallback("Disabled by settings")
            return

        try:
            from sentence_transformers import SentenceTransformer
            print("Attempting to load sentence-transformers model...")
            # This loads the model. SentenceTransformer handles local caching automatically.
            self.model = SentenceTransformer(settings.MODEL_NAME)
            self.model_mode = "sentence-transformers"
            print(f"sentence-transformers ({settings.MODEL_NAME}) loaded successfully.")
        except Exception as e:
            self._setup_tfidf_fallback(str(e))
        
        self._initialized = True

    def _setup_tfidf_fallback(self, reason: str):
        print(f"Falling back to TF-IDF. Reason: {reason}")
        self.model = None
        self.model_mode = "tfidf-fallback"
        self._initialized = True

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculates cosine similarity between two texts.
        """
        self.initialize()
        if not text1.strip() or not text2.strip():
            return 0.0
            
        if self.model_mode == "sentence-transformers":
            emb1 = self.model.encode(text1, convert_to_numpy=True)
            emb2 = self.model.encode(text2, convert_to_numpy=True)
            norm1 = np.linalg.norm(emb1)
            norm2 = np.linalg.norm(emb2)
            if norm1 == 0 or norm2 == 0:
                return 0.0
            return float(np.dot(emb1, emb2) / (norm1 * norm2))
        else:
            return self._lexical_similarity(text1, text2)

    def calculate_similarity_batch(self, text: str, candidates: list[str]) -> list[float]:
        """
        Calculates cosine similarity between a single text and a list of candidate texts.
        """
        self.initialize()
        if not text.strip() or not candidates:
            return [0.0] * len(candidates)
            
        if self.model_mode == "sentence-transformers":
            emb_text = self.model.encode(text, convert_to_numpy=True)
            emb_candidates = self.model.encode(candidates, convert_to_numpy=True)
            norm_text = np.linalg.norm(emb_text)
            if norm_text == 0:
                return [0.0] * len(candidates)
                
            similarities = []
            for emb_cand in emb_candidates:
                norm_cand = np.linalg.norm(emb_cand)
                if norm_cand == 0:
                    similarities.append(0.0)
                else:
                    sim = float(np.dot(emb_text, emb_cand) / (norm_text * norm_cand))
                    # Bound to [0.0, 1.0] for simplicity in risk score normalization
                    sim = max(0.0, min(1.0, sim))
                    similarities.append(sim)
            return similarities
        else:
            return [self._lexical_similarity(text, cand) for cand in candidates]

    def _lexical_similarity(self, text1: str, text2: str) -> float:
        """
        Lightweight local fallback inspired by TF-IDF cosine similarity.
        It avoids model downloads and keeps tests responsive in offline environments.
        """
        tokens1 = self._tokens(text1)
        tokens2 = self._tokens(text2)
        if not tokens1 or not tokens2:
            return 0.0

        vocab = set(tokens1) | set(tokens2)
        counts1 = Counter(tokens1)
        counts2 = Counter(tokens2)

        dot = sum(counts1[token] * counts2[token] for token in vocab)
        norm1 = np.sqrt(sum(value * value for value in counts1.values()))
        norm2 = np.sqrt(sum(value * value for value in counts2.values()))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(max(0.0, min(1.0, dot / (norm1 * norm2))))

    def _tokens(self, text: str) -> list[str]:
        return re.findall(r"[a-z0-9]+", text.lower())

embedding_manager = EmbeddingModelManager()
def get_model_mode() -> str:
    embedding_manager.initialize()
    return embedding_manager.model_mode
