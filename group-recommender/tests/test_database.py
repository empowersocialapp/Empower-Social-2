import pytest
from backend.infrastructure.database import Database
from backend.domain.models import Group, Location, GroupType

def test_save_and_retrieve_group():
    """Test saving and retrieving a group"""
    db = Database("sqlite:///test.db")
    
    # Create test group
    group = Group(
        id="test-1",
        name="Test Group",
        description="Test description",
        member_count=50,
        group_type=GroupType.SOCIAL,
        location=Location(city="Test City", state="TS"),
        source="test",
        url="http://test.com"
    )
    
    # Save
    assert db.save_group(group) == True
    
    # Retrieve
    groups = db.get_groups_by_city("Test City")
    assert len(groups) == 1
    assert groups[0].name == "Test Group"
    assert groups[0].member_count == 50

def test_db_to_domain_conversion():
    """Test converting DB model to domain model"""
    db = Database("sqlite:///test.db")
    
    # Create and save group
    group = Group(
        id="test-convert",
        name="Convert Test",
        description="Test",
        member_count=100,
        group_type=GroupType.SPORT,
        location=Location(city="Test", state="TS"),
        source="test",
        url="http://test.com"
    )
    db.save_group(group)
    
    # Retrieve and convert
    db_group = db.get_group_by_id("test-convert")
    domain_group = db.db_to_domain(db_group)
    
    assert domain_group.id == "test-convert"
    assert domain_group.name == "Convert Test"
    assert domain_group.group_type == GroupType.SPORT

