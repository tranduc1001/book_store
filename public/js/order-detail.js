// File: /public/js/order-detail.js

/**
 * Hàm này sẽ được chạy ngay khi trang được tải xong.
 * Nó sẽ tự động lấy ID đơn hàng từ URL và gọi API để lấy dữ liệu.
 */
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderOrderDetail();
});


/**
 * Hàm chính: Lấy ID đơn hàng, gọi API, và điều phối việc hiển thị.
 */
async function fetchAndRenderOrderDetail() {
    // 1. Lấy ID đơn hàng từ URL của trình duyệt
    // Ví dụ: Nếu URL là http://localhost:8080/orders/5, orderId sẽ là '5'
    const orderId = getOrderIdFromUrl();

    // Nếu không có ID, không làm gì cả
    if (!orderId) {
        console.error('Không tìm thấy ID đơn hàng trong URL.');
        showError('Không thể tải thông tin đơn hàng.');
        return;
    }

    // 2. Gọi API backend để lấy dữ liệu chi tiết đơn hàng
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Giả sử token được lưu trong localStorage sau khi đăng nhập
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        // 3. Xử lý kết quả trả về từ API
        if (response.ok) {
            const orderData = await response.json();
            // Nếu thành công, gọi hàm để hiển thị dữ liệu lên trang
            renderOrderDetail(orderData);
        } else {
            // Nếu API trả về lỗi (ví dụ: 404 Not Found, 403 Forbidden)
            const errorData = await response.json();
            showError(errorData.message || 'Lỗi khi tải dữ liệu đơn hàng.');
        }
    } catch (error) {
        // Xử lý lỗi nếu không thể kết nối đến server
        console.error('Lỗi mạng hoặc server:', error);
        showError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
}


/**
 * Hàm hiển thị dữ liệu đơn hàng lên các thành phần HTML.
 * @param {object} data - Đối tượng JSON chứa toàn bộ thông tin chi tiết đơn hàng.
 */
function renderOrderDetail(data) {
    // --- HIỂN THỊ THÔNG TIN CHUNG ---
    const setText = (id, text) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        } else {
            console.warn(`Không tìm thấy phần tử HTML với id: #${id}`);
        }
    };

    // --- HIỂN THỊ THÔNG TIN CHUNG ---
    setText('order-id-header', `Chi tiết đơn hàng #${data.id}`);
    setText('order-date', new Date(data.createdAt).toLocaleDateString('vi-VN'));
    setText('order-status', translateStatus(data.trang_thai_don_hang));
    
    // --- HIỂN THỊ THÔNG TIN NGƯỜI NHẬN ---
    setText('customer-name', data.ten_nguoi_nhan);
    setText('customer-phone', data.sdt_nguoi_nhan);
    setText('customer-address', data.dia_chi_giao_hang);

    // --- HIỂN THỊ DANH SÁCH SẢN PHẨM ---
    const itemsContainer = document.getElementById('order-items-tbody');
    itemsContainer.innerHTML = ''; // Xóa nội dung cũ để tránh trùng lặp

    // Kiểm tra để đảm bảo 'orderItems' tồn tại và là một mảng
    if (data.orderItems && Array.isArray(data.orderItems)) {
        data.orderItems.forEach(item => {
            // Kiểm tra xem 'item.product' có tồn tại không
            const productName = item.product ? item.product.ten_sach : 'Sản phẩm không còn tồn tại';
            const productPrice = item.product ? formatCurrency(item.don_gia) : 'N/A';
            const lineTotal = formatCurrency(item.so_luong_dat * item.don_gia);

            const itemRowHtml = `
                <tr>
                    <td>${productName}</td>
                    <td class="text-center">${item.so_luong_dat}</td>
                    <td class="text-right">${productPrice}</td>
                    <td class="text-right">${lineTotal}</td>
                </tr>
            `;
            itemsContainer.innerHTML += itemRowHtml;
        });
    } else {
        itemsContainer.innerHTML = '<tr><td colspan="4" class="text-center">Không có sản phẩm nào trong đơn hàng này.</td></tr>';
    }

    // --- HIỂN THỊ TỔNG TIỀN ---
    document.getElementById('subtotal').textContent = formatCurrency(data.tong_tien_hang);
    document.getElementById('shipping-fee').textContent = formatCurrency(data.phi_van_chuyen);
    document.getElementById('total-price').textContent = formatCurrency(data.tong_thanh_toan);

    // Ẩn thông báo lỗi nếu có
    hideError();
}


// --- CÁC HÀM TIỆN ÍCH ---

/**
 * Lấy ID đơn hàng từ URL.
 * @returns {string|null} - Trả về chuỗi ID hoặc null nếu không tìm thấy.
 */
function getOrderIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    // Lấy phần tử cuối cùng của URL, ví dụ: '5' từ '/orders/5'
    return pathParts[pathParts.length - 1];
}

/**
 * Hiển thị thông báo lỗi trên giao diện.
 * @param {string} message - Nội dung lỗi cần hiển thị.
 */
function showError(message) {
    const errorContainer = document.getElementById('error-message');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }
}

/**
 * Ẩn thông báo lỗi.
 */
function hideError() {
    const errorContainer = document.getElementById('error-message');
    if (errorContainer) {
        errorContainer.style.display = 'none';
    }
}

/**
 * Định dạng một số thành chuỗi tiền tệ Việt Nam (VND).
 * @param {number} number - Số tiền cần định dạng.
 * @returns {string} - Chuỗi đã định dạng, ví dụ: "120.000 ₫".
 */
function formatCurrency(number) {
    if (typeof number !== 'number') {
        return 'N/A';
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

/**
 * Dịch trạng thái đơn hàng từ tiếng Anh sang tiếng Việt.
 * @param {string} status - Trạng thái tiếng Anh (pending, confirmed, ...).
 * @returns {string} - Trạng thái tiếng Việt tương ứng.
 */
function translateStatus(status) {
    const statusMap = {
        'pending': 'Đang chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'shipping': 'Đang giao hàng',
        'delivered': 'Đã giao thành công',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status; // Trả về chính nó nếu không tìm thấy trong map
}