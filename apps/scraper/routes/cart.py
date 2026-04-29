from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from cart.validators import CartCreateRequest, CartCreateResponse
from cart.cart_orchestrator import CartOrchestrator

router = APIRouter()
orchestrator = CartOrchestrator()

@router.post("/create", response_model=CartCreateResponse)
async def create_cart(request: CartCreateRequest):
    """
    Called by Node API Gateway when user clicks Buy.
    Normalizes products, generates cart in Redis, signs token.
    """
    try:
        cart_id, token = orchestrator.process_frontend_request(
            platform=request.platform, 
            products=request.products
        )
        return CartCreateResponse(
            cartId=cart_id,
            token=token,
            message="Cart orchestrated successfully. Extension may proceed."
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error orchestrating cart: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error during Cart Orchestration")
