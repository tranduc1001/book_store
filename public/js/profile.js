// File: /public/js/profile.js
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Các form
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');

    // Các ô input
    const ho_ten_input = document.getElementById('ho_ten');
    const email_input = document.getElementById('email');
    const phone_input = document.getElementById('phone');
    const dia_chi_input = document.getElementById('dia_chi');
    const ten_dang_nhap_input = document.getElementById('ten_dang_nhap');

    // Các alert box
    const profileAlert = document.getElementById('profileAlert');
    const passwordAlert = document.getElementById('passwordAlert');

    // Hàm fetch và điền thông tin profile
    async function fetchAndFillProfile() {
        try {
            const response = await fetch('/api/users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Không thể tải thông tin tài khoản.');
            
            const user = await response.json();
            ho_ten_input.value = user.ho_ten || '';
            email_input.value = user.email || '';
            phone_input.value = user.phone || '';
            dia_chi_input.value = user.dia_chi || '';
            ten_dang_nhap_input.value = user.ten_dang_nhap || '';

        } catch (error) {
            console.error('Lỗi:', error);
            profileAlert.textContent = error.message;
            profileAlert.className = 'alert alert-danger';
            profileAlert.style.display = 'block';
        }
    }
    
    // Lắng nghe submit form thông tin
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedData = {
            ho_ten: ho_ten_input.value,
            email: email_input.value,
            phone: phone_input.value,
            dia_chi: dia_chi_input.value,
        };
        // Logic gọi API PUT /api/users/profile...
        // ... (tương tự các form khác)
        // Sau khi thành công, hiển thị thông báo
        profileAlert.textContent = 'Cập nhật thông tin thành công!';
        profileAlert.className = 'alert alert-success';
        profileAlert.style.display = 'block';
    });

    // Lắng nghe submit form đổi mật khẩu
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        try {
             const response = await fetch('/api/users/change-password', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const result = await response.json();
            if (response.ok) {
                passwordAlert.textContent = result.message;
                passwordAlert.className = 'alert alert-success';
                passwordForm.reset(); // Xóa các trường trong form
            } else {
                passwordAlert.textContent = result.message;
                passwordAlert.className = 'alert alert-danger';
            }
            passwordAlert.style.display = 'block';
        } catch (error) {
             passwordAlert.textContent = 'Lỗi kết nối server.';
             passwordAlert.className = 'alert alert-danger';
             passwordAlert.style.display = 'block';
        }
    });


    // Chạy lần đầu
    fetchAndFillProfile();
});