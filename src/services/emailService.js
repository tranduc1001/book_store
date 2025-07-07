// File: /src/services/emailService.js (PHIÊN BẢN CẬP NHẬT)

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
// --- THÊM HÀM HELPER ĐỊNH DẠNG TIỀN ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

/**
 * Hàm gửi email xác nhận đơn hàng tới người dùng.
 * @param {string} toEmail - Địa chỉ email của người nhận (khách hàng).
 * @param {object} orderDetails - Một đối tượng chứa thông tin chi tiết của đơn hàng (id, tên người nhận, tổng tiền,...).
 */
const sendOrderConfirmationEmail = async (toEmail, orderDetails) => {
    // 2. Tạo nội dung email (mail options)
    const mailOptions = {
        from: `"Book Zone " <${process.env.EMAIL_USER}>`, // Tên người gửi và địa chỉ email
        to: toEmail, // Địa chỉ email của người nhận
        subject: `Xác nhận đơn hàng #${orderDetails.id}`, // Tiêu đề của email
        
        // Nội dung email, có thể viết dưới dạng HTML để có định dạng đẹp hơn.
         html: `
            <h1>Cảm ơn bạn đã đặt hàng!</h1>
            <p>Chào ${orderDetails.ten_nguoi_nhan},</p>
            <p>Đơn hàng của bạn đã được đặt thành công và đang chờ xử lý.</p>
            <!-- SỬ DỤNG HÀM MỚI Ở ĐÂY -->
            <p>Tổng thanh toán: <strong>${formatCurrency(orderDetails.tong_thanh_toan)}</strong></p>
            <p>Chúng tôi sẽ thông báo cho bạn khi đơn hàng được vận chuyển.</p>
            <br>
            <p>Trân trọng,</p>
            <p><strong>Book Zone</strong></p>
        `,
    };

    try {
        // 3. Gửi email bằng phương thức sendMail của transporter
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email xác nhận đơn hàng #${orderDetails.id} đã được gửi thành công tới ${toEmail}`);
    } catch (error) {
        // Bắt lỗi nếu quá trình gửi email thất bại và ghi log ra console.
        // Việc này giúp chúng ta biết được lỗi nhưng không làm dừng ứng dụng.
        console.error(`❌ Lỗi khi gửi email xác nhận đơn hàng #${orderDetails.id} tới ${toEmail}: `, error);
    }
};


// ==========================================================
// ============== THÊM HÀM MỚI VÀO ĐÂY ======================
// ==========================================================
/**
 * Hàm gửi email thông báo sản phẩm hết hàng cho admin.
 * @param {object} product - Đối tượng sản phẩm đã hết hàng.
 */
/**
 * Hàm gửi email xin lỗi khách hàng khi sản phẩm họ đặt đã hết hàng.
 * @param {string} toEmail - Email của khách hàng.
 * @param {object} customerInfo - Thông tin khách hàng (tên).
 * @param {object} product - Sản phẩm đã hết hàng.
 */
const sendOutOfStockApologyEmail = async (toEmail, customerInfo, product) => {
    const mailOptions = {
        from: `"Book Zone" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Thông báo về sản phẩm trong đơn hàng của bạn`,
        html: `
            <h1>Rất tiếc phải thông báo!</h1>
            <p>Chào ${customerInfo.name},</p>
            <p>Chúng tôi rất xin lỗi, sản phẩm <strong>"${product.ten_sach}"</strong> mà bạn vừa đặt đã tạm thời hết hàng ngay trước khi bạn hoàn tất thanh toán.</p>
            <p>Do đó, đơn hàng của bạn chưa thể được xử lý. Chúng tôi đã ghi nhận lại sự quan tâm của bạn và sẽ thông báo ngay khi có hàng trở lại.</p>
            <p>Thành thật xin lỗi vì sự bất tiện này.</p>
            <br>
            <p>Trân trọng,</p>
            <p><strong>Book Zone</strong></p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email xin lỗi hết hàng cho sản phẩm #${product.id} đã được gửi tới ${toEmail}.`);
    } catch (error) {
        console.error(`❌ Lỗi khi gửi email xin lỗi hết hàng tới ${toEmail}:`, error);
    }
};
/**
 * Gửi email chứa link reset mật khẩu.
 * @param {string} toEmail - Email của người dùng.
 * @param {string} resetUrl - URL đầy đủ để reset mật khẩu.
 */
const sendPasswordResetEmail = async (toEmail, resetUrl) => {
    const mailOptions = {
        from: `"Book Zone" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Yêu cầu đặt lại mật khẩu Book Zone',
        html: `
            <h1>Bạn đã yêu cầu đặt lại mật khẩu</h1>
            <p>Vui lòng nhấn vào liên kết dưới đây để đặt lại mật khẩu của bạn. Liên kết này sẽ hết hạn sau 10 phút.</p>
            <a href="${resetUrl}" style="background-color: #0d6efd; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Đặt lại mật khẩu
            </a>
            <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email reset mật khẩu đã được gửi tới ${toEmail}`);
    } catch (error) {
        console.error(`❌ Lỗi khi gửi email reset mật khẩu tới ${toEmail}:`, error);
        // Ném lỗi ra để controller có thể bắt và xử lý
        throw new Error('Không thể gửi email reset mật khẩu.'); 
    }
};
// ==========================================================


// Export các hàm service để các controller (ví dụ: orderController) có thể gọi và sử dụng.
module.exports = {
    sendOrderConfirmationEmail,
    sendOutOfStockApologyEmail, // <<< THÊM HÀM MỚI VÀO EXPORT
    sendPasswordResetEmail,
    // sendWelcomeEmail,
};