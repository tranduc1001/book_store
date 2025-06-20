// File: /src/models/orderItemModel.js (Phiên bản hoàn chỉnh)

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/connectDB');

// 1. ĐỊNH NGHĨA CLASS
class OrderItem extends Model {
    // 2. THÊM HÀM ASSOCIATE VÀO ĐÂY
    static associate(models) {
        // Mối quan hệ "Nhiều-Một": Một OrderItem thuộc về một Order
        this.belongsTo(models.Order, {
            foreignKey: 'order_id',
            as: 'order'
        });

        // Mối quan hệ "Nhiều-Một": Một OrderItem thuộc về một Product
        // DÒNG NÀY CHÍNH LÀ PHẦN BỊ THIẾU GÂY RA LỖI
        this.belongsTo(models.Product, {
            foreignKey: 'product_id',
            as: 'product' // Đặt bí danh là 'product' để khớp với controller
        });
    }
}

// 3. KHỞI TẠO MODEL
OrderItem.init({
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
    },
    // Khóa ngoại tham chiếu đến bảng 'products'
    product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
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
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items',
    timestamps: true
});

// 4. EXPORT CLASS
module.exports = OrderItem;