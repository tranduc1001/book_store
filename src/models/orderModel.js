// File: /src/models/orderModel.js (CHUẨN MỚI - CLASS-BASED)

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/connectDB');

// 1. ĐỊNH NGHĨA CLASS 'Order' KẾ THỪA TỪ 'Model'
class Order extends Model {
    // 2. ĐỊNH NGHĨA HÀM ASSOCIATE (STATIC)
    // Hàm này sẽ được gọi từ file index.js để thiết lập các mối quan hệ
    static associate(models) {
        // Một Order thuộc về một User
        this.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });

        // Một Order có nhiều OrderItem
        this.hasMany(models.OrderItem, {
            foreignKey: 'order_id',
            as: 'orderItems',
            onDelete: 'CASCADE'
        });
    }
}

// 3. KHỞI TẠO MODEL VỚI CÁC TRƯỜNG VÀ TÙY CHỌN
Order.init({
    // Cột 'id': Khóa chính của bảng, mã đơn hàng
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    ten_nguoi_nhan: { type: DataTypes.STRING, allowNull: false },
    email_nguoi_nhan: { type: DataTypes.STRING, allowNull: false },
    sdt_nguoi_nhan: { type: DataTypes.STRING(20), allowNull: false },
    dia_chi_giao_hang: { type: DataTypes.STRING, allowNull: false },
    ghi_chu_khach_hang: { type: DataTypes.TEXT, allowNull: true },
    tong_tien_hang: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    phi_van_chuyen: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    tong_thanh_toan: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    phuong_thuc_thanh_toan: { type: DataTypes.STRING(50), allowNull: false },
    trang_thai_don_hang: {
        type: DataTypes.ENUM('pending', 'confirmed', 'shipping', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
    },
    trang_thai_thanh_toan: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    // 4. TRUYỀN VÀO SEQUELIZE INSTANCE VÀ CÁC TÙY CHỌN KHÁC
    sequelize,              // Kết nối instance
    modelName: 'Order',     // Tên của model, Sequelize sẽ tự động tạo bảng 'Orders'
    tableName: 'orders',    // Ghi đè tên bảng thành 'orders' (viết thường, số nhiều)
    timestamps: true        // Bật createdAt và updatedAt
});

// 5. EXPORT CLASS
module.exports = Order;