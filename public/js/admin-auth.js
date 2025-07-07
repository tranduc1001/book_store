// File: /public/js/admin-auth.js (Phiên bản đã sửa và tối ưu)

// Chờ cho toàn bộ cây DOM được tải xong rồi mới thực thi
document.addEventListener('DOMContentLoaded', () => {

    // ====================================================================
    // PHẦN 1: HIỂN THỊ THÔNG TIN ADMIN VÀ XỬ LÝ ĐĂNG XUẤT
    // ====================================================================

    const adminNameEl = document.getElementById('admin-name');
    const logoutBtn = document.getElementById('logout-btn');
    const userString = localStorage.getItem('user');

    // Hiển thị tên Admin nếu có
    if (userString) {
        try {
            const user = JSON.parse(userString);
            if (adminNameEl && user.ho_ten) {
                adminNameEl.textContent = user.ho_ten;
            }
        } catch (error) {
            console.error('Lỗi phân tích dữ liệu user:', error);
        }
    }

    // Gắn sự kiện cho nút đăng xuất
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Hiển thị hộp thoại xác nhận
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

                    // 2. Xóa dữ liệu phiên làm việc ở client
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');

                    // 3. Thông báo và chuyển hướng
                    await Swal.fire('Đã đăng xuất!', 'Bạn đã đăng xuất thành công.', 'success');
                    window.location.href = '/login';

                } catch (error) {
                    console.error('Lỗi khi đăng xuất:', error);
                    Swal.fire('Lỗi!', 'Có lỗi xảy ra trong quá trình đăng xuất.', 'error');
                }
            }
        });
    }
});