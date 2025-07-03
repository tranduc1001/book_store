// File: /public/js/admin-order-detail.js

const token = localStorage.getItem('token');

// Lắng nghe sự kiện submit của form
document.getElementById('updateStatusForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Ngăn form submit theo cách truyền thống

    // Lấy ID đơn hàng từ URL của trang
    const orderId = window.location.pathname.split('/').pop();
    // Lấy trạng thái mới mà admin đã chọn
    const newStatus = document.getElementById('orderStatus').value;

    Swal.fire({
        title: 'Xác nhận cập nhật',
        text: `Bạn có chắc muốn đổi trạng thái đơn hàng #${orderId}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Vâng, cập nhật!',
        cancelButtonText: 'Hủy'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/orders/${orderId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Có lỗi xảy ra.');
                }

                // Thông báo thành công và tải lại trang để thấy thay đổi
                await Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: data.message
                });
                
                window.location.reload(); // Tải lại trang

            } catch (error) {
                console.error('Lỗi khi cập nhật trạng thái:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Cập nhật thất bại',
                    text: error.message
                });
            }
        }
    });
});