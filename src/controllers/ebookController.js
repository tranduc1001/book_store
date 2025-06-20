// File: /src/controllers/ebookController.js

// Import các model cần thiết
const { EbookDownloadLink, Order, OrderItem, Product } = require('../models');
// Import module `crypto` của Node.js để tạo token ngẫu nhiên
const crypto = require('crypto');
// Import module `path` của Node.js để làm việc với đường dẫn file
const path = require('path');
// Import toán tử Op
const { Op } = require('sequelize');

/**
 * @description     User: Lấy danh sách các Ebook mà người dùng đã mua.
 * @route           GET /api/ebooks/my-ebooks
 * @access          Private
 */
const getMyEbooks = async (request, response) => {
    try {
        // Tìm tất cả các đơn hàng của người dùng đã được giao thành công
        const purchasedOrders = await Order.findAll({
            where: {
                user_id: request.user.id,
                trang_thai_don_hang: 'delivered'
            },
            // Chỉ lấy các đơn hàng có chứa sản phẩm là e-book
            include: {
                model: OrderItem,
                as: 'items',
                required: true, // INNER JOIN: chỉ lấy những đơn hàng có ít nhất một OrderItem thỏa mãn điều kiện bên dưới
                include: {
                    model: Product,
                    as: 'product',
                    where: { product_type: 'ebook' }, // Lọc những sản phẩm có loại là 'ebook'
                    attributes: ['id', 'ten_sach', 'img']
                }
            },
            attributes: ['id', 'createdAt'] // Chỉ lấy các trường cần thiết của đơn hàng
        });

        response.status(200).json(purchasedOrders);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách Ebook đã mua:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     User: Tạo một đường link download tạm thời cho một Ebook đã mua.
 * @route           POST /api/ebooks/generate-link
 * @access          Private
 */
const generateDownloadLink = async (request, response) => {
    // Người dùng cần gửi lên ID của sản phẩm và ID của đơn hàng đã mua sản phẩm đó
    const { productId, orderId } = request.body;
    const userId = request.user.id;

    try {
        // 1. XÁC THỰC QUYỀN SỞ HỮU
        // Kiểm tra xem có tồn tại một đơn hàng của user này, đã giao thành công, VÀ chứa sản phẩm này không.
        const isValidPurchase = await Order.findOne({
            where: { id: orderId, user_id: userId, trang_thai_don_hang: 'delivered' },
            include: {
                model: OrderItem,
                as: 'items',
                where: { product_id: productId }
            }
        });

        if (!isValidPurchase) {
            return response.status(403).json({ message: "Yêu cầu không hợp lệ. Bạn không có quyền tải file này." });
        }

        // 2. TẠO TOKEN VÀ THỜI GIAN HẾT HẠN
        // Tạo một chuỗi 20 bytes ngẫu nhiên và chuyển thành dạng hex để làm token
        const download_token = crypto.randomBytes(20).toString('hex');
        // Link sẽ hết hạn sau 24 giờ kể từ lúc tạo
        const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); 

        // 3. TẠO BẢN GHI LINK DOWNLOAD MỚI TRONG CSDL
        const newLink = await EbookDownloadLink.create({
            user_id: userId,
            product_id: productId,
            order_id: orderId,
            download_token,
            expires_at
        });

        // 4. TRẢ VỀ ĐƯỜNG LINK HOÀN CHỈNH CHO FRONTEND
        // Đường link này sẽ trỏ đến API download của chúng ta ở dưới.
        const downloadUrl = `${request.protocol}://${request.get('host')}/api/ebooks/download/${newLink.download_token}`;
        response.status(200).json({ downloadUrl: downloadUrl });

    } catch (error) {
        console.error("Lỗi khi tạo link download Ebook:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     Thực hiện việc tải file Ebook về máy người dùng bằng token.
 * @route           GET /api/ebooks/download/:token
 * @access          Public (Vì token đã là một lớp bảo mật)
 */
const downloadEbook = async (request, response) => {
    try {
        const { token } = request.params;
        
        // 1. TÌM LINK TRONG CSDL DỰA VÀO TOKEN
        // Điều kiện: token phải khớp, link chưa được sử dụng, và link chưa hết hạn.
        const link = await EbookDownloadLink.findOne({
            where: {
                download_token: token,
                is_used: false,
                expires_at: { [Op.gt]: new Date() } // gt: greater than (lớn hơn)
            },
            include: { model: Product, attributes: ['ebook_url', 'ten_sach'] }
        });

        // Nếu không tìm thấy link hợp lệ, báo lỗi.
        if (!link) {
            // Dùng response.send để trả về một trang HTML đơn giản báo lỗi
            return response.status(404).send('<h1>Link download không hợp lệ, đã được sử dụng hoặc đã hết hạn.</h1>');
        }

        // 2. ĐÁNH DẤU LINK ĐÃ SỬ DỤNG (để ngăn tải lại)
        link.is_used = true;
        await link.save();

        // 3. XÁC ĐỊNH ĐƯỜNG DẪN ĐẾN FILE TRÊN SERVER
        // Giả sử bạn có một thư mục `uploads/ebooks` ở thư mục gốc của dự án để chứa các file PDF.
        const filePath = path.join(__dirname, '..', '..', 'uploads', 'ebooks', link.Product.ebook_url);
        
        // 4. TRẢ VỀ FILE CHO NGƯỜI DÙNG TẢI XUỐNG
        // Hàm `response.download()` của Express sẽ tự động thiết lập các header cần thiết
        // để trình duyệt hiểu đây là một file cần tải về thay vì hiển thị.
        response.download(filePath, `${link.Product.ten_sach}.pdf`, (error) => {
            if (error) {
                // Ghi log lỗi nếu có vấn đề trong quá trình gửi file
                console.error("Lỗi khi gửi file Ebook:", error);
                // Không thể gửi response khác sau khi đã bắt đầu gửi file,
                // Express sẽ tự xử lý việc đóng kết nối.
            }
        });

    } catch (error) {
        console.error("Lỗi server trong quá trình download:", error);
        response.status(500).send("<h1>Đã có lỗi xảy ra ở phía server.</h1>");
    }
};


module.exports = {
    getMyEbooks,
    generateDownloadLink,
    downloadEbook
};