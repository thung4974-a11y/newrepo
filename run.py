import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print(" 🍱 CS:GO LUNCH CASE OPENER - FASTAPI SERVER")
    print(" Trưa nay ăn gì? Mở hòm CS:GO giật gân để quyết định!")
    print(" Địa chỉ truy cập: http://127.0.0.1:8000")
    print("=" * 60)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
