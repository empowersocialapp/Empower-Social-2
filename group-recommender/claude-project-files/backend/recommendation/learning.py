"""
Learning system that analyzes A/B test results and adjusts recommendation weights
"""
from typing import Dict, List, Optional
from backend.infrastructure.database import Database
import json

class LearningSystem:
    """
    Analyzes user feedback from A/B tests and learns preferences
    """
    
    # Default weights (used when no feedback exists)
    DEFAULT_WEIGHTS = {
        'personality': 0.40,
        'interest': 0.35,
        'social_needs': 0.15,
        'motivations': 0.10
    }
    
    # Reason code to weight adjustment mapping
    REASON_WEIGHT_ADJUSTMENTS = {
        'better_interest_match': {'interest': +0.05, 'personality': -0.02, 'social_needs': -0.02, 'motivations': -0.01},
        'more_welcoming': {'social_needs': +0.05, 'personality': -0.02, 'interest': -0.02, 'motivations': -0.01},
        'better_personality_fit': {'personality': +0.05, 'interest': -0.02, 'social_needs': -0.02, 'motivations': -0.01},
        'more_convenient': {'interest': +0.02, 'personality': -0.01},  # Location/preference, doesn't affect core weights much
        'larger_group': {'social_needs': +0.03, 'personality': +0.02},  # Extraversion preference
        'more_structured': {'personality': +0.03, 'social_needs': +0.02},  # Conscientiousness preference
        'more_casual': {'personality': -0.02, 'social_needs': +0.02},  # Lower structure preference
        'better_description': {'interest': +0.02}  # Description quality affects interest perception
    }
    
    def __init__(self):
        self.db = Database()
    
    def get_learned_weights(self, user_id: str, min_feedback_count: int = 3) -> Dict[str, float]:
        """
        Get learned weights for a user based on their A/B test feedback
        
        Args:
            user_id: User ID
            min_feedback_count: Minimum number of feedback items needed to adjust weights
        
        Returns:
            Dictionary of adjusted weights (personality, interest, social_needs, motivations)
        """
        # Get all A/B test results for this user
        ab_results = self.db.get_ab_test_results(user_id=user_id)
        
        if len(ab_results) < min_feedback_count:
            # Not enough feedback yet, return default weights
            return self.DEFAULT_WEIGHTS.copy()
        
        # Start with default weights
        learned_weights = self.DEFAULT_WEIGHTS.copy()
        
        # Track adjustments
        total_adjustments = {
            'personality': 0.0,
            'interest': 0.0,
            'social_needs': 0.0,
            'motivations': 0.0
        }
        
        feedback_count = 0
        
        # Analyze each feedback
        for result in ab_results:
            if not result.reason:
                continue
            
            try:
                reasons = json.loads(result.reason) if isinstance(result.reason, str) else result.reason
                if not reasons or not isinstance(reasons, list):
                    continue
                
                feedback_count += 1
                
                # Apply adjustments for each reason
                for reason_code in reasons:
                    if reason_code in self.REASON_WEIGHT_ADJUSTMENTS:
                        adjustments = self.REASON_WEIGHT_ADJUSTMENTS[reason_code]
                        for weight_key, adjustment in adjustments.items():
                            total_adjustments[weight_key] += adjustment
            except:
                # Skip invalid JSON
                continue
        
        if feedback_count == 0:
            return self.DEFAULT_WEIGHTS.copy()
        
        # Average the adjustments
        avg_adjustments = {
            key: value / feedback_count
            for key, value in total_adjustments.items()
        }
        
        # Apply adjustments to learned weights
        for weight_key in learned_weights:
            learned_weights[weight_key] += avg_adjustments.get(weight_key, 0.0)
        
        # Normalize weights to sum to 1.0
        total = sum(learned_weights.values())
        if total > 0:
            learned_weights = {
                key: value / total
                for key, value in learned_weights.items()
            }
        
        # Ensure weights stay within reasonable bounds (0.05 to 0.60)
        for weight_key in learned_weights:
            learned_weights[weight_key] = max(0.05, min(0.60, learned_weights[weight_key]))
        
        # Renormalize after clamping
        total = sum(learned_weights.values())
        if total > 0:
            learned_weights = {
                key: value / total
                for key, value in learned_weights.items()
            }
        
        return learned_weights
    
    def get_feedback_summary(self, user_id: str) -> Dict:
        """
        Get a summary of user feedback patterns
        
        Returns:
            Dictionary with feedback statistics
        """
        ab_results = self.db.get_ab_test_results(user_id=user_id)
        
        if not ab_results:
            return {
                'total_feedback': 0,
                'with_reasons': 0,
                'reason_counts': {},
                'has_learned_weights': False
            }
        
        reason_counts = {}
        with_reasons = 0
        
        for result in ab_results:
            if result.reason:
                try:
                    reasons = json.loads(result.reason) if isinstance(result.reason, str) else result.reason
                    if reasons and isinstance(reasons, list):
                        with_reasons += 1
                        for reason in reasons:
                            reason_counts[reason] = reason_counts.get(reason, 0) + 1
                except:
                    pass
        
        learned_weights = self.get_learned_weights(user_id)
        has_learned = learned_weights != self.DEFAULT_WEIGHTS
        
        return {
            'total_feedback': len(ab_results),
            'with_reasons': with_reasons,
            'reason_counts': reason_counts,
            'learned_weights': learned_weights,
            'has_learned_weights': has_learned,
            'default_weights': self.DEFAULT_WEIGHTS
        }

