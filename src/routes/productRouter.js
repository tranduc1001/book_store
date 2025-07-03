// File: /src/routes/productRouter.js

const express = require('express');
const router = express.Router();
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    exportProductsToExcel,
    getBestsellerProducts
} = require('../controllers/productController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
// Import hàm lấy review từ reviewController
const { getReviewsByProductId } = require('../controllers/reviewController');

// Route để lấy tất cả review của một sản phẩm
// Route này phải được đặt TRƯỚC route '/:id' để không bị nhầm lẫn
router.get('/:id/reviews', getReviewsByProductId);

// Các route chính của sản phẩm
router.route('/')
    .post(protect, admin, upload.single('img'), createProduct)
    .get(getAllProducts);
router.get('/bestsellers', getBestsellerProducts);
router.get('/export/excel', protect, admin, exportProductsToExcel);


router.route('/:id')
    .get(getProductById)
    .put(protect, admin, upload.single('img'),updateProduct)
    .delete(protect, admin, deleteProduct);

module.exports = router;