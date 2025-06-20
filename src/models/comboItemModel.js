// File: /src/models/comboItemModel.js

// Import các kiểu dữ liệu từ thư viện Sequelize
const { DataTypes } = require('sequelize');
// Import đối tượng sequelize từ file cấu hình kết nối CSDL
const { sequelize } = require('../config/connectDB');

// Định nghĩa model 'ComboItem' tương ứng với bảng 'combo_items'
const ComboItem = sequelize.define('ComboItem', {
    // Cột 'id': Khóa chính của bảng
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    
    // Cột 'combo_id': Khóa ngoại, liên kết tới bảng 'combos'
    combo_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },

    // Cột 'product_id': Khóa ngoại, liên kết tới bảng 'sach' (products)
    product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    }
}, {
    // Các tùy chọn cho model
    tableName: 'combo_items', // Tên của bảng trong CSDL
    timestamps: true,        // Bảng trung gian thường không cần timestamps
});

// Export model ComboItem để các file khác, đặc biệt là index.js, có thể sử dụng.
module.exports = ComboItem;