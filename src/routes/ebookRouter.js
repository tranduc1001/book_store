// File: /src/routes/ebookRouter.js

// 1. Import thư viện Express
const express = require('express');

// 2. Import các hàm controller từ ebookController
const {
    getMyEbooks,
    generateDownloadLink,
    downloadEbook
} = require('../controllers/ebookController');

// 3. Import middleware bảo vệ
const { protect } = require('../middlewares/authMiddleware');

// 4. Tạo một đối tượng router mới
const router = express.Router();

// 5. Định nghĩa các tuyến đường

// Định nghĩa route '/my-ebooks' để người dùng xem danh sách các e-book họ đã mua.
// Yêu cầu phải đăng nhập.
// Ví dụ: GET /api/ebooks/my-ebooks
router.get('/my-ebooks', protect, getMyEbooks);

// Định nghĩa route '/generate-link' để người dùng yêu cầu tạo một link download tạm thời.
// Yêu cầu phải đăng nhập.
// Ví dụ: POST /api/ebooks/generate-link
router.post('/generate-link', protect, generateDownloadLink);

// Định nghĩa route '/download/:token' để thực hiện việc tải file.
// Route này là công khai (public) vì bất kỳ ai có link (chứa token hợp lệ) đều có thể truy cập.
// Chính chuỗi token ngẫu nhiên và có thời hạn đã là một lớp bảo mật.
// Ví dụ: GET /api/ebooks/download/a1b2c3d4e5f6...
router.get('/download/:token', downloadEbook);

// 6. Export đối tượng router
module.exports = router;