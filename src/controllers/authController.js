// File: /src/controllers/authController.js
const bcrypt = require('bcryptjs');
const db = require('../models'); 
const { User, Role } = require('../models');
const { Op } = require('sequelize');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto'); // <<< THÊM DÒNG NÀY
const { sendPasswordResetEmail } = require('../services/emailService'); 

/**
 * @description     Đăng ký một người dùng mới
 * @route           POST /api/auth/register
 * @access          Public
 */
const registerUser = async (req, res) => {
    // Lấy thông tin từ body của request
    const { ho_ten, ten_dang_nhap, email, mat_khau } = req.body;

    // 1. Kiểm tra các trường thông tin bắt buộc
    if (!ho_ten || !ten_dang_nhap || !email || !mat_khau) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin.' });
    }

    try {
        // 2. Kiểm tra xem email hoặc tên đăng nhập đã tồn tại trong CSDL chưa
        const userExists = await User.findOne({
            where: {
                [Op.or]: [{ email: email }, { ten_dang_nhap: ten_dang_nhap }]
            }
        });

        if (userExists) {
            // Nếu đã tồn tại, trả về lỗi 400 Bad Request
            return res.status(400).json({ message: 'Email hoặc Tên đăng nhập đã được sử dụng.' });
        }

        // 3. Tạo người dùng mới trong CSDL
        // Mật khẩu sẽ được tự động hash bởi hook 'beforeCreate' trong UserModel
        // Vai trò mặc định sẽ là 'user' (role_id = 2)
        const newUser = await User.create({
            ho_ten,
            ten_dang_nhap,
            email,
            mat_khau,
            // role_id sẽ có giá trị mặc định là 2 (user) như đã định nghĩa trong model
        });

        // 4. Nếu tạo thành công, trả về thông tin người dùng (không bao gồm mật khẩu) và token
        if (newUser) {
            res.status(201).json({
                id: newUser.id,
                ho_ten: newUser.ho_ten,
                email: newUser.email,
                role_id: newUser.role_id,
                token: generateToken(newUser.id, newUser.role_id),
            });
        } else {
             response.status(400).json({ message: "Dữ liệu người dùng không hợp lệ." });
            // Trường hợp hiếm gặp khi tạo user thất bại mà không báo lỗi
            res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ.' });
        }
    } catch (error) {
        // Bắt các lỗi khác từ server hoặc CSDL
        console.error('Lỗi khi đăng ký:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng ký người dùng.' });
    }
};


/**
 * @description     Đăng nhập người dùng và trả về token
 * @route           POST /api/auth/login
 * @access          Public
 */
const loginUser = async (req, res) => {
    try {
        const { email, mat_khau } = req.body;

        // Dùng `include` để lấy luôn thông tin Role khi đăng nhập
        const user = await User.findOne({
            where: { email },
            include: { model: Role, as: 'role' }
        });

        if (user && (await user.comparePassword(mat_khau))) {
            const token = generateToken(user.id);

            // Đặt token vào một httpOnly cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 ngày
            });

            // Trả về thông tin cần thiết cho client
            res.json({
                id: user.id,
                ho_ten: user.ho_ten,
                email: user.email,
                role_id: user.role_id, // Gửi role_id để client kiểm tra quyền
                role: user.role, // Gửi cả object role nếu cần
                token: token
            });
        } else {
            res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
        }
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
    }
};
const logoutUser = (req, res) => {
    // Xóa cookie token bằng cách đặt thời gian hết hạn trong quá khứ
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.status(200).json({ message: 'Đăng xuất thành công.' });
};
/**
 * @description     Quên mật khẩu, gửi email reset
 * @route           POST /api/auth/forgotpassword
 * @access          Public
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng với email này.' });
        }

        // Lấy token reset (phương thức này đã được thêm vào userModel)
        const resetToken = user.getResetPasswordToken();
        await user.save(); // Lưu token đã hash và ngày hết hạn vào DB

        // Tạo URL reset, ví dụ: http://localhost:8080/reset-password/abcdef123...
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

        // Gửi email
        await sendPasswordResetEmail(user.email, resetUrl);

        res.status(200).json({ success: true, message: 'Email đã được gửi. Vui lòng kiểm tra hộp thư của bạn.' });

    } catch (error) {
        console.error('Lỗi ở forgotPassword:', error);
        // Nếu có lỗi, xóa token đã tạo để người dùng có thể thử lại
        if (req.user) {
            req.user.resetPasswordToken = null;
            req.user.resetPasswordExpire = null;
            await req.user.save();
        }
        res.status(500).json({ message: 'Gửi email thất bại, vui lòng thử lại.' });
    }
};

/**
 * @description     Đặt lại mật khẩu
 * @route           PUT /api/auth/resetpassword/:resettoken
 * @access          Public
 */
const resetPassword = async (req, res) => {
    try {
        // Lấy token đã hash từ URL
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        // Tìm user có token hợp lệ (chưa hết hạn)
        const user = await User.findOne({
            where: {
                resetPasswordToken,
                resetPasswordExpire: { [Op.gt]: Date.now() }, // Token còn hạn
            },
        });

        if (!user) {
            return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        }

        // Đặt mật khẩu mới
        user.mat_khau = req.body.mat_khau;
        // Xóa token sau khi đã sử dụng
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        
        // Hook beforeUpdate sẽ tự động hash mật khẩu mới
        await user.save();
        
        // (Tùy chọn) Tự động đăng nhập cho người dùng sau khi reset
          const token = generateToken(user.id, user.role_id); // Nhớ truyền cả role_id
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true khi deploy
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 ngày
        });

        res.status(200).json({ 
            success: true, 
            message: 'Mật khẩu đã được cập nhật thành công.', 
            // Cũng trả về thông tin user để client có thể lưu vào localStorage
            user: {
                id: user.id,
                ho_ten: user.ho_ten,
                email: user.email,
                role_id: user.role_id
            },
            token: token // Trả về token để client có thể dùng ngay
        });

    } catch (error) {
        console.error('Lỗi ở resetPassword:', error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword
};