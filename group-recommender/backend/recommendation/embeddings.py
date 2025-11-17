"""
Embeddings service for semantic similarity matching
Uses sentence-transformers for generating embeddings
"""
from typing import List, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
from backend.config.settings import settings

class EmbeddingService:
    """Service for generating and comparing embeddings"""
    
    _model: Optional[SentenceTransformer] = None
    
    @classmethod
    def get_model(cls) -> SentenceTransformer:
        """Lazy load the embedding model"""
        if cls._model is None:
            model_name = settings.embedding_model
            print(f"Loading embedding model: {model_name}")
            cls._model = SentenceTransformer(model_name)
            print("✅ Embedding model loaded")
        return cls._model
    
    @classmethod
    def generate_embedding(cls, text: str) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        if not text or not text.strip():
            # Return zero vector if text is empty
            model = cls.get_model()
            return [0.0] * model.get_sentence_embedding_dimension()
        
        model = cls.get_model()
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    
    @classmethod
    def generate_embeddings(cls, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts (batch processing)
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        model = cls.get_model()
        embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        return embeddings.tolist()
    
    @classmethod
    def cosine_similarity(cls, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Similarity score between -1 and 1 (typically 0-1 for normalized embeddings)
        """
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        # Handle zero vectors
        if np.all(vec1 == 0) or np.all(vec2 == 0):
            return 0.0
        
        # Calculate cosine similarity
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        similarity = dot_product / (norm1 * norm2)
        return float(similarity)
    
    @classmethod
    def calculate_interest_match(
        cls,
        user_interests: List[str],
        group_description: str,
        group_embedding: Optional[List[float]] = None
    ) -> float:
        """
        Calculate interest match score using embeddings
        
        Args:
            user_interests: List of user interest keywords/phrases
            group_description: Group description text
            group_embedding: Pre-computed group embedding (optional)
            
        Returns:
            Match score between 0 and 1
        """
        if not user_interests:
            return 0.5  # Neutral if no interests
        
        # Generate embedding for group description if not provided
        if group_embedding is None:
            group_embedding = cls.generate_embedding(group_description)
        
        # Generate embeddings for user interests
        interest_embeddings = cls.generate_embeddings(user_interests)
        
        if not interest_embeddings:
            return 0.5
        
        # Calculate similarity with each interest and take the average
        similarities = [
            cls.cosine_similarity(group_embedding, interest_emb)
            for interest_emb in interest_embeddings
        ]
        
        # Average similarity (normalize to 0-1 range)
        avg_similarity = sum(similarities) / len(similarities)
        
        # Normalize: cosine similarity is typically -1 to 1, but for normalized embeddings it's 0-1
        # Map to 0-1 range more explicitly
        return max(0.0, min(1.0, (avg_similarity + 1) / 2))

