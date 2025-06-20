// File: /src/services/emailService.js

// Import thư viện nodemailer để gửi email
const nodemailer = require('nodemailer');
// Import thư viện dotenv để đọc các biến môi trường từ file .env
require('dotenv').config();

// 1. Cấu hình "người vận chuyển" (transporter)
// Transporter là một đối tượng biết cách gửi email.
// Chúng ta sẽ cấu hình nó để sử dụng dịch vụ Gmail.
const transporter = nodemailer.createTransport({
    // Chỉ định dịch vụ email, ví dụ: 'gmail', 'outlook',...
    service: 'gmail',
    
    // Cung cấp thông tin xác thực tài khoản sẽ dùng để gửi email.
    // Các thông tin này được lưu trong file .env để đảm bảo an toàn.
    auth: {
        user: process.env.EMAIL_USER,     // Địa chỉ email của bạn, ví dụ: 'mybookstore@gmail.com'
        pass: process.env.EMAIL_PASSWORD, // Mật khẩu ứng dụng (App Password) của tài khoản email đó.
          // Lưu ý: Đây không phải là mật khẩu đăng nhập thông thường của bạn.
         // Bạn cần vào cài đặt bảo mật của tài khoản Google để tạo một mật khẩu ứng dụng.
    },
});

/**
 * Hàm gửi email xác nhận đơn hàng tới người dùng.
 * @param {string} toEmail - Địa chỉ email của người nhận (khách hàng).
 * @param {object} orderDetails - Một đối tượng chứa thông tin chi tiết của đơn hàng (id, tên người nhận, tổng tiền,...).
 */
const sendOrderConfirmationEmail = async (toEmail, orderDetails) => {
    // 2. Tạo nội dung email (mail options)
    const mailOptions = {
        from: `"BookStore của Duck" <${process.env.EMAIL_USER}>`, // Tên người gửi và địa chỉ email
        to: toEmail, // Địa chỉ email của người nhận
        subject: `Xác nhận đơn hàng #${orderDetails.id}`, // Tiêu đề của email
        
        // Nội dung email, có thể viết dưới dạng HTML để có định dạng đẹp hơn.
        html: `
            <h1>Cảm ơn bạn đã đặt hàng!</h1>
            <p>Chào ${orderDetails.ten_nguoi_nhan},</p>
            <p>Đơn hàng #${orderDetails.id} của bạn đã được đặt thành công và đang chờ xử lý.</p>
            <p>Tổng thanh toán: <strong>${orderDetails.tong_thanh_toan.toLocaleString('vi-VN')}đ</strong></p>
            <p>Chúng tôi sẽ thông báo cho bạn khi đơn hàng được vận chuyển.</p>
            <br>
            <p>Trân trọng,</p>
            <p><strong>BookStore của Người Anh Em</strong></p>
        `,
    };

    try {
        // 3. Gửi email bằng phương thức sendMail của transporter
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email xác nhận đơn hàng đã được gửi thành công tới ${toEmail}`);
    } catch (error) {
        // Bắt lỗi nếu quá trình gửi email thất bại và ghi log ra console.
        // Việc này giúp chúng ta biết được lỗi nhưng không làm dừng ứng dụng.
        console.error(`❌ Lỗi khi gửi email tới ${toEmail}: `, error);
    }
};

// Export các hàm service để các controller (ví dụ: orderController) có thể gọi và sử dụng.
module.exports = {
    sendOrderConfirmationEmail,
    // Trong tương lai, bạn có thể thêm các hàm khác vào đây, ví dụ:
    // sendPasswordResetEmail,
    // sendWelcomeEmail,
};