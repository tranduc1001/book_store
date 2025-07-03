// File: /src/routes/userRouter.js

const express = require('express');
const router = express.Router();
const {
    // Chức năng của User
    getUserProfile,
    updateUserProfile,
    changeUserPassword,
    // Chức năng của Admin
    getAllUsers,
    getUserById,
    updateUserByAdmin,
    deleteUser, 
    createUserByAdmin,
} = require('../controllers/userController');

// Import các middleware cần thiết
const { protect, admin } = require('../middlewares/authMiddleware');

// ====================================================================
// ============= CÁC ROUTE CHO USER ĐÃ ĐĂNG NHẬP ======================
// ====================================================================
// Các route này chỉ yêu cầu người dùng phải đăng nhập (dùng `protect`).

// @desc    Người dùng lấy/cập nhật thông tin cá nhân của mình
// @route   GET, PUT /api/users/profile
// @access  Private
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// @desc    Người dùng tự đổi mật khẩu
// @route   PUT /api/users/change-password
// @access  Private
router.put('/change-password', protect, changeUserPassword);


// ====================================================================
// ============== CÁC ROUTE CHỈ DÀNH CHO ADMIN ========================
// ====================================================================
// Các route này yêu cầu phải đăng nhập VÀ có quyền Admin (dùng `protect` và `admin`).

// @desc    Admin lấy danh sách tất cả người dùng
// @route   GET /api/users
// @access  Private/Admin
router.route('/')
    .get(protect, admin, getAllUsers)
    // ====================== THÊM DÒNG NÀY ======================
    .post(protect, admin, createUserByAdmin);
// @desc    Admin lấy, cập nhật, xóa một người dùng cụ thể bằng ID
// @route   GET, PUT, DELETE /api/users/:id
// @access  Private/Admin
router.route('/:id')
    .get(protect, admin, getUserById)
    .put(protect, admin, updateUserByAdmin)
    .delete(protect, admin, deleteUser);

module.exports = router;