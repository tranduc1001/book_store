// File: /src/middlewares/uploadMiddleware.js

const multer = require('multer');
const path = require('path');

// 1. Cấu hình nơi lưu trữ file
const storage = multer.diskStorage({
    // Đích đến của file (thư mục public/uploads)
    destination: (req, file, cb) => {
        // cb là callback (error, destination)
        cb(null, 'public/images/');
    },
    // Đặt lại tên cho file
    filename: (req, file, cb) => {
        // Tạo một tên file duy nhất để tránh trùng lặp
        // Tên file = tên gốc + timestamp + đuôi file
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 2. Cấu hình bộ lọc file (chỉ cho phép upload ảnh)
const fileFilter = (req, file, cb) => {
    // Kiểm tra loại file (mimetype)
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Chấp nhận file
    } else {
        cb(new Error('Chỉ cho phép upload file ảnh!'), false); // Từ chối file
    }
};

// 3. Khởi tạo middleware upload
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // Giới hạn kích thước file 5MB
});

module.exports = upload;