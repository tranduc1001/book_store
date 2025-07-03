// File: /src/routes/adminRouter.js (Phiên bản cuối cùng)

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const {
    renderAdminDashboard,
    renderAdminProducts,
    renderProductFormPage,
    renderAdminCategoriesPage,
    renderAdminOrdersPage,
    renderAdminOrderDetailPage,
    renderAdminUsersPage,
    renderReceiptsListPage,
    renderReceiptDetailPage,
    renderAdminPromotionsPage,
    renderPromotionFormPage
} = require('../controllers/adminViewController');

// TẤT CẢ CÁC ROUTE TRONG FILE NÀY SẼ TỰ ĐỘNG CÓ TIỀN TỐ /admin
// (Do cách chúng ta sẽ cấu hình trong server.js)

// Dashboard
router.get('/', protect, admin, renderAdminDashboard);

// Quản lý Sản phẩm
router.get('/products', protect, admin, renderAdminProducts);
router.get('/products/add', protect, admin, renderProductFormPage);
router.get('/products/edit/:id', protect, admin, renderProductFormPage);

// Quản lý Danh mục
router.get('/categories', protect, admin, renderAdminCategoriesPage);

// Quản lý Đơn hàng
router.get('/orders', protect, admin, renderAdminOrdersPage);
router.get('/orders/:id', protect, admin, renderAdminOrderDetailPage);

// Quản lý Nhập hàng
router.get('/receipts', protect, admin, renderReceiptsListPage);
router.get('/receipts/:id', protect, admin, renderReceiptDetailPage);

// Quản lý Khuyến mãi
router.get('/promotions', protect, admin, renderAdminPromotionsPage);
router.get('/promotions/add', protect, admin, renderPromotionFormPage);
router.get('/promotions/edit/:id', protect, admin, renderPromotionFormPage);

// Quản lý Người dùng
router.get('/users', protect, admin, renderAdminUsersPage);

module.exports = router;