// File: /src/routes/promotionRouter.js

// 1. Import thư viện Express
const express = require('express');

// 2. Import các hàm controller từ promotionController
const {
    createPromotion,
    getAllPromotions,
    updatePromotion,
    deletePromotion,
    applyPromotion,
    getAvailablePromotions
} = require('../controllers/promotionController');

// 3. Import các middleware bảo vệ
const { protect, admin } = require('../middlewares/authMiddleware');

// 4. Tạo một đối tượng router mới
const router = express.Router();

// 5. Định nghĩa các tuyến đường

// Định nghĩa route '/apply' để người dùng đã đăng nhập có thể kiểm tra một mã khuyến mãi.
// Ví dụ: POST /api/promotions/apply
router.post('/apply', protect, applyPromotion);

router.get('/available', protect, getAvailablePromotions);

// Định nghĩa route cho đường dẫn gốc ('/'), tức là '/api/promotions'
// Các thao tác này chỉ dành cho Admin.
router.route('/')
    // Phương thức GET để Admin lấy danh sách tất cả các mã khuyến mãi.
    .get(protect, admin, getAllPromotions)
    // Phương thức POST để Admin tạo một mã khuyến mãi mới.
    .post(protect, admin, createPromotion);

// Định nghĩa route cho đường dẫn có tham số ID, ví dụ: '/api/promotions/7'
// Các thao tác này cũng chỉ dành cho Admin.
router.route('/:id')
    // Phương thức PUT để Admin cập nhật một mã khuyến mãi.
    .put(protect, admin, updatePromotion)
    // Phương thức DELETE để Admin xóa một mã khuyến mãi.
    .delete(protect, admin, deletePromotion);

// 6. Export đối tượng router
module.exports = router;