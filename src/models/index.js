// File: /src/models/index.js (CHUẨN MỚI)

'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const { sequelize } = require('../config/connectDB');

const db = {};

// Đọc tất cả các file trong thư mục hiện tại
fs
  .readdirSync(__dirname)
  .filter(file => {
    // Lọc ra các file javascript, không phải file ẩn, không phải file index.js
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    // Import model dạng class
    const model = require(path.join(__dirname, file));
    // Gắn class model vào đối tượng db
    db[model.name] = model;
  });

// Gọi hàm associate cho từng model
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;