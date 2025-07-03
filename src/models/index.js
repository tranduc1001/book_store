'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const { sequelize } = require('../config/connectDB');
const basename = path.basename(__filename);

const db = {};

// Đọc tất cả các file trong thư mục hiện tại
fs.readdirSync(__dirname)
  .filter(file => {
    // Lọc ra các file javascript, không phải file ẩn, không phải file index.js
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    // Import model từ file
    const model = require(path.join(__dirname, file));
    // Gắn model vào đối tượng db, với key là tên model (ví dụ: 'User')
    db[model.name] = model;
  });

// Sau khi đã import TẤT CẢ các model, lúc này mới gọi hàm associate
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Gắn sequelize instance và class Sequelize vào đối tượng db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;