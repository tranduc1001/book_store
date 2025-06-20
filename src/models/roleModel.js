// File: /src/models/roleModel.js

// Import các kiểu dữ liệu từ thư viện Sequelize
const { DataTypes } = require('sequelize');
// Import đối tượng sequelize từ file cấu hình kết nối CSDL
const { sequelize } = require('../config/connectDB');

// Định nghĩa model 'Role' tương ứng với bảng 'roles'
const Role = sequelize.define('Role', {
    // Cột 'id': Khóa chính của bảng
    id: {
        type: DataTypes.BIGINT,      // Kiểu dữ liệu số nguyên lớn
        primaryKey: true,            // Đánh dấu đây là khóa chính
        autoIncrement: true,         // Tự động tăng giá trị
    },
    
    // Cột 'ten_quyen': Tên của vai trò (ví dụ: 'admin', 'user')
    ten_quyen: {
        type: DataTypes.STRING,
        allowNull: false,            // Không được phép để trống
        unique: true,                // Tên mỗi vai trò phải là duy nhất
    }
}, {
    // Các tùy chọn cho model

    tableName: 'roles',              // Tên của bảng trong CSDL
    
    // Bảng này chứa dữ liệu gần như không thay đổi (dữ liệu gốc),
    // nên chúng ta không cần hai cột `createdAt` và `updatedAt`.
    timestamps: true, 
});

// Export model Role để các file khác (đặc biệt là index.js và userController.js) có thể sử dụng.
module.exports = Role;