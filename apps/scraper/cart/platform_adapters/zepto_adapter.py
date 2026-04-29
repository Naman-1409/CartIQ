from typing import List
from cart.validators import ScrapedProduct, UniversalCartItem

class ZeptoAdapter:
    def format_item(self, product: ScrapedProduct, quantity: int = 1) -> UniversalCartItem:
        return UniversalCartItem(
            productId=product.productId,
            productUrl=product.productUrl,
            quantity=quantity,
            itemName=product.name
        )

    def validate_cart(self, products: List[ScrapedProduct]) -> bool:
        return all(p.platform == "zepto" for p in products)
