// File: /src/models/receiptItemModel.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/connectDB');

const ReceiptItem = sequelize.define('ReceiptItem', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    // Khóa ngoại liên kết đến bảng receipts
    receipt_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    // Khóa ngoại liên kết đến bảng products (sách)
    product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    so_luong_nhap: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1, // Nên có giá trị mặc định là 1
    },
    gia_nhap: {
        type: DataTypes.DECIMAL(12, 2), // Giá gốc trên mỗi đơn vị
        allowNull: false,
    },
    // ==========================================================
    // ================ PHẦN BỔ SUNG QUAN TRỌNG =================
    // ==========================================================
    chiet_khau: {
        type: DataTypes.DECIMAL(12, 2), // Số tiền chiết khấu trên mỗi đơn vị
        allowNull: false,
        defaultValue: 0.00 // Mặc định là không có chiết khấu
    },
    thanh_tien: {
        // Đây là cột được tính toán: (gia_nhap - chiet_khau) * so_luong_nhap
        // Chúng ta sẽ lưu lại để truy vấn cho nhanh
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    }
    // ==========================================================

}, {
    tableName: 'receipt_items',
    timestamps: true,
    // Thêm hooks để tự động tính toán 'thanh_tien'
    hooks: {
        beforeValidate: (receiptItem) => {
              // Tính toán thành tiền trước khi lưu vào DB
            const giaSauChietKhau = parseFloat(receiptItem.gia_nhap) - parseFloat(receiptItem.chiet_khau);
            if (giaSauChietKhau < 0) {
                throw new Error("Chiết khấu không thể lớn hơn giá nhập.");
            }
            receiptItem.thanh_tien = giaSauChietKhau * parseInt(receiptItem.so_luong_nhap);
        }
    }
});

ReceiptItem.associate = (models) => {
    // Quan hệ: Một Chi tiết phiếu nhập thuộc về một Phiếu nhập
    ReceiptItem.belongsTo(models.Receipt, {
        foreignKey: 'receipt_id',
        as: 'receipt'
    });

    // Quan hệ: Một Chi tiết phiếu nhập ứng với một Sản phẩm
    ReceiptItem.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product'
    });
};

module.exports = ReceiptItem;