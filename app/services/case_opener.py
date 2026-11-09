import random
import uuid
from datetime import datetime
from typing import List, Tuple, Optional
from app.models import (
    Rarity,
    RARITY_META,
    FoodItem,
    RouletteItem,
    OpenCaseResponse,
    HistoryEntry,
    TradeUpResponse
)
from app.services.data_manager import DataManager

WEAR_TIERS = [
    (0.07, "Factory New (Mới ra lò nóng hổi)"),
    (0.15, "Minimal Wear (Vừa thổi vừa ăn)"),
    (0.38, "Field-Tested (Đầy đủ rau dưa gia vị)"),
    (0.45, "Well-Worn (Bọc hộp xốp mang về)"),
    (1.00, "Battle-Scarred (Ship trễ 30p, nguội ngắt)")
]


def _generate_wear_and_float() -> Tuple[str, float]:
    float_val = round(random.uniform(0.0010, 0.9990), 4)
    wear_name = WEAR_TIERS[-1][1]
    for max_float, name in WEAR_TIERS:
        if float_val <= max_float:
            wear_name = name
            break
    return wear_name, float_val


def _food_to_roulette_item(food: FoodItem, is_winner: bool = False) -> RouletteItem:
    meta = RARITY_META.get(food.rarity, RARITY_META[Rarity.MILSPEC])
    
    wear, float_val = _generate_wear_and_float()
    
    # 10% chance for StatTrak
    is_stattrak = random.random() < 0.10 if is_winner else False
    stattrak_count = random.randint(3, 88) if is_stattrak else 0

    return RouletteItem(
        id=food.id,
        name=food.name,
        rarity=food.rarity,
        rarity_name=meta["name"],
        color=meta["color"],
        image=food.image,
        price_range=food.price_range,
        description=food.description,
        category=food.category,
        wear=wear,
        float_value=float_val,
        is_stattrak=is_stattrak,
        stattrak_count=stattrak_count
    )


class CaseOpenerService:
    @staticmethod
    def open_case(case_id: str) -> OpenCaseResponse:
        case = DataManager.get_case(case_id)
        case_name = case.name if case else "Hòm Cơm Văn Phòng"
        case_foods = DataManager.get_foods_by_case(case_id)
        if not case_foods:
            case_foods = DataManager.get_foods()

        # Group foods by rarity
        by_rarity = {}
        for f in case_foods:
            by_rarity.setdefault(f.rarity, []).append(f)

        # Build available rarities and their weights
        available_rarities = []
        weights = []
        for r, meta in RARITY_META.items():
            if r in by_rarity and len(by_rarity[r]) > 0:
                available_rarities.append(r)
                weights.append(meta["weight"])

        if not available_rarities:
            available_rarities = [Rarity.MILSPEC]
            weights = [100.0]

        # 1. Roll winning rarity
        winning_rarity = random.choices(available_rarities, weights=weights, k=1)[0]
        winning_food = random.choice(by_rarity[winning_rarity])
        winning_item = _food_to_roulette_item(winning_food, is_winner=True)

        # 2. Build 55-item roulette strip
        total_items = 55
        winner_index = 45
        strip_items: List[RouletteItem] = []

        for i in range(total_items):
            if i == winner_index:
                strip_items.append(winning_item)
            else:
                # Weighted sample for fillers to create CS:GO suspense
                sample_rarity = random.choices(available_rarities, weights=weights, k=1)[0]
                sample_food = random.choice(by_rarity[sample_rarity])
                strip_items.append(_food_to_roulette_item(sample_food, is_winner=False))

        # Jitter offset inside the winning card (-45px to +45px)
        jitter_px = random.randint(-45, 45)
        now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Record to history
        history_entry = HistoryEntry(
            id=str(uuid.uuid4())[:8],
            case_id=case_id,
            case_name=case_name,
            item_id=winning_item.id,
            item_name=winning_item.name,
            rarity=winning_item.rarity,
            rarity_name=winning_item.rarity_name,
            color=winning_item.color,
            image=winning_item.image,
            price_range=winning_item.price_range,
            wear=winning_item.wear or "Standard",
            float_value=winning_item.float_value or 0.0,
            is_stattrak=winning_item.is_stattrak,
            stattrak_count=winning_item.stattrak_count,
            opened_at=now_iso
        )
        DataManager.add_history(history_entry)

        return OpenCaseResponse(
            case_id=case_id,
            case_name=case_name,
            items=strip_items,
            winner_index=winner_index,
            winning_item=winning_item,
            jitter_px=jitter_px,
            opened_at=now_iso
        )

    @staticmethod
    def execute_trade_up(item_ids: List[str]) -> TradeUpResponse:
        if len(item_ids) != 5:
            return TradeUpResponse(
                success=False,
                message="Cần chính xác 5 món ăn cùng cấp độ hiếm để thực hiện Hợp đồng Nâng cấp (Trade-Up Contract)!"
            )

        foods = [DataManager.get_food(fid) for fid in item_ids]
        if any(f is None for f in foods):
            return TradeUpResponse(
                success=False,
                message="Một số món ăn được chọn không tồn tại trong hệ thống."
            )

        # Check all are same rarity
        rarities = set(f.rarity for f in foods)
        if len(rarities) > 1:
            return TradeUpResponse(
                success=False,
                message="Tất cả 5 món ăn phải có CÙNG độ hiếm (cùng màu)!"
            )

        base_rarity = list(rarities)[0]
        rarity_upgrade_map = {
            Rarity.MILSPEC: Rarity.RESTRICTED,
            Rarity.RESTRICTED: Rarity.CLASSIFIED,
            Rarity.CLASSIFIED: Rarity.COVERT,
            Rarity.COVERT: Rarity.GOLD
        }

        if base_rarity not in rarity_upgrade_map:
            return TradeUpResponse(
                success=False,
                message="Độ hiếm này đã là cao nhất (Dao Vàng), không thể nâng cấp thêm!"
            )

        target_rarity = rarity_upgrade_map[base_rarity]
        all_foods = DataManager.get_foods()
        higher_tier_foods = [f for f in all_foods if f.rarity == target_rarity]

        if not higher_tier_foods:
            return TradeUpResponse(
                success=False,
                message=f"Chưa có món ăn nào thuộc cấp bậc cao hơn ({target_rarity.value})."
            )

        awarded_food = random.choice(higher_tier_foods)
        output_item = _food_to_roulette_item(awarded_food, is_winner=True)

        return TradeUpResponse(
            success=True,
            message="Ký hợp đồng thành công! Chúc mừng bạn đã nâng cấp lên món ăn đẳng cấp hơn!",
            output_item=output_item,
            target_rarity=target_rarity
        )
