// Gói toàn bộ code trong một hàm IIFE (Immediately Invoked Function Expression)
// để tránh làm ô nhiễm scope toàn cục.
(() => {
    // ====================================================================
    // ===== PHẦN 1: KIỂM TRA QUYỀN TRUY CẬP KHI TẢI TRANG (giữ nguyên) =====
    // ====================================================================
    const userString = localStorage.getItem('user');
    if (!userString) {
        alert('Vui lòng đăng nhập với tài khoản Admin để truy cập trang này.');
        window.location.href = '/login';
        return;
    }
    try {
        const user = JSON.parse(userString);
        // Kiểm tra xem user có tồn tại và có phải là admin không (role_id == 1)
        if (user && user.role_id == 1) {
            // Hiển thị tên Admin trên thanh top navigation
            const adminNameEl = document.getElementById('admin-name');
            if (adminNameEl) {
                adminNameEl.textContent = user.ho_ten || 'Admin';
            }
        } else {
            alert('Bạn không có quyền truy cập trang này.');
            window.location.href = '/'; // Chuyển về trang chủ
        }
    } catch (error) {
        console.error('Lỗi dữ liệu localStorage:', error);
        localStorage.clear();
        window.location.href = '/login';
    }

    // ====================================================================
    // ========== PHẦN 2: XỬ LÝ SỰ KIỆN ĐĂNG XUẤT (phần mới) ==============
    // ====================================================================

    // Chờ cho toàn bộ cây DOM được tải xong rồi mới tìm nút đăng xuất
    document.addEventListener('DOMContentLoaded', () => {
        const logoutBtn = document.getElementById('logout-btn');

        // Nếu tìm thấy nút đăng xuất
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault(); // Ngăn hành động mặc định của thẻ <a>

                // Hiển thị hộp thoại xác nhận cho chắc chắn
                const result = await Swal.fire({
                    title: 'Bạn có chắc chắn muốn đăng xuất?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Đúng, đăng xuất!',
                    cancelButtonText: 'Hủy bỏ'
                });

                if (result.isConfirmed) {
                    try {
                        // 1. Gọi API để server xóa httpOnly cookie
                        await fetch('/api/auth/logout', { method: 'POST' });

                        // 2. Xóa dữ liệu phiên làm việc ở phía client
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');

                        // 3. Thông báo thành công và chuyển hướng
                        await Swal.fire(
                            'Đã đăng xuất!',
                            'Bạn đã đăng xuất thành công.',
                            'success'
                        );
                        
                        window.location.href = '/login';

                    } catch (error) {
                        console.error('Lỗi khi đăng xuất:', error);
                        Swal.fire(
                            'Lỗi!',
                            'Có lỗi xảy ra trong quá trình đăng xuất.',
                            'error'
                        );
                    }
                }
            });
        }
    });

})(); // Thực thi hàm IIFE ngay lập tức 