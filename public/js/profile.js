document.addEventListener('DOMContentLoaded', () => {
    // Lấy token từ localStorage để xác thực
    const token = localStorage.getItem('token');
    
    // Nếu không có token, chuyển hướng ngay về trang đăng nhập
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // === LẤY CÁC ELEMENT HTML CẦN THIẾT ===

    // Form và các nút submit
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const profileSubmitBtn = profileForm.querySelector('button[type="submit"]');
    const passwordSubmitBtn = passwordForm.querySelector('button[type="submit"]');

    // Các ô input trong form thông tin cá nhân
    const hoTenInput = document.getElementById('ho_ten');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const diaChiInput = document.getElementById('dia_chi');
    const tenDangNhapInput = document.getElementById('ten_dang_nhap');

    // Các ô input trong form đổi mật khẩu
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');

    // Các hộp thoại thông báo
    const profileAlert = document.getElementById('profileAlert');
    const passwordAlert = document.getElementById('passwordAlert');


    // === CÁC HÀM XỬ LÝ LOGIC ===

    /**
     * Hàm lấy thông tin profile của người dùng từ server và điền vào form.
     * Được gọi ngay khi trang tải xong.
     */
    async function fetchAndFillProfile() {
        try {
            const response = await fetch('/api/users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                // Nếu token hết hạn hoặc không hợp lệ, server sẽ trả về 401
                if (response.status === 401) {
                    localStorage.clear();
                    window.location.href = '/login';
                }
                throw new Error('Không thể tải thông tin tài khoản.');
            }
            
            const user = await response.json();
            
            // Điền thông tin vào các ô input
            hoTenInput.value = user.ho_ten || '';
            emailInput.value = user.email || '';
            phoneInput.value = user.phone || '';
            diaChiInput.value = user.dia_chi || '';
            tenDangNhapInput.value = user.ten_dang_nhap || '';

        } catch (error) {
            // Hiển thị lỗi nếu không tải được thông tin
            profileAlert.textContent = error.message;
            profileAlert.className = 'alert alert-danger';
            profileAlert.style.display = 'block';
        }
    }
    
    /**
     * Lắng nghe sự kiện submit của form "Thông tin cá nhân"
     */
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Ngăn form submit theo cách truyền thống

        // Vô hiệu hóa nút và hiển thị trạng thái đang xử lý
        profileSubmitBtn.disabled = true;
        profileSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang lưu...';
        profileAlert.style.display = 'none'; // Ẩn thông báo cũ

        // Lấy dữ liệu đã được người dùng cập nhật từ form
        const updatedData = {
            ho_ten: hoTenInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            dia_chi: diaChiInput.value.trim(),
        };

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            const result = await response.json();

            if (response.ok) {
                // Hiển thị thông báo thành công
                profileAlert.textContent = 'Cập nhật thông tin thành công!';
                profileAlert.className = 'alert alert-success';
                
                // CẬP NHẬT LẠI DỮ LIỆU TRONG LOCALSTORAGE
                // Điều này rất quan trọng để đảm bảo header hiển thị đúng tên/email mới
                const userFromStorage = JSON.parse(localStorage.getItem('user'));
                userFromStorage.ho_ten = result.ho_ten;
                userFromStorage.email = result.email;
                
                localStorage.setItem('user', JSON.stringify(userFromStorage));
                // Nếu server trả về token mới (do đổi email), hãy cập nhật lại
                if (result.token) {
                    localStorage.setItem('token', result.token);
                }

                // Tải lại trang sau 1.5 giây để header cập nhật
                setTimeout(() => location.reload(), 1500);

            } else {
                // Hiển thị thông báo lỗi từ server
                profileAlert.textContent = result.message || 'Cập nhật thất bại.';
                profileAlert.className = 'alert alert-danger';
            }
        } catch (error) {
            // Hiển thị lỗi kết nối
            profileAlert.textContent = 'Lỗi kết nối đến server.';
            profileAlert.className = 'alert alert-danger';
        } finally {
            // Luôn kích hoạt lại nút submit sau khi xử lý xong
            profileSubmitBtn.disabled = false;
            profileSubmitBtn.textContent = 'Lưu thay đổi';
            // Hiển thị hộp thoại thông báo
            profileAlert.style.display = 'block';
        }
    });

    /**
     * Lắng nghe sự kiện submit của form "Đổi mật khẩu"
     */
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Vô hiệu hóa nút và hiển thị trạng thái đang xử lý
        passwordSubmitBtn.disabled = true;
        passwordSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang đổi...';
        passwordAlert.style.display = 'none';

        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;

        try {
             const response = await fetch('/api/users/change-password', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const result = await response.json();

            if (response.ok) {
                passwordAlert.textContent = result.message;
                passwordAlert.className = 'alert alert-success';
                passwordForm.reset(); // Xóa các trường trong form sau khi đổi thành công
            } else {
                passwordAlert.textContent = result.message || 'Đổi mật khẩu thất bại.';
                passwordAlert.className = 'alert alert-danger';
            }
        } catch (error) {
             passwordAlert.textContent = 'Lỗi kết nối đến server.';
             passwordAlert.className = 'alert alert-danger';
        } finally {
            passwordSubmitBtn.disabled = false;
            passwordSubmitBtn.textContent = 'Đổi mật khẩu';
            passwordAlert.style.display = 'block';
        }
    });


    // === KHỞI CHẠY ===
    // Gọi hàm này lần đầu tiên để tải dữ liệu và điền vào form
    fetchAndFillProfile();
});