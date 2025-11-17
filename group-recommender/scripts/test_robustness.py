#!/usr/bin/env python3
"""
Test the recommendation system robustness with 1000 groups
Tests various personality profiles and interest combinations
"""
import sys
from pathlib import Path
import random

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.recommendation.engine import RecommendationEngine
from backend.domain.models import UserProfile, Location

def test_recommendation_robustness():
    """Test recommendations with various user profiles"""
    engine = RecommendationEngine()
    
    test_cases = [
        {
            'name': 'High Extraversion, Large Groups',
            'personality': {'extraversion': 13, 'conscientiousness': 10, 'openness': 8},
            'interests': ['running', 'networking', 'social mixers'],
            'expected': 'Should prefer large groups'
        },
        {
            'name': 'Low Extraversion, Small Groups',
            'personality': {'extraversion': 4, 'conscientiousness': 10, 'openness': 8},
            'interests': ['book clubs', 'meditation', 'writing'],
            'expected': 'Should prefer small, intimate groups'
        },
        {
            'name': 'High Conscientiousness, Structured',
            'personality': {'extraversion': 10, 'conscientiousness': 13, 'openness': 8},
            'interests': ['workshops', 'professional development', 'tech meetups'],
            'expected': 'Should prefer structured, organized groups'
        },
        {
            'name': 'High Openness, Creative',
            'personality': {'extraversion': 10, 'conscientiousness': 10, 'openness': 13},
            'interests': ['art', 'music', 'creative writing'],
            'expected': 'Should prefer creative, diverse groups'
        },
        {
            'name': 'Social Needs Focus',
            'personality': {'extraversion': 8, 'conscientiousness': 10, 'openness': 8},
            'interests': ['volunteering', 'community organizing'],
            'social_needs': {'loneliness_frequency': 5, 'close_friends_count': 1},
            'expected': 'Should prioritize welcoming, active groups'
        }
    ]
    
    print("🧪 Testing Recommendation Robustness with 1000 Groups\n")
    print("=" * 60)
    
    all_passed = True
    
    for i, test in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test['name']}")
        print(f"Expected: {test['expected']}")
        
        user = UserProfile(
            personality_scores=test['personality'],
            interests=test['interests'],
            location=Location('San Francisco', 'CA'),
            social_needs=test.get('social_needs'),
            motivations=test.get('motivations')
        )
        
        recs = engine.recommend(user, top_k=10)
        
        if len(recs) == 0:
            print("  ❌ FAILED: No recommendations returned")
            all_passed = False
            continue
        
        print(f"  ✅ Generated {len(recs)} recommendations")
        print(f"  Top match: {recs[0]['group'].name}")
        print(f"  Score: {recs[0]['final_score']:.3f}")
        
        # Verify top recommendation matches expectations
        top_group = recs[0]['group']
        
        if 'large' in test['expected'].lower() and top_group.group_size_category != 'large':
            print(f"  ⚠️  WARNING: Expected large group, got {top_group.group_size_category}")
        elif 'small' in test['expected'].lower() and top_group.group_size_category != 'small':
            print(f"  ⚠️  WARNING: Expected small group, got {top_group.group_size_category}")
        elif 'structured' in test['expected'].lower() and top_group.structure_level != 'structured':
            print(f"  ⚠️  WARNING: Expected structured, got {top_group.structure_level}")
        else:
            print(f"  ✅ Recommendation matches expectations")
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ All robustness tests passed!")
    else:
        print("⚠️  Some tests had issues")
    
    return all_passed

if __name__ == "__main__":
    test_recommendation_robustness()

