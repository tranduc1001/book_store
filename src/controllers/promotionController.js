// File: /src/controllers/promotionController.js

// Import các model cần thiết và các toán tử của Sequelize
const { Promotion, Product, Category, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * @description     Admin: Tạo một mã khuyến mãi mới.
 * @route           POST /api/promotions
 * @access          Private/Admin
 */
const createPromotion = async (request, response) => {
    try {
        // Tạo một bản ghi mới trong bảng 'khuyen_mai' với dữ liệu từ body của request
        const newPromo = await Promotion.create(request.body);
        response.status(201).json(newPromo);
    } catch (error) {
        // Bắt lỗi nếu mã khuyến mãi đã tồn tại (do có ràng buộc unique)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return response.status(400).json({ message: "Mã khuyến mãi này đã tồn tại." });
        }
        console.error("Lỗi khi tạo khuyến mãi:", error);
        response.status(500).json({ message: "Tạo khuyến mãi thất bại.", error: error.message });
    }
};

/**
 * @description     Admin: Lấy tất cả các mã khuyến mãi để quản lý.
 * @route           GET /api/promotions
 * @access          Private/Admin
 */
const getAllPromotions = async (request, response) => {
    try {
        const promotions = await Promotion.findAll({ order: [['createdAt', 'DESC']] });
        response.status(200).json(promotions);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách khuyến mãi:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     Admin: Cập nhật thông tin mã khuyến mãi.
 * @route           PUT /api/promotions/:id
 * @access          Private/Admin
 */
const updatePromotion = async (request, response) => {
    try {
        const promo = await Promotion.findByPk(request.params.id);
        if (promo) {
            const updatedPromo = await promo.update(request.body);
            response.status(200).json(updatedPromo);
        } else {
            response.status(404).json({ message: "Không tìm thấy mã khuyến mãi." });
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật khuyến mãi:", error);
        response.status(500).json({ message: "Cập nhật thất bại.", error: error.message });
    }
};

/**
 * @description     Admin: Xóa một mã khuyến mãi.
 * @route           DELETE /api/promotions/:id
 * @access          Private/Admin
 */
const deletePromotion = async (request, response) => {
    try {
        const promo = await Promotion.findByPk(request.params.id);
        if (promo) {
            await promo.destroy();
            response.status(200).json({ message: "Xóa mã khuyến mãi thành công." });
        } else {
            response.status(404).json({ message: "Không tìm thấy mã khuyến mãi." });
        }
    } catch (error) {
        console.error("Lỗi khi xóa khuyến mãi:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     User: Kiểm tra và áp dụng mã khuyến mãi.
 * @route           POST /api/promotions/apply
 * @access          Private
 */
const applyPromotion = async (request, response) => {
    // Frontend cần gửi lên mã KM và tổng tiền hiện tại của giỏ hàng để kiểm tra
    const { ma_khuyen_mai, currentSubtotal } = request.body; 

    if (!ma_khuyen_mai || currentSubtotal === undefined) {
        return response.status(400).json({ message: "Vui lòng cung cấp mã khuyến mãi và tổng tiền giỏ hàng." });
    }

    try {
        // 1. TÌM MÃ KHUYẾN MÃI
        const promo = await Promotion.findOne({
            where: {
                ma_khuyen_mai: { [Op.iLike]: ma_khuyen_mai }, // Tìm không phân biệt hoa thường
                trang_thai: true,                             // Phải đang hoạt động
                ngay_bat_dau: { [Op.lte]: new Date() },       // Phải còn hạn sử dụng
                ngay_ket_thuc: { [Op.gte]: new Date() },
            }
        });

        // 2. KIỂM TRA CÁC ĐIỀU KIỆN CƠ BẢN
        if (!promo) {
            return response.status(404).json({ message: "Mã khuyến mãi không hợp lệ hoặc đã hết hạn." });
        }
        if (promo.so_luong_gioi_han !== null && promo.so_luong_da_su_dung >= promo.so_luong_gioi_han) {
            return response.status(400).json({ message: "Mã khuyến mãi đã hết lượt sử dụng." });
        }
        if (parseFloat(currentSubtotal) < parseFloat(promo.dieu_kien_don_hang_toi_thieu)) {
            const minOrderValue = parseFloat(promo.dieu_kien_don_hang_toi_thieu).toLocaleString('vi-VN');
            return response.status(400).json({ message: `Đơn hàng phải có giá trị tối thiểu là ${minOrderValue}đ để áp dụng mã này.` });
        }

        // 3. TÍNH TOÁN SỐ TIỀN ĐƯỢC GIẢM
        // Logic tính toán chi tiết (áp dụng cho từng sản phẩm/danh mục) sẽ được thực hiện khi tạo đơn hàng.
        // Ở bước này, chúng ta chỉ cần tính toán dựa trên tổng tiền để hiển thị cho người dùng.
        let discountAmount = 0;
        if (promo.loai_giam_gia === 'percentage') {
            // Tính số tiền giảm thô theo %
            const rawDiscount = (parseFloat(currentSubtotal) * parseFloat(promo.gia_tri_giam)) / 100;
            const maxDiscount = parseFloat(promo.giam_toi_da);

            // Nếu có thiết lập "giảm tối đa", hãy so sánh và lấy số nhỏ hơn
            if (maxDiscount > 0) {
                discountAmount = Math.min(rawDiscount, maxDiscount);
            } else {
                // Nếu không có giới hạn, lấy số tiền giảm thô
                discountAmount = rawDiscount;
            }
        } else { // 'fixed_amount'
            discountAmount = parseFloat(promo.gia_tri_giam);
        }
        
        // Đảm bảo cuối cùng số tiền giảm không được lớn hơn tổng tiền của giỏ hàng
        discountAmount = Math.min(discountAmount, parseFloat(currentSubtotal));
        
        // 4. TRẢ VỀ KẾT QUẢ
        response.status(200).json({
            success: true,
            message: "Áp dụng mã khuyến mãi thành công!",
            discountAmount: discountAmount,
            promotionDetails: promo // Gửi cả chi tiết mã KM về để frontend xử lý nếu cần
        });

    } catch (error) {
        console.error("Lỗi khi áp dụng mã khuyến mãi:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};
/**
 * @description     User: Lấy các mã khuyến mãi có thể sử dụng được
 * @route           GET /api/promotions/available
 * @access          Private
 */
const getAvailablePromotions = async (request, response) => {
    try {
        // Lấy tổng tiền tạm tính của giỏ hàng từ query string
        const currentSubtotal = parseFloat(request.query.subtotal || 0);

        const availablePromos = await Promotion.findAll({
            where: {
                trang_thai: true,
                ngay_bat_dau: { [Op.lte]: new Date() },
                ngay_ket_thuc: { [Op.gte]: new Date() },
                // Chỉ lấy các mã có điều kiện đơn hàng tối thiểu <= tổng tiền hiện tại
                dieu_kien_don_hang_toi_thieu: { [Op.lte]: currentSubtotal },
                // Chỉ lấy các mã chưa hết lượt sử dụng
                [Op.or]: [
                    { so_luong_gioi_han: null },
                    { so_luong_gioi_han: { [Op.gt]: sequelize.col('so_luong_da_su_dung') } }
                ]
            },
            order: [['createdAt', 'DESC']]
        });
        response.status(200).json(availablePromos);
    } catch (error) {
        console.error("Lỗi khi lấy khuyến mãi hợp lệ:", error);
        response.status(500).json({ message: "Lỗi server." });
    }
};


module.exports = {
    createPromotion,
    getAllPromotions,
    updatePromotion,
    deletePromotion,
    applyPromotion,
    getAvailablePromotions
};