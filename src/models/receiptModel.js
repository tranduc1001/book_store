// File: /src/models/receiptModel.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/connectDB');

const Receipt = sequelize.define('Receipt', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    
    ten_nha_cung_cap: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Khóa ngoại liên kết đến bảng users (người tạo phiếu)
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    ngay_nhap: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    tong_tien_phieu_nhap: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    ghi_chu: {
        type: DataTypes.TEXT,
    }
}, {
    tableName: 'receipts',
    timestamps: true,
});

Receipt.associate = (models) => {

    // Quan hệ: Một Phiếu nhập do một User tạo
    Receipt.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'creator' // Người tạo
    });

    // Quan hệ: Một Phiếu nhập có nhiều Chi tiết phiếu nhập
    Receipt.hasMany(models.ReceiptItem, {
        foreignKey: 'receipt_id',
        as: 'receiptItems',
        onDelete: 'CASCADE'
    });
};

module.exports = Receipt;