// File: /src/routes/orderRouter.js (PHIÊN BẢN ĐÃ SẮP XẾP LẠI)

const express = require('express');
const router = express.Router();
const {
    createOrder,
    handleMomoIPN,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    getAllOrders // Đổi tên getOrdersForAdmin thành getAllOrders cho khớp
} = require('../controllers/orderController');
const { protect, admin } = require('../middlewares/authMiddleware');


// ==========================================================
// ====== CÁC ROUTE CỤ THỂ PHẢI ĐƯỢC ĐẶT LÊN TRÊN HẾT ======
// ==========================================================
router.post('/momo-ipn', handleMomoIPN);
// GET /api/orders/myorders -> Lấy danh sách đơn hàng của người dùng đang đăng nhập
router.get('/myorders', protect, getMyOrders);

// GET /api/orders -> Lấy TẤT CẢ đơn hàng (Admin)
// Route này phải ở trên '/:id' để không bị nhầm lẫn.
router.route('/')
    .get(protect, admin, getAllOrders)  // GET /api/orders (Admin)
    .post(protect, createOrder);

// ==========================================================
// ============= CÁC ROUTE ĐỘNG (VỚI :id) Ở DƯỚI =============
// ==========================================================

// GET /api/orders/:id -> Lấy chi tiết một đơn hàng theo ID
router.get('/:id', protect, getOrderById);

// POST /api/orders -> Tạo một đơn hàng mới

// PUT /api/orders/:id/status -> Cập nhật trạng thái đơn hàng (Admin)
// Nên dùng route này thay vì 2 route PUT
router.put('/:id/status', protect, admin, updateOrderStatus);


module.exports = router;