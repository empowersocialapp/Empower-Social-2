import time
from abc import ABC, abstractmethod
from typing import List
from backend.domain.models import Group

class RateLimiter:
    def __init__(self, requests_per_second: float = 1.0):
        self.min_interval = 1.0 / requests_per_second
        self.last_request_time = 0
    
    def wait_if_needed(self):
        """Wait if needed to respect rate limit"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_request_time = time.time()

class BaseScraper(ABC):
    """Abstract base class for scrapers"""
    
    def __init__(self, rate_limit: float = 1.0):
        self.rate_limiter = RateLimiter(rate_limit)
    
    @abstractmethod
    def fetch_groups(self, city: str, max_groups: int = 10) -> List[Group]:
        """Fetch groups from the source"""
        pass
    
    @abstractmethod
    def transform_to_domain(self, raw_data: dict) -> Group:
        """Transform raw scraped data to domain Group model"""
        pass

