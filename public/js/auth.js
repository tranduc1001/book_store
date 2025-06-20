// File: /public/js/auth.js

// Lắng nghe sự kiện submit của form đăng ký
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Ngăn không cho form submit theo cách truyền thống (tải lại trang)

        // Lấy giá trị từ các input
        const ho_ten = document.getElementById('ho_ten').value;
        const ten_dang_nhap = document.getElementById('ten_dang_nhap').value;
        const email = document.getElementById('email').value;
        const mat_khau = document.getElementById('mat_khau').value;
        const alertBox = document.getElementById('alertBox');

        try {
            // Gọi API đăng ký bằng fetch
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ho_ten, ten_dang_nhap, email, mat_khau }),
            });

            const data = await response.json();

            if (response.ok) { // Nếu request thành công (status 2xx)
                alertBox.className = 'alert alert-success';
                alertBox.textContent = 'Đăng ký thành công! Bạn sẽ được chuyển đến trang đăng nhập.';
                alertBox.style.display = 'block';
                // Chuyển hướng đến trang đăng nhập sau 2 giây
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else { // Nếu có lỗi từ server (status 4xx, 5xx)
                alertBox.className = 'alert alert-danger';
                alertBox.textContent = data.message || 'Đã có lỗi xảy ra.';
                alertBox.style.display = 'block';
            }
        } catch (error) {
            console.error('Lỗi:', error);
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = 'Không thể kết nối đến server. Vui lòng thử lại sau.';
            alertBox.style.display = 'block';
        }
    });
}


// Lắng nghe sự kiện submit của form đăng nhập
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const mat_khau = document.getElementById('mat_khau').value;
        const alertBox = document.getElementById('alertBox');
         console.log('CHECK 1 - Đang thử đăng nhập với email:', email); 
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, mat_khau }),
            });

            const data = await response.json();

            if (response.ok) {
                // **Lưu cả token và thông tin user (bao gồm role_id) vào localStorage**
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({
                    id: data.id,
                    ho_ten: data.ho_ten,
                    email: data.email,
                    role_id: data.role_id
                }));

                // Sử dụng SweetAlert2 để thông báo đẹp hơn
                Swal.fire({
                    icon: 'success',
                    title: 'Đăng nhập thành công!',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    // **Chuyển hướng dựa trên vai trò**
                    if (data.role_id === 1) {
                        window.location.href = '/admin'; // Admin vào trang quản trị
                    } else {
                        window.location.href = '/'; // User thường về trang chủ
                    }
                });

            } else {
                alertBox.className = 'alert alert-danger';
                alertBox.textContent = data.message || 'Đã có lỗi xảy ra.';
                alertBox.style.display = 'block';
            }
        } catch (error) {
            console.error('Lỗi:', error);
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = 'Không thể kết nối đến server.';
            alertBox.style.display = 'block';
        }
    });
}