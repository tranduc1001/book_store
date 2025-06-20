// File: /public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const authLinksContainer = document.getElementById('auth-links');
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (token && userString) {
        // Nếu đã đăng nhập
        const user = JSON.parse(userString);
        authLinksContainer.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    Xin chào, ${user.ho_ten}
                </a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="/my-orders">Lịch sử đơn hàng</a></li>
                    <li><a class="dropdown-item" href="/profile">Thông tin tài khoản</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logout-btn">Đăng xuất</a></li>
                </ul>
            </li>
        `;

        // Gán sự kiện cho nút đăng xuất
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (event) => {
                event.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            });
        }
    } else {
        // Nếu chưa đăng nhập
        authLinksContainer.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="/login">Đăng nhập</a>
            </li>
            <li class="nav-item">
                <a class="nav-link btn btn-primary text-white" href="/register">Đăng ký</a>
            </li>
        `;
    }
});