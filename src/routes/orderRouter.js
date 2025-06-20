// File: /src/routes/orderRouter.js (Phiên bản đã sửa)

const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    getAllOrders
} = require('../controllers/orderController');
const { protect, admin } = require('../middlewares/authMiddleware');

// === CÁC ROUTE CỦA USER ===

// POST /api/orders -> Tạo một đơn hàng mới
router.post('/', protect, createOrder);

// GET /api/orders/my -> Lấy danh sách đơn hàng của người dùng đang đăng nhập
// <<< ĐẶT ROUTE NÀY LÊN TRÊN ROUTE '/:id' >>>
router.get('/myorders', protect, getMyOrders);

// GET /api/orders/:id -> Lấy chi tiết một đơn hàng theo ID
// Route này phải nằm sau các route cụ thể khác để tránh xung đột.
router.get('/:id', protect, getOrderById);

router.get('/', protect, admin, getAllOrders);
// === CÁC ROUTE CỦA ADMIN ===
// (Giả sử bạn có route lấy tất cả đơn hàng cho admin)
// router.get('/', protect, admin, getAllOrders);

// PUT /api/orders/:id -> Cập nhật trạng thái đơn hàng
router.put('/:id', protect, admin, updateOrderStatus);


module.exports = router;