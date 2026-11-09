import sys
import uvicorn

if __name__ == "__main__":
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    print("=" * 60)
    print(" CS:GO LUNCH CASE OPENER - FASTAPI SERVER")
    print(" Trua nay an gi? Mo hom CS:GO de quyet dinh!")
    print(" Server URL: http://127.0.0.1:8000")
    print("=" * 60)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
