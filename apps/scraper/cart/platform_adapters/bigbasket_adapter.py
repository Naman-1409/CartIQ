from typing import List
from cart.validators import ScrapedProduct, UniversalCartItem

class BigBasketAdapter:
    def format_item(self, product: ScrapedProduct, quantity: int = 1) -> UniversalCartItem:
        # BB might have variant IDs, appending to URL if needed, right now we just use the raw URL
        return UniversalCartItem(
            productId=product.productId,
            productUrl=product.productUrl,
            quantity=quantity,
            itemName=product.name
        )

    def validate_cart(self, products: List[ScrapedProduct]) -> bool:
        return all(p.platform == "bigbasket" for p in products)
