const db = require('../models');
const { Op } = require('sequelize');
const sequelize = db.sequelize;

/**
 * Controller để lấy tất cả dữ liệu thống kê cho trang Dashboard.
 * Nhận tham số `startDate` và `endDate` từ query string.
 */
const getDashboardStats = async (req, res) => {
    try {
        // --- BƯỚC 1: XỬ LÝ KHOẢNG THỜI GIAN ĐẦU VÀO ---
        let { startDate, endDate } = req.query;

        // Nếu không có, đặt mặc định là 30 ngày gần nhất
        if (!startDate || !endDate) {
            const today = new Date();
            endDate = new Date();
            startDate = new Date(new Date().setDate(today.getDate() - 30));
        } else {
            // Đảm bảo endDate bao gồm cả ngày cuối cùng (đến 23:59:59)
            endDate = new Date(endDate);
            endDate.setHours(23, 59, 59, 999);
        }

        // Tạo điều kiện WHERE cho khoảng thời gian để tái sử dụng
        const dateRangeWhere = {
            createdAt: {
                [Op.gte]: new Date(startDate),
                [Op.lte]: new Date(endDate),
            },
        };

        const completedStatus = 'delivered'; // Quan trọng: Phải khớp với ENUM trong model

        // --- BƯỚC 2: LẤY DOANH THU GOM NHÓM THEO THÁNG/NĂM ---
        // Kết quả sẽ là một mảng các object, ví dụ: [{ year: 2025, month: 6, total: 750000 }]
        const revenueByMonth = await db.Order.findAll({
            attributes: [
                [sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "createdAt"')), 'year'],
                [sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "createdAt"')), 'month'],
                [sequelize.fn('SUM', sequelize.col('tong_thanh_toan')), 'total']
            ],
            where: {
                trang_thai_don_hang: completedStatus,
                ...dateRangeWhere // Áp dụng bộ lọc thời gian
            },
            group: ['year', 'month'],
            order: [[sequelize.col('year'), 'ASC'], [sequelize.col('month'), 'ASC']],
            raw: true
        });

        // --- BƯỚC 3: LẤY CÁC DỮ LIỆU THỐNG KÊ KHÁC ---
        
        // Tạo điều kiện WHERE cho các câu lệnh JOIN phức tạp
        const joinWhereCondition = {
            trang_thai_don_hang: completedStatus,
            ...dateRangeWhere
        };

        // Top 5 sản phẩm bán chạy nhất trong khoảng thời gian đã chọn
        const topSellingProducts = await db.OrderItem.findAll({
            attributes: [
                'product_id',
                [sequelize.fn('SUM', sequelize.col('so_luong_dat')), 'total_sold']
            ],
            include: [
                { model: db.Product, as: 'product', attributes: ['ten_sach'] },
                {
                    model: db.Order, as: 'order',
                    where: joinWhereCondition,
                    attributes: [] // Không cần lấy cột nào từ bảng Order
                }
            ],
            group: ['product_id', 'product.id'],
            order: [[sequelize.fn('SUM', sequelize.col('so_luong_dat')), 'DESC']],
            limit: 5,
            raw: true,
            nest: true,
        });

        // Top 5 khách hàng tiềm năng trong khoảng thời gian đã chọn
        const topCustomers = await db.Order.findAll({
            attributes: [
                'user_id',
                [sequelize.fn('COUNT', sequelize.col('Order.id')), 'order_count'],
            ],
            include: [{
                model: db.User, as: 'user',
                attributes: ['ho_ten', 'email']
            }],
            where: joinWhereCondition,
            group: ['user_id', 'user.id'],
            order: [[sequelize.fn('COUNT', sequelize.col('Order.id')), 'DESC']],
            limit: 5,
            raw: true,
            nest: true,
        });

        // --- BƯỚC 4: GỬI PHẢN HỒI VỀ CHO CLIENT ---
        res.status(200).json({
            revenueByMonth,
            topSellingProducts,
            topCustomers
        });

    } catch (error) {
        // Ghi log lỗi ra console của server để debug
        console.error("Lỗi khi lấy dữ liệu dashboard:", error);
        // Trả về lỗi 500 cho client
        res.status(500).json({ message: "Lỗi server khi lấy dữ liệu thống kê." });
    }
};

module.exports = {
    getDashboardStats
};