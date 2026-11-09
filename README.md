# 🍱 CS:GO Lunch Case Opener - "Trưa Nay Ăn Gì?"

> Ứng dụng web giải quyết câu hỏi muôn thuở **"Trưa nay ăn gì?"** bằng phong cách **mở hòm (Case Opening)** kịch tính và giật gân kinh điển của tựa game **CS:GO / CS2**. Xây dựng hoàn toàn bằng **FastAPI**, **Tailwind CSS**, và **Web Audio API**.

---

## ✨ Điểm Nổi Bật

- 🎰 **Vòng quay Roulette giật gân**: Dải 55 món lướt mượt mà với hiệu ứng giảm tốc vật lý tự nhiên (`cubic-bezier`), vạch kim căn giữa và độ lệch jitter ngẫu nhiên chuẩn game.
- 🔊 **Hệ thống âm thanh Web Audio API sống động**: Tiếng *tách... tách... tách* chân thực theo từng ô lướt qua kim chỉ và tiếng nhạc kèn hoan hỉ ăn mừng (fanfare) theo từng cấp bậc độ hiếm.
- 🌈 **Hệ thống phân cấp độ hiếm (CS:GO Rarity Tiers)**:
  - 🔵 **Mil-Spec (Xanh lam - 65%)**: Bánh mì chả pate, Cơm bình dân, Bún đậu, Mì tôm chanh bò khô,...
  - 🟣 **Restricted (Tím - 22%)**: Phở bò tái lăn, Cơm tấm sườn bì chả, Gà rán sốt cay Hàn Quốc,...
  - 💖 **Classified (Hồng - 9%)**: Pizza hải sản phô mai, Dimsum Quảng Đông, Lẩu cá hồi,...
  - 🔴 **Covert (Đỏ - 3.5%)**: Bò bít tết Wagyu thăn nội, Đại tiệc Lẩu Haidilao, Buffet nướng,...
  - 🟡 **Special Item / Dao Vàng ★ (0.5%)**: *★ Sếp hoặc Đồng Nghiệp khao 100%!*, *★ Dao Karambit: Uống trà sữa nhịn cơm!*
- 🏷️ **Thuộc tính CS:GO chân thực**:
  - Tỉ lệ rơi **StatTrak™** (ghi nhận số lần đã ăn).
  - Độ mòn vũ khí (Wear): *Factory New (Mới ra lò nóng hổi)* đến *Battle-Scarred (Ship trễ 30 phút, nguội ngắt)*.
  - Chỉ số **Float Value** ngẫu nhiên từ `0.0001` đến `0.9999`.
- 📜 **Hợp đồng nâng cấp (Trade-Up Contract)**: Gom 5 món bậc thấp cùng màu để ký hợp đồng đổi lấy 1 món bậc cao hơn!
- 📍 **Tìm quán quanh đây**: 1-click liên kết thẳng sang Google Maps tìm quán ăn tương ứng gần vị trí hiện tại.
- 📦 **Nhiều loại hòm theo tâm trạng**:
  - *Hòm Cơm Văn Phòng*
  - *Hòm Cuối Tháng Cháy Túi*
  - *Hòm Ngày Nhận Lương (Đại Gia)*
  - *Hòm Healthy & Clean*
- ⚙️ **Quản lý món ăn linh hoạt**: Thêm, sửa, xoá món mới của nhóm bạn / quán quen dễ dàng.

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Yêu cầu hệ thống
- Python 3.10 trở lên.

### 2. Cài đặt thư viện
```bash
pip install -r requirements.txt
```

### 3. Chạy ứng dụng
```bash
python run.py
```
Hoặc dùng trực tiếp `uvicorn`:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 4. Mở trình duyệt
Truy cập: **[http://127.0.0.1:8000](http://127.0.0.1:8000)** và trải nghiệm cảm giác unbox bữa trưa!

---

## 📁 Cấu Trúc Thư Mục

```text
github/
├── app/
│   ├── main.py              # Khởi tạo FastAPI router & endpoints
│   ├── models.py            # Pydantic schemas (Rarity, Food, Case, TradeUp)
│   ├── services/
│   │   ├── case_opener.py   # Thuật toán Weighted RNG, Wear, Float, Trade-up
│   │   └── data_manager.py  # Quản lý file JSON (Foods, Cases, History)
│   ├── static/
│   │   ├── css/
│   │   │   └── csgo_theme.css   # Dark theme CS:GO, hiệu ứng glow, kim chỉ
│   │   └── js/
│   │       ├── audio.js         # Bộ tổng hợp âm thanh Web Audio API
│   │       ├── roulette.js      # Animation cuộn roulette & tracking ticks
│   │       └── app.js           # Xử lý tương tác UI, modal, trade-up
│   └── templates/
│       ├── base.html        # Khung giao diện dùng chung
│       ├── index.html       # Màn hình chính mở hòm & roulette
│       ├── tradeup.html     # Bàn ký hợp đồng Trade-Up Contract
│       ├── history.html     # Lịch sử mở hòm
│       └── manage.html      # Thêm / xoá món ăn tùy chỉnh
├── data/
│   ├── cases.json           # Danh sách các hòm
│   ├── foods.json           # Dữ liệu món ăn có sẵn
│   └── history.json         # Lịch sử đã mở
├── requirements.txt         # Danh sách thư viện Python
├── run.py                   # Script chạy nhanh ứng dụng
└── README.md
```
