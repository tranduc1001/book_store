// File: /public/js/admin-order-list.js (PHIÊN BẢN HOÀN CHỈNH)

document.addEventListener('DOMContentLoaded', () => {

    // === KHAI BÁO BIẾN DOM ===
    const ordersTableBody = document.getElementById('ordersTableBody');
    const paginationContainer = document.getElementById('pagination-container');
    const filterForm = document.getElementById('filter-form');
    const keywordInput = document.getElementById('keyword-input');
    const statusSelect = document.getElementById('status-select');
    
    const token = localStorage.getItem('token');

    // === CÁC HÀM TIỆN ÍCH (Giữ nguyên) ===
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const getStatusBadge = (status) => {
        const statusMap = {
            pending: { text: 'Chờ xác nhận', class: 'bg-warning text-dark' },
            confirmed: { text: 'Đã xác nhận', class: 'bg-info' },
            shipping: { text: 'Đang giao', class: 'bg-primary' },
            delivered: { text: 'Hoàn thành', class: 'bg-success' },
            cancelled: { text: 'Đã hủy', class: 'bg-danger' },
        };
        const current = statusMap[status] || { text: 'Không xác định', class: 'bg-secondary' };
        return `<span class="badge ${current.class}">${current.text}</span>`;
    };

    // === HÀM CHÍNH: LẤY VÀ HIỂN THỊ DỮ LIỆU ===
    async function fetchAndRenderOrders(page = 1, keyword = '', status = '') {
        try {
            ordersTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Đang tải dữ liệu... <i class="fas fa-spinner fa-spin"></i></td></tr>`;

            // Xây dựng URL động với các tham số
            const apiUrl = `/api/orders?page=${page}&limit=10&keyword=${keyword}&status=${status}`;
            
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Lỗi khi lấy dữ liệu đơn hàng.');
            
            const data = await response.json(); // API cần trả về { orders, currentPage, totalPages }
            const { orders, currentPage, totalPages } = data;

            ordersTableBody.innerHTML = ''; // Xóa nội dung cũ

            if (orders.length === 0) {
                ordersTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Không có đơn hàng nào phù hợp.</td></tr>`;
            } else {
                orders.forEach(order => {
                    const row = `
                        <tr>
                            <td><strong>#${order.id}</strong></td> 
                            <td>${order.ten_nguoi_nhan || 'Khách vãng lai'}</td>
                            <td>${formatDate(order.createdAt)}</td>
                            <td class="text-end">${formatCurrency(order.tong_thanh_toan)}</td>
                            <td class="text-center">${getStatusBadge(order.trang_thai_don_hang)}</td>
                            <td class="text-center">
                                <a href="/admin/orders/${order.id}" class="btn btn-info btn-circle btn-sm" title="Xem chi tiết"><i class="fas fa-eye"></i></a>
                            </td>
                        </tr>`;
                    ordersTableBody.insertAdjacentHTML('beforeend', row);
                });
            }
            
            renderPagination(currentPage, totalPages, keyword, status);

        } catch (error) {
            ordersTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Không thể tải dữ liệu.</td></tr>`;
        }
    }

    // === HÀM RENDER THANH PHÂN TRANG ===
    function renderPagination(currentPage, totalPages, keyword, status) {
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;
        
        let paginationHtml = '<ul class="pagination justify-content-end">';
        paginationHtml += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">Trước</a></li>`;
        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
        paginationHtml += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">Sau</a></li>`;
        paginationHtml += '</ul>';
        paginationContainer.innerHTML = paginationHtml;
    }
    
    // === GẮN SỰ KIỆN ===
    // Sự kiện submit form tìm kiếm
    filterForm.addEventListener('submit', e => {
        e.preventDefault();
        const keyword = keywordInput.value.trim();
        const status = statusSelect.value;
        fetchAndRenderOrders(1, keyword, status); // Luôn về trang 1 khi tìm kiếm mới
    });

    // Sự kiện click vào các nút phân trang
    paginationContainer.addEventListener('click', e => {
        e.preventDefault();
        const pageLink = e.target.closest('.page-link');
        if (pageLink && !pageLink.parentElement.classList.contains('disabled')) {
            const page = parseInt(pageLink.dataset.page);
            const keyword = keywordInput.value.trim();
            const status = statusSelect.value;
            fetchAndRenderOrders(page, keyword, status);
        }
    });

    // === KHỞI CHẠY LẦN ĐẦU ===
    fetchAndRenderOrders();
});