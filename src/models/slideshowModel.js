// File: /src/models/slideshowModel.js

// Import các kiểu dữ liệu từ thư viện Sequelize
const { DataTypes } = require('sequelize');
// Import đối tượng sequelize từ file cấu hình kết nối CSDL
const { sequelize } = require('../config/connectDB');

// Định nghĩa model 'Slideshow' tương ứng với bảng 'slideshows'
const Slideshow = sequelize.define('Slideshow', {
    // Cột 'id': Khóa chính của bảng
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    // Cột 'image_url': Đường dẫn (URL) đến hình ảnh của slide
    image_url: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Đường dẫn đến ảnh của slide, '
    },

    // Cột 'tieu_de': Tiêu đề chính hiển thị trên slide (nếu có)
    tieu_de: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Tiêu đề chính trên slide, ví dụ: "Sách Mới Ra Mắt"'
    },

    // Cột 'phu_de': Tiêu đề phụ hoặc mô tả ngắn gọn hơn trên slide
    phu_de: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Tiêu đề phụ hoặc mô tả ngắn, ví dụ: "Giảm giá đến 50%"'
    },

    // Cột 'link_to': Đường dẫn mà người dùng sẽ được chuyển đến khi click vào slide
    link_to: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Đường dẫn khi click vào slide, ví dụ: /products/123 hoặc /categories/4'
    },

    // Cột 'thu_tu_hien_thi': Số thứ tự để sắp xếp các slide
    // Slide có số nhỏ hơn sẽ được hiển thị trước.
    thu_tu_hien_thi: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Dùng để sắp xếp thứ tự các slide, số nhỏ hơn hiển thị trước'
    },

    // Cột 'trang_thai': Trạng thái hiển thị của slide
    trang_thai: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // true: hiển thị, false: ẩn
    },
}, {
    // Các tùy chọn cho model

    tableName: 'slideshows', // Tên của bảng trong CSDL
    timestamps: true,        // Cần biết slide được tạo/cập nhật khi nào
});

// Export model Slideshow để các file khác có thể sử dụng.
module.exports = Slideshow;