#!/usr/bin/env python3
"""
Create test groups for any city
Usage: python scripts/create_test_data.py [city_key]
Examples:
    python scripts/create_test_data.py          # Uses default (SF)
    python scripts/create_test_data.py denver   # Creates Denver groups
    python scripts/create_test_data.py dc       # Creates DC groups
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.infrastructure.database import Database
from backend.domain.models import Group, Location, GroupType, get_city_info
from backend.config.settings import settings
from backend.recommendation.embeddings import EmbeddingService

def create_test_groups(city: str = None, state: str = None, generate_embeddings: bool = True):
    """
    Create test groups for any city
    
    Args:
        city: City name (defaults to settings.active_city)
        state: State abbreviation (defaults to settings.active_state)
        generate_embeddings: Whether to generate embeddings for descriptions
    """
    db = Database()
    embedding_service = EmbeddingService() if generate_embeddings else None
    
    # Use provided city or default from settings
    city = city or settings.active_city
    state = state or settings.active_state
    
    print(f"Creating test groups for {city}, {state}")
    if generate_embeddings:
        print("Generating embeddings for group descriptions...")
    
    test_groups = [
        Group(
            id=f"{city.lower().replace(' ', '-')}-running-1",
            name=f"{city} Running Club",
            description=f"Weekly running group for all levels in {city}. Join us for regular runs and community building.",
            member_count=150,
            group_type=GroupType.SPORT,
            location=Location(city=city, state=state),
            source="manual",
            url=f"http://test.com/{city.lower().replace(' ', '-')}/running",
            group_size_category="medium",
            structure_level="structured",
            meeting_frequency="weekly"
        ),
        Group(
            id=f"{city.lower().replace(' ', '-')}-book-1",
            name=f"{city} Small Book Club",
            description=f"Intimate book discussions in {city}. Small group focused on deep literary conversations.",
            member_count=12,
            group_type=GroupType.HOBBY,
            location=Location(city=city, state=state),
            source="manual",
            url=f"http://test.com/{city.lower().replace(' ', '-')}/book",
            group_size_category="small",
            structure_level="flexible",
            meeting_frequency="monthly",
            atmosphere="intimate"
        ),
        Group(
            id=f"{city.lower().replace(' ', '-')}-tech-1",
            name=f"{city} Tech Networking",
            description=f"Large networking events for tech professionals in {city}. Connect with industry leaders.",
            member_count=800,
            group_type=GroupType.PROFESSIONAL,
            location=Location(city=city, state=state),
            source="manual",
            url=f"http://test.com/{city.lower().replace(' ', '-')}/tech",
            group_size_category="large",
            structure_level="semi-structured",
            meeting_frequency="biweekly",
            atmosphere="energetic"
        ),
        Group(
            id=f"{city.lower().replace(' ', '-')}-hiking-1",
            name=f"{city} Hiking Group",
            description=f"Weekend hikes near {city}. Explore nature and build friendships on the trail.",
            member_count=320,
            group_type=GroupType.SPORT,
            location=Location(city=city, state=state),
            source="manual",
            url=f"http://test.com/{city.lower().replace(' ', '-')}/hiking",
            group_size_category="medium",
            structure_level="flexible",
            meeting_frequency="weekly",
            atmosphere="relaxed"
        ),
        Group(
            id=f"{city.lower().replace(' ', '-')}-volunteer-1",
            name=f"{city} Volunteer Network",
            description=f"Community service opportunities in {city}. Make a difference together.",
            member_count=95,
            group_type=GroupType.VOLUNTEER,
            location=Location(city=city, state=state),
            source="manual",
            url=f"http://test.com/{city.lower().replace(' ', '-')}/volunteer",
            group_size_category="medium",
            structure_level="structured",
            meeting_frequency="monthly",
            newcomer_friendly=True
        ),
    ]
    
    saved_count = 0
    for group in test_groups:
        # Generate embedding if enabled
        if generate_embeddings and embedding_service and group.description:
            try:
                group.embedding = embedding_service.generate_embedding(group.description)
            except Exception as e:
                print(f"  ⚠️  Warning: Could not generate embedding for {group.name}: {e}")
        
        if db.save_group(group):
            saved_count += 1
            print(f"  ✅ Saved: {group.name}")
        else:
            print(f"  ❌ Failed: {group.name}")
    
    print(f"\n✅ Created {saved_count}/{len(test_groups)} test groups for {city}, {state}")
    if generate_embeddings:
        print("✅ Embeddings generated for all groups")

if __name__ == "__main__":
    # Allow city to be passed as argument
    if len(sys.argv) > 1:
        city_key = sys.argv[1].lower()
        city_info = get_city_info(city_key)
        create_test_groups(city=city_info["city"], state=city_info["state"])
    else:
        # Use default from settings
        create_test_groups()

