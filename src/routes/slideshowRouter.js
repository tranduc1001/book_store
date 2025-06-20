// File: /src/routes/slideshowRouter.js

// 1. Import thư viện Express
const express = require('express');

// 2. Import các hàm controller từ slideshowController
const {
    createSlide,
    getPublicSlides,
    getAllSlidesForAdmin,
    updateSlide,
    deleteSlide
} = require('../controllers/slideshowController');

// 3. Import các middleware bảo vệ
const { protect, admin } = require('../middlewares/authMiddleware');

// 4. Tạo một đối tượng router mới
const router = express.Router();

// 5. Định nghĩa các tuyến đường

// Định nghĩa route '/public' để cho phép tất cả người dùng (cả khách) có thể xem các slide đang hoạt động.
// Ví dụ: GET /api/slideshows/public
router.route('/public')
    .get(getPublicSlides);

// Định nghĩa route cho đường dẫn gốc ('/'), tức là '/api/slideshows'
// Các thao tác trên đường dẫn này chỉ dành cho Admin.
router.route('/')
    // Phương thức GET để Admin lấy tất cả các slide (cả ẩn và hiện) để quản lý.
    .get(protect, admin, getAllSlidesForAdmin)
    // Phương thức POST để Admin tạo một slide mới.
    .post(protect, admin, createSlide);

// Định nghĩa route cho đường dẫn có tham số ID, ví dụ: '/api/slideshows/10'
// Các thao tác này cũng chỉ dành cho Admin.
router.route('/:id')
    // Phương thức PUT để Admin cập nhật một slide.
    .put(protect, admin, updateSlide)
    // Phương thức DELETE để Admin xóa một slide.
    .delete(protect, admin, deleteSlide);

// 6. Export đối tượng router
module.exports = router;