#!/usr/bin/env python3
"""Check learning system status for a user"""
import sys
import requests
import json

API_BASE = "http://localhost:8000/api/test"

def check_learning(user_id: str):
    # Get A/B test results
    results_response = requests.get(f"{API_BASE}/ab-test/results?user_id={user_id}")
    results_data = results_response.json()
    
    # Get recommendations (which includes learning status)
    recs_response = requests.get(f"{API_BASE}/recommendations/{user_id}?count=1")
    recs_data = recs_response.json()
    
    print("=" * 60)
    print(f"LEARNING SYSTEM STATUS FOR USER: {user_id}")
    print("=" * 60)
    
    # A/B Test Results
    print(f"\n📊 A/B Test Results:")
    print(f"   Total feedback: {results_data['count']}")
    
    # Count reasons
    reasons_count = {}
    with_reasons = 0
    for r in results_data['results']:
        reasons = r.get('reasons', [])
        if reasons:
            with_reasons += 1
            for reason in reasons:
                reasons_count[reason] = reasons_count.get(reason, 0) + 1
    
    print(f"   Feedback with reasons: {with_reasons}")
    if reasons_count:
        print(f"\n   Reason patterns:")
        for reason, count in sorted(reasons_count.items(), key=lambda x: x[1], reverse=True):
            print(f"     • {reason}: {count} times")
    
    # Learning Status
    learning = recs_data.get('learning', {})
    print(f"\n🧠 Learning System:")
    print(f"   Has learned weights: {learning.get('has_learned_weights', False)}")
    
    # Weight Comparison
    learned = learning.get('learned_weights', {})
    default = learning.get('default_weights', {})
    
    print(f"\n⚖️  Weight Adjustments:")
    print(f"   {'Component':<15} {'Default':<10} {'Learned':<10} {'Change':<10}")
    print(f"   {'-'*15} {'-'*10} {'-'*10} {'-'*10}")
    
    for key in ['personality', 'interest', 'social_needs', 'motivations']:
        def_val = default.get(key, 0)
        learned_val = learned.get(key, 0)
        change = learned_val - def_val
        change_str = f"{change:+.4f}" if change != 0 else "0.0000"
        print(f"   {key.capitalize():<15} {def_val:<10.4f} {learned_val:<10.4f} {change_str:<10}")
    
    print("\n" + "=" * 60)
    
    # Show what this means
    if learning.get('has_learned_weights'):
        print("\n✅ The system IS learning from your feedback!")
        print("   Your preferences are being incorporated into recommendations.")
    else:
        print("\n⏳ The system needs more feedback (minimum 3) to start learning.")

if __name__ == "__main__":
    user_id = sys.argv[1] if len(sys.argv) > 1 else "bag4ze"
    check_learning(user_id)

