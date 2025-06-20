// File: /public/js/admin-order-list.js

/**
 * File này xử lý việc hiển thị danh sách tất cả các đơn hàng cho trang admin.
 * Nó sẽ gọi API để lấy dữ liệu và điền vào bảng HTML.
 */

// Lấy token xác thực của admin từ localStorage.
// Token này phải được lưu khi admin đăng nhập thành công.
const token = localStorage.getItem('token');

// Thêm một listener để tự động chạy hàm loadOrders() ngay khi
// toàn bộ cấu trúc HTML của trang đã được tải xong.
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});

/**
 * Hàm chính: Tải danh sách tất cả các đơn hàng từ API và hiển thị ra bảng.
 */
async function loadOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    // Hiển thị trạng thái đang tải để người dùng biết
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Đang tải dữ liệu đơn hàng...</td></tr>';

    try {
        // Gọi API endpoint để lấy TẤT CẢ các đơn hàng (yêu cầu quyền admin)
        const response = await fetch('/api/orders', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Gửi token trong header để xác thực
            }
        });

        // Nếu API trả về lỗi (ví dụ: không có quyền, server lỗi)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể tải danh sách đơn hàng.');
        }

        // Nếu gọi API thành công, chuyển đổi kết quả thành JSON
        const orders = await response.json();

        // Xóa dòng "Đang tải..."
        tableBody.innerHTML = '';

        // Kiểm tra xem có đơn hàng nào không
        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có đơn hàng nào trong hệ thống.</td></tr>';
            return;
        }

        // Lặp qua từng đơn hàng trong danh sách và tạo một hàng (<tr>) cho mỗi đơn
        orders.forEach(order => {
            const row = tableBody.insertRow(); // Tạo một thẻ <tr> mới

            // Lấy tên khách hàng, nếu không có (khách vãng lai) thì hiển thị mặc định
            const customerName = order.user ? order.user.ho_ten : 'Khách vãng lai';
            
            // Dùng hàm tiện ích để tạo badge màu mè cho trạng thái
            const orderStatusBadge = getStatusBadge(order.trang_thai_don_hang);
            
            // Dùng hàm tiện ích để định dạng số tiền cho đẹp
            const totalAmountFormatted = formatCurrency(order.tong_thanh_toan);

            // Điền nội dung cho các ô (<td>) trong hàng
            row.innerHTML = `
                <td>#${order.id}</td>
                <td>${customerName}</td>
                <td>${new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>${totalAmountFormatted}</td>
                <td>${orderStatusBadge}</td>
                <td>
                    <a href="/admin/orders/${order.id}" class="btn btn-info btn-sm" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            `;
        });

    } catch (error) {
        // Nếu có bất kỳ lỗi nào xảy ra trong quá trình fetch hoặc xử lý
        console.error('Lỗi khi tải danh sách đơn hàng:', error);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Lỗi: ${error.message}</td></tr>`;
    }
}

/**
 * Hàm tiện ích để định dạng một số thành chuỗi tiền tệ Việt Nam (VND).
 * @param {number | string} amount - Số tiền cần định dạng.
 * @returns {string} - Chuỗi đã định dạng, ví dụ: "123.456 ₫".
 */
function formatCurrency(amount) {
    // Chuyển đổi amount thành số để đảm bảo tính toán đúng
    const numberAmount = parseFloat(amount);
    if (isNaN(numberAmount)) {
        return 'N/A'; // Trả về 'N/A' nếu không phải là số
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numberAmount);
}

/**
 * Hàm tiện ích để tạo một thẻ <span> badge có màu sắc tương ứng với trạng thái đơn hàng.
 * @param {string} status - Trạng thái đơn hàng từ CSDL (ví dụ: 'pending', 'confirmed').
 * @returns {string} - Chuỗi HTML của thẻ <span> badge.
 */
function getStatusBadge(status) {
    let className = 'secondary'; // Màu mặc định
    let text = status; // Tên hiển thị mặc định

    // Dùng switch-case để gán màu và tên tiếng Việt tương ứng
    switch (status) {
        case 'pending':
            className = 'warning';
            text = 'Chờ xác nhận';
            break;
        case 'confirmed':
            className = 'primary';
            text = 'Đã xác nhận';
            break;
        case 'shipping':
            className = 'info';
            text = 'Đang giao';
            break;
        case 'delivered':
            className = 'success';
            text = 'Hoàn thành';
            break;
        case 'cancelled':
            className = 'danger';
            text = 'Đã hủy';
            break;
    }
    // Trả về chuỗi HTML hoàn chỉnh
    return `<span class="badge bg-${className}">${text}</span>`;
}