import pytest
from backend.recommendation.personality import match_extraversion, calculate_personality_fit
from backend.domain.models import Group, Location, GroupType

def test_extraversion_matching_high():
    """Test matching high extraversion user to large group"""
    user_score = 12  # High extraversion
    
    large_group = Group(
        id="1", name="Big Social", description="Large social group",
        member_count=500, group_type=GroupType.SOCIAL,
        location=Location("Austin", "TX"),
        source="test", url="...",
        group_size_category="large"
    )
    
    score = match_extraversion(user_score, large_group)
    assert score == 1.0  # Perfect match

def test_extraversion_matching_low():
    """Test matching low extraversion user to small group"""
    user_score = 4  # Low extraversion
    
    small_group = Group(
        id="2", name="Small Intimate", description="Small group",
        member_count=20, group_type=GroupType.SOCIAL,
        location=Location("Austin", "TX"),
        source="test", url="...",
        group_size_category="small"
    )
    
    score = match_extraversion(user_score, small_group)
    assert score == 1.0  # Perfect match

def test_extraversion_mismatch():
    """Test mismatch scenarios"""
    high_user = 12
    small_group = Group(
        id="3", name="Small", description="...",
        member_count=15, group_type=GroupType.SOCIAL,
        location=Location("Austin", "TX"),
        source="test", url="...",
        group_size_category="small"
    )
    
    score = match_extraversion(high_user, small_group)
    assert score == 0.3  # Poor match

def test_personality_fit_calculation():
    """Test overall personality fit calculation"""
    user_personality = {
        'extraversion': 12,
        'conscientiousness': 10,
        'openness': 8
    }
    
    group = Group(
        id="4", name="Test", description="...",
        member_count=300, group_type=GroupType.SOCIAL,
        location=Location("Austin", "TX"),
        source="test", url="...",
        group_size_category="large",
        structure_level="structured"
    )
    
    fit_score = calculate_personality_fit(user_personality, group)
    assert 0 <= fit_score <= 1.0
    assert fit_score > 0.5  # Should be decent match

