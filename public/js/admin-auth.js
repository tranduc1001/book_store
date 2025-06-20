// File: /public/js/admin-auth.js

// Hàm kiểm tra được gói trong một hàm khác để tránh làm ô nhiễm scope toàn cục
(() => {
    // Lấy chuỗi JSON chứa thông tin người dùng từ localStorage
    const userString = localStorage.getItem('user');
    
    // Nếu không có chuỗi này, nghĩa là người dùng chưa đăng nhập.
    if (!userString) {
        // Thông báo và chuyển hướng ngay lập tức về trang đăng nhập.
        alert('Vui lòng đăng nhập với tài khoản Admin để truy cập trang này.');
        window.location.href = '/login';
        return; // Dừng hàm tại đây
    }

    try {
        // Cố gắng chuyển đổi chuỗi JSON thành một đối tượng JavaScript
        const user = JSON.parse(userString);
        
        // **ĐIỂM SỬA LỖI QUAN TRỌNG NHẤT**
        // Kiểm tra xem `user.role_id` có tồn tại và giá trị của nó có bằng 1 hay không.
        // Phép so sánh `==` sẽ tự động chuyển đổi kiểu dữ liệu (type coercion),
        // nên nó sẽ đúng cho cả `1` (số) và `"1"` (chuỗi).
        // Đây là cách an toàn hơn so với so sánh nghiêm ngặt `!== 1`.
        if (user && user.role_id == 1) {
            // Nếu là admin, không làm gì cả, cho phép ở lại trang.
            // console.log('Xác thực Admin thành công. Chào mừng!');
            return;
        } else {
            // Nếu không phải admin (role_id khác 1 hoặc không tồn tại)
            alert('Bạn không có quyền truy cập trang này.');
            window.location.href = '/'; // Chuyển về trang chủ của người dùng
        }

    } catch (error) {
        // Nếu có lỗi khi parse JSON (dữ liệu trong localStorage bị hỏng)
        console.error('Lỗi khi đọc dữ liệu người dùng từ localStorage:', error);
        // Xóa hết dữ liệu cũ để tránh lỗi lặp lại
        localStorage.clear();
        // Chuyển về trang đăng nhập
        window.location.href = '/login';
    }
})(); // Thực thi hàm ngay lập tức