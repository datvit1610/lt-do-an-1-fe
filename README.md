# HUST Equipment Manager — Frontend

Hệ thống Quản lý Thiết bị & Dụng cụ Học tập  
**Đại học Bách Khoa Hà Nội (HUST)**

---

## Tech Stack

- **React 18** + React Router v6
- **Axios** — HTTP client
- **Lucide React** — icon library
- **CSS Variables** — theming & design tokens
- **Google Fonts**: Be Vietnam Pro + Playfair Display

## Cấu trúc thư mục

```
src/
├── components/       # Shared/reusable components
│   ├── HustLogo.jsx
│   └── ProtectedRoute.jsx
├── context/
│   └── AuthContext.jsx   # Auth state toàn cục
├── pages/
│   ├── LoginPage.jsx     # Màn hình đăng nhập
│   ├── LoginPage.css
│   └── DashboardPage.jsx # Placeholder dashboard
├── services/
│   └── api.js            # Axios instance + authService
├── utils/            # Helper functions (để trống)
├── hooks/            # Custom hooks (để trống)
├── App.jsx           # Router + providers
├── index.js
└── index.css         # CSS variables + global styles
```

## Cài đặt & chạy

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env từ example
cp .env.example .env
# Sửa REACT_APP_API_URL thành URL backend của bạn

# 3. Chạy dev server
npm start
```

## Kết nối Backend

Sửa file `.env`:
```
REACT_APP_API_URL=http://localhost:8080/api
```

**API login endpoint** mà frontend gọi:
```
POST /api/auth/login
Body: { "username": "...", "password": "..." }
Response: { "user": {...}, "token": "JWT_TOKEN" }
```

Token JWT sẽ được lưu vào `localStorage` và tự động đính kèm vào mọi request tiếp theo qua Axios interceptor.

## Tính năng hiện tại (v1.0 base)

- [x] Màn hình đăng nhập đầy đủ animation
- [x] Form validation cơ bản
- [x] Xử lý lỗi API (401, network error)
- [x] Hiện/ẩn mật khẩu
- [x] Protected route (redirect nếu chưa đăng nhập)
- [x] Auth context + localStorage persistence
- [x] Axios interceptor tự động gắn token
- [x] Responsive mobile

## Màu sắc thương hiệu

| Token | Giá trị | Ý nghĩa |
|-------|---------|---------|
| `--hust-navy` | `#0a2158` | Màu chủ đạo BKHN |
| `--hust-red` | `#c8102e` | Màu nhấn đỏ |
| `--hust-gold` | `#f0b429` | Màu vàng trang trí |

## Các màn hình cần thêm tiếp theo

- Dashboard tổng quan
- Quản lý thiết bị (danh sách, chi tiết, thêm/sửa/xóa)
- Quản lý mượn/trả
- Quản lý phòng / cơ sở vật chất
- Quản lý người dùng (admin)
- Báo cáo thống kê
