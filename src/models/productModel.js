// File: /src/models/productModel.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/connectDB');

// Định nghĩa model 'Product' tương ứng với bảng 'products' trong CSDL
const Product = sequelize.define('Product', {
    // Sequelize sẽ tự động tạo cột 'id' làm khóa chính (primary key) với auto-increment
    // nên chúng ta không cần định nghĩa nó ở đây.

    ten_sach: {
        type: DataTypes.STRING, // Kiểu chuỗi, tương đương VARCHAR(255)
        allowNull: false // Bắt buộc phải có giá trị
    },

    mo_ta_ngan: {
        type: DataTypes.TEXT, // Kiểu TEXT cho mô tả dài
        allowNull: true // Cho phép giá trị null
    },

    gia_bia: {
        type: DataTypes.DECIMAL(12, 2), // Kiểu số thập phân, ví dụ: 1234567890.12
        allowNull: false
    },

    so_luong_ton_kho: {
        type: DataTypes.INTEGER, // Kiểu số nguyên
        allowNull: false,
        defaultValue: 0 // Giá trị mặc định là 0 nếu không được cung cấp
    },

    tac_gia: {
        type: DataTypes.STRING,
        allowNull: true
    },

    nha_xuat_ban: {
        type: DataTypes.STRING,
        allowNull: true
    },

    nam_xuat_ban: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    img: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL đến hình ảnh đại diện của sản phẩm'
    },
    so_trang: {
        type: DataTypes.INTEGER, // kiểu số nguyên
        allowNull: true,
        validate: {
            isInt: true,      // Phải là số nguyên
            min: 1            // Số trang phải lớn hơn 0
        }
    },
    // Trường để phân biệt sách in và ebook
    product_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'print_book', // 'print_book' hoặc 'ebook'
        comment: 'Loại sản phẩm: sách in (print_book) hoặc ebook'
    },

    // Trường để lưu link download cho ebook
    ebook_url: {
        type: DataTypes.STRING,
        allowNull: true, // Chỉ có giá trị khi product_type là 'ebook'
        comment: 'Đường dẫn gốc đến file ebook'
    },

    // Khóa ngoại trỏ đến bảng 'categories'
    danh_muc_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    }

}, {
    // Các tùy chọn cho model
    tableName: 'products', // Chỉ định rõ tên bảng trong CSDL
    timestamps: true, // Tự động thêm các cột createdAt và updatedAt
    
  
});

// Định nghĩa các mối quan hệ (associations)
// Hàm này sẽ được gọi tự động bởi file /models/index.js
Product.associate = (models) => {

    // Quan hệ: Một Product thuộc về một Category (Product.belongsTo(Category))
    // --> Sẽ thêm một khóa ngoại `danh_muc_id` vào bảng `products`.
    Product.belongsTo(models.Category, {
        foreignKey: 'danh_muc_id',
        as: 'category' // Đặt bí danh để có thể include một cách dễ dàng và tường minh
    });

    // Quan hệ: Một Product có thể xuất hiện trong nhiều OrderItems (Product.hasMany(OrderItem))
    // --> Sẽ thêm một khóa ngoại `product_id` vào bảng `order_items`.
    Product.hasMany(models.OrderItem, {
        foreignKey: 'product_id',
        as: 'orderItems',
        onDelete: 'CASCADE', 
        hooks: true 
    });
     Product.hasMany(models.CartItem, {
         foreignKey: 'product_id', 
         onDelete: 'CASCADE', 
         hooks: true });
    // Quan hệ: Một Product có thể có nhiều Reviews (Product.hasMany(Review))
    // --> Sẽ thêm một khóa ngoại `product_id` vào bảng `reviews`.
    Product.hasMany(models.Review, {
        foreignKey: 'product_id',
        as: 'reviews',
        onDelete: 'CASCADE', 
        hooks: true 
    });
     Product.hasMany(models.ReceiptItem, {
        foreignKey: 'product_id',
        as: 'receiptHistory' // Lịch sử nhập hàng
    });
};

module.exports = Product;