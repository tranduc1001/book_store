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
            const statusClass = getStatusClass(order.trang_thai_don_hang);

            ordersHTML += `
                <tr>
                    <th scope="row">#${order.id}</th>
                    <td>${orderDate}</td>
                    <td>${parseFloat(order.tong_thanh_toan).toLocaleString('vi-VN')}đ</td>
                    <td><span class="badge ${statusClass}">${order.trang_thai_don_hang}</span></td>
                    <td>${order.trang_thai_thanh_toan ? 'Đã thanh toán' : 'Chưa thanh toán'}</td>
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
            case 'pending': return 'bg-secondary';
            case 'confirmed': return 'bg-info';
            case 'shipping': return 'bg-primary';
            case 'delivered': return 'bg-success';
            case 'cancelled': return 'bg-danger';
            default: return 'bg-light text-dark';
        }
    }

    // Chạy hàm fetch lần đầu
    fetchAndRenderOrders();
});