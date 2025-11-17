# Quick Start Guide

All commands use full paths from your base directory.

## 🚀 Quick Start Commands

### 1. Navigate and Activate Environment
```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate
```

### 2. Create Test Data
```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate
python scripts/create_test_data.py
```

### 3. Start API Server
```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate
uvicorn backend.api.main:app --reload
```

### 4. Open in Browser
- **Main Interface**: http://localhost:8000/
- **API Docs**: http://localhost:8000/docs

## 📋 Common Commands

### Test Different Cities
```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate
python scripts/create_test_data.py denver
python scripts/create_test_data.py dc
```

### Run Tests
```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate
pytest tests/ -v
```

### Check Database
```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate
python -c "from backend.infrastructure.database import Database; db = Database(); groups = db.get_groups_by_city('San Francisco'); print(f'Found {len(groups)} groups')"
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate
uvicorn backend.api.main:app --reload --port 8001
```

### Reinstall Dependencies
```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate
pip install -r requirements.txt
```

