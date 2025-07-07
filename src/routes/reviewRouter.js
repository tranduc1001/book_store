// File: /src/routes/reviewRouter.js

// 1. Import thư viện Express
const express = require('express');

// 2. Import các hàm controller từ reviewController
const {
    createReview, 
    getProductReviews,
    deleteReviewByAdmin
} = require('../controllers/reviewController');

// 3. Import các middleware bảo vệ
const { protect, admin } = require('../middlewares/authMiddleware');

// 4. Tạo một đối tượng router mới
const router = express.Router();

// 5. Áp dụng middleware bảo vệ cho tất cả các route trong file này
router.use(protect, admin);

// 6. Định nghĩa các tuyến đường

// Định nghĩa route để Admin có thể xóa một review bất kỳ bằng ID của review đó.
// Ví dụ: DELETE /api/reviews/50
router.route('/:id')
    .delete(deleteReviewByAdmin);

router.route('/:productId/reviews')
    .get(getProductReviews)
    .post(protect, createReview);
// Trong tương lai, có thể thêm route để Admin xem tất cả các review
// router.route('/').get(getAllReviewsByAdmin);

// 7. Export đối tượng router
module.exports = router;