// File: /src/controllers/cartController.js

// Import các model cần thiết
const { Cart, CartItem, Product } = require('../models');

/**
 * @description     Lấy thông tin chi tiết giỏ hàng của người dùng đang đăng nhập.
 * @route           GET /api/cart
 * @access          Private (Yêu cầu đăng nhập)
 */
const getCart = async (request, response) => {
    // ID của người dùng được lấy từ `req.user` do middleware `protect` cung cấp.
    const userId = request.user.id;

    try {
        // Tìm giỏ hàng của người dùng
        const cart = await Cart.findOne({
            where: { user_id: userId },
            // Sử dụng `include` để lấy tất cả các `CartItem` (as: 'items') thuộc về giỏ hàng này.
            include: {
                model: CartItem,
                as: 'items',
                // Trong mỗi CartItem, lại tiếp tục `include` để lấy thông tin chi tiết của `Product`.
                include: {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'ten_sach', 'gia_bia', 'img', 'so_luong_ton_kho'] // Chỉ lấy các trường cần thiết của sản phẩm
                }
            },
            // Sắp xếp các sản phẩm trong giỏ hàng theo thời gian được thêm vào
            order: [[{ model: CartItem, as: 'items' }, 'id', 'DESC']]
        });

        // Nếu người dùng chưa có giỏ hàng (chưa từng thêm sản phẩm nào), trả về một giỏ hàng rỗng.
        if (!cart) {
            return response.status(200).json({ id: null, user_id: userId, items: [] });
        }
        
        response.status(200).json(cart);
    } catch (error) {
        console.error("Lỗi khi lấy thông tin giỏ hàng:", error);
        response.status(500).json({ message: "Lỗi server khi lấy thông tin giỏ hàng.", error: error.message });
    }
};

/**
 * @description     Thêm một sản phẩm vào giỏ hàng.
 * @route           POST /api/cart
 * @access          Private
 */
const addToCart = async (request, response) => {
    const { productId, soLuong } = request.body;
    const userId = request.user.id;

    // Kiểm tra dữ liệu đầu vào
    if (!productId || !soLuong || parseInt(soLuong) <= 0) {
        return response.status(400).json({ message: "ID sản phẩm và số lượng hợp lệ là bắt buộc." });
    }
    const quantity = parseInt(soLuong);

    try {
        // 1. Tìm hoặc tạo giỏ hàng cho người dùng.
        //    `findOrCreate` là một phương thức rất tiện lợi của Sequelize:
        //    - Nếu tìm thấy một bản ghi thỏa mãn `where`, nó sẽ trả về bản ghi đó.
        //    - Nếu không tìm thấy, nó sẽ tạo một bản ghi mới với thông tin trong `defaults` (hoặc `where`) và trả về.
        const [cart, created] = await Cart.findOrCreate({
            where: { user_id: userId },
        });

        // 2. Kiểm tra xem sản phẩm đã tồn tại trong giỏ hàng chưa.
        let cartItem = await CartItem.findOne({
            where: { cart_id: cart.id, product_id: productId }
        });

        if (cartItem) {
            // Nếu sản phẩm đã có, chỉ cần cập nhật lại số lượng.
            cartItem.so_luong += quantity;
            await cartItem.save();
        } else {
            // Nếu sản phẩm chưa có, tạo một `CartItem` mới.
            cartItem = await CartItem.create({
                cart_id: cart.id,
                product_id: productId,
                so_luong: quantity
            });
        }
        
        // Trả về thông tin của mục vừa được thêm/cập nhật.
        response.status(201).json(cartItem);
    } catch (error) {
        console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
        response.status(500).json({ message: "Lỗi server khi thêm sản phẩm vào giỏ hàng.", error: error.message });
    }
};

/**
 * @description     Cập nhật số lượng của một sản phẩm trong giỏ hàng.
 * @route           PUT /api/cart/items/:itemId
 * @access          Private
 */
const updateCartItem = async (request, response) => {
    const { itemId } = request.params; // Lấy ID của CartItem từ URL
    const { soLuong } = request.body;   // Lấy số lượng mới từ body

    if (!soLuong || parseInt(soLuong) <= 0) {
        return response.status(400).json({ message: "Số lượng không hợp lệ." });
    }

    try {
        const cartItem = await CartItem.findByPk(itemId);
        if (!cartItem) {
            return response.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ hàng." });
        }
        
        // Xác thực: Kiểm tra xem CartItem này có thực sự thuộc về giỏ hàng của người dùng đang đăng nhập không.
        const cart = await Cart.findOne({ where: { id: cartItem.cart_id, user_id: request.user.id }});
        if (!cart) {
            return response.status(403).json({ message: "Bạn không có quyền thực hiện hành động này." });
        }

        // Cập nhật số lượng và lưu lại
        cartItem.so_luong = parseInt(soLuong);
        await cartItem.save();
        
        response.status(200).json(cartItem);
    } catch (error) {
        console.error("Lỗi khi cập nhật sản phẩm trong giỏ hàng:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     Xóa một sản phẩm khỏi giỏ hàng.
 * @route           DELETE /api/cart/items/:itemId
 * @access          Private
 */
const removeCartItem = async (request, response) => {
    const { itemId } = request.params;
    try {
        const cartItem = await CartItem.findByPk(itemId);
        if (!cartItem) {
            return response.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ hàng." });
        }

        // Tương tự như update, cần xác thực quyền sở hữu
        const cart = await Cart.findOne({ where: { id: cartItem.cart_id, user_id: request.user.id }});
        if (!cart) {
            return response.status(403).json({ message: "Bạn không có quyền thực hiện hành động này." });
        }
        
        // Xóa bản ghi CartItem
        await cartItem.destroy();
        
        response.status(200).json({ message: "Xóa sản phẩm khỏi giỏ hàng thành công." });
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

module.exports = { 
    getCart, 
    addToCart, 
    updateCartItem, 
    removeCartItem 
};