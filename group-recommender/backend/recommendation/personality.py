from typing import Dict, Optional, List
from backend.domain.models import Group

def match_extraversion(user_score: float, group: Group) -> float:
    """
    High extraversion (11-14) → Large groups
    Low extraversion (2-6) → Small groups
    Medium (7-10) → Flexible
    """
    if user_score >= 11:  # High
        if group.group_size_category == 'large':
            return 1.0
        elif group.group_size_category == 'medium':
            return 0.7
        else:
            return 0.3
    elif user_score <= 6:  # Low
        if group.group_size_category == 'small':
            return 1.0
        elif group.group_size_category == 'medium':
            return 0.7
        else:
            return 0.2
    else:  # Medium (7-10)
        return 0.7  # Flexible

def match_conscientiousness(user_score: float, group: Group) -> float:
    """
    High conscientiousness (11-14) → Structured groups
    Low conscientiousness (2-6) → Flexible groups
    """
    if user_score >= 11:  # High
        if group.structure_level == 'structured':
            return 1.0
        elif group.structure_level == 'semi-structured':
            return 0.7
        else:
            return 0.3
    elif user_score <= 6:  # Low
        if group.structure_level == 'flexible':
            return 1.0
        elif group.structure_level == 'semi-structured':
            return 0.7
        else:
            return 0.2
    else:  # Medium
        return 0.7

def match_openness(user_score: float, group: Group) -> float:
    """
    High openness (11-14) → Creative, diverse, experimental groups
    Low openness (2-6) → Traditional, familiar, routine groups
    """
    if not group.description:
        return 0.5  # Neutral if no description
    
    description_lower = group.description.lower()
    
    # Keywords for high openness
    creative_keywords = ['creative', 'art', 'experimental', 'diverse', 'novel', 'innovative', 
                        'explore', 'discover', 'variety', 'different', 'unique', 'unconventional']
    
    # Keywords for low openness
    traditional_keywords = ['traditional', 'classic', 'routine', 'established', 'conventional',
                           'regular', 'standard', 'familiar', 'consistent']
    
    if user_score >= 11:  # High openness
        creative_score = sum(1 for kw in creative_keywords if kw in description_lower)
        if creative_score > 0:
            return 1.0
        elif 'diverse' in description_lower or 'variety' in description_lower:
            return 0.8
        else:
            return 0.5  # Neutral
    elif user_score <= 6:  # Low openness
        traditional_score = sum(1 for kw in traditional_keywords if kw in description_lower)
        if traditional_score > 0:
            return 1.0
        elif 'regular' in description_lower or 'routine' in description_lower:
            return 0.8
        else:
            return 0.5  # Neutral
    else:  # Medium (7-10)
        return 0.7  # Flexible

def match_social_needs(
    social_needs: Optional[Dict],
    group: Group
) -> float:
    """
    Match based on social needs (from your existing system)
    High social need → newcomer-friendly, recurring, community-building groups
    """
    if not social_needs:
        return 0.5  # Neutral if no social needs data
    
    score = 0.0
    max_score = 0.0
    
    # Loneliness → prioritize welcoming, active groups
    loneliness = social_needs.get('loneliness_frequency', 3)
    if loneliness >= 4:  # Often lonely
        max_score += 0.3
        if group.newcomer_friendly:
            score += 0.3
        if group.meeting_frequency in ['weekly', 'biweekly']:
            score += 0.2
        if group.atmosphere == 'welcoming' or 'welcoming' in (group.description or '').lower():
            score += 0.2
    
    # Low friend count → prioritize small, intimate groups
    close_friends = social_needs.get('close_friends_count', 5)
    if close_friends <= 3:  # Few friends
        max_score += 0.3
        if group.group_size_category == 'small':
            score += 0.3
        elif group.group_size_category == 'medium':
            score += 0.2
    
    # Social satisfaction → prioritize community-building
    social_satisfaction = social_needs.get('social_satisfaction', 4)
    if social_satisfaction <= 3:  # Low satisfaction
        max_score += 0.2
        if 'community' in (group.description or '').lower() or 'friendship' in (group.description or '').lower():
            score += 0.2
    
    # Normalize score
    if max_score > 0:
        return min(score / max_score, 1.0)
    return 0.5

def match_motivations(
    motivations: Optional[Dict[str, float]],
    group: Group
) -> float:
    """
    Match based on motivations (from your existing system)
    Intrinsic → fun, enjoyable activities
    Social → connection-focused groups
    Achievement → skill-building groups
    """
    if not motivations:
        return 0.5  # Neutral if no motivation data
    
    score = 0.0
    max_score = 0.0
    description_lower = (group.description or '').lower()
    
    # Intrinsic motivation → fun, enjoyable activities
    intrinsic = motivations.get('intrinsic', 0)
    if intrinsic >= 4:
        max_score += 0.3
        if 'fun' in description_lower or 'enjoyable' in description_lower or 'enjoy' in description_lower:
            score += 0.3
        elif group.group_type and group.group_type.value and 'hobby' in group.group_type.value.lower():
            score += 0.2
    
    # Social motivation → connection-focused groups
    social = motivations.get('social', 0)
    if social >= 4:
        max_score += 0.3
        if group.group_type and group.group_type.value and 'social' in group.group_type.value.lower():
            score += 0.3
        elif 'connect' in description_lower or 'community' in description_lower or 'friendship' in description_lower:
            score += 0.2
    
    # Achievement motivation → skill-building groups
    achievement = motivations.get('achievement', 0)
    if achievement >= 4:
        max_score += 0.3
        if group.group_type and group.group_type.value and ('professional' in group.group_type.value.lower() or 'educational' in group.group_type.value.lower()):
            score += 0.3
        elif 'skill' in description_lower or 'learn' in description_lower or 'develop' in description_lower:
            score += 0.2
    
    # Normalize score
    if max_score > 0:
        return min(score / max_score, 1.0)
    return 0.5

def calculate_personality_fit(
    user_personality: Dict[str, float],
    group: Group,
    social_needs: Optional[Dict] = None,
    motivations: Optional[Dict[str, float]] = None
) -> Dict[str, float]:
    """
    Calculate comprehensive personality fit score with all dimensions
    
    Returns:
        Dictionary with individual scores and overall fit
    """
    scores = {}
    
    # Extraversion match
    if group.group_size_category:
        scores['extraversion'] = match_extraversion(
            user_personality['extraversion'],
            group
        )
    
    # Conscientiousness match
    if group.structure_level:
        scores['conscientiousness'] = match_conscientiousness(
            user_personality['conscientiousness'],
            group
        )
    
    # Openness match
    scores['openness'] = match_openness(
        user_personality['openness'],
        group
    )
    
    # Social needs match (optional)
    if social_needs:
        scores['social_needs'] = match_social_needs(social_needs, group)
    
    # Motivation match (optional)
    if motivations:
        scores['motivations'] = match_motivations(motivations, group)
    
    # Calculate overall personality fit (weighted average)
    weights = {
        'extraversion': 0.25,
        'conscientiousness': 0.25,
        'openness': 0.20,
        'social_needs': 0.15,
        'motivations': 0.15
    }
    
    weighted_sum = 0.0
    total_weight = 0.0
    
    for dimension, weight in weights.items():
        if dimension in scores:
            weighted_sum += scores[dimension] * weight
            total_weight += weight
    
    overall_fit = weighted_sum / total_weight if total_weight > 0 else 0.5
    
    return {
        'overall': overall_fit,
        'components': scores
    }

