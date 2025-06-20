// File: /src/controllers/userController.js

// Import các model cần thiết và các toán tử của Sequelize
const { User, Role } = require('../models');
const { Op } = require('sequelize');

/**
 * @description     Admin: Lấy danh sách tất cả người dùng (có phân trang).
 * @route           GET /api/users
 * @access          Private/Admin
 */
const getAllUsers = async (request, response) => {
    // Lấy các tham số phân trang từ query string của URL, ví dụ: /api/users?page=1&limit=10
    const { page = 1, limit = 10 } = request.query;
    
    // Chuyển đổi page và limit sang kiểu số nguyên
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Tính toán offset để bỏ qua các bản ghi của trang trước
    const offset = (pageNum - 1) * limitNum;

    try {
        // Sử dụng phương thức `findAndCountAll` của Sequelize.
        // Phương thức này rất hữu ích cho việc phân trang vì nó trả về cả tổng số bản ghi và dữ liệu của trang hiện tại.
        const { count, rows } = await User.findAndCountAll({
            // Chỉ lấy các thuộc tính cần thiết, loại bỏ trường 'mat_khau' để bảo mật.
            attributes: { exclude: ['mat_khau'] },
            // Sử dụng `include` để JOIN với bảng `roles` và lấy `ten_quyen` tương ứng.
            include: {
                model: Role,
                attributes: ['ten_quyen'] // Chỉ lấy cột 'ten_quyen' từ bảng roles
            },
            limit: limitNum,   // Giới hạn số lượng bản ghi trên một trang
            offset: offset,    // Bỏ qua bao nhiêu bản ghi
            order: [['createdAt', 'DESC']] // Sắp xếp người dùng mới nhất lên đầu
        });

        // Trả về dữ liệu cho client, bao gồm danh sách người dùng và thông tin phân trang.
        response.status(200).json({
            users: rows,
            currentPage: pageNum,
            totalPages: Math.ceil(count / limitNum), // Tính tổng số trang
            totalUsers: count
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng:', error);
        response.status(500).json({ message: "Lỗi server khi lấy danh sách người dùng.", error: error.message });
    }
};

/**
 * @description     Admin: Lấy thông tin chi tiết của một người dùng bằng ID.
 * @route           GET /api/users/:id
 * @access          Private/Admin
 */
const getUserById = async (request, response) => {
    try {
        // Tìm người dùng bằng khóa chính (Primary Key)
        const user = await User.findByPk(request.params.id, {
            attributes: { exclude: ['mat_khau'] } // Luôn luôn loại bỏ mật khẩu
        });

        if (user) {
            response.status(200).json(user);
        } else {
            // Nếu không tìm thấy, trả về lỗi 404 (Not Found)
            response.status(404).json({ message: "Không tìm thấy người dùng." });
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng bằng ID:', error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     Admin: Tạo một tài khoản quản lý mới (ví dụ: Admin, Editor).
 * @route           POST /api/users
 * @access          Private/Admin
 */
const createUserByAdmin = async (request, response) => {
    // Hàm này cho phép Admin tạo tài khoản mới với vai trò được chỉ định.
    const { ho_ten, ten_dang_nhap, email, mat_khau, role_id } = request.body;

    if (!ho_ten || !ten_dang_nhap || !email || !mat_khau || !role_id) {
        return response.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
    }

    try {
        // Kiểm tra xem email hoặc tên đăng nhập đã tồn tại chưa
        const userExists = await User.findOne({ where: { [Op.or]: [{ email: email }, { ten_dang_nhap: ten_dang_nhap }] } });
        if (userExists) {
            return response.status(400).json({ message: 'Email hoặc Tên đăng nhập đã tồn tại.' });
        }
        
        // Tạo người dùng mới
        const newUser = await User.create({ ho_ten, ten_dang_nhap, email, mat_khau, role_id });

        // Tạo một bản sao của đối tượng user để có thể xóa trường mật khẩu trước khi gửi về client
        const userResponse = { ...newUser.get({ plain: true }) };
        delete userResponse.mat_khau;

        response.status(201).json(userResponse);
    } catch (error) {
        console.error('Lỗi khi Admin tạo người dùng:', error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};


/**
 * @description     Admin: Cập nhật thông tin người dùng (vai trò, trạng thái).
 * @route           PUT /api/users/:id
 * @access          Private/Admin
 */
const updateUserByAdmin = async (request, response) => {
    try {
        const user = await User.findByPk(request.params.id);
        if (!user) {
            return response.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        // Chỉ cho phép Admin cập nhật các trường này
        const { ho_ten, role_id, trang_thai } = request.body;
        // Phương thức `update` sẽ cập nhật các trường được cung cấp và lưu vào CSDL
        const updatedUser = await user.update({ ho_ten, role_id, trang_thai });
        
        const userResponse = { ...updatedUser.get({ plain: true }) };
        delete userResponse.mat_khau;

        response.status(200).json(userResponse);
    } catch (error) {
        console.error('Lỗi khi Admin cập nhật người dùng:', error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     Admin: Xóa một người dùng.
 * @route           DELETE /api/users/:id
 * @access          Private/Admin
 */
const deleteUser = async (request, response) => {
    try {
        const user = await User.findByPk(request.params.id);
        if (user) {
            // Xóa người dùng khỏi CSDL
            await user.destroy();
            response.status(200).json({ message: "Xóa người dùng thành công." });
        } else {
            response.status(404).json({ message: "Không tìm thấy người dùng." });
        }
    } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};
/**
 * @description     Người dùng tự lấy thông tin cá nhân của mình
 * @route           GET /api/users/profile
 * @access          Private
 */
const getUserProfile = async (request, response) => {
    // Middleware `protect` đã lấy thông tin user và gán vào request.user
    const user = await User.findByPk(request.user.id, {
        attributes: { exclude: ['mat_khau', 'role_id'] } // Không trả về các trường nhạy cảm
    });

    if (user) {
        response.status(200).json(user);
    } else {
        response.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }
};

/**
 * @description     Người dùng tự cập nhật thông tin cá nhân (không bao gồm mật khẩu)
 * @route           PUT /api/users/profile
 * @access          Private
 */
const updateUserProfile = async (request, response) => {
    try {
        const user = await User.findByPk(request.user.id);

        if (user) {
            // Chỉ cho phép cập nhật các trường an toàn
            user.ho_ten = request.body.ho_ten || user.ho_ten;
            user.phone = request.body.phone || user.phone;
            user.dia_chi = request.body.dia_chi || user.dia_chi;
            
            // Xử lý nếu người dùng muốn thay đổi email hoặc username (cần kiểm tra trùng lặp)
            if (request.body.email && request.body.email !== user.email) {
                const emailExists = await User.findOne({ where: { email: request.body.email } });
                if (emailExists) {
                    return response.status(400).json({ message: 'Email đã tồn tại.' });
                }
                user.email = request.body.email;
            }

            const updatedUser = await user.save();
            response.status(200).json({
                id: updatedUser.id,
                ho_ten: updatedUser.ho_ten,
                email: updatedUser.email,
                phone: updatedUser.phone,
                dia_chi: updatedUser.dia_chi,
            });
        } else {
            response.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
    } catch (error) {
        response.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

/**
 * @description     Người dùng đổi mật khẩu
 * @route           PUT /api/users/change-password
 * @access          Private
 */
const changeUserPassword = async (request, response) => {
    const { currentPassword, newPassword } = request.body;

    if (!currentPassword || !newPassword) {
        return response.status(400).json({ message: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.' });
    }

    try {
        const user = await User.findByPk(request.user.id);
        
        // Kiểm tra mật khẩu cũ có đúng không
        if (user && (await user.comparePassword(currentPassword))) {
            // Mật khẩu mới sẽ được hash tự động bởi hook 'beforeUpdate' trong model
            user.mat_khau = newPassword;
            await user.save();
            response.status(200).json({ message: 'Đổi mật khẩu thành công.' });
        } else {
            response.status(401).json({ message: 'Mật khẩu cũ không chính xác.' });
        }
    } catch (error) {
        response.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUserByAdmin,
    updateUserByAdmin,
    deleteUser,
    getUserProfile,
    updateUserProfile,
    changeUserPassword
};