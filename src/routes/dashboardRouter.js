// File: /src/routes/dashboardRouter.js

// 1. Import thư viện Express
const express = require('express');

// 2. Import các hàm controller từ dashboardController
const {
    getDashboardOverview,
    getRevenueByMonth
} = require('../controllers/dashboardController');

// 3. Import các middleware bảo vệ
const { protect, admin } = require('../middlewares/authMiddleware');

// 4. Tạo một đối tượng router mới
const router = express.Router();

// 5. Áp dụng middleware bảo vệ cho TẤT CẢ các routes trong file này.
router.use(protect, admin);

// 6. Định nghĩa các tuyến đường

// Định nghĩa route '/overview' để lấy các số liệu thống kê tổng quan.
// Ví dụ: GET /api/dashboard/overview
router.get('/overview', getDashboardOverview);

// Định nghĩa route '/revenue-by-month' để lấy dữ liệu doanh thu cho biểu đồ.
// Ví dụ: GET /api/dashboard/revenue-by-month
router.get('/revenue-by-month', getRevenueByMonth);

// 7. Export đối tượng router
module.exports = router;