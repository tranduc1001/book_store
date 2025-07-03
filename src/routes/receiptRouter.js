// File: /src/routes/receiptRouter.js

const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { protect, admin } = require('../middlewares/authMiddleware');

// @route   POST /api/receipts
// @desc    Tạo một phiếu nhập hàng mới
// @access  Private/Admin
router.post('/', protect, admin, receiptController.createReceipt);

// @route   GET /api/receipts
// @desc    Lấy danh sách các phiếu nhập
//router.get('/', protect, admin, receiptController.getAllReceipts);

// @route   GET /api/receipts/:id
// @desc    Lấy chi tiết một phiếu nhập
//router.get('/:id', protect, admin, receiptController.getReceiptById);

module.exports = router;