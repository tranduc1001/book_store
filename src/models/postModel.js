// File: /src/models/postModel.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/connectDB');

const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    tieu_de: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    tom_tat: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    noi_dung: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    anh_dai_dien: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL ảnh đại diện cho bài viết'
    },
    trang_thai: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // true: published, false: draft
    }
}, {
    tableName: 'posts',
    timestamps: true,
});

module.exports = Post;