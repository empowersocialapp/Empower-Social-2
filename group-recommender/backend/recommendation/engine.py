from typing import List, Dict, Optional
from backend.domain.models import UserProfile, Group
from backend.recommendation.personality import calculate_personality_fit
from backend.recommendation.embeddings import EmbeddingService
from backend.recommendation.learning import LearningSystem
from backend.infrastructure.database import Database

class RecommendationEngine:
    """
    Enhanced recommendation engine with embeddings and comprehensive personality matching
    Includes learning from A/B test feedback
    """
    
    def __init__(self):
        self.db = Database()
        self.learning = LearningSystem()
        # EmbeddingService uses class methods, no need to instantiate
    
    def recommend(self, user_profile: UserProfile, top_k: int = 10, user_id: Optional[str] = None) -> List[dict]:
        """
        Enhanced recommendation with embeddings and comprehensive personality matching
        Includes learning from A/B test feedback
        
        Default scoring weights:
        - Personality fit: 40%
        - Interest match (embeddings): 35%
        - Social needs: 15%
        - Motivations: 10%
        
        Weights are adjusted based on user feedback if user_id is provided
        """
        # Get learned weights if user_id provided
        if user_id:
            weights = self.learning.get_learned_weights(user_id)
        else:
            weights = self.learning.DEFAULT_WEIGHTS
        
        # Get groups already shown to this user (exclude from recommendations)
        excluded_group_ids = set()
        if user_id:
            ab_results = self.db.get_ab_test_results(user_id=user_id)
            for result in ab_results:
                excluded_group_ids.add(result.variant_a_group_id)
                excluded_group_ids.add(result.variant_b_group_id)
        
        # Get groups in user's city
        db_groups = self.db.get_groups_by_city(user_profile.location.city)
        
        if not db_groups:
            return []
        
        # Convert to domain models and score
        scored = []
        excluded_count = 0
        for db_group in db_groups:
            # Skip groups already shown to this user
            if db_group.id in excluded_group_ids:
                excluded_count += 1
                continue
            group = self.db.db_to_domain(db_group)
            
            # Calculate comprehensive personality fit
            personality_result = calculate_personality_fit(
                user_profile.personality_scores,
                group,
                social_needs=user_profile.social_needs,
                motivations=user_profile.motivations
            )
            personality_score = personality_result['overall']
            
            # Interest match using embeddings
            interest_score = self._calculate_interest_match(
                user_profile.interests,
                group.description,
                group.embedding
            )
            
            # Get component scores
            social_needs_score = personality_result['components'].get('social_needs', 0.5)
            motivations_score = personality_result['components'].get('motivations', 0.5)
            
            # Combined score with learned or default weights
            final_score = (
                personality_score * weights['personality'] +
                interest_score * weights['interest'] +
                social_needs_score * weights['social_needs'] +
                motivations_score * weights['motivations']
            )
            
            scored.append({
                'group': group,
                'personality_score': personality_score,
                'personality_components': personality_result['components'],
                'interest_score': interest_score,
                'social_needs_score': social_needs_score,
                'motivations_score': motivations_score,
                'final_score': final_score,
                'weights_used': weights  # Include weights for transparency
            })
        
        # Sort and return top K
        scored.sort(key=lambda x: x['final_score'], reverse=True)
        result = scored[:top_k]
        
        # Add metadata about exclusions (only if user_id provided)
        if user_id and result:
            # Add exclusion metadata to first item for API response
            result[0]['_metadata'] = {
                'excluded_count': excluded_count,
                'total_groups': len(db_groups)
            }
        
        return result
    
    def _calculate_interest_match(
        self,
        interests: List[str],
        description: str,
        group_embedding: List[float] = None
    ) -> float:
        """
        Calculate interest match using embeddings
        
        Args:
            interests: User's interests
            description: Group description
            group_embedding: Pre-computed group embedding (optional)
        """
        if not interests:
            return 0.5  # Neutral if no interests
        
        return EmbeddingService.calculate_interest_match(
            interests,
            description,
            group_embedding
        )

