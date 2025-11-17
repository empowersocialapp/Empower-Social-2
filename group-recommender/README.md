# Group Recommender

A recommendation system that helps users discover local social groups, clubs, and recurring activities based on their personality traits and preferences.

## Features

- **Modular City Support**: Easily switch between cities (San Francisco, Denver, DC, etc.)
- **Personality-Based Matching**: Uses proven Big Five personality assessment (TIPI)
- **Two-Stage Recommendation**: Embedding-based retrieval + personality ranking
- **Group Health Scoring**: Filters out inactive/defunct groups

## Quick Start

### 1. Setup Environment

```bash
# Navigate to project directory
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers (for scraping)
playwright install chromium
```

### 2. Create Test Data

```bash
# Navigate to project directory
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate

# Create test groups for default city (San Francisco)
python scripts/create_test_data.py

# Or for a specific city
python scripts/create_test_data.py denver
python scripts/create_test_data.py dc
```

### 3. Run API Server

```bash
# Navigate to project directory
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate

# Start server
uvicorn backend.api.main:app --reload
```

### 4. Test the API

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
      "extraversion": 10,
      "conscientiousness": 12,
      "openness": 8
    },
    "interests": ["running", "fitness"],
    "city": "San Francisco"
  }'
```

## Project Structure

```
group-recommender/
├── backend/
│   ├── domain/           # Core domain models
│   ├── infrastructure/   # Database, scrapers
│   ├── recommendation/   # Recommendation engine
│   ├── api/              # FastAPI routes
│   └── config/           # Configuration
├── scripts/              # Utility scripts
├── tests/                # Tests
└── requirements.txt
```

## Supported Cities

- San Francisco, CA (default)
- Denver, CO
- Washington, DC
- Austin, TX
- New York, NY

## Development

### Running Tests

```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate
pytest tests/
```

### Creating Test Data for Different Cities

```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate
python scripts/create_test_data.py sf      # San Francisco
python scripts/create_test_data.py denver  # Denver
python scripts/create_test_data.py dc      # Washington DC
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

