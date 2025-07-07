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
    getBestsellerProducts,
    getAllPublishers 
} = require('../controllers/productController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
// Import hàm lấy review từ reviewController
const { createReview, getProductReviews  } = require('../controllers/reviewController');

// =========================================================================
// CÁC ROUTE CỐ ĐỊNH PHẢI ĐẶT LÊN TRÊN
// =========================================================================
router.get('/bestsellers', getBestsellerProducts);
router.get('/publishers', getAllPublishers); // <--- Thêm route mới cho NXB
router.get('/export/excel', protect, admin, exportProductsToExcel);

// Route này cũng phải đặt trước route /:id
router.route('/:id/reviews')
    .post(protect, createReview)   // Xử lý POST request
    .get(getProductReviews); 

// =========================================================================
// CÁC ROUTE ĐỘNG (CÓ THAM SỐ) ĐẶT Ở DƯỚI
// =========================================================================
router.route('/')
    .post(protect, admin, upload.single('img'), createProduct)
    .get(getAllProducts);
router.route('/:id')
    .get(getProductById)
    .put(protect, admin, upload.single('img'),updateProduct)
    .delete(protect, admin, deleteProduct);

module.exports = router;