// File: /src/routes/cartRouter.js

// 1. Import thư viện Express
const express = require('express');

// 2. Import các hàm controller từ cartController
const {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem
} = require('../controllers/cartController');

// 3. Import middleware bảo vệ
const { protect } = require('../middlewares/authMiddleware');

// 4. Tạo một đối tượng router mới
const router = express.Router();

// 5. Áp dụng middleware `protect` cho TẤT CẢ các routes trong file này.
//    Điều này đảm bảo rằng chỉ người dùng đã đăng nhập mới có thể truy cập các API giỏ hàng.
router.use(protect);

// 6. Định nghĩa các tuyến đường

// Định nghĩa route cho đường dẫn gốc ('/'), tức là '/api/cart'
router.route('/')
    // Phương thức GET sẽ được xử lý bởi `getCart` để lấy thông tin giỏ hàng hiện tại.
    .get(getCart)
    // Phương thức POST sẽ được xử lý bởi `addToCart` để thêm sản phẩm vào giỏ.
    .post(addToCart);

// Định nghĩa route cho đường dẫn '/items/:itemId', ví dụ: '/api/cart/items/15'
// `:itemId` là ID của một mục trong giỏ hàng (một bản ghi trong bảng `cart_items`).
router.route('/items/:itemId')
    // Phương thức PUT sẽ được xử lý bởi `updateCartItem` để cập nhật số lượng.
    .put(updateCartItem)
    // Phương thức DELETE sẽ được xử lý bởi `removeCartItem` để xóa sản phẩm khỏi giỏ.
    .delete(removeCartItem);

// 7. Export đối tượng router
module.exports = router;