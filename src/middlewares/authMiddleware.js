// Import các thư viện và model cần thiết
const jwt = require('jsonwebtoken');
const db = require('../models');

/**
 * Middleware để bảo vệ các route yêu cầu đăng nhập.
 * Nó có thể lấy token từ httpOnly cookie (cho các trang render bằng EJS)
 * hoặc từ Authorization header (cho các API được gọi bằng JavaScript).
 */
const protect = async (req, res, next) => {
    let token;

    // --- LOGIC LẤY TOKEN ĐÃ ĐƯỢC NÂNG CẤP ---

    // 1. Ưu tiên tìm token trong httpOnly cookie.
    //    Cơ chế này dùng để xác thực khi người dùng truy cập trực tiếp
    //    vào các trang được render từ server (ví dụ: /admin/users).
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    // 2. Nếu không có trong cookie, thử tìm trong Authorization header.
    //    Cơ chế này dùng để xác thực các request API từ phía client
    //    (ví dụ: fetch('/api/users') trong file admin-user-list.js).
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Nếu sau cả hai bước trên vẫn không có token, xử lý lỗi.
    if (!token) {
        // Cải thiện trải nghiệm người dùng:
        // Nếu request đến một trang admin, chuyển hướng về trang đăng nhập.
        if (req.originalUrl.startsWith('/admin')) {
            return res.redirect('/login?message=unauthenticated');
        }
        // Nếu là request API, trả về lỗi JSON.
        return res.status(401).json({ message: 'Xác thực thất bại, không tìm thấy token.' });
    }

    try {
        // Giải mã token để lấy ID người dùng.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Dùng ID đã giải mã để tìm người dùng trong CSDL.
        // Luôn `include` thông tin Role để phục vụ cho việc phân quyền.
        req.user = await db.User.findByPk(decoded.id, {
            attributes: { exclude: ['mat_khau'] }, // Không bao giờ lấy mật khẩu
            include: {
                model: db.Role,
                as: 'role' // Đảm bảo bí danh này khớp với model User
            }
        });

        // Nếu không tìm thấy người dùng (ví dụ: token hợp lệ nhưng user đã bị xóa).
        if (!req.user) {
            if (req.originalUrl.startsWith('/admin')) {
                return res.redirect('/login?message=user-not-found');
            }
            return res.status(401).json({ message: 'Người dùng không tồn tại.' });
        }

        // Nếu mọi thứ ổn, cho phép request đi tiếp đến middleware hoặc controller tiếp theo.
        next();
    } catch (error) {
        // Bắt lỗi nếu token không hợp lệ (ví dụ: đã hết hạn, bị sửa đổi).
        console.error('Lỗi xác thực token:', error.message);
        if (req.originalUrl.startsWith('/admin')) {
            return res.redirect('/login?message=invalid-token');
        }
        return res.status(401).json({ message: 'Xác thực thất bại, token không hợp lệ.' });
    }
};

/**
 * Middleware để kiểm tra quyền Admin.
 * Lưu ý: Middleware này PHẢI được dùng SAU middleware `protect`.
 */
const admin = (req, res, next) => {
    // Kiểm tra xem `req.user` đã được `protect` gán vào chưa,
    // và `role` của user đó có phải là 'admin' không.
    if (req.user && req.user.role && req.user.role.ten_quyen === 'admin') {
        next(); // Nếu là admin, cho đi tiếp.
    } else {
        // Nếu không phải admin, trả về lỗi 403 Forbidden (Cấm).
        if (req.originalUrl.startsWith('/admin')) {
             // Có thể tạo một trang lỗi 403 đẹp hơn
            return res.status(403).render('pages/error', {
                title: '403 - Bị cấm',
                message: 'Bạn không có quyền truy cập vào trang này. Yêu cầu quyền Admin.'
            });
        }
        res.status(403).json({ message: 'Không có quyền truy cập, yêu cầu quyền Admin.' });
    }
};

// Export các middleware để các file router có thể sử dụng.
module.exports = { protect, admin };