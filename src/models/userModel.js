// File: /src/models/userModel.js

// Import các kiểu dữ liệu từ thư viện Sequelize
const { DataTypes } = require('sequelize');
// Import đối tượng sequelize từ file cấu hình kết nối CSDL
const { sequelize } = require('../config/connectDB');
// Import thư viện bcryptjs để mã hóa mật khẩu
const bcrypt = require('bcryptjs');

// Sử dụng phương thức sequelize.define() để định nghĩa một model mới.
// Tham số đầu tiên 'User' là tên của model trong Sequelize.
// Tham số thứ hai là một đối tượng định nghĩa các cột (attributes) của bảng.
const User = sequelize.define('User', {
    // Các thuộc tính của model được định nghĩa ở đây

    // Cột 'id': Khóa chính của bảng
    id: {
        type: DataTypes.BIGINT,      // Kiểu dữ liệu số nguyên lớn
        primaryKey: true,            // Đánh dấu đây là khóa chính
        autoIncrement: true,         // Tự động tăng giá trị khi có một bản ghi mới
    },

    // Cột 'role_id': Khóa ngoại, liên kết tới bảng 'roles'
    role_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 2,           // Giá trị mặc định là 2 (tương ứng với vai trò 'User')
    },

    // Cột 'ten_dang_nhap': Tên đăng nhập của người dùng
    ten_dang_nhap: {
        type: DataTypes.STRING(100), // Kiểu chuỗi, giới hạn 100 ký tự
        allowNull: false,
        unique: true,                // Đảm bảo mỗi tên đăng nhập là duy nhất
    },

    // Cột 'email': Email của người dùng
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,                // Đảm bảo mỗi email là duy nhất
        validate: {
            isEmail: true,           // Sequelize sẽ tự động kiểm tra xem chuỗi có phải là một email hợp lệ không
        },
    },

    // Cột 'mat_khau': Mật khẩu đã được mã hóa của người dùng
    mat_khau: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    // Cột 'ho_ten': Họ và tên đầy đủ của người dùng
    ho_ten: {
        type: DataTypes.STRING,
        allowNull: true,             // Cho phép để trống
    },

    // Cột 'phone': Số điện thoại của người dùng
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    img: {
        type: DataTypes.STRING
    },
    // Cột 'dia_chi': Địa chỉ của người dùng
    dia_chi: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // Cột 'trang_thai': Trạng thái tài khoản (ví dụ: đang hoạt động hoặc bị khóa)
    trang_thai: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,          // Mặc định là true (đang hoạt động)
    },

}, {
    // Tham số thứ ba là các tùy chọn cho model

    tableName: 'users',              // Tên của bảng trong CSDL
    timestamps: true,                // Tự động thêm hai cột `createdAt` và `updatedAt`

    // Hooks (bộ móc) là các hàm sẽ tự động chạy tại các thời điểm nhất định trong vòng đời của một đối tượng model.
    hooks: {
        // `beforeCreate` sẽ chạy ngay trước khi một bản ghi mới được tạo và lưu vào CSDL.
        beforeCreate: async (user) => {
            // Nếu người dùng có cung cấp mật khẩu
            if (user.mat_khau) {
                // 1. Tạo một chuỗi "muối" (salt) ngẫu nhiên. Salt giúp tăng cường bảo mật cho việc mã hóa.
                const salt = await bcrypt.genSalt(10);
                // 2. Mã hóa mật khẩu gốc của người dùng với salt vừa tạo.
                user.mat_khau = await bcrypt.hash(user.mat_khau, salt);
            }
        },

        // `beforeUpdate` sẽ chạy ngay trước khi một bản ghi được cập nhật.
        beforeUpdate: async (user) => {
            // Chúng ta chỉ mã hóa lại mật khẩu nếu trường 'mat_khau' thực sự bị thay đổi.
            if (user.changed('mat_khau')) {
                const salt = await bcrypt.genSalt(10);
                user.mat_khau = await bcrypt.hash(user.mat_khau, salt);
            }
        }
    }
});
User.associate = (models) => {
    User.belongsTo(models.Role, {
        foreignKey: 'role_id',
        as: 'role',
        // Thêm defaultValue và ràng buộc ở đây nếu cần, nhưng cách tốt nhất là để DB xử lý
        onDelete: 'SET NULL', // hoặc 'CASCADE'
        onUpdate: 'CASCADE'
    });
};
// Thêm một phương thức `comparePassword` vào prototype của model User.
// Phương thức này giúp so sánh mật khẩu người dùng nhập vào với mật khẩu đã mã hóa trong CSDL.
User.prototype.comparePassword = async function (enteredPassword) {
    // bcrypt.compare sẽ tự động thực hiện việc so sánh một cách an toàn.
    return await bcrypt.compare(enteredPassword, this.mat_khau);
    
};


// Export model User để các phần khác của ứng dụng có thể sử dụng.
module.exports = User;