// File: /src/middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // 1. Giải mã token để lấy payload (chứa id và role_id)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 2. **THAY ĐỔI LỚN NHẤT:** Gán thông tin từ token đã giải mã trực tiếp vào `req.user`
            //    Chúng ta không cần query lại CSDL ở bước này nữa, vì thông tin cần thiết (id, role_id)
            //    đã có sẵn trong token. Điều này giúp tối ưu và tránh các lỗi không nhất quán.
            req.user = {
                id: decoded.id,
                role_id: decoded.role_id
            };
            
            // In ra để kiểm tra
            

            next();
        } catch (error) {
            console.error('Lỗi xác thực token:', error.message);
            return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        }
    } else {
        return res.status(401).json({ message: 'Không tìm thấy token, yêu cầu đăng nhập và xác thực.' });
    }
};

const admin = (req, res, next) => {
    // In ra để kiểm tra
     const userRoleId = parseInt(req.user.role_id, 10); 
    
    // Bây giờ, req.user chắc chắn có role_id đọc từ token
    if (req.user && userRoleId === 1) {
        next();
    } else {
        res.status(403).json({ message: 'Truy cập bị từ chối. Yêu cầu quyền Admin.' });
    }
};



module.exports = {
    protect,
    admin
};