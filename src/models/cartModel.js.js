// File: /src/models/cartModel.js

// Import các kiểu dữ liệu từ thư viện Sequelize
const { DataTypes } = require('sequelize');
// Import đối tượng sequelize từ file cấu hình kết nối CSDL
const { sequelize } = require('../config/connectDB');

// Định nghĩa model 'Cart' tương ứng với bảng 'carts'
const Cart = sequelize.define('Cart', {
    // Cột 'id': Khóa chính của bảng giỏ hàng
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    // Cột 'user_id': Khóa ngoại, liên kết tới bảng 'users'.
    // Cột này xác định giỏ hàng này thuộc về người dùng nào.
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false, // Một giỏ hàng phải thuộc về một người dùng cụ thể.
        unique: true 
    }
}, {
    // Các tùy chọn cho model

    tableName: 'carts', // Tên của bảng trong CSDL
    timestamps: true,
    
});
Cart.associate = (models) => {
    // Quan hệ: Một Cart thuộc về một User
    Cart.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // Quan hệ: Một Cart có nhiều CartItems
    // Đây chính là dòng code sửa lỗi "CartItem is not associated to Cart!"
    Cart.hasMany(models.CartItem, {
        foreignKey: 'cart_id',
        as: 'items' // Đặt bí danh là 'items' để khớp với controller
    });
};
// Export model Cart để các file khác có thể sử dụng.
module.exports = Cart;