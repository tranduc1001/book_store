const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/connectDB');

// 1. SỬ DỤNG sequelize.define() ĐỂ TẠO MODEL
const Order = sequelize.define('Order', {
    // Cột 'id': Khóa chính của bảng, mã đơn hàng
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    // Cột 'user_id': Khóa ngoại tham chiếu đến bảng 'users'
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'users', // Tên bảng 'users'
            key: 'id'
        }
    },
    ten_nguoi_nhan: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email_nguoi_nhan: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sdt_nguoi_nhan: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    dia_chi_giao_hang: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ghi_chu_khach_hang: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tong_tien_hang: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    phi_van_chuyen: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    tong_thanh_toan: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    phuong_thuc_thanh_toan: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    ma_khuyen_mai_da_ap_dung: {
        type: DataTypes.STRING,
        allowNull: true // Cho phép NULL nếu đơn hàng không dùng mã KM
    },
    so_tien_giam_gia: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    trang_thai_don_hang: {
        type: DataTypes.ENUM('pending', 'pending_payment', 'confirmed', 'shipping', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
    },
    trang_thai_thanh_toan: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    // 2. CÁC TÙY CHỌN CHO MODEL
    tableName: 'orders',    // Ghi đè tên bảng thành 'orders'
    timestamps: true        // Bật createdAt và updatedAt
});

// 3. ĐỊNH NGHĨA CÁC MỐI QUAN HỆ (ASSOCIATIONS)
Order.associate = (models) => {
    // Một Order "thuộc về một" User
    Order.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'SET NULL', // hoặc 'RESTRICT'
        onUpdate: 'CASCADE'
    });

    // Một Order "có nhiều" OrderItem
    Order.hasMany(models.OrderItem, {
        foreignKey: 'order_id',
        as: 'orderItems',
        onDelete: 'CASCADE' // Nếu xóa Order, các OrderItem liên quan cũng bị xóa
    });
};

// 4. EXPORT MODEL
module.exports = Order;