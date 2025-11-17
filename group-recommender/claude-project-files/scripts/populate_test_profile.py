#!/usr/bin/env python3
"""
Script to populate a test user profile with sample data
Usage: python scripts/populate_test_profile.py <user_id>
"""
import sys
import requests
import json

API_BASE = "http://localhost:8000/api/test"

def populate_profile(user_id: str):
    """Populate user profile with realistic test data"""
    
    # Sample profile data that will create varied scores
    profile_data = {
        "name": "Test User",
        "email": "test@example.com",
        "age": 28,
        "gender": "non-binary",
        "zipcode": "94102",
        
        # Personality quiz (1-7 scale)
        # High extraversion, medium conscientiousness, high openness
        "q1": 6,  # Extraverted, enthusiastic
        "q6": 2,  # NOT reserved, quiet (reverse scored) → high extraversion
        "q3": 5,  # Dependable, self-disciplined
        "q8": 4,  # NOT disorganized (reverse scored) → medium conscientiousness
        "q5": 7,  # Open to new experiences
        "q10": 1,  # NOT conventional (reverse scored) → high openness
        
        # Social needs
        "close_friends": 2,  # Few friends
        "loneliness": 4,  # Often lonely
        "social_satisfaction": 3,  # Low satisfaction
        
        # Motivations (1-5 scale)
        # High intrinsic, medium social, low achievement
        "m1": 5,  # Find activities enjoyable and fun
        "m2": 3,  # Spend time with people I care about
        "m3": 2,  # Develop new skills (low)
        "m4": 5,  # Feel energized and engaged
        "m5": 4,  # Meeting new people is important
        "m6": 2,  # Enjoy challenging myself (low)
        
        # Interests - diverse set
        "interest_categories": ["sports", "outdoor", "social", "learning"],
        "interests": [
            "running", "yoga", "hiking", "biking", 
            "social mixers", "networking", "book clubs", "tech meetups"
        ],
        
        # Preferences
        "free_time": "10-20",
        "travel_distance": "5-15",
        "activity_preferences": ["outdoor", "physical", "structured"],
        
        # Affinity groups (optional)
        "affinity_groups": {}
    }
    
    # Update the profile
    url = f"{API_BASE}/user/{user_id}"
    response = requests.put(url, json=profile_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Profile populated successfully for user: {user_id}")
        print(f"   User ID: {result.get('user_id', user_id)}")
        print(f"   Message: {result.get('message', 'Profile updated')}")
        print("\n📊 Expected Scores:")
        print("   - High Extraversion (12/14) → Will prefer large groups")
        print("   - Medium Conscientiousness (9/14) → Flexible on structure")
        print("   - High Openness (13/14) → Will prefer creative/novel groups")
        print("   - High Social Need → Will prefer newcomer-friendly, weekly groups")
        print("   - High Intrinsic Motivation → Will prefer fun activities")
        print("   - Interests: Running, yoga, hiking, social mixers, tech meetups")
        return True
    else:
        print(f"❌ Error: {response.status_code}")
        try:
            error = response.json()
            print(f"   {error.get('detail', error)}")
        except:
            print(f"   {response.text}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/populate_test_profile.py <user_id>")
        print("Example: python scripts/populate_test_profile.py bag4ze")
        sys.exit(1)
    
    user_id = sys.argv[1]
    print(f"Populating test profile for user: {user_id}\n")
    success = populate_profile(user_id)
    sys.exit(0 if success else 1)

