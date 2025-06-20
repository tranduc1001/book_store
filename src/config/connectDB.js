// File: /src/config/connectDB.js

// Import thư viện Sequelize
const { Sequelize } = require('sequelize');
// Import thư viện dotenv để đọc các biến môi trường từ file .env
require('dotenv').config();

// Khởi tạo một đối tượng Sequelize mới để kết nối với CSDL
// Các thông tin kết nối được lấy từ file .env để đảm bảo tính bảo mật
const sequelize = new Sequelize(
    process.env.DB_DATABASE, // Tên cơ sở dữ liệu
    process.env.DB_USER,     // Tên người dùng CSDL
    process.env.DB_PASSWORD, // Mật khẩu CSDL
    {
        host: process.env.DB_HOST, // Host của CSDL (thường là 'localhost' khi chạy ở máy)
        port: process.env.DB_PORT, // Cổng của CSDL (mặc định của PostgreSQL là 5432)
        dialect: 'postgres',       // Chỉ định loại CSDL chúng ta đang sử dụng
        
        // Tắt logging các câu lệnh SQL ra console để đỡ rối,
        // bạn có thể bật lại bằng cách đổi `false` thành `console.log` khi cần gỡ lỗi.
        logging: false,

        // Lưu ý: Đoạn `dialectOptions` dùng cho kết nối SSL đã được loại bỏ
        // vì server PostgreSQL trên máy local của bạn không yêu cầu SSL.
        // Khi bạn triển khai ứng dụng lên một server production (như Heroku, AWS),
        // bạn sẽ cần thêm lại đoạn cấu hình SSL này.
    }
);

// Một hàm bất đồng bộ để kiểm tra xem kết nối có thành công hay không
const connectDB = async () => {
    try {
        // Phương thức .authenticate() sẽ thử kết nối tới CSDL và báo lỗi nếu thất bại
        await sequelize.authenticate();
        console.log('✅ Kết nối tới PostgreSQL đã được thiết lập thành công.');
    } catch (error) {
        // Bắt lỗi nếu không thể kết nối và hiển thị ra console
        console.error('❌ Không thể kết nối tới cơ sở dữ liệu:', error);
    }
};

// Export đối tượng `sequelize` và hàm `connectDB` để các file khác có thể sử dụng
module.exports = {
    sequelize,
    connectDB,
};