// File: /src/models/reviewModel.js

// Import các kiểu dữ liệu từ thư viện Sequelize
const { DataTypes } = require('sequelize');
// Import đối tượng sequelize từ file cấu hình kết nối CSDL
const { sequelize } = require('../config/connectDB');

// Định nghĩa model 'Review' tương ứng với bảng 'reviews'
const Review = sequelize.define('Review', {
    // Cột 'id': Khóa chính của bảng
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    // Cột 'user_id': Khóa ngoại, liên kết tới người dùng đã viết đánh giá/bình luận
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },

    // Cột 'product_id': Khóa ngoại, liên kết tới sản phẩm được đánh giá/bình luận
    product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },

    // Cột 'rating': Số sao đánh giá, từ 1 đến 5
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true, // Cho phép null, vì người dùng có thể chỉ bình luận mà không đánh giá.
        validate: {
            min: 1, // Giá trị nhỏ nhất là 1
            max: 5, // Giá trị lớn nhất là 5
        }
    },

    // Cột 'comment': Nội dung bình luận của người dùng
    comment: {
        type: DataTypes.TEXT,
        allowNull: true, // Cho phép null, vì người dùng có thể chỉ đánh giá sao mà không bình luận.
    },

    // Cột 'parent_id': Khóa ngoại tự tham chiếu đến chính nó.
    // Dùng để tạo tính năng trả lời (reply) bình luận.
    // Nếu một bình luận là câu trả lời cho một bình luận khác, cột này sẽ chứa `id` của bình luận cha.
    parent_id: {
        type: DataTypes.BIGINT,
        allowNull: true, // Cho phép null, vì các bình luận/đánh giá gốc sẽ không có cha.
        references: {
            model: 'reviews', // Tham chiếu đến chính bảng 'reviews'
            key: 'id'
        }
    }
}, {
    // Các tùy chọn cho model

    tableName: 'reviews', // Tên của bảng trong CSDL
    timestamps: true,     // Cần biết thời gian bình luận được tạo và cập nhật
    
});
Review.associate = (models) => {
    // Quan hệ: Một Review thuộc về một User
    // Đây chính là dòng code sửa lỗi "User is not associated to Review!"
    Review.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'User' // Đặt bí danh là 'User' (viết hoa) để khớp với controller
    });

    // Quan hệ: Một Review thuộc về một Product
    Review.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product'
    });
};


// Export model Review để các file khác có thể sử dụng.
module.exports = Review;