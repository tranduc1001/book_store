// File: /src/models/promotionModel.js

// Import các kiểu dữ liệu từ thư viện Sequelize
const { DataTypes } = require('sequelize');
// Import đối tượng sequelize từ file cấu hình kết nối CSDL
const { sequelize } = require('../config/connectDB');

// Định nghĩa model 'Promotion' tương ứng với bảng 'khuyen_mai'
const Promotion = sequelize.define('Promotion', {
    // Cột 'id': Khóa chính của bảng
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    // Cột 'ma_khuyen_mai': Mã code mà người dùng sẽ nhập vào để nhận ưu đãi
    ma_khuyen_mai: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Mỗi mã khuyến mãi phải là duy nhất
        comment: 'Mã code người dùng sẽ nhập, ví dụ: "TET2024", "FREESHIP"'
    },
    // Cột 'mo_ta': Mô tả về chương trình khuyến mãi
    mo_ta: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    // Cột 'loai_giam_gia': Xác định hình thức giảm giá
    loai_giam_gia: {
        type: DataTypes.ENUM('percentage', 'fixed_amount'), // 'percentage': giảm theo %, 'fixed_amount': giảm số tiền cụ thể
        allowNull: false,
    },
    // Cột 'gia_tri_giam': Giá trị của việc giảm giá
    gia_tri_giam: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Nếu loai_giam_gia là "percentage" thì đây là %, nếu là "fixed_amount" thì đây là số tiền'
    },
    // Cột 'dieu_kien_don_hang_toi_thieu': Giá trị đơn hàng tối thiểu để được áp dụng mã
    dieu_kien_don_hang_toi_thieu: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        comment: 'Giá trị đơn hàng tối thiểu để áp dụng mã'
    },
    // Cột 'ngay_bat_dau': Thời gian bắt đầu có hiệu lực của mã
    ngay_bat_dau: {
        type: DataTypes.DATE,
        allowNull: false
    },
    // Cột 'ngay_ket_thuc': Thời gian hết hiệu lực của mã
    ngay_ket_thuc: {
        type: DataTypes.DATE,
        allowNull: false
    },
    // Cột 'so_luong_gioi_han': Tổng số lượt sử dụng tối đa của mã
    so_luong_gioi_han: {
        type: DataTypes.INTEGER,
        allowNull: true, // Giá trị null có nghĩa là không giới hạn số lượng
    },
    // Cột 'so_luong_da_su_dung': Số lượt đã sử dụng mã này
    so_luong_da_su_dung: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    // Cột 'pham_vi_ap_dung': Xác định đối tượng được áp dụng khuyến mãi
    pham_vi_ap_dung: {
        type: DataTypes.ENUM('all', 'category', 'product'), // 'all': toàn bộ đơn hàng, 'category': danh mục, 'product': sản phẩm cụ thể
        allowNull: false,
        defaultValue: 'all'
    },
    // Cột 'danh_sach_ap_dung': Chứa danh sách ID của đối tượng được áp dụng
    // Đây là một tính năng mạnh mẽ của PostgreSQL.
    danh_sach_ap_dung: {
        type: DataTypes.ARRAY(DataTypes.BIGINT), // Kiểu dữ liệu mảng các số nguyên lớn
        allowNull: true,
        comment: 'Lưu mảng các ID của sản phẩm hoặc danh mục được áp dụng'
    },
    // Cột 'trang_thai': Trạng thái của mã khuyến mãi
    trang_thai: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // true: đang hoạt động, false: đã tắt
    },
}, {
    // Các tùy chọn cho model
    tableName: 'promotions',
    timestamps: true,
});

// Export model Promotion để các file khác có thể sử dụng.
module.exports = Promotion;