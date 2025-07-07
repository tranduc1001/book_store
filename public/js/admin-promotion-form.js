document.addEventListener('DOMContentLoaded', () => {

    /**
     * Hàm helper để lấy và parse dữ liệu JSON từ một thẻ script.
     * @param {string} id - ID của thẻ script chứa dữ liệu.
     * @returns {object|null} - Đối tượng JSON đã được parse, hoặc null nếu có lỗi.
     */
    const getJsonData = (id) => {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`Lỗi: Không tìm thấy element dữ liệu với id: #${id}`);
            return null;
        }
        try {
            // Lấy nội dung text bên trong thẻ script và chuyển thành đối tượng JavaScript
            return JSON.parse(element.textContent);
        } catch (e) {
            console.error(`Lỗi khi parse JSON từ element #${id}:`, e);
            return null;
        }
    };

    // === LẤY DỮ LIỆU BAN ĐẦU TỪ CÁC THẺ SCRIPT ===
    const productsData = getJsonData('products-data');
    const categoriesData = getJsonData('categories-data');
    const promotionData = getJsonData('promotion-data');

    // Nếu có lỗi nghiêm trọng khi lấy dữ liệu, dừng toàn bộ script
    if (productsData === null || categoriesData === null) {
        alert('Lỗi nghiêm trọng khi tải dữ liệu trang. Vui lòng làm mới lại trang.');
        return;
    }

    // === KHAI BÁO BIẾN VÀ LẤY CÁC ELEMENT CỦA FORM ===
    const token = localStorage.getItem('token');
    const form = document.getElementById('promotion-form');
    const phamViSelect = document.getElementById('pham_vi_ap_dung');
    const applicableListContainer = document.getElementById('applicable-list-container');
    const applicableListSelect = document.getElementById('danh_sach_id_ap_dung');
    
    // Kiểm tra các element quan trọng có tồn tại không
    if (!form || !phamViSelect || !applicableListContainer || !applicableListSelect) {
        console.error('Một hoặc nhiều element quan trọng của form không được tìm thấy trên trang.');
        return;
    }

    // Khởi tạo thư viện Select2 cho dropdown
    if (typeof $ !== 'undefined') {
        $(applicableListSelect).select2({
            placeholder: "Chọn các mục áp dụng...",
            allowClear: true,
            width: '100%'
        });
    } else {
        console.error('Thư viện jQuery chưa được tải, Select2 sẽ không hoạt động.');
    }
      const cleaveOptions = {
        numeral: true,
        numeralThousandsGroupStyle: 'thousand',
        numeralDecimalScale: 0,
    };

    const cleaveGiaTri = new Cleave('#gia_tri_giam', cleaveOptions);
    const cleaveGiamToiDa = new Cleave('#giam_toi_da', cleaveOptions);
    const cleaveDieuKien = new Cleave('#dieu_kien_don_hang_toi_thieu', cleaveOptions);
    // === CÁC HÀM XỬ LÝ LOGIC ===

    /**
     * Cập nhật danh sách lựa chọn (products/categories) cho dropdown Select2
     * dựa trên phạm vi áp dụng được chọn.
     * @param {string} scope - Phạm vi được chọn ('all', 'category', 'product').
     */
    const updateApplicableList = (scope) => {
        $(applicableListSelect).empty(); // Xóa các lựa chọn cũ
        
        let optionsData = [];
        if (scope === 'category') {
            optionsData = categoriesData.map(cat => ({ id: cat.id, text: cat.ten_danh_muc }));
        } else if (scope === 'product') {
            optionsData = productsData.map(prod => ({ id: prod.id, text: prod.ten_sach }));
        }

        // Cập nhật lại data và placeholder cho Select2
        $(applicableListSelect).select2({
            data: optionsData,
            placeholder: `Chọn ${scope === 'category' ? 'danh mục' : 'sản phẩm'}...`,
            width: '100%'
        });

        // Hiển thị hoặc ẩn container chứa dropdown
        applicableListContainer.style.display = (scope === 'all') ? 'none' : 'block';
    };

    /**
     * Điền dữ liệu có sẵn của khuyến mãi vào form (cho trường hợp "Sửa").
     */
    const populateForm = () => {
        if (promotionData) {
            // Cập nhật dropdown dựa trên phạm vi đã lưu
            updateApplicableList(promotionData.pham_vi_ap_dung);

            // Chọn lại các giá trị đã lưu trong dropdown Select2
            if (promotionData.danh_sach_id_ap_dung) {
                const selectedIds = promotionData.danh_sach_id_ap_dung.split(',');
                $(applicableListSelect).val(selectedIds).trigger('change');
            }
        } else {
            // Nếu là form "Thêm mới", mặc định là 'all' và ẩn dropdown
            updateApplicableList('all');
        }
    };
    
    // === LẮNG NGHE CÁC SỰ KIỆN ===

    // Sự kiện khi người dùng thay đổi "Phạm vi áp dụng"
    phamViSelect.addEventListener('change', (e) => {
        updateApplicableList(e.target.value);
    });

    // Sự kiện khi người dùng submit form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const promotionId = form.dataset.promotionId;
        const selectedApplicableIds = $(applicableListSelect).val() || [];
        
        // Tạo đối tượng FormData để gửi lên API
        const formData = {
            ma_khuyen_mai: document.getElementById('ma_khuyen_mai').value.trim().toUpperCase(),
            mo_ta: document.getElementById('mo_ta').value,
            loai_giam_gia: document.getElementById('loai_giam_gia').value,
            gia_tri_giam: cleaveGiaTri.getRawValue(),
            giam_toi_da: cleaveGiamToiDa.getRawValue() || null,
            pham_vi_ap_dung: phamViSelect.value,
            danh_sach_id_ap_dung: selectedApplicableIds.join(','),
            dieu_kien_don_hang_toi_thieu: cleaveDieuKien.getRawValue() || 0,
            so_luong_gioi_han: document.getElementById('so_luong_gioi_han').value || null,
            ngay_bat_dau: document.getElementById('ngay_bat_dau').value,
            ngay_ket_thuc: document.getElementById('ngay_ket_thuc').value,
            trang_thai: document.getElementById('trang_thai').checked
        };

        const method = promotionId ? 'PUT' : 'POST';
        const url = promotionId ? `/api/promotions/${promotionId}` : '/api/promotions';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Có lỗi xảy ra, vui lòng thử lại.');

            await Swal.fire('Thành công!', `Đã ${promotionId ? 'cập nhật' : 'tạo mới'} khuyến mãi thành công!`, 'success');
            window.location.href = '/admin/promotions';

        } catch (error) {
            Swal.fire('Thất bại!', error.message, 'error');
        }
    });

    // === KHỞI TẠO FORM KHI TRANG ĐƯỢC TẢI ===
    populateForm();
});