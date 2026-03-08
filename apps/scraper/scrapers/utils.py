import re
import math
from typing import List

def parse_weight_to_grams(weight_str: str) -> float:
    if not weight_str:
        return 0.0
    weight_str = weight_str.lower().replace(" ", "")
    
    # Extract number and unit
    match = re.search(r'([\d.]+)(kg|g|l|ml)', weight_str)
    if not match:
        return 0.0
        
    val = float(match.group(1))
    unit = match.group(2)
    
    if unit in ['kg', 'l']:
        return val * 1000.0
    return val

def calculate_adjusted_quantity(requested_weight: str, matched_name: str, base_quantity: int = 1) -> int:
    if not requested_weight:
        return base_quantity
        
    req_g = parse_weight_to_grams(requested_weight)
    if req_g <= 0:
        return base_quantity
        
    matched_g = parse_weight_to_grams(matched_name)
    if matched_g <= 0:
        return base_quantity
        
    multiplier = math.ceil(req_g / matched_g)
    
    return base_quantity * int(multiplier)

def parse_pieces_from_name(name: str) -> int:
    if not name:
        return 0
    name_lower = name.lower()
    
    # Prioritize exact piece indicators anywhere in the string
    match = re.search(r'(\d+)\s*(?:pcs|pc|pieces|units|eggs)(?!\w)', name_lower)
    if match: return int(match.group(1))
    
    match = re.search(r'(?:pack|set)\s*of\s*(\d+)', name_lower)
    if match: return int(match.group(1))
    
    # Fallback to pack counts if no piece counts are found
    match = re.search(r'(\d+)\s*(?:pack|set)(?!\w)', name_lower)
    if match: return int(match.group(1))
    
    return 0

def get_final_quantity(item, matched_name: str) -> int:
    req_qty = item.quantity
    
    if item.weight:
        req_g = parse_weight_to_grams(item.weight)
        if req_g > 0:
            matched_g = parse_weight_to_grams(matched_name)
            if matched_g > 0:
                multiplier = math.ceil(req_g / matched_g)
                return req_qty * int(multiplier)
    
    matched_pieces = parse_pieces_from_name(matched_name)
    if matched_pieces > 1:
        packs_needed = math.ceil(req_qty / matched_pieces)
        return packs_needed
    
    return req_qty

def get_requested_pieces(item) -> int:
    # If the user asks for a quantity and it has no weight attached to it, 
    # and the category isn't typically sold by weight, return requested pieces.
    if item.weight:
        return 0
    return item.quantity

def normalize_query_words(query: str) -> List[str]:
    """
    Splits the query into words, and stems plurals to singulars
    to prevent overlapping substring score inflation.
    """
    words = query.lower().split()
    normalized = set()
    for w in words:
        if len(w) > 3:
            if w.endswith('oes'):
                normalized.add(w[:-2]) # tomatoes -> tomato, potatoes -> potato
            elif w.endswith('es') and not w.endswith('oes'):
                normalized.add(w[:-2] if w[-3] != 'l' else w) # avoid apples -> appl
            elif w.endswith('s') and not w.endswith('ss'):
                normalized.add(w[:-1]) # eggs -> egg
            else:
                normalized.add(w)
        else:
            normalized.add(w)
    return list(normalized)
