# Excel 薪資管理系統 (Cloud Computing HW1)

這是一個分散式的薪資管理系統，旨在展示雲端運算中「微服務」的概念。系統將功能拆分為 **資料中心 (A)**、**計算中心 (B)** 與 **前端入口 (C)** 三個節點。

## 系統特色

- **分散式架構**：將資料儲存、薪資運算與網頁呈現完全解耦。
- **即時試算**：支援補習班、家教、出差津貼、獎金與扣款等多項薪資參數計算。
- **Excel 整合**：可直接上傳 `.xlsx` 檔案批量匯入員工資料。
- **完整 CRUD**：提供新增、查詢、修改、刪除員工資料的功能，並具備「刪除復原」機制。
- **響應式設計**：美觀的 UI 介面，支援行動裝置瀏覽。

## 系統架構圖

1.  **電腦 A (Data API Server)**:
    - 負責讀寫 `salary.xlsx`。
    - 提供員工資料的增刪查改 API。
    - Port：`5000`
2.  **電腦 B (Calculation Server)**:
    - 負責複雜的薪資公式邏輯運算。
    - 向電腦 A 請求資料，計算後回傳統計結果（總額、平均、最高/最低薪）。
    - Port：`5001`
3.  **電腦 C (Web Server)**:
    - 提供使用者操作界面 (HTML/CSS/JS)。
    - Port：`5002`

## 快速開始

### 1. 環境準備
確保您的環境已安裝 Python 3.8+ 以及相關套件：
```bash
pip install flask flask-cors requests openpyxl
```

### 2. 設定 IP 位址 (重要)
由於是分散式架構，請根據您的主機 IP 修改以下檔案：
- **B.py**: 修改 `A_URL` 為電腦 A 的 IP。
- **static/script.js**: 修改 `A_URL` 與 `B_URL` 為實際的伺服器位址。

### 3. 啟動服務
請依序啟動三個服務：

**啟動電腦 A (資料中心):**
```bash
python A.py
```
**啟動電腦 B (計算中心):**
```bash
python B.py
```
**啟動電腦 C (前端入口):**
```bash
python C.py
```

啟動後，開啟瀏覽器造訪 `http://<電腦C_IP>:5002` 即可開始使用。

## 薪資計算邏輯
系統依據以下公式計算個人總薪資：
> **個人薪資** = (補習班時數 × 補習班時薪) + (家教時數 × 家教時薪) + (出差天數 × 出差津貼) + 獎金 - 扣款

## 檔案結構
- `A.py`: 使用 `openpyxl` 處理 Excel 讀寫。
- `B.py`: 處理薪資彙總與邏輯計算。
- `C.py`: 僅負責渲染前端頁面。
- `static/`: 包含 `script.js` (前端邏輯) 與 `style.css` (UI 設計)。
- `templates/index.html`: 系統主介面模板。
- `salary.xlsx`: 存放資料的 Excel 檔案。

## API 說明 (Node A)
- `GET /api/employees`: 取得所有員工
- `POST /api/employees`: 新增員工
- `PUT /api/employees/<id>`: 修改員工
- `DELETE /api/employees/<id>`: 刪除員工
- `POST /api/upload`: 上傳 Excel 覆蓋資料