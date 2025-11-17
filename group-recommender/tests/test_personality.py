import pytest
from backend.domain.personality import calculate_personality_scores

def test_personality_calculation():
    """Test personality score calculation (from your proven system)"""
    quiz = {
        'q1': 5,  # Extraversion item
        'q6': 3,  # Reverse scored: 8-3=5, so extraversion = 5+5=10
        'q3': 6,  # Conscientiousness item
        'q8': 2,  # Reverse scored: 8-2=6, so conscientiousness = 6+6=12
        'q5': 7,  # Openness item
        'q10': 1  # Reverse scored: 8-1=7, so openness = 7+7=14
    }
    
    scores = calculate_personality_scores(quiz)
    assert scores['extraversion'] == 10
    assert scores['conscientiousness'] == 12
    assert scores['openness'] == 14
    assert scores['categories']['conscientiousness'] == 'high'
    assert scores['categories']['openness'] == 'high'
    assert scores['categories']['extraversion'] == 'medium'

def test_personality_categories():
    """Test that categories are correctly assigned"""
    # Low scores
    quiz_low = {'q1': 2, 'q6': 6, 'q3': 2, 'q8': 6, 'q5': 2, 'q10': 6}
    scores = calculate_personality_scores(quiz_low)
    assert scores['categories']['extraversion'] == 'low'
    
    # High scores
    quiz_high = {'q1': 7, 'q6': 1, 'q3': 7, 'q8': 1, 'q5': 7, 'q10': 1}
    scores = calculate_personality_scores(quiz_high)
    assert scores['categories']['extraversion'] == 'high'

