#!/usr/bin/env python3
"""
Regenerate embeddings for all groups in the database
Useful when you want to update embeddings after changing descriptions
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.utils.embeddings_helper import generate_embeddings_for_all_groups

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Regenerate embeddings for groups')
    parser.add_argument('--city', type=str, help='City to process (optional, processes all if not specified)')
    
    args = parser.parse_args()
    
    print("🔄 Regenerating embeddings...")
    count = generate_embeddings_for_all_groups(city=args.city)
    print(f"\n✅ Done! Updated {count} groups")

