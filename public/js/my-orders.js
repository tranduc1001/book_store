// File: /public/js/my-orders.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    
    // Nếu chưa đăng nhập, chuyển hướng
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const ordersContainer = document.getElementById('orders-container');

    // Hàm để fetch và render lịch sử đơn hàng
    async function fetchAndRenderOrders() {
        try {
            const response = await fetch('/api/orders/myorders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
                throw new Error('Không thể tải lịch sử đơn hàng.');
            }
            
            const orders = await response.json();
            renderOrders(orders);

        } catch (error) {
            console.error('Lỗi:', error);
            ordersContainer.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
    }

    // Hàm để render giao diện
    function renderOrders(orders) {
        if (!orders || orders.length === 0) {
            ordersContainer.innerHTML = '<p>Bạn chưa có đơn hàng nào.</p>';
            return;
        }

        let ordersHTML = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th scope="col">Mã ĐH</th>
                        <th scope="col">Ngày Đặt</th>
                        <th scope="col">Tổng Tiền</th>
                        <th scope="col">Trạng thái ĐH</th>
                        <th scope="col">Thanh toán</th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody>
        `;

       orders.forEach(order => {
        const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN');
        const totalAmount = parseFloat(order.tong_thanh_toan).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
        const paymentStatus = order.trang_thai_thanh_toan === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
        
        // --- SỬA LẠI LOGIC Ở ĐÂY ---

        // 1. Gọi hàm để lấy object chứa thông tin trạng thái
        const statusInfo = getStatusClass(order.trang_thai_don_hang);

        // 2. Dựng chuỗi HTML cho badge từ thông tin trong object
        // Lưu ý: Dùng `text-bg-` là class chuẩn của Bootstrap 5 cho badge có nền màu
        const statusBadgeHTML = `<span class="badge rounded-pill text-bg-${statusInfo.className}">${statusInfo.text}</span>`;

        // 3. Sử dụng biến statusBadgeHTML trong chuỗi HTML của hàng
        ordersHTML += `
            <tr>
                <th scope="row">#${order.id}</th>
                <td>${orderDate}</td>
                <td>${totalAmount}</td>
                <td>${statusBadgeHTML}</td> 
                <td>${paymentStatus}</td>
                <td>
                    <a href="/orders/${order.id}" class="btn btn-sm btn-info">Xem chi tiết</a>
                </td>
            </tr>
        `;
    });

    ordersHTML += `
            </tbody>
        </table>
    `;
    ordersContainer.innerHTML = ordersHTML;
}


    // Hàm để lấy class CSS cho từng trạng thái
    function getStatusClass(status) {
        switch (status) {
        case 'pending':
            return { className: 'secondary', text: 'Chờ xác nhận' };
        case 'confirmed':
            return { className: 'info', text: 'Đã xác nhận' };
        case 'shipping':
            return { className: 'primary', text: 'Đang giao' };
        case 'delivered':
            return { className: 'success', text: 'Đã giao' };
        case 'cancelled':
            return { className: 'danger', text: 'Đã hủy' };
        default:
            return { className: 'light text-dark', text: status }; // Hiển thị trạng thái gốc nếu không khớp
    }
    }

    // Chạy hàm fetch lần đầu
    fetchAndRenderOrders();
});