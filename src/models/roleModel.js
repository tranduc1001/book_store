// File: /src/models/roleModel.js (PHIÊN BẢN HOÀN CHỈNH)

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/connectDB');

const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    ten_quyen: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    }
}, {
    tableName: 'roles',
    timestamps: true, 
});

// Định nghĩa mối quan hệ
Role.associate = (models) => {
    // Một Role "có nhiều" User
    Role.hasMany(models.User, {
        foreignKey: 'role_id',
        as: 'users' // Đặt bí danh để có thể truy vấn users từ một role
    });
};
// ==========================================================

module.exports = Role;