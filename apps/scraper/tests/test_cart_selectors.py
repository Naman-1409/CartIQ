import pytest
from playwright.sync_api import Page, expect

"""
INTERNAL ENGINEERING USE ONLY.
This file is solely for tracking regression of the target platform's DOM selectors.
Never run this inside the hot-path or production execution engine. 
"""

BLINKIT_URL = "https://blinkit.com/s/?q=tomato"
ZEPTO_URL = "https://www.zeptonow.com/search?query=tomato"
BIGBASKET_URL = "https://www.bigbasket.com/ps/?q=tomato"

@pytest.mark.skip(reason="Run explicitly only for regressions to save bandwidth")
def test_blinkit_selectors(page: Page):
    page.goto(BLINKIT_URL)
    btn = page.locator('div[class*="AddToCart"] button, div.add-btn, button:has-text("ADD")').first
    expect(btn).to_be_visible(timeout=10000)

@pytest.mark.skip(reason="Run explicitly only for regressions to save bandwidth")
def test_zepto_selectors(page: Page):
    page.goto(ZEPTO_URL)
    btn = page.locator('button[data-testid="add-btn"], button:has-text("Add"), .add-to-cart-button').first
    expect(btn).to_be_visible(timeout=10000)

@pytest.mark.skip(reason="Run explicitly only for regressions to save bandwidth")
def test_bigbasket_selectors(page: Page):
    page.goto(BIGBASKET_URL)
    btn = page.locator('button[data-qa="add"], button.bb-button-add, .add-basket').first
    expect(btn).to_be_visible(timeout=10000)
