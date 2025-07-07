// File: /src/routes/viewRouter.js
const express = require('express');
const router = express.Router();
const adminViewController = require('../controllers/adminViewController');
const { protect, admin } = require('../middlewares/authMiddleware');

const {
    renderHomePage,
    renderProductListPage,
    renderProductDetailPage,
    renderLoginPage,
    renderRegisterPage,
    renderCartPage,
    renderCheckoutPage,
    renderMyOrdersPage,
    renderOrderDetailPage,
    renderProfilePage,
    renderForgotPasswordPage,
    renderResetPasswordPage
} = require('../controllers/viewController');

router.get('/', renderHomePage);
router.get('/products', renderProductListPage); 
router.get('/products/:id', renderProductDetailPage);
router.get('/login', renderLoginPage);
router.get('/register', renderRegisterPage);
router.get('/cart', renderCartPage);
router.get('/checkout', renderCheckoutPage);
router.get('/my-orders', renderMyOrdersPage);
router.get('/orders/:id', renderOrderDetailPage);
router.get('/profile', renderProfilePage);

router.get('/forgot-password', renderForgotPasswordPage);
router.get('/reset-password/:token', renderResetPasswordPage);
router.get('/checkout-success', (req, res) => {
    res.render('pages/checkout-success', { title: 'Thanh Toán Thành Công' });
});
router.get('/checkout-fail', (req, res) => {
    res.render('pages/checkout-fail', { title: 'Thanh Toán Thất Bại' });
});

module.exports = router;