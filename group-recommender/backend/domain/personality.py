from typing import Dict

def calculate_personality_scores(quiz_responses: Dict[str, int]) -> Dict[str, float]:
    """
    Port your proven TIPI calculation
    Q1, Q6 (reversed) → Extraversion
    Q3, Q8 (reversed) → Conscientiousness
    Q5, Q10 (reversed) → Openness
    Range: 2-14 per dimension
    """
    # Reverse score: 8 - original (for Q6, Q8, Q10)
    q6_reversed = 8 - quiz_responses.get('q6', 4)
    q8_reversed = 8 - quiz_responses.get('q8', 4)
    q10_reversed = 8 - quiz_responses.get('q10', 4)
    
    extraversion = quiz_responses.get('q1', 4) + q6_reversed
    conscientiousness = quiz_responses.get('q3', 4) + q8_reversed
    openness = quiz_responses.get('q5', 4) + q10_reversed
    
    def categorize(score: float) -> str:
        if score <= 6:
            return 'low'
        elif score >= 11:
            return 'high'
        else:
            return 'medium'
    
    return {
        'extraversion': extraversion,
        'conscientiousness': conscientiousness,
        'openness': openness,
        'categories': {
            'extraversion': categorize(extraversion),
            'conscientiousness': categorize(conscientiousness),
            'openness': categorize(openness)
        }
    }

