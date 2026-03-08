import re
import math
from typing import List

def normalize_query_words(query: str) -> List[str]:
    words = query.lower().split()
    normalized = set()
    for w in words:
        normalized.add(w)
        if len(w) > 3:
            if w.endswith('es'):
                normalized.add(w[:-2])
            if w.endswith('s'):
                normalized.add(w[:-1])
    return list(normalized)

blinkit_products = [
    {"name": "Garden Onion Pakoda Namkeen 150g", "price": 45},
    {"name": "Onion (Pyaz) 1 kg", "price": 29},
    {"name": "Spring Onion 250g", "price": 20}
]

zepto_products = [
    {"name": "Amul Gold Full Cream Fresh Milk", "price": 33},
    {"name": "Amul Lite Milk Fat Spread", "price": 213}
]

def score_product(p, query_words):
    n = p["name"].lower()
    match_count = sum(1 for w in query_words if w in n)
    
    starts_with_bonus = 0
    for w in query_words:
        if n.startswith(w):
            starts_with_bonus = 0.5
            break
            
    # Small length penalty just to break ties safely
    len_penalty = len(n) / 1000.0
    
    score = match_count + starts_with_bonus - len_penalty
    return score

def test_query(platform, products, query):
    query_words = normalize_query_words(query)
    print(f"--- {platform} | Query: '{query}' -> {query_words} ---")
    for p in products:
        s = score_product(p, query_words)
        print(f"  [{s:.3f}] {p['name']}")
    best = max(products, key=lambda p: score_product(p, query_words))
    print(f"  WINNER: {best['name']}\n")

test_query("Blinkit", blinkit_products, "onions")
test_query("Zepto", zepto_products, "amul milk")
