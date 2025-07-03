const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/connectDB');

// 1. SỬ DỤNG sequelize.define() ĐỂ TẠO MODEL
const Promotion = sequelize.define('Promotion', {
    // Khóa chính
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    // Mã khuyến mãi mà người dùng sẽ nhập
    ma_khuyen_mai: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    // Mô tả ngắn gọn về chương trình khuyến mãi
    mo_ta: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    // Loại giảm giá: theo phần trăm hay theo số tiền cố định
    loai_giam_gia: {
        type: DataTypes.ENUM('percentage', 'fixed_amount'),
        allowNull: false,
    },
    // Giá trị của việc giảm giá
    gia_tri_giam: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    // Điều kiện về giá trị đơn hàng tối thiểu để được áp dụng
    dieu_kien_don_hang_toi_thieu: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    // Ngày bắt đầu có hiệu lực
    ngay_bat_dau: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    // Ngày kết thúc hiệu lực
    ngay_ket_thuc: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    // Giới hạn số lần sử dụng. NULL nghĩa là không giới hạn.
    so_luong_gioi_han: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    // Số lần mã đã được sử dụng
    so_luong_da_su_dung: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    // Trạng thái của mã: true (hoạt động), false (đã tắt)
    trang_thai: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    // Phạm vi áp dụng của khuyến mãi
    pham_vi_ap_dung: {
        type: DataTypes.ENUM('all', 'category', 'product'),
        allowNull: false,
        defaultValue: 'all'
    },
    // Danh sách các ID được áp dụng, ngăn cách bởi dấu phẩy
    danh_sach_id_ap_dung: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Số tiền giảm giá tối đa
    giam_toi_da: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
    }

}, {
    // 2. CÁC TÙY CHỌN CHO MODEL
    tableName: 'promotions',
    timestamps: true
});

// 3. ĐỊNH NGHĨA ASSOCIATE (nếu có)
// Promotion.associate = (models) => {
//     // Ví dụ: this.belongsTo(models.User, { foreignKey: 'created_by' });
// };

// 4. EXPORT MODEL
module.exports = Promotion;