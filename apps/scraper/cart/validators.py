from pydantic import BaseModel, HttpUrl, Field
from typing import List, Literal, Optional

PlatformT = Literal["blinkit", "zepto", "bigbasket"]

class ScrapedProduct(BaseModel):
    """Product representation returned strictly by scraper"""
    name: str
    platform: PlatformT
    price: float
    productId: str
    variantId: Optional[str] = None
    productUrl: str
    quantityLabel: Optional[str] = None
    inStock: bool
    
class UniversalCartItem(BaseModel):
    """Normalized items in the universal cart"""
    productId: str
    productUrl: str
    quantity: int
    itemName: str

class UniversalCart(BaseModel):
    """The single source of truth for downstream execution (extension)"""
    cartId: str
    platform: PlatformT
    items: List[UniversalCartItem]
    
class CartCreateRequest(BaseModel):
    """Incoming request payload from user frontend"""
    platform: PlatformT
    products: List[ScrapedProduct] = Field(..., description="Selected components from comparison table")

class CartCreateResponse(BaseModel):
    """Outgoing response to frontend with signed orchestrator token"""
    cartId: str
    token: str
    message: str
