// Import các model cần thiết và đối tượng sequelize để sử dụng transaction
const db = require('../models');
const { sequelize } = db;
const { Op } = require('sequelize'); // Lấy sequelize và Op từ db object cho nhất quán
// Import service gửi email
const { sendOrderConfirmationEmail, sendOutOfStockApologyEmail } = require('../services/emailService');
const { createMomoPayment } = require('../services/momoService');

/**
 * @description     Tạo một đơn hàng mới từ giỏ hàng của người dùng.
 * @route           POST /api/orders
 * @access          Private
 */
const createOrder = async (request, response) => {
    // Khởi tạo transaction để đảm bảo toàn vẹn dữ liệu
    const t = await sequelize.transaction();

    try {
        // === BƯỚC 1: LẤY DỮ LIỆU TỪ REQUEST VÀ GIỎ HÀNG ===
        const userId = request.user.id;
        // Lấy thông tin người nhận và mã khuyến mãi (nếu có) từ body của request
        const {
            ten_nguoi_nhan,
            email_nguoi_nhan,
            sdt_nguoi_nhan,
            dia_chi_giao_hang,
            phuong_thuc_thanh_toan,
            ghi_chu_khach_hang,
            ma_khuyen_mai
        } = request.body;

        // Tìm giỏ hàng của người dùng
        const cart = await db.Cart.findOne({ where: { user_id: userId } });
        if (!cart) {
            return response.status(404).json({ message: "Không tìm thấy giỏ hàng của bạn." });
        }
        
        // Lấy tất cả các sản phẩm trong giỏ hàng, kèm theo thông tin chi tiết của sản phẩm
        const cartItems = await db.CartItem.findAll({
            where: { cart_id: cart.id },
            include: [{ model: db.Product, as: 'product' }]
        });
        if (cartItems.length === 0) {
            return response.status(400).json({ message: "Giỏ hàng của bạn đang trống." });
        }

        // === BƯỚC 2: KIỂM TRA TỒN KHO TRƯỚC KHI TIẾP TỤC ===
        for (const item of cartItems) {
            if (!item.product || item.product.so_luong_ton_kho < item.so_luong) {
                const productName = item.product ? item.product.ten_sach : 'Không xác định';
                // Gửi email xin lỗi khách hàng vì sự cố hết hàng
                sendOutOfStockApologyEmail(email_nguoi_nhan, { name: ten_nguoi_nhan }, { id: item.product_id, ten_sach: productName });
                // Trả về lỗi ngay lập tức để frontend xử lý
                return response.status(400).json({
                    message: `Rất tiếc, sản phẩm "${productName}" đã tạm thời hết hàng.`,
                    outOfStock: true,
                    productId: item.product_id,
                });
            }
        }

        // === BƯỚC 3: XÁC THỰC VÀ TÍNH TOÁN KHUYẾN MÃI (NẾU CÓ) ===
        let discountAmount = 0;
        let promotion = null;

        // Tính tổng tiền hàng trước khi áp dụng khuyến mãi
        const tong_tien_hang = cartItems.reduce((acc, item) => acc + (parseFloat(item.product.gia_bia) * item.so_luong), 0);

        // Chỉ xử lý nếu người dùng có nhập mã khuyến mãi
        if (ma_khuyen_mai) {
            promotion = await db.Promotion.findOne({
                where: {
                    ma_khuyen_mai: { [Op.iLike]: ma_khuyen_mai }, // Tìm không phân biệt hoa thường
                    trang_thai: true,
                    ngay_bat_dau: { [Op.lte]: new Date() },
                    ngay_ket_thuc: { [Op.gte]: new Date() },
                    // Đảm bảo số lượng đã dùng nhỏ hơn số lượng giới hạn
                    so_luong_da_su_dung: { [Op.lt]: db.sequelize.col('so_luong_gioi_han') }
                }
            });

            if (!promotion) {
                throw new Error("Mã khuyến mãi không hợp lệ, đã hết hạn hoặc hết lượt sử dụng.");
            }
            if (tong_tien_hang < parseFloat(promotion.dieu_kien_don_hang_toi_thieu)) {
                const minOrderValue = parseFloat(promotion.dieu_kien_don_hang_toi_thieu).toLocaleString('vi-VN');
                throw new Error(`Đơn hàng phải có giá trị tối thiểu là ${minOrderValue}đ để áp dụng mã này.`);
            }

            // Tính toán số tiền được giảm
            let subtotalForDiscount = tong_tien_hang;
            // (Trong tương lai có thể thêm logic tính subtotal cho từng loại sản phẩm/danh mục ở đây)
            
            if (promotion.loai_giam_gia === 'percentage') {
                let calculatedDiscount = (subtotalForDiscount * parseFloat(promotion.gia_tri_giam)) / 100;
                // Áp dụng mức giảm giá tối đa nếu có
                if (promotion.giam_toi_da && calculatedDiscount > parseFloat(promotion.giam_toi_da)) {
                    calculatedDiscount = parseFloat(promotion.giam_toi_da);
                }
                discountAmount = calculatedDiscount;
            } else { // 'fixed_amount'
                discountAmount = parseFloat(promotion.gia_tri_giam);
            }
            // Đảm bảo số tiền giảm không vượt quá tổng tiền
            discountAmount = Math.min(discountAmount, subtotalForDiscount);
        }
        
        // === BƯỚC 4: TÍNH TOÁN GIÁ TRỊ CUỐI CÙNG VÀ TẠO ĐƠN HÀNG ===
        const phi_van_chuyen = 30000;
        const tong_thanh_toan = tong_tien_hang - discountAmount + phi_van_chuyen;
        
        const newOrder = await db.Order.create({
            user_id: userId,
            ten_nguoi_nhan,
            email_nguoi_nhan,
            sdt_nguoi_nhan,
            dia_chi_giao_hang,
            phuong_thuc_thanh_toan,
            trang_thai_don_hang:  phuong_thuc_thanh_toan === 'momo' ? 'pending_payment' : 'pending',
            tong_tien_hang,
            phi_van_chuyen,
            so_tien_giam_gia: discountAmount,
            ma_khuyen_mai_da_ap_dung: promotion ? promotion.ma_khuyen_mai : null,
            tong_thanh_toan,
            ghi_chu_khach_hang
        }, { transaction: t });

        // === BƯỚC 5: TẠO CHI TIẾT ĐƠN HÀNG, CẬP NHẬT KHO VÀ MÃ KHUYẾN MÃI ===
        for (const item of cartItems) {
            await db.OrderItem.create({
                order_id: newOrder.id,
                product_id: item.product_id,
                so_luong_dat: item.so_luong,
                don_gia: item.product.gia_bia,
            }, { transaction: t });

            await db.Product.decrement('so_luong_ton_kho', {
                by: item.so_luong,
                where: { id: item.product_id },
                transaction: t
            });
        }
        
        if (promotion) {
            await promotion.increment('so_luong_da_su_dung', { by: 1, transaction: t });
        }
          // <<< 3. XỬ LÝ THANH TOÁN DỰA TRÊN PHƯƠNG THỨC >>>
        if (phuong_thuc_thanh_toan === 'momo') {
            const redirectUrl = `${process.env.CLIENT_URL}/my-orders/${newOrder.id}`; // Chuyển về trang chi tiết đơn hàng
            const ipnUrl = `${process.env.SERVER_URL}/api/orders/momo-ipn`;
            
            const momoResponse = await createMomoPayment({
                orderId: `BOOKSTORE_${newOrder.id}_${new Date().getTime()}`, // Tạo mã đơn hàng duy nhất cho MoMo
                amount: tong_thanh_toan,
                orderInfo: `Thanh toan cho don hang #${newOrder.id}`,
                redirectUrl,
                ipnUrl
            });

            if (momoResponse && momoResponse.payUrl) {
                await db.CartItem.destroy({ where: { cart_id: cart.id }, transaction: t });
                await t.commit();
                return response.status(200).json({ payUrl: momoResponse.payUrl });
            } else {
                throw new Error("Không thể tạo yêu cầu thanh toán MoMo.");
            }
        } else { // Xử lý cho COD
            await db.CartItem.destroy({ where: { cart_id: cart.id }, transaction: t });
            await t.commit();
            sendOrderConfirmationEmail(newOrder.email_nguoi_nhan, newOrder.toJSON());
            return response.status(201).json(newOrder);
        }

    } catch (error) {
        // Nếu có lỗi, hủy bỏ tất cả các thao tác đã thực hiện trong transaction
        await t.rollback();
        const statusCode = error.message.includes("Mã khuyến mãi") || error.message.includes("Đơn hàng không đủ điều kiện") ? 400 : 500;
        console.error("Lỗi khi tạo đơn hàng:", error);
        response.status(statusCode).json({ message: error.message });
    }
};

/**
 * @description     Nhận thông báo kết quả thanh toán từ MoMo (IPN - Instant Payment Notification)
 * @route           POST /api/orders/momo-ipn
 * @access          Public (MoMo server calls this)
 */
const handleMomoIPN = async (request, response) => {
    // Logic xác thực chữ ký của MoMo sẽ được thêm vào sau để đảm bảo an toàn
    // const isValid = verifyIPN(request.body);
    // if (!isValid) {
    //     return response.status(400).json({ message: "Invalid signature" });
    // }

    const { orderId, message, resultCode } = request.body;
    
    // Lấy ID đơn hàng gốc của bạn từ chuỗi orderId của MoMo
    const originalOrderId = orderId.split('_')[1];

    try {
        if (resultCode === 0) { // Thanh toán thành công
            const order = await db.Order.findByPk(originalOrderId);
            if (order) {
                order.trang_thai_don_hang = 'pending'; // Chuyển sang trạng thái "chờ xác nhận"
                order.trang_thai_thanh_toan = true; // Đánh dấu đã thanh toán
                await order.save();
                
                // Gửi email xác nhận
                sendOrderConfirmationEmail(order.email_nguoi_nhan, order.toJSON());
            }
        } else { // Thanh toán thất bại
            // (Tùy chọn) Có thể cập nhật trạng thái đơn hàng thành "payment_failed"
            console.log(`Thanh toán MoMo cho đơn hàng ${originalOrderId} thất bại: ${message}`);
        }
        
        // Luôn trả về 204 để báo cho MoMo đã nhận được thông báo
        response.status(204).send();

    } catch (error) {
        console.error("Lỗi xử lý MoMo IPN:", error);
        // Nếu có lỗi, cũng nên trả về 204 để MoMo không gửi lại
        response.status(204).send();
    }
};
/**
 * @description     Lấy danh sách các đơn hàng của người dùng đang đăng nhập.
 * @route           GET /api/orders/myorders
 * @access          Private
 */
const getMyOrders = async (request, response) => {
    try {
        const orders = await db.Order.findAll({
            where: { user_id: request.user.id },
            order: [['createdAt', 'DESC']]
        });
        response.status(200).json(orders);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách đơn hàng của tôi:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     Lấy thông tin chi tiết của một đơn hàng.
 * @route           GET /api/orders/:id
 * @access          Private (Cả User và Admin đều có thể xem)
 */
const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        const order = await db.Order.findByPk(orderId, {
            include: [
                { model: db.User, as: 'user', attributes: ['ho_ten', 'email'] },
                {
                    model: db.OrderItem,
                    as: 'orderItems',
                    include: { model: db.Product, as: 'product', attributes: ['ten_sach', 'img'] }
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }

        if (req.user.role.ten_quyen === 'admin' || order.user_id === req.user.id) {
            return res.status(200).json(order);
        } else {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập vào đơn hàng này.' });
        }
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
        res.status(500).json({ message: 'Lỗi server.', error: error.message });
    }
};

/**
 * @description     Admin: Cập nhật trạng thái của một đơn hàng.
 * @route           PUT /api/orders/:id/status
 * @access          Private/Admin
 */
const updateOrderStatus = async (req, res) => {
    const { status: newStatus } = req.body;
    const orderId = req.params.id;
    const t = await sequelize.transaction();

    try {
        const order = await db.Order.findByPk(orderId, {
            include: [{ model: db.OrderItem, as: 'orderItems' }],
            transaction: t 
        });

        if (!order) {
            await t.rollback();
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }
        
        const oldStatus = order.trang_thai_don_hang;
        // Chỉ hoàn trả tồn kho nếu đơn hàng bị hủy từ một trạng thái khác 'cancelled'
        if (oldStatus !== 'cancelled' && newStatus === 'cancelled') {
            for (const item of order.orderItems) {
                await db.Product.increment('so_luong_ton_kho', {
                    by: item.so_luong_dat,
                    where: { id: item.product_id },
                    transaction: t
                });
            }
        }
        
        // Nếu admin xác nhận đơn hàng đã giao, tự động cập nhật là đã thanh toán
        if (newStatus === 'delivered') {
            order.trang_thai_thanh_toan = true;
        }
        
        order.trang_thai_don_hang = newStatus;
        await order.save({ transaction: t });
        await t.commit();

        res.status(200).json({ message: `Trạng thái đơn hàng đã được cập nhật thành công!`, order });

    } catch (error) {
        await t.rollback();
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái.', error: error.message });
    }
};

/**
 * @description     Admin: Lấy tất cả các đơn hàng trong hệ thống (có phân trang và lọc)
 * @route           GET /api/orders
 * @access          Private/Admin
 */
const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, keyword = '', status = '' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereCondition = {};
        if (status) {
            whereCondition.trang_thai_don_hang = status;
        }
        if (keyword) {
            whereCondition[Op.or] = [
                db.sequelize.where(db.sequelize.cast(db.sequelize.col('Order.id'), 'varchar'), { [Op.iLike]: `%${keyword}%` }),
                { ten_nguoi_nhan: { [Op.iLike]: `%${keyword}%` } },
                { email_nguoi_nhan: { [Op.iLike]: `%${keyword}%` } }
            ];
        }

        const { count, rows } = await db.Order.findAndCountAll({
            where: whereCondition,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset,
        });

        res.status(200).json({
            orders: rows,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
        });

    } catch (error) {
        console.error("Lỗi API getAllOrders:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn hàng.' });
    }
};

module.exports = { 
    createOrder,
    handleMomoIPN,
    getMyOrders, 
    getOrderById, 
    updateOrderStatus,
    getAllOrders
};