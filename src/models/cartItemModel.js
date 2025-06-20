// File: /src/models/cartItemModel.js

// Import các kiểu dữ liệu từ thư viện Sequelize
const { DataTypes } = require('sequelize');
// Import đối tượng sequelize từ file cấu hình kết nối CSDL
const { sequelize } = require('../config/connectDB');

// Định nghĩa model 'CartItem' tương ứng với bảng 'cart_items'
const CartItem = sequelize.define('CartItem', {
    // Cột 'id': Khóa chính của bảng
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    // Cột 'cart_id': Khóa ngoại, liên kết tới bảng 'carts'.
    // Cột này cho biết mục này thuộc về giỏ hàng nào.
    cart_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },

    // Cột 'product_id': Khóa ngoại, liên kết tới bảng 'sach' (products).
    // Cột này cho biết đây là sản phẩm nào.
    product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },

    // Cột 'so_luong': Số lượng của sản phẩm này trong giỏ hàng.
    so_luong: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1, // Mặc định khi thêm vào giỏ là 1 sản phẩm
    }
}, {
    // Các tùy chọn cho model

    tableName: 'cart_items', // Tên của bảng trong CSDL
    
    // Bảng này không nhất thiết cần timestamps (`createdAt`, `updatedAt`)
    // vì thông tin này không quá quan trọng đối với từng mục trong giỏ hàng.
    // Thời gian cập nhật của cả giỏ hàng (trong bảng 'carts') là đủ.
    timestamps: true,
});
CartItem.associate = (models) => {
    // Quan hệ: Một CartItem thuộc về một Cart
    CartItem.belongsTo(models.Cart, {
        foreignKey: 'cart_id',
        as: 'cart'
    });

    // Quan hệ: Một CartItem thuộc về một Product
    // Đây chính là dòng code sửa lỗi!
    CartItem.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product' // Đặt bí danh là 'product' để khớp với controller
    });
};

// Export model CartItem để các file khác có thể sử dụng.
module.exports = CartItem;