# Claude Project Export

This directory contains all essential files for the Group Recommender System to be uploaded to a Claude project repository.

## What's Included

### Documentation
- `README.md` - Project overview and setup
- `ENHANCEMENTS.md` - Recent enhancements and features
- `QUICK_START.md` - Quick start guide
- `SETUP.md` - Setup instructions
- `requirements.txt` - Python dependencies
- `.cursorrules` - Project context for Claude

### Backend Code
- `backend/api/` - FastAPI routes (main, test mode, regular routes)
- `backend/recommendation/` - Core recommendation engine, learning system, personality matching, embeddings
- `backend/domain/` - Domain models (User, Group, UserProfile, etc.)
- `backend/infrastructure/` - Database models and operations
- `backend/config/` - Configuration settings
- `backend/utils/` - Utility functions

### Frontend (Test Mode)
- `frontend/test/profile.html` - User profile/survey management
- `frontend/test/recommendations.html` - A/B testing interface

### Scripts
- `scripts/check_learning.py` - Check learning system status
- `scripts/populate_test_profile.py` - Populate test user data

## Key Features

1. **Learning System**: Adjusts recommendation weights based on A/B test feedback
2. **Two-Stage Recommendation**: Embedding retrieval + personality ranking
3. **Test Mode**: Complete A/B testing interface for collecting user feedback
4. **Personality Matching**: Big Five personality traits (Extraversion, Conscientiousness, Openness)

## Upload Instructions

1. Upload the entire `claude-project-files/` directory to your Claude project
2. Claude will understand the project structure from `.cursorrules`
3. All code is ready to use - no database files or cache included

## Excluded

- Database files (`*.db`)
- Python cache (`__pycache__/`, `*.pyc`)
- Virtual environment (`venv/`)
- Test data generation scripts (not needed for understanding)

