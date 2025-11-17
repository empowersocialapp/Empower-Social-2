# Setup Guide

## ✅ Completed Steps

### 1. Project Structure ✓
- Created modular project structure
- Set up configuration system with city support
- Created domain models (Group, UserProfile, Location)

### 2. Database Infrastructure ✓
- SQLAlchemy setup with SQLite
- Database models and repository pattern
- Test data factory with modular cities

### 3. Personality System ✓
- Ported TIPI personality calculation (proven from your system)
- Personality matching algorithms (extraversion, conscientiousness)
- Test coverage for all personality logic

### 4. Recommendation Engine ✓
- Simple recommendation engine (city filter + personality match)
- Interest matching (keyword-based, ready for embeddings)
- Scoring system (60% personality, 40% interest)

### 5. API ✓
- FastAPI setup with routes
- Group listing endpoint
- Recommendation endpoint
- Personality quiz endpoint

### 6. Testing ✓
- Unit tests for models
- Unit tests for personality calculation
- Unit tests for personality matching
- Database integration tests
- All tests passing (11/11)

## 🚀 Quick Start

### 1. Activate Virtual Environment
```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Create Test Data
```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate

# Default (San Francisco)
python scripts/create_test_data.py

# Other cities
python scripts/create_test_data.py denver
python scripts/create_test_data.py dc
```

### 3. Run Tests
```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate
pytest tests/ -v
```

### 4. Start API Server
```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate
uvicorn backend.api.main:app --reload
```

### 5. Test API
```bash
# Health check
curl http://localhost:8000/health

# List groups
curl http://localhost:8000/api/groups?city=San%20Francisco

# Get recommendations
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "personality_scores": {
      "extraversion": 12,
      "conscientiousness": 10,
      "openness": 8
    },
    "interests": ["running", "fitness"],
    "city": "San Francisco"
  }'
```

## 📊 Current Status

✅ **Working:**
- Domain models and database
- Personality calculation (TIPI)
- Personality matching (extraversion, conscientiousness)
- Test data generation for multiple cities
- Simple recommendation engine
- FastAPI endpoints
- All unit tests passing

🔄 **Next Steps:**
- Add embeddings for better interest matching
- Enhance personality matching (openness dimension)
- Add Meetup scraper
- Add social needs and motivation matching
- Frontend integration

## 🧪 Test Results

```
✅ 11 tests passing
- test_group_creation
- test_location_from_city_name
- test_user_profile_creation
- test_personality_calculation
- test_personality_categories
- test_save_and_retrieve_group
- test_db_to_domain_conversion
- test_extraversion_matching_high
- test_extraversion_matching_low
- test_extraversion_mismatch
- test_personality_fit_calculation
```

## 📁 Project Structure

```
group-recommender/
├── backend/
│   ├── domain/              # Core domain models
│   │   ├── models.py       # Group, UserProfile, Location
│   │   └── personality.py  # TIPI calculation
│   ├── infrastructure/      # Database, scrapers
│   │   ├── database.py     # SQLAlchemy setup
│   │   └── scrapers/       # (Ready for scrapers)
│   ├── recommendation/     # Recommendation engine
│   │   ├── engine.py       # SimpleRecommendationEngine
│   │   └── personality.py  # Personality matching
│   ├── api/                # FastAPI routes
│   │   ├── main.py         # FastAPI app
│   │   └── routes.py        # API endpoints
│   └── config/             # Configuration
│       └── settings.py     # Settings with city support
├── scripts/
│   └── create_test_data.py # Test data factory
├── tests/                   # Unit tests
└── requirements.txt         # Dependencies
```

## 🎯 Modular City Support

The system supports multiple cities out of the box:

```python
# Use default (San Francisco)
python scripts/create_test_data.py

# Switch cities easily
python scripts/create_test_data.py denver
python scripts/create_test_data.py dc
python scripts/create_test_data.py austin
```

Supported cities:
- San Francisco, CA (default)
- Denver, CO
- Washington, DC
- Austin, TX
- New York, NY

## 🔧 Configuration

Edit `.env` to change defaults:
```
DATABASE_URL=sqlite:///groups.db
DEFAULT_CITY=San Francisco
DEFAULT_STATE=CA
```

