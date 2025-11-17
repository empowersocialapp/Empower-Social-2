import pytest
from backend.domain.models import Group, Location, GroupType, UserProfile

def test_group_creation():
    """Test creating a Group"""
    group = Group(
        id="test-1",
        name="Austin Running Club",
        description="Weekly running group",
        member_count=150,
        group_type=GroupType.SPORT,
        location=Location(city="Austin", state="TX"),
        source="meetup",
        url="https://meetup.com/...",
        group_size_category="medium",
        structure_level="structured"
    )
    assert group.name == "Austin Running Club"
    assert group.group_size_category == "medium"
    assert group.group_type == GroupType.SPORT

def test_location_from_city_name():
    """Test Location.from_city_name helper"""
    location = Location.from_city_name("San Francisco")
    assert location.city == "San Francisco"
    assert location.state == "CA"

def test_user_profile_creation():
    """Test creating a UserProfile"""
    profile = UserProfile(
        personality_scores={
            'extraversion': 10,
            'conscientiousness': 12,
            'openness': 8
        },
        interests=['running', 'fitness'],
        location=Location(city="San Francisco", state="CA")
    )
    assert profile.personality_scores['extraversion'] == 10
    assert 'running' in profile.interests

