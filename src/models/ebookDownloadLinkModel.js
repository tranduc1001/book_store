// File: /src/models/ebookDownloadLinkModel.js

// Import các kiểu dữ liệu từ thư viện Sequelize
const { DataTypes } = require('sequelize');
// Import đối tượng sequelize từ file cấu hình kết nối CSDL
const { sequelize } = require('../config/connectDB');

// Định nghĩa model 'EbookDownloadLink' tương ứng với bảng 'ebook_download_links'
const EbookDownloadLink = sequelize.define('EbookDownloadLink', {
    // Cột 'id': Khóa chính của bảng
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    // Cột 'user_id': Khóa ngoại, liên kết tới người dùng yêu cầu tạo link
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },

    // Cột 'product_id': Khóa ngoại, liên kết tới sản phẩm E-book cần tải
    product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },

    // Cột 'order_id': Khóa ngoại, liên kết tới đơn hàng đã mua E-book này
    // Dùng để xác thực rằng người dùng thực sự đã mua sản phẩm.
    order_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },

    // Cột 'download_token': Một chuỗi token ngẫu nhiên, duy nhất.
    // Đây là thành phần chính để bảo mật link download.
    download_token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Mỗi token phải là duy nhất
    },

    // Cột 'expires_at': Thời gian mà token này sẽ hết hạn.
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },

    // Cột 'is_used': Đánh dấu link đã được sử dụng hay chưa.
    // Có thể dùng để giới hạn mỗi link chỉ được tải một lần.
    is_used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
}, {
    // Các tùy chọn cho model
    
    tableName: 'ebook_download_links', // Tên của bảng trong CSDL
    timestamps: true, // Cần biết link được tạo khi nào
});

// Export model EbookDownloadLink để các file khác có thể sử dụng.
module.exports = EbookDownloadLink;