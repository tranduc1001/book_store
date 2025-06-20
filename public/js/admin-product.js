// File: /public/js/admin-product.js

document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');

    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Thu thập dữ liệu từ form
        const formData = new FormData(productForm);
        const productData = Object.fromEntries(formData.entries());
        
        // Lấy token của admin từ localStorage (giả định admin đã đăng nhập)
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Bạn không có quyền thực hiện hành động này. Vui lòng đăng nhập lại.');
            window.location.href = '/login';
            return;
        }

        // Xác định xem đây là hành động THÊM hay SỬA
        const urlParams = new URLSearchParams(window.location.search);
        const pathParts = window.location.pathname.split('/');
        const productId = pathParts[pathParts.length - 1];
        const isEdit = pathParts[pathParts.length - 2] === 'edit';
        
        const method = isEdit ? 'PUT' : 'POST';
        const apiUrl = isEdit ? `/api/products/${productId}` : '/api/products';

        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });

            const result = await response.json();

            if (response.ok) {
                alert(`Thao tác thành công!`);
                window.location.href = '/admin/products'; // Chuyển về trang danh sách
            } else {
                alert(`Lỗi: ${result.message || 'Có lỗi xảy ra'}`);
            }
        } catch (error) {
            console.error('Lỗi khi submit form sản phẩm:', error);
            alert('Không thể kết nối đến server.');
        }
    });
});