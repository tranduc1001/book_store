// File: /src/models/comboModel.js

// Import các kiểu dữ liệu từ thư viện Sequelize
const { DataTypes } = require('sequelize');
// Import đối tượng sequelize từ file cấu hình kết nối CSDL
const { sequelize } = require('../config/connectDB');

// Định nghĩa model 'Combo' tương ứng với bảng 'combos'
const Combo = sequelize.define('Combo', {
    // Cột 'id': Khóa chính của bảng
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    // Cột 'ten_combo': Tên của gói sản phẩm
    ten_combo: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    // Cột 'mo_ta': Mô tả chi tiết về combo
    mo_ta: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    // Cột 'img': Đường dẫn đến ảnh đại diện cho combo
    img: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Ảnh đại diện cho gói combo'
    },

    // Cột 'gia_combo': Giá bán của cả combo
    gia_combo: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Giá bán của cả gói sản phẩm này'
    },

    // Cột 'trang_thai': Trạng thái hiển thị của combo
    trang_thai: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // true: đang bán (hiển thị), false: ngừng bán (ẩn)
    }
}, {
    // Các tùy chọn cho model

    tableName: 'combos', // Tên của bảng trong CSDL
    timestamps: true,    // Cần biết combo được tạo/cập nhật khi nào
});

// Export model Combo để các file khác có thể sử dụng.
module.exports = Combo;