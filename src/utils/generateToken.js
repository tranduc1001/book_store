// File: /src/utils/generateToken.js

const jwt = require('jsonwebtoken');

// **Hàm này phải nhận vào cả id và role_id**
const generateToken = (id, role_id) => {
    // payload là thông tin chúng ta muốn "đóng gói" vào token
    const payload = {
        id: id,
        role_id: role_id, // <<< ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT
    };

    // Tạo token với payload, khóa bí mật (secret key), và thời gian hết hạn
    return jwt.sign(
        payload,
        process.env.JWT_SECRET, // Lấy khóa bí mật từ file .env
        {
            expiresIn: '30d', // Token sẽ hết hạn sau 30 ngày
        }
    );
};

module.exports = generateToken;