// File: /src/controllers/authController.js

const { User } = require('../models');
const { Op } = require('sequelize');
const generateToken = require('../utils/generateToken');

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
    const { email, mat_khau } = req.body;

    // 1. Kiểm tra input
    if (!email || !mat_khau) {
        return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu.' });
    }

    try {
        // 2. Tìm người dùng bằng email trong CSDL
        const user = await User.findOne({ where: { email } });

        // 3. Kiểm tra xem người dùng có tồn tại không VÀ mật khẩu có khớp không
        //    Hàm `user.comparePassword` đã được định nghĩa trong model để so sánh mật khẩu đã hash
        if (user && (await user.comparePassword(mat_khau))) {
            // Nếu tất cả đều hợp lệ, trả về thông tin và token mới
            return res.status(200).json({
                id: user.id,
                ho_ten: user.ho_ten,
                email: user.email,
                role_id: user.role_id, // Rất quan trọng cho việc phân quyền ở frontend
                token: generateToken(user.id, user.role_id), // Tạo token chứa cả id và role_id
            });
        } else {
            // Nếu người dùng không tồn tại hoặc sai mật khẩu
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }
    } catch (error) {
        // Bắt các lỗi từ server hoặc CSDL
        console.error('Lỗi khi đăng nhập:', error);
        return res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
    }
};


module.exports = {
    registerUser,
    loginUser,
};