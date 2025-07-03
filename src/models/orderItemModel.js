const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/connectDB');

// 1. SỬ DỤNG sequelize.define() ĐỂ TẠO MODEL
const OrderItem = sequelize.define('OrderItem', {
    // Khóa chính
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    // Khóa ngoại tham chiếu đến bảng 'orders'
    order_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'orders', // Tên bảng 'orders'
            key: 'id'
        }
    },
    // Khóa ngoại tham chiếu đến bảng 'products'
    product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'products', // Tên bảng 'products'
            key: 'id'
        }
    },
    // Số lượng sản phẩm được đặt trong mục này
    so_luong_dat: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // Đơn giá của sản phẩm tại thời điểm đặt hàng
    don_gia: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
    }
}, {
    // 2. CÁC TÙY CHỌN CHO MODEL
    tableName: 'order_items',
    timestamps: true
});

// 3. ĐỊNH NGHĨA CÁC MỐI QUAN HỆ (ASSOCIATIONS)
OrderItem.associate = (models) => {
    // Một OrderItem "thuộc về một" Order
    OrderItem.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order',
        onDelete: 'CASCADE', // Khi xóa Order, OrderItem này cũng bị xóa
        onUpdate: 'CASCADE'
    });

    // Một OrderItem "thuộc về một" Product
    OrderItem.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product',
        onDelete: 'SET NULL', // Khi xóa Product, product_id trong OrderItem sẽ thành NULL
        onUpdate: 'CASCADE'
    });
};

// 4. EXPORT MODEL
module.exports = OrderItem;