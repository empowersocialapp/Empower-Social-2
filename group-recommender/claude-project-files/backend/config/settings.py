from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///groups.db"
    
    # Default city (can be overridden)
    default_city: str = "San Francisco"
    default_state: str = "CA"
    
    # Scraping
    scraping_enabled: bool = True
    embedding_model: str = "all-MiniLM-L6-v2"
    
    # For testing - can override
    test_city: Optional[str] = None  # Override default for tests
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )

    @property
    def active_city(self) -> str:
        """Get the active city (test override or default)"""
        return self.test_city or self.default_city
    
    @property
    def active_state(self) -> str:
        """Get the active state based on city"""
        return self._get_state_for_city(self.active_city)
    
    def _get_state_for_city(self, city: str) -> str:
        """Map city to state"""
        city_state_map = {
            "San Francisco": "CA",
            "Denver": "CO",
            "Washington": "DC",
            "Washington DC": "DC",
            "DC": "DC",
            "Austin": "TX",
            "New York": "NY",
            "Seattle": "WA",
            "Portland": "OR"
        }
        return city_state_map.get(city, "CA")  # Default to CA

settings = Settings()

