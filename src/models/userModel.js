// File: /src/models/userModel.js (PHIÊN BẢN ĐÃ SỬA)

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/connectDB');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Sử dụng phương thức sequelize.define() để định nghĩa một model mới.
const User = sequelize.define('User', {
    // Cột 'id': Khóa chính của bảng
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    // ==========================================================
    // ============= SỬA LẠI ĐỊNH NGHĨA CỘT ROLE_ID ==============
    // ==========================================================
    // Cột 'role_id': Khóa ngoại, liên kết tới bảng 'roles'
    role_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 2, // Mặc định là 'User'
        references: {
            model: 'roles', // Tên bảng mà nó tham chiếu đến
            key: 'id'       // Tên cột khóa chính trong bảng 'roles'
        }
        // onUpdate và onDelete sẽ được định nghĩa trong association để rõ ràng hơn
    },
    // ==========================================================

    ten_dang_nhap: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    mat_khau: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ho_ten: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    img: {
        type: DataTypes.STRING
    },
    dia_chi: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    trang_thai: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    resetPasswordExpire: {
        type: DataTypes.DATE,
        allowNull: true,
    },

}, {
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.mat_khau) {
                const salt = await bcrypt.genSalt(10);
                user.mat_khau = await bcrypt.hash(user.mat_khau, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('mat_khau')) {
                const salt = await bcrypt.genSalt(10);
                user.mat_khau = await bcrypt.hash(user.mat_khau, salt);
            }
        }
    }
    
});

// Định nghĩa các mối quan hệ (associations)
User.associate = (models) => {
    // Mối quan hệ User "thuộc về một" Role
    User.belongsTo(models.Role, {
        foreignKey: 'role_id',
        as: 'role',
        onDelete: 'RESTRICT', // Nếu Role bị xóa, role_id trong User sẽ thành NULL
        onUpdate: 'CASCADE'   // Nếu id trong Role thay đổi, role_id trong User cũng thay đổi theo
    });

    // Mối quan hệ User "có nhiều" Receipt
    User.hasMany(models.Receipt, {
        foreignKey: 'user_id',
        as: 'receipts' 
    });

    // Thêm các mối quan hệ khác ở đây nếu cần, ví dụ: User có nhiều Order
    User.hasMany(models.Order, {
        foreignKey: 'user_id',
        as: 'orders',
        onDelete: 'SET NULL', // <<== THÊM VÀO: Giữ lại Order khi User bị xóa
        onUpdate: 'CASCADE'
    });
     // Quan hệ: User có nhiều Review
    User.hasMany(models.Review, {
        foreignKey: 'user_id',
        as: 'reviews',
        onDelete: 'CASCADE', // <<== THÊM VÀO: Xóa tất cả review của user khi user bị xóa
        onUpdate: 'CASCADE'
    });
};

// Phương thức so sánh mật khẩu
User.prototype.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.mat_khau);
};
User.prototype.getResetPasswordToken = function () {
    // 1. Tạo một token ngẫu nhiên
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 2. Hash token đó và lưu vào cột resetPasswordToken trong DB
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // 3. Đặt thời gian hết hạn (ví dụ: 10 phút)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    // 4. Trả về token gốc (chưa hash) để gửi qua email
    return resetToken;
};
module.exports = User;