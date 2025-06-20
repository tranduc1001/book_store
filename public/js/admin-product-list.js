// File: /public/js/admin-product-list.js

document.addEventListener('DOMContentLoaded', () => {
    const productTableBody = document.getElementById('products-table-body');

    productTableBody.addEventListener('click', async (event) => {
        const deleteButton = event.target.closest('.delete-product-btn');
        if (!deleteButton) return; // Nếu không click vào nút xóa thì không làm gì cả

        const productId = deleteButton.dataset.id;
        
        // SỬ DỤNG SWEETALERT THAY CHO CONFIRM MẶC ĐỊNH
        Swal.fire({
            title: `Bạn chắc chắn muốn xóa?`,
            text: `Sản phẩm có ID: ${productId} sẽ bị xóa vĩnh viễn!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Vâng, xóa nó đi!',
            cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Nếu người dùng đồng ý
                const token = localStorage.getItem('token');
                if (!token) {
                    Swal.fire('Lỗi!', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                    window.location.href = '/login';
                    return;
                }

                try {
                    const response = await fetch(`/api/products/${productId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const resultData = await response.json();

                    if (response.ok) {
                        // HIỂN THỊ THÔNG BÁO THÀNH CÔNG
                        Swal.fire('Đã xóa!', resultData.message, 'success');
                        
                        // Xóa dòng sản phẩm trên giao diện
                        const productRow = document.getElementById(`product-row-${productId}`);
                        if (productRow) {
                            productRow.remove();
                        }
                    } else {
                        // HIỂN THỊ THÔNG BÁO LỖI
                        Swal.fire('Thất bại!', resultData.message || 'Không thể xóa sản phẩm.', 'error');
                    }
                } catch (error) {
                    console.error('Lỗi khi xóa sản phẩm:', error);
                    Swal.fire('Lỗi!', 'Không thể kết nối đến server.', 'error');
                }
            }
        });
    });

    // Thêm ví dụ về Loading State
    function renderLoading() {
        const productTable = document.querySelector('.table');
        if(productTable) {
             productTable.insertAdjacentHTML('afterbegin', `
                <div class="overlay-loading">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `);
        }
    }

    function removeLoading() {
        const loadingOverlay = document.querySelector('.overlay-loading');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }
    
    // Giả sử có một hàm tải lại danh sách
    async function reloadProducts() {
        renderLoading(); // <-- Hiển thị loading
        try {
            // ... (code gọi API để lấy danh sách sản phẩm mới)
            // ... (code render lại bảng)
        } catch (error) {
            // ... (xử lý lỗi)
        } finally {
            removeLoading(); // <-- Luôn ẩn loading dù thành công hay thất bại
        }
    }
});