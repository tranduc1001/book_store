// File: /src/controllers/orderController.js

// Import các model cần thiết và đối tượng sequelize để sử dụng transaction
const { Order, OrderItem, Cart, CartItem, Product, sequelize } = require('../models');
// Import service gửi email
const db = require('../models');
const { sendOrderConfirmationEmail } = require('../services/emailService');

/**
 * @description     Tạo một đơn hàng mới từ giỏ hàng của người dùng.
 * @route           POST /api/orders
 * @access          Private
 */
const createOrder = async (request, response) => {
    // Bước 1: Khởi tạo transaction và gán nó vào biến 't'
     const t = await db.sequelize.transaction();

    try {
        const userId = request.user.id; // Lấy userId từ middleware xác thực
        const { ten_nguoi_nhan, email_nguoi_nhan, sdt_nguoi_nhan, dia_chi_giao_hang, phuong_thuc_thanh_toan, ghi_chu_khach_hang } = request.body;

        // Tìm giỏ hàng của người dùng
        const cart = await db.Cart.findOne({ where: { user_id: userId } });
        if (!cart) {
            await t.rollback(); // Hủy transaction
            return response.status(404).json({ message: "Không tìm thấy giỏ hàng." });
        }

        // Lấy tất cả các sản phẩm trong giỏ hàng
        const cartItems = await CartItem.findAll({
            where: { cart_id: cart.id },
            include: [{ 
                model: Product,
                as: 'product'
             }]
        });
        if (cartItems.length === 0) {
            await t.rollback(); // Hủy transaction
            return response.status(400).json({ message: "Giỏ hàng của bạn đang trống." });
        }

        // Tính toán tổng giá trị đơn hàng
          const tong_tien_hang = cartItems.reduce((acc, item) => {
            if (item.product) { // <<< SỬA 'item.Product' THÀNH 'item.product'
                return acc + item.product.gia_bia * item.so_luong;
            }
            return acc;
        }, 0);
        // Giả sử phí vận chuyển là một giá trị cố định hoặc tính toán sau
        const phi_van_chuyen = 30000;
        const tong_thanh_toan = tong_tien_hang + phi_van_chuyen;

        // Bước 2: Tạo đơn hàng và truyền vào { transaction: t }
        const newOrder = await Order.create({
            user_id: userId,
            ten_nguoi_nhan,
            email_nguoi_nhan,
            sdt_nguoi_nhan,
            dia_chi_giao_hang,
            phuong_thuc_thanh_toan,
            trang_thai_don_hang: 'pending', // Trạng thái ban đầu
            tong_tien_hang,
            phi_van_chuyen,
            tong_thanh_toan,
            ghi_chu_khach_hang
        }, { transaction: t }); // <<< Đảm bảo tất cả các thao tác ghi đều có option này

        // Bước 3: Chuẩn bị và tạo các mục chi tiết đơn hàng (OrderItem)
        const orderItems = [];
        for (const item of cartItems) {
            orderItems.push({
                order_id: newOrder.id,
                product_id: item.product_id,
                so_luong_dat: item.so_luong,
                don_gia: item.product.gia_bia,
                don_gia_sau_khi_khuyen_mai: item.product.gia_bia // Giả sử chưa có khuyến mãi
            });
            // Cập nhật số lượng tồn kho của sản phẩm
            const product = await Product.findByPk(item.product_id, { transaction: t });
            if (product.so_luong_ton_kho < item.so_luong) {
                // Nếu không đủ hàng, hủy toàn bộ transaction
                throw new Error(`Sản phẩm "${product.ten_sach}" không đủ số lượng trong kho.`);
            }
            product.so_luong_ton_kho -= item.so_luong;
            await product.save({ transaction: t });
        }
        await OrderItem.bulkCreate(orderItems, { transaction: t });

        // Bước 4: Xóa các sản phẩm đã mua khỏi giỏ hàng
        await CartItem.destroy({ where: { cart_id: cart.id }, transaction: t });
        await Cart.update({ tong_tien: 0 }, { where: { id: cart.id }, transaction: t });

        // Bước 5: Nếu tất cả các bước trên thành công, commit transaction
        await t.commit();

        // Gửi email xác nhận (sau khi đã commit thành công)
        await sendOrderConfirmationEmail(newOrder.email_nguoi_nhan, newOrder.toJSON());

        // Gửi phản hồi thành công về cho client
        response.status(201).json(newOrder);

    } catch (error) {
        // Bước 6: Nếu có bất kỳ lỗi nào xảy ra, rollback transaction
        await t.rollback();
        console.error("Lỗi khi tạo đơn hàng:", error);
        response.status(500).json({ message: "Lỗi server khi tạo đơn hàng.", error: error.message });
    }
};


/**
 * @description     Lấy danh sách các đơn hàng của người dùng đang đăng nhập.
 * @route           GET /api/orders/myorders
 * @access          Private
 */
const getMyOrders = async (request, response) => {
    try {
        // Sử dụng db.Order thay vì Order
        const orders = await db.Order.findAll({
            where: { user_id: request.user.id },
            order: [['createdAt', 'DESC']]
        });
        response.status(200).json(orders);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     Lấy thông tin chi tiết của một đơn hàng.
 * @route           GET /api/orders/:id
 * @access          Private (Cả User và Admin đều có thể xem, nhưng User chỉ xem được đơn của mình)
 */
const getOrderById = async (request, response) => {
    try {
       const order = await db.Order.findByPk(request.params.id, {
           include: [
                {
                    model: db.OrderItem, 
                    as: 'orderItems', // Sử dụng bí danh đã định nghĩa trong model
                    include: {        // Include lồng: Lấy cả thông tin Product
                        model: db.Product,
                        as: 'product' // Sử dụng bí danh từ OrderItem -> Product
                    }
                },
                {
                    model: db.User,     // Lấy cả thông tin người đặt hàng
                    as: 'user',
                    attributes: ['id', 'ho_ten', 'email'] // Chỉ lấy các trường cần thiết
                }
            ]
        });
         if (order) {
             if (request.user.role === 'admin' || order.user_id === request.user.id) {
                response.status(200).json(order);
            } else {
                response.status(403).json({ message: "Không có quyền truy cập vào đơn hàng này." });
            }
        } else {
            response.status(404).json({ message: "Không tìm thấy đơn hàng." });
        }
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     Admin: Cập nhật trạng thái của một đơn hàng.
 * @route           PUT /api/orders/:id/status
 * @access          Private/Admin
 */
const updateOrderStatus = async (request, response) => {
    try {
        const { trang_thai_don_hang } = request.body;
        const order = await db.Order.findByPk(request.params.id);

        if (order) {
            // Logic hủy đơn: cập nhật lại số lượng tồn kho
            if (trang_thai_don_hang === 'cancelled' && order.trang_thai_don_hang !== 'cancelled') {
                const orderItems = await OrderItem.findAll({ where: { order_id: order.id } });
                for (const item of orderItems) {
                    await Product.increment('so_luong_ton_kho', {
                        by: item.so_luong_dat,
                        where: { id: item.product_id }
                    });
                }
            }

            order.trang_thai_don_hang = trang_thai_don_hang;
            await order.save();
            response.status(200).json(order);
        } else {
            response.status(404).json({ message: "Không tìm thấy đơn hàng." });
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};
/**
 * @description     Admin: Lấy tất cả các đơn hàng trong hệ thống
 * @route           GET /api/orders
 * @access          Private/Admin
 */
const getAllOrders = async (req, res) => {
    try {
        const orders = await db.Order.findAll({
            // Sắp xếp đơn hàng mới nhất lên đầu
            order: [['createdAt', 'DESC']],
            // Lấy kèm thông tin người đặt hàng để hiển thị
            include: {
                model: db.User,
                as: 'user',
                attributes: ['ho_ten', 'email'] // Chỉ lấy các trường cần thiết
            }
        });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Lỗi khi lấy tất cả đơn hàng:", error);
        res.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};
module.exports = { 
    createOrder, 
    getMyOrders, 
    getOrderById, 
    updateOrderStatus,
    getAllOrders
};