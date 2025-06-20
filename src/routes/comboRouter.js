// File: /src/routes/comboRouter.js

// 1. Import thư viện Express
const express = require('express');

// 2. Import các hàm controller từ comboController
const {
    createCombo,
    getAllCombos,
    getComboById
    // (Trong tương lai có thể thêm các hàm update, delete)
} = require('../controllers/comboController');

// 3. Import các middleware bảo vệ
const { protect, admin } = require('../middlewares/authMiddleware');

// 4. Tạo một đối tượng router mới
const router = express.Router();

// 5. Định nghĩa các tuyến đường

// Định nghĩa route cho đường dẫn gốc ('/'), tức là '/api/combos'
router.route('/')
    // Phương thức GET để người dùng có thể xem danh sách tất cả các combo đang được bán.
    .get(getAllCombos)
    // Phương thức POST để Admin tạo một combo mới.
    .post(protect, admin, createCombo);

// Định nghĩa route cho đường dẫn có tham số ID, ví dụ: '/api/combos/3'
router.route('/:id')
    // Phương thức GET để người dùng có thể xem chi tiết một combo cụ thể.
    .get(getComboById);
    // (Trong tương lai có thể thêm các route PUT và DELETE cho Admin tại đây)
    // .put(protect, admin, updateCombo)
    // .delete(protect, admin, deleteCombo);


// 6. Export đối tượng router
module.exports = router;