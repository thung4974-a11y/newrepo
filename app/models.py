from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
import datetime


class Rarity(str, Enum):
    MILSPEC = "milspec"          # Blue
    RESTRICTED = "restricted"    # Purple
    CLASSIFIED = "classified"    # Pink
    COVERT = "covert"            # Red
    GOLD = "gold"                # Yellow/Gold ★


RARITY_META = {
    Rarity.MILSPEC: {
        "name": "Món Quốc Dân (Mil-Spec)",
        "color": "#4b69ff",
        "bg_color": "rgba(75, 105, 255, 0.15)",
        "border_color": "#4b69ff",
        "weight": 65.0
    },
    Rarity.RESTRICTED: {
        "name": "Món Hơi Ngon (Restricted)",
        "color": "#8847ff",
        "bg_color": "rgba(136, 71, 255, 0.15)",
        "border_color": "#8847ff",
        "weight": 22.0
    },
    Rarity.CLASSIFIED: {
        "name": "Món Hạng Sang (Classified)",
        "color": "#d32ce6",
        "bg_color": "rgba(211, 44, 230, 0.15)",
        "border_color": "#d32ce6",
        "weight": 9.0
    },
    Rarity.COVERT: {
        "name": "Món Cực Phẩm (Covert)",
        "color": "#eb4b4b",
        "bg_color": "rgba(235, 75, 75, 0.15)",
        "border_color": "#eb4b4b",
        "weight": 3.5
    },
    Rarity.GOLD: {
        "name": "★ Dao Vàng Đặc Biệt (Special)",
        "color": "#ffd700",
        "bg_color": "rgba(255, 215, 0, 0.2)",
        "border_color": "#ffd700",
        "weight": 0.5
    }
}


class FoodItem(BaseModel):
    id: str
    name: str
    rarity: Rarity
    price_range: str
    cases: List[str] = Field(default_factory=list)
    image: str = "🍲"
    description: str
    category: str = "Món ăn"


class FoodCreateUpdate(BaseModel):
    name: str
    rarity: Rarity
    price_range: str
    cases: List[str]
    image: str = "🍲"
    description: str
    category: str = "Món ăn"


class CaseItem(BaseModel):
    id: str
    name: str
    description: str
    icon: str = "📦"
    badge_color: str = "#4b69ff"


class RouletteItem(BaseModel):
    id: str
    name: str
    rarity: Rarity
    rarity_name: str
    color: str
    image: str
    price_range: str
    description: str
    category: str
    wear: Optional[str] = None
    float_value: Optional[float] = None
    is_stattrak: bool = False
    stattrak_count: int = 0


class OpenCaseResponse(BaseModel):
    case_id: str
    case_name: str
    items: List[RouletteItem]
    winner_index: int
    winning_item: RouletteItem
    jitter_px: int
    opened_at: str


class HistoryEntry(BaseModel):
    id: str
    case_id: str
    case_name: str
    item_id: str
    item_name: str
    rarity: Rarity
    rarity_name: str
    color: str
    image: str
    price_range: str
    wear: str
    float_value: float
    is_stattrak: bool
    stattrak_count: int
    opened_at: str


class TradeUpRequest(BaseModel):
    item_ids: List[str]


class TradeUpResponse(BaseModel):
    success: bool
    message: str
    output_item: Optional[RouletteItem] = None
    target_rarity: Optional[Rarity] = None
