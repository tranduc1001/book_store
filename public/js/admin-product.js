// File: /public/js/admin-product.js 

document.addEventListener('DOMContentLoaded', function() {
    // ====================================================================
    // LOGIC XỬ LÝ FORM SẮP XẾP
    // ====================================================================
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const form = document.getElementById('sort-form');
            if (!form) {
                console.error('Không tìm thấy form#sort-form');
                return;
            }

            // Xóa các input ẩn cũ để tránh trùng lặp
            const oldSortBy = form.querySelector('input[name="sortBy"]');
            if (oldSortBy) oldSortBy.remove();
            const oldOrder = form.querySelector('input[name="order"]');
            if (oldOrder) oldOrder.remove();

            // ==========================================================
            // ================= SỬA LỖI LOGIC TÁCH CHUỖI ================
            // ==========================================================
            const selectedValue = this.value; // Ví dụ: "gia_bia_DESC"

            // Tìm vị trí của dấu gạch dưới cuối cùng
            const lastUnderscoreIndex = selectedValue.lastIndexOf('_');

            // sortByValue sẽ là phần từ đầu đến dấu gạch dưới cuối cùng
            const sortByValue = selectedValue.substring(0, lastUnderscoreIndex); 
            
            // orderValue sẽ là phần từ sau dấu gạch dưới cuối cùng
            const orderValue = selectedValue.substring(lastUnderscoreIndex + 1);
            // ==========================================================

            // Tạo input ẩn mới cho sortBy
            const sortByInput = document.createElement('input');
            sortByInput.type = 'hidden';
            sortByInput.name = 'sortBy';
            sortByInput.value = sortByValue; // Sẽ là 'gia_bia'
            form.appendChild(sortByInput);

            // Tạo input ẩn mới cho order
            const orderInput = document.createElement('input');
            orderInput.type = 'hidden';
            orderInput.name = 'order';
            orderInput.value = orderValue; // Sẽ là 'DESC'
            form.appendChild(orderInput);

            form.submit();
        });
    }

    // ====================================================================
    // LOGIC XỬ LÝ NÚT XÓA SẢN PHẨM
    // ====================================================================
    const productTableBody = document.getElementById('products-table-body');
    if (productTableBody) {
        productTableBody.addEventListener('click', async function(event) {
            const deleteButton = event.target.closest('.delete-product-btn');
            if (!deleteButton) {
                return;
            }

            const productId = deleteButton.dataset.id;
            
            const result = await Swal.fire({
                title: 'Bạn có chắc chắn?',
                text: `Sản phẩm có ID: ${productId} sẽ bị xóa vĩnh viễn!`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Vâng, xóa nó đi!',
                cancelButtonText: 'Hủy bỏ'
            });

            if (result.isConfirmed) {
                const token = localStorage.getItem('token');
                if (!token) {
                    Swal.fire('Lỗi!', 'Phiên đăng nhập đã hết hạn.', 'error');
                    return;
                }

                try {
                    const response = await fetch(`/api/products/${productId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const resultData = await response.json();

                    if (response.ok) {
                        await Swal.fire(
                            'Đã xóa!',
                            resultData.message || 'Sản phẩm đã được xóa thành công.',
                            'success'
                        );
                        // Tải lại trang để cập nhật danh sách
                        window.location.reload();
                    } else {
                        Swal.fire('Thất bại!', resultData.message || 'Không thể xóa sản phẩm.', 'error');
                    }
                } catch (error) {
                    Swal.fire('Lỗi kết nối!', 'Không thể kết nối đến server.', 'error');
                }
            }
        });
    }
});