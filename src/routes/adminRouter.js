// File: /src/routes/adminRouter.js
const express = require('express');
const router = express.Router();
const {
    renderAdminDashboard,
    renderAdminProducts,
    renderProductFormPage,
    renderAdminOrderDetailPage,
    renderAdminCategoriesPage,
    renderAdminOrdersPage,
} = require('../controllers/adminViewController');


router.get('/', renderAdminDashboard);
router.get('/products', renderAdminProducts);
// Route để hiển thị form thêm mới
router.get('/products/add', renderProductFormPage);
// Route để hiển thị form chỉnh sửa
router.get('/products/edit/:id', renderProductFormPage);
router.get('/categories', renderAdminCategoriesPage);
router.get('/orders', renderAdminOrdersPage);
router.get('/orders/:id', renderAdminOrderDetailPage);

module.exports = router;