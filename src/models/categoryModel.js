// File: /src/models/categoryModel.js (Phiên bản cuối cùng, đã sửa lỗi triệt để)

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/connectDB');

const Category = sequelize.define('Category', {
    // Không cần định nghĩa 'id' một cách tường minh, Sequelize sẽ tự tạo.
    
    ten_danh_muc: {
        type: DataTypes.STRING, // Bỏ (255) đi cho đơn giản
        allowNull: false
    },
    mo_ta: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Quan trọng: Chỉ định nghĩa cột khóa ngoại, không thêm 'references' ở đây.
    // Việc tạo khóa ngoại sẽ do phần 'associate' đảm nhiệm.
    danh_muc_cha_id: {
        type: DataTypes.BIGINT,
        allowNull: true // Danh mục gốc không có cha
    },
    img: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'categories',
    timestamps: true, // Bật timestamps
   
});

// Hàm associate sẽ được gọi trong /models/index.js
// Nó định nghĩa mối quan hệ SAU KHI tất cả các model đã được khởi tạo.
// Đây là cách làm chuẩn và an toàn nhất.
Category.associate = (models) => {
    // Quan hệ một Category có nhiều Products
    Category.hasMany(models.Product, {
        foreignKey: 'danh_muc_id',
        as: 'products'
    });

    // Quan hệ một Category (cha) có nhiều Categories (con)
    Category.hasMany(models.Category, { 
        foreignKey: 'danh_muc_cha_id', 
        as: 'subCategories' 
    });

    // Quan hệ một Category (con) thuộc về một Category (cha)
    Category.belongsTo(models.Category, { 
        foreignKey: 'danh_muc_cha_id', 
        as: 'parentCategory' 
    });
};

module.exports = Category;