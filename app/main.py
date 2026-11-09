import os
from fastapi import FastAPI, Request, HTTPException, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.models import (
    FoodCreateUpdate,
    Rarity,
    RARITY_META,
    TradeUpRequest
)
from app.services.data_manager import DataManager
from app.services.case_opener import CaseOpenerService

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(
    title="CS:GO Lunch Case Opener",
    description="Ứng dụng chọn món ăn trưa phong cách mở hòm CS:GO giật gân kịch tính",
    version="1.0.0"
)

# Mount static files
static_dir = os.path.join(BASE_DIR, "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Jinja2 templates
templates_dir = os.path.join(BASE_DIR, "templates")
templates = Jinja2Templates(directory=templates_dir)


# ---------------- PAGE ROUTES ----------------

@app.get("/", response_class=HTMLResponse)
async def home_page(request: Request):
    cases = DataManager.get_cases()
    default_case = cases[0] if cases else None
    foods = DataManager.get_foods_by_case(default_case.id if default_case else "")
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "cases": cases,
            "current_case": default_case,
            "foods": [f.model_dump() for f in foods],
            "rarity_meta": RARITY_META
        }
    )


@app.get("/case/{case_id}", response_class=HTMLResponse)
async def case_page(request: Request, case_id: str):
    cases = DataManager.get_cases()
    current_case = DataManager.get_case(case_id)
    if not current_case:
        raise HTTPException(status_code=404, detail="Hòm không tồn tại")
    foods = DataManager.get_foods_by_case(case_id)
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "cases": cases,
            "current_case": current_case,
            "foods": [f.model_dump() for f in foods],
            "rarity_meta": RARITY_META
        }
    )


@app.get("/manage", response_class=HTMLResponse)
async def manage_page(request: Request):
    foods = DataManager.get_foods()
    cases = DataManager.get_cases()
    return templates.TemplateResponse(
        request=request,
        name="manage.html",
        context={
            "foods": [f.model_dump() for f in foods],
            "cases": cases,
            "rarities": list(Rarity),
            "rarity_meta": RARITY_META
        }
    )


@app.get("/trade-up", response_class=HTMLResponse)
async def trade_up_page(request: Request):
    foods = DataManager.get_foods()
    return templates.TemplateResponse(
        request=request,
        name="tradeup.html",
        context={
            "foods": [f.model_dump() for f in foods],
            "rarity_meta": RARITY_META
        }
    )


@app.get("/history", response_class=HTMLResponse)
async def history_page(request: Request):
    history = DataManager.get_history(limit=100)
    return templates.TemplateResponse(
        request=request,
        name="history.html",
        context={
            "history": [h.model_dump() for h in history],
            "rarity_meta": RARITY_META
        }
    )


# ---------------- API ROUTES ----------------

@app.post("/api/open-case/{case_id}")
async def api_open_case(case_id: str):
    case = DataManager.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Hòm không tồn tại")
    result = CaseOpenerService.open_case(case_id)
    return result


@app.get("/api/cases")
async def api_get_cases():
    return DataManager.get_cases()


@app.get("/api/foods")
async def api_get_foods(case_id: str = None):
    if case_id:
        return DataManager.get_foods_by_case(case_id)
    return DataManager.get_foods()


@app.post("/api/foods")
async def api_add_food(food_data: FoodCreateUpdate):
    created = DataManager.add_food(food_data)
    return created


@app.put("/api/foods/{food_id}")
async def api_update_food(food_id: str, food_data: FoodCreateUpdate):
    updated = DataManager.update_food(food_id, food_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Món ăn không tồn tại")
    return updated


@app.delete("/api/foods/{food_id}")
async def api_delete_food(food_id: str):
    deleted = DataManager.delete_food(food_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Món ăn không tồn tại")
    return {"success": True, "message": "Đã xoá món ăn thành công"}


@app.post("/api/trade-up")
async def api_trade_up(req: TradeUpRequest):
    result = CaseOpenerService.execute_trade_up(req.item_ids)
    return result


@app.get("/api/history")
async def api_get_history(limit: int = 50):
    return DataManager.get_history(limit)


@app.delete("/api/history")
async def api_clear_history():
    DataManager.clear_history()
    return {"success": True, "message": "Đã xoá lịch sử mở hòm"}
