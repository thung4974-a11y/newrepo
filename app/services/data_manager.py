import json
import os
import uuid
from typing import List, Optional
from app.models import FoodItem, CaseItem, HistoryEntry, Rarity, FoodCreateUpdate

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
FOODS_FILE = os.path.join(DATA_DIR, "foods.json")
CASES_FILE = os.path.join(DATA_DIR, "cases.json")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")


def _read_json(filepath: str, default=None):
    if not os.path.exists(filepath):
        return default if default is not None else []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return default if default is not None else []


def _write_json(filepath: str, data):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class DataManager:
    @staticmethod
    def get_cases() -> List[CaseItem]:
        raw = _read_json(CASES_FILE, [])
        return [CaseItem(**item) for item in raw]

    @staticmethod
    def get_case(case_id: str) -> Optional[CaseItem]:
        cases = DataManager.get_cases()
        for c in cases:
            if c.id == case_id:
                return c
        return None

    @staticmethod
    def get_foods() -> List[FoodItem]:
        raw = _read_json(FOODS_FILE, [])
        return [FoodItem(**item) for item in raw]

    @staticmethod
    def get_foods_by_case(case_id: str) -> List[FoodItem]:
        all_foods = DataManager.get_foods()
        filtered = [f for f in all_foods if case_id in f.cases]
        # If no food found for this specific case, fallback to all foods
        return filtered if filtered else all_foods

    @staticmethod
    def get_food(food_id: str) -> Optional[FoodItem]:
        foods = DataManager.get_foods()
        for f in foods:
            if f.id == food_id:
                return f
        return None

    @staticmethod
    def add_food(food_data: FoodCreateUpdate) -> FoodItem:
        foods = DataManager.get_foods()
        food_id = str(uuid.uuid4())[:8]
        new_food = FoodItem(
            id=food_id,
            name=food_data.name,
            rarity=food_data.rarity,
            price_range=food_data.price_range,
            cases=food_data.cases,
            image=food_data.image,
            description=food_data.description,
            category=food_data.category
        )
        foods.append(new_food)
        _write_json(FOODS_FILE, [f.model_dump() for f in foods])
        return new_food

    @staticmethod
    def update_food(food_id: str, food_data: FoodCreateUpdate) -> Optional[FoodItem]:
        foods = DataManager.get_foods()
        for idx, f in enumerate(foods):
            if f.id == food_id:
                updated = FoodItem(
                    id=food_id,
                    name=food_data.name,
                    rarity=food_data.rarity,
                    price_range=food_data.price_range,
                    cases=food_data.cases,
                    image=food_data.image,
                    description=food_data.description,
                    category=food_data.category
                )
                foods[idx] = updated
                _write_json(FOODS_FILE, [item.model_dump() for item in foods])
                return updated
        return None

    @staticmethod
    def delete_food(food_id: str) -> bool:
        foods = DataManager.get_foods()
        initial_count = len(foods)
        foods = [f for f in foods if f.id != food_id]
        if len(foods) < initial_count:
            _write_json(FOODS_FILE, [item.model_dump() for item in foods])
            return True
        return False

    @staticmethod
    def get_history(limit: int = 50) -> List[HistoryEntry]:
        raw = _read_json(HISTORY_FILE, [])
        entries = [HistoryEntry(**item) for item in raw]
        # Return newest first
        return list(reversed(entries))[:limit]

    @staticmethod
    def add_history(entry: HistoryEntry):
        raw = _read_json(HISTORY_FILE, [])
        raw.append(entry.model_dump())
        _write_json(HISTORY_FILE, raw)

    @staticmethod
    def clear_history():
        _write_json(HISTORY_FILE, [])
