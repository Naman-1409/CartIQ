import os
import uuid
import json
import jwt
import redis
from datetime import datetime, timedelta
from typing import List, Dict

from cart.validators import ScrapedProduct, UniversalCart, UniversalCartItem
from cart.platform_adapters.blinkit_adapter import BlinkitAdapter
from cart.platform_adapters.zepto_adapter import ZeptoAdapter
from cart.platform_adapters.bigbasket_adapter import BigBasketAdapter

# Read Redis from env or use default localhost during dev
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
JWT_SECRET = os.environ.get("JWT_SECRET", "super-secret-cartiq-extension-key")

class CartOrchestrator:
    def __init__(self):
        self.redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        self.adapters = {
            "blinkit": BlinkitAdapter(),
            "zepto": ZeptoAdapter(),
            "bigbasket": BigBasketAdapter()
        }

    def _get_adapter(self, platform: str):
        if platform not in self.adapters:
            raise ValueError(f"Unsupported platform: {platform}")
        return self.adapters[platform]

    def create_unified_cart(self, platform: str, products: List[ScrapedProduct]) -> UniversalCart:
        adapter = self._get_adapter(platform)
        
        if not adapter.validate_cart(products):
            raise ValueError(f"All products must belong to the selected platform: {platform}")

        cart_id = str(uuid.uuid4())
        items = []

        for p in products:
            if p.inStock:
                # Assuming 1 quantity for MVP, real implementation could have user define quantity or LLM extracts it
                item = adapter.format_item(p, quantity=1)
                items.append(item)
            else:
                # Here we could call out to a substitute mapping engine if product not in stock
                # For Phase 1 we just skip or log
                print(f"Skipping out of stock item: {p.name}")

        return UniversalCart(
            cartId=cart_id,
            platform=platform,
            items=items
        )

    def cache_cart(self, cart: UniversalCart) -> None:
        """Cache cart payload securely with TTL=15 mins"""
        cache_key = f"cart:{cart.cartId}"
        payload = cart.model_dump_json()
        self.redis_client.setex(cache_key, timedelta(minutes=15), payload)

    def sign_payload(self, cart: UniversalCart) -> str:
        """Sign payload so Chrome Extension knows the payload is authentically from CartIQ."""
        payload = {
            "cartId": cart.cartId,
            "platform": cart.platform,
            "exp": datetime.utcnow() + timedelta(minutes=15)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        return token

    def process_frontend_request(self, platform: str, products: List[ScrapedProduct]):
        """Main entry point: convert frontend raw products to unified valid cart, cache & sign."""
        cart = self.create_unified_cart(platform, products)
        self.cache_cart(cart)
        token = self.sign_payload(cart)
        return cart.cartId, token
