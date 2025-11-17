#!/usr/bin/env python3
"""Test and compare AdaptiveLearningSystem vs LearningSystem"""
import sys
from backend.recommendation.learning import LearningSystem, AdaptiveLearningSystem

def compare_learning_systems(user_id: str):
    """Compare outputs of both learning systems"""
    
    print("=" * 70)
    print(f"COMPARING LEARNING SYSTEMS FOR USER: {user_id}")
    print("=" * 70)
    
    # Standard learning system
    standard = LearningSystem()
    standard_weights = standard.get_learned_weights(user_id)
    standard_summary = standard.get_feedback_summary(user_id)
    
    # Adaptive learning system
    adaptive = AdaptiveLearningSystem()
    adaptive_result = adaptive.get_learned_weights_with_confidence(user_id)
    adaptive_weights = adaptive_result['weights']
    
    print("\n📊 STANDARD LEARNING SYSTEM:")
    print(f"   Feedback count: {standard_summary['total_feedback']}")
    print(f"   Feedback with reasons: {standard_summary['with_reasons']}")
    print(f"   Has learned weights: {standard_summary['has_learned_weights']}")
    print(f"\n   Weights:")
    for key, value in standard_weights.items():
        print(f"     {key.capitalize():<15}: {value:.4f}")
    
    print("\n🧠 ADAPTIVE LEARNING SYSTEM:")
    print(f"   Feedback count: {adaptive_result['feedback_count']}")
    print(f"   Confidence: {adaptive_result['confidence']:.4f}")
    print(f"   Consistency score: {adaptive_result['consistency_score']:.4f}")
    print(f"\n   Weights:")
    for key, value in adaptive_weights.items():
        print(f"     {key.capitalize():<15}: {value:.4f}")
    
    print("\n📈 DIFFERENCES:")
    print(f"   {'Component':<15} {'Standard':<12} {'Adaptive':<12} {'Difference':<12}")
    print(f"   {'-'*15} {'-'*12} {'-'*12} {'-'*12}")
    for key in standard_weights:
        diff = adaptive_weights[key] - standard_weights[key]
        print(f"   {key.capitalize():<15} {standard_weights[key]:<12.4f} {adaptive_weights[key]:<12.4f} {diff:+.4f}")
    
    print("\n" + "=" * 70)
    
    if adaptive_result['confidence'] > 0.5:
        print("✅ High confidence in learned weights - user has consistent preferences")
    elif adaptive_result['confidence'] > 0.3:
        print("⚠️  Moderate confidence - more feedback needed for better accuracy")
    else:
        print("❌ Low confidence - need more feedback to learn preferences")
    
    if adaptive_result['consistency_score'] > 0.6:
        print("✅ High consistency - user preferences are stable")
    elif adaptive_result['consistency_score'] > 0.3:
        print("⚠️  Moderate consistency - preferences may be evolving")
    else:
        print("❌ Low consistency - user preferences vary significantly")

if __name__ == "__main__":
    user_id = sys.argv[1] if len(sys.argv) > 1 else "bag4ze"
    compare_learning_systems(user_id)

