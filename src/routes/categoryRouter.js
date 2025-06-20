// File: /src/routes/categoryRouter.js

const express = require('express');
const router = express.Router();
const {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

// Import các middleware cần thiết
const { protect, admin } = require('../middlewares/authMiddleware');

// ====================================================================
// ==================== CÁC ROUTE CHO MỌI NGƯỜI =======================
// ====================================================================

// @desc    Lấy danh sách tất cả danh mục
// @route   GET /api/categories
// @access  Public
router.get('/', getAllCategories);

// @desc    Lấy thông tin chi tiết một danh mục bằng ID
// @route   GET /api/categories/:id
// @access  Public
router.get('/:id', getCategoryById);


// ====================================================================
// ==================== CÁC ROUTE CHO ADMIN ===========================
// ====================================================================

// @desc    Admin tạo một danh mục mới
// @route   POST /api/categories
// @access  Private/Admin
router.post('/', protect, admin, createCategory);

// @desc    Admin cập nhật thông tin danh mục
// @route   PUT /api/categories/:id
// @access  Private/Admin
router.put('/:id', protect, admin, updateCategory);

// @desc    Admin xóa một danh mục
// @route   DELETE /api/categories/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;