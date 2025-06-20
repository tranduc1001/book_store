// File: /src/controllers/dashboardController.js

// Import các model cần thiết và đối tượng sequelize cùng các toán tử
const { Order, User, Product, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * @description     Admin: Lấy các số liệu thống kê tổng quan cho dashboard.
 * @route           GET /api/dashboard/overview
 * @access          Private/Admin
 */
const getDashboardOverview = async (request, response) => {
    try {
        // 1. TÍNH TỔNG DOANH THU
        // Sử dụng hàm `sum` của Sequelize để tính tổng cột 'tong_thanh_toan'.
        // Chỉ tính cho các đơn hàng đã giao thành công ('delivered').
        const totalRevenue = await Order.sum('tong_thanh_toan', {
            where: { trang_thai_don_hang: 'delivered' }
        });

        // 2. ĐẾM SỐ LƯỢNG ĐƠN HÀNG
        // Sử dụng hàm `count` để đếm số bản ghi.
        const totalOrders = await Order.count();
        const successfulOrders = await Order.count({ where: { trang_thai_don_hang: 'delivered' } });
        const pendingOrders = await Order.count({ where: { trang_thai_don_hang: 'pending' } });
        const cancelledOrders = await Order.count({ where: { trang_thai_don_hang: 'cancelled' } });

        // 3. ĐẾM SỐ LƯỢNG NGƯỜI DÙNG VÀ SẢN PHẨM
        const totalUsers = await User.count({ where: { role_id: 2 } }); // Chỉ đếm người dùng thường
        const totalProducts = await Product.count();

        // 4. TRẢ VỀ KẾT QUẢ
        // Trả về một đối tượng chứa tất cả các số liệu đã tính toán.
        // `|| 0` để đảm bảo nếu kết quả là null (khi chưa có đơn hàng nào) thì sẽ trả về 0.
        response.status(200).json({
            totalRevenue: totalRevenue || 0,
            orders: {
                total: totalOrders,
                successful: successfulOrders,
                pending: pendingOrders,
                cancelled: cancelledOrders
            },
            totalUsers: totalUsers,
            totalProducts: totalProducts
        });
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu tổng quan cho dashboard:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     Admin: Lấy dữ liệu doanh thu theo 12 tháng gần nhất để vẽ biểu đồ.
 * @route           GET /api/dashboard/revenue-by-month
 * @access          Private/Admin
 */
const getRevenueByMonth = async (request, response) => {
    try {
        const currentYear = new Date().getFullYear();
        // Truy vấn này khá phức tạp, nó sử dụng các hàm của CSDL để trích xuất và tính toán.
        const revenueData = await Order.findAll({
            // Các cột cần lấy
            attributes: [
                // 1. Trích xuất tháng từ cột 'createdAt' và đặt tên cho cột kết quả là 'month'.
                //    `sequelize.fn` cho phép gọi các hàm gốc của CSDL.
                //    `sequelize.literal` để viết một chuỗi SQL thuần.
                [sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "createdAt"')), 'month'],
                
                // 2. Tính tổng cột 'tong_thanh_toan' và đặt tên là 'total'.
                [sequelize.fn('SUM', sequelize.col('tong_thanh_toan')), 'total']
            ],
            // Điều kiện lọc
            where: {
                trang_thai_don_hang: 'delivered', // Chỉ tính đơn hàng thành công
                // Chỉ lấy các đơn hàng trong năm hiện tại
                [Op.and]: [
                    sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "createdAt"')), currentYear)
                ]
            },
            // Nhóm kết quả lại theo tháng để hàm SUM hoạt động đúng
            group: ['month'],
            // Sắp xếp kết quả theo tháng tăng dần
            order: [[sequelize.literal('month'), 'ASC']]
        });
        
        // Định dạng lại dữ liệu thành một mảng 12 phần tử (tương ứng 12 tháng)
        // để phía frontend có thể dễ dàng sử dụng để vẽ biểu đồ.
        const formattedData = Array(12).fill(0); // Tạo một mảng 12 số 0
        revenueData.forEach(item => {
            const monthIndex = item.get('month') - 1; // get('month') trả về tháng từ 1-12, index của mảng từ 0-11
            // Gán giá trị doanh thu vào đúng vị trí tháng trong mảng
            formattedData[monthIndex] = parseFloat(item.get('total'));
        });

        response.status(200).json(formattedData);
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu doanh thu theo tháng:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

module.exports = {
    getDashboardOverview,
    getRevenueByMonth
};