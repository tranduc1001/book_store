/**
 * File: /public/js/order-detail.js
 * Chức năng: Lấy và hiển thị thông tin chi tiết của một đơn hàng.
 */

// Hàm này sẽ được chạy ngay khi trang được tải xong.
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderOrderDetail();
});


/**
 * Hàm chính: Lấy ID đơn hàng, gọi API, và điều phối việc hiển thị.
 */
async function fetchAndRenderOrderDetail() {
    // 1. Lấy ID đơn hàng từ URL của trình duyệt
    const orderId = getOrderIdFromUrl();

    if (!orderId) {
        console.error('Không tìm thấy ID đơn hàng trong URL.');
        showError('URL không hợp lệ. Không thể tải thông tin đơn hàng.');
        return;
    }

    // 2. Gọi API backend để lấy dữ liệu chi tiết đơn hàng
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login'; // Nếu chưa đăng nhập thì không cho xem
            return;
        }

        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            renderOrderDetail(data);
        } else {
            showError(data.message || 'Lỗi khi tải dữ liệu đơn hàng.');
        }
    } catch (error) {
        console.error('Lỗi mạng hoặc server:', error);
        showError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
}


/**
 * Hàm hiển thị toàn bộ dữ liệu đơn hàng lên các thành phần HTML.
 * @param {object} data - Đối tượng JSON chứa thông tin chi tiết đơn hàng từ API.
 */
function renderOrderDetail(data) {
    // --- HIỂN THỊ THÔNG TIN CHUNG ---
    setText('order-id-header', `Chi tiết đơn hàng #${data.id}`);
    setText('order-date', new Date(data.createdAt).toLocaleDateString('vi-VN'));
    
    // --- XỬ LÝ VÀ HIỂN THỊ CÁC BADGE TRẠNG THÁI ---
    const orderStatusInfo = getStatusInfo(data.trang_thai_don_hang);
    const paymentStatusInfo = getPaymentStatusInfo(data.trang_thai_thanh_toan);
    
    const orderStatusBadgeEl = document.getElementById('order-status-badge');
    if (orderStatusBadgeEl) {
        orderStatusBadgeEl.innerHTML = `<span class="badge ${orderStatusInfo.className}">${orderStatusInfo.text}</span>`;
    }

    const paymentStatusBadgeEl = document.getElementById('payment-status-badge');
    if (paymentStatusBadgeEl) {
        paymentStatusBadgeEl.innerHTML = `<span class="badge ${paymentStatusInfo.className}">${paymentStatusInfo.text}</span>`;
    }

    // --- HIỂN THỊ THÔNG TIN NGƯỜI NHẬN ---
    setText('customer-name', data.ten_nguoi_nhan);
    setText('customer-phone', data.sdt_nguoi_nhan);
    setText('customer-address', data.dia_chi_giao_hang);

    // --- HIỂN THỊ DANH SÁCH SẢN PHẨM ---
    const itemsContainer = document.getElementById('order-items-tbody');
    itemsContainer.innerHTML = ''; // Xóa nội dung cũ

    if (data.orderItems && Array.isArray(data.orderItems) && data.orderItems.length > 0) {
        data.orderItems.forEach(item => {
            const productName = item.product ? item.product.ten_sach : 'Sản phẩm không còn tồn tại';
            const productPrice = formatCurrency(parseFloat(item.don_gia));
            const lineTotal = formatCurrency(parseFloat(item.so_luong_dat) * parseFloat(item.don_gia));

            const itemRowHtml = `
                <tr>
                    <td>${productName}</td>
                    <td class="text-center">${item.so_luong_dat}</td>
                    <td class="text-end">${productPrice}</td>
                    <td class="text-end">${lineTotal}</td>
                </tr>
            `;
            itemsContainer.innerHTML += itemRowHtml;
        });
    } else {
        itemsContainer.innerHTML = '<tr><td colspan="4" class="text-center">Không có sản phẩm nào trong đơn hàng này.</td></tr>';
    }

    // --- HIỂN THỊ TỔNG TIỀN (BAO GỒM GIẢM GIÁ) ---
    setText('subtotal', formatCurrency(parseFloat(data.tong_tien_hang)));
    setText('shipping-fee', formatCurrency(parseFloat(data.phi_van_chuyen)));
    setText('total-price', formatCurrency(parseFloat(data.tong_thanh_toan)));
    
    const discountRow = document.getElementById('discount-row');
    const discountAmountEl = document.getElementById('discount-amount');
    
    if (data.so_tien_giam_gia && parseFloat(data.so_tien_giam_gia) > 0) {
        discountAmountEl.textContent = `- ${formatCurrency(parseFloat(data.so_tien_giam_gia))}`;
        discountRow.style.display = 'flex'; // Sử dụng flex để căn chỉnh
    } else {
        discountRow.style.display = 'none'; // Ẩn đi nếu không có giảm giá
    }

    // Ẩn thông báo lỗi nếu tải thành công
    hideError();
}


// ===================================================================
// ===================== CÁC HÀM TIỆN ÍCH ============================
// ===================================================================

/**
 * Gán text vào một element bằng ID.
 * @param {string} id - ID của element.
 * @param {string} text - Nội dung cần gán.
 */
const setText = (id, text) => {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
};

/**
 * Lấy ID đơn hàng từ URL.
 * @returns {string|null}
 */
function getOrderIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1] || null;
}

/**
 * Hiển thị thông báo lỗi trên giao diện.
 * @param {string} message - Nội dung lỗi.
 */
function showError(message) {
    const errorContainer = document.getElementById('error-message');
    const mainContent = document.querySelector('main .row');
    if (errorContainer && mainContent) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        // Ẩn nội dung chính đi khi có lỗi nghiêm trọng
        mainContent.style.display = 'none';
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
 * @param {number} number - Số tiền.
 * @returns {string}
 */
function formatCurrency(number) {
    if (typeof number !== 'number' || isNaN(number)) {
        return '0 ₫';
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

/**
 * "Thông dịch" trạng thái đơn hàng sang text và class CSS.
 * @param {string} status - Trạng thái từ DB.
 * @returns {{text: string, className: string}}
 */
function getStatusInfo(status) {
    switch (status) {
        case 'pending':
            return { text: 'Chờ xác nhận', className: 'bg-secondary' };
        case 'confirmed':
            return { text: 'Đã xác nhận', className: 'bg-primary' };
        case 'shipping':
            return { text: 'Đang giao', className: 'bg-info text-dark' };
        case 'delivered':
            return { text: 'Đã giao', className: 'bg-success' };
        case 'cancelled':
            return { text: 'Đã hủy', className: 'bg-danger' };
        default:
            return { text: status, className: 'bg-light text-dark' };
    }
}

/**
 * "Thông dịch" trạng thái thanh toán.
 * @param {boolean} isPaid - Trạng thái từ DB.
 * @returns {{text: string, className: string}}
 */
function getPaymentStatusInfo(isPaid) {
    if (isPaid) {
        return { text: 'Đã thanh toán', className: 'bg-success' };
    } else {
        return { text: 'Chưa thanh toán', className: 'bg-warning text-dark' };
    }
}