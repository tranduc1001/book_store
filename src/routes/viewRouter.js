// File: /src/routes/viewRouter.js
const express = require('express');
const router = express.Router();
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
    renderProfilePage
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
module.exports = router;