document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('promotions-table-body');
    const token = localStorage.getItem('token');

    // Hàm helper để định dạng ngày tháng
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Date(dateString).toLocaleDateString('vi-VN', options);
    };

    // Hàm gọi API để lấy và render danh sách
    const fetchAndRenderPromotions = async () => {
        try {
            const response = await fetch('/api/promotions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Không thể tải danh sách khuyến mãi.');
            }

            const promotions = await response.json();
            tableBody.innerHTML = ''; // Xóa dữ liệu cũ

            if (promotions.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có mã khuyến mãi nào.</td></tr>';
                return;
            }

            promotions.forEach(promo => {
    // Xử lý hiển thị giá trị cho đúng
    const displayValue = promo.loai_giam_gia === 'percentage'
        ? `${parseInt(promo.gia_tri_giam)}%` // Dùng parseInt để hiển thị 15% thay vì 15.00%
        : `${parseInt(promo.gia_tri_giam).toLocaleString('vi-VN')}đ`;

    // Xử lý hiển thị trạng thái với class của Bootstrap 5
    const statusBadge = `<span class="badge text-bg-${promo.trang_thai ? 'success' : 'secondary'}">${promo.trang_thai ? 'Hoạt động' : 'Đã tắt'}</span>`;

            const row = `
                <tr>
                    <td><strong>${promo.ma_khuyen_mai}</strong></td>
                    <td>${promo.mo_ta}</td>
                    <td>${displayValue}</td>
                    <td>${formatDate(promo.ngay_bat_dau)} - ${formatDate(promo.ngay_ket_thuc)}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <a href="/admin/promotions/edit/${promo.id}" class="btn btn-warning btn-sm" title="Sửa">
                            <i class="fas fa-edit"></i>
                        </a>
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${promo.id}" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
        } catch (error) {
            console.error(error);
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${error.message}</td></tr>`;
        }
    };

    // Lắng nghe sự kiện click trên các nút xóa
    tableBody.addEventListener('click', async (e) => {
        if (e.target.closest('.delete-btn')) {
            const button = e.target.closest('.delete-btn');
            const promoId = button.dataset.id;
            
            // Sử dụng SweetAlert2 để xác nhận
            Swal.fire({
                title: 'Bạn có chắc chắn?',
                text: "Bạn sẽ không thể hoàn tác hành động này!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Vâng, xóa nó!',
                cancelButtonText: 'Hủy'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetch(`/api/promotions/${promoId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(data.message || 'Xóa thất bại.');
                        }

                        Swal.fire('Đã xóa!', data.message, 'success');
                        fetchAndRenderPromotions(); // Tải lại danh sách

                    } catch (error) {
                        Swal.fire('Lỗi!', error.message, 'error');
                    }
                }
            });
        }
    });

    // Gọi hàm để tải dữ liệu lần đầu
    fetchAndRenderPromotions();
});