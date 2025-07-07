// File: server.js

/// Framework chính
const express = require('express');
// Thư viện để làm việc với đường dẫn file và thư mục
const path = require('path');
// Thư viện để quản lý biến môi trường từ file .env
const dotenv = require('dotenv');
// Thư viện để xử lý Cross-Origin Resource Sharing (CORS)
const cors = require('cors');
const cookieParser = require('cookie-parser');
// Module kết nối cơ sở dữ liệu và Sequelize instance
const { connectDB, sequelize } = require('./src/config/connectDB');


// --- 2. IMPORT TẤT CẢ CÁC ROUTER CỦA ỨNG DỤNG ---
// Kích hoạt dotenv để đọc file .env
dotenv.config();
// Khởi tạo ứng dụng Express
const app = express();
// Thực hiện kết nối đến cơ sở dữ liệu
connectDB();
// Routers cho Giao diện (Views)
const viewRouter = require('./src/routes/viewRouter');
const adminRouter = require('./src/routes/adminRouter');

// Routers cho API (Backend Logic)
const authRouter = require('./src/routes/authRouter');
const userRouter = require('./src/routes/userRouter');
const categoryRouter = require('./src/routes/categoryRouter');
const productRouter = require('./src/routes/productRouter');
const reviewRouter = require('./src/routes/reviewRouter');
const cartRouter = require('./src/routes/cartRouter');
const orderRouter = require('./src/routes/orderRouter');
const slideshowRouter = require('./src/routes/slideshowRouter');
const promotionRouter = require('./src/routes/promotionRouter');
const comboRouter = require('./src/routes/comboRouter');
const dashboardRouter = require('./src/routes/dashboardRouter');
const ebookRouter = require('./src/routes/ebookRouter');
const roleRouter = require('./src/routes/roleRouter'); 
const receiptRouter = require('./src/routes/receiptRouter');
const postRouter = require('./src/routes/postRouter');
const provinceRouter = require('./src/routes/provinceRouter');



// --- 3. KHỞI TẠO VÀ CẤU HÌNH BAN ĐẦU ---




// --- 4. CẤU HÌNH CÁC MIDDLEWARE TOÀN CỤC ---

// Cấu hình View Engine là EJS
app.set('view engine', 'ejs');
// Chỉ định thư mục chứa các file EJS
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Cho phép các request từ mọi domain (hữu ích khi phát triển với frontend riêng biệt)
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Middleware của Express để tự động parse các request có body là JSON

// Middleware của Express để parse các request có body được mã hóa dạng URL-encoded


// **[QUAN TRỌNG]** Middleware để phục vụ các file tĩnh (CSS, JS phía client, ảnh...)
// Khi có request đến /css/style.css, Express sẽ tự động tìm file trong thư mục `public/css/style.css`



// --- 5. GẮN (MOUNT) CÁC ROUTER VÀO ỨNG DỤNG ---
// Thứ tự gắn router rất quan trọng để tránh xung đột

// A. Gắn các router API với tiền tố '/api'
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/slideshows', slideshowRouter);
app.use('/api/promotions', promotionRouter);
app.use('/api/combos', comboRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/ebooks', ebookRouter);
app.use('/api/roles', roleRouter);
app.use('/api/receipts', receiptRouter);
app.use('/api/posts', postRouter);
app.use('/api/provinces', provinceRouter);
// B. Gắn router cho các trang quản trị (Admin)
app.use('/admin', adminRouter);

// C. Gắn router cho các trang của người dùng (phải ở cuối cùng)
// Vì route này có đường dẫn '/', nó sẽ "bắt" tất cả các request không khớp với các route ở trên.
app.use('/', viewRouter);


// --- 6. ĐỒNG BỘ CSDL VÀ KHỞI CHẠY SERVER ---

// Lấy cổng từ file .env, nếu không có thì mặc định là 8080
const PORT = process.env.PORT || 8080;

// Sử dụng `sequelize.sync()` để đồng bộ hóa
// Chúng ta sẽ thêm { force: false } để an toàn hơn, nó sẽ không xóa dữ liệu cũ.
// { force: true } sẽ xóa và tạo lại bảng, mất hết dữ liệu,hữu ích khi phát triển nhưng nguy hiểm.
//{ alter: true } KHÔNG LÀM MẤT DỮ LIỆU. Nó chỉ thay đổi cấu trúc (schema) của bảng để khớp với model. 
// Đây là cách an toàn nhất để cập nhật database của bạn trong quá trình phát triển mà không phải viết các file migration phức tạp.
// Trả lại server.js về trạng thái bình thường để BẢO VỆ DỮ LIỆU
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server đang chạy trên cổng http://localhost:${PORT}`);
    });
});