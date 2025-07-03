document.addEventListener('DOMContentLoaded', () => {

    // ====================================================================
    // ===================== KHAI BÁO CÁC BIẾN DOM =======================
    // ====================================================================
    const addReceiptModalEl = document.getElementById('addReceiptModal');

    // Nếu không có Modal trên trang này, không cần chạy code còn lại
    if (!addReceiptModalEl) {
        return;
    }

    const receiptForm = document.getElementById('receipt-form');
    const supplierNameInput = document.getElementById('supplier-name-input');
    const productSearchInput = document.getElementById('product-search');
    const searchResultsContainer = document.getElementById('product-search-results');
    const receiptItemsTbody = document.getElementById('receipt-items-tbody');
    const receiptItemTemplate = document.getElementById('receipt-item-template');
    const receiptTotalEl = document.getElementById('receipt-total');
    const emptyRow = document.getElementById('empty-receipt-row');

    let searchTimeout; // Biến để debounce việc tìm kiếm
    const token = localStorage.getItem('token'); // Lấy token để xác thực API


    // ====================================================================
    // ======================== CÁC HÀM TIỆN ÍCH ==========================
    // ====================================================================

    // Hàm định dạng số sang tiền tệ Việt Nam
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    // Hàm định dạng số có dấu chấm, ví dụ: 10000 -> "10.000"
    const formatNumberInput = (numStr) => {
        if (!numStr) return '0';
        // Loại bỏ hết các ký tự không phải số
        const num = numStr.toString().replace(/\D/g, '');
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    // Hàm chuyển chuỗi có dấu chấm về số, ví dụ: "10.000" -> 10000
    const parseFormattedNumber = (str) => {
        if (!str) return 0;
        return parseFloat(str.replace(/\./g, ''));
    };

    // Hàm cập nhật tổng tiền cho toàn bộ phiếu nhập
    const updateGrandTotal = () => {
        let grandTotal = 0;
        receiptItemsTbody.querySelectorAll('.receipt-item-row').forEach(row => {
            const thanhTienText = row.querySelector('.thanh-tien').textContent;
            // SỬA LẠI DÒNG NÀY: Xóa cả dấu chấm và ký tự tiền tệ
            const value = parseFloat(thanhTienText.replace(/[.₫\s]/g, '')) || 0;
            grandTotal += value;
    });
        receiptTotalEl.textContent = formatCurrency(grandTotal);

        if (emptyRow) {
            const hasItems = receiptItemsTbody.querySelector('.receipt-item-row');
            emptyRow.style.display = hasItems ? 'none' : 'table-row';
        }
    };
    
    // Hàm cập nhật thành tiền cho một dòng sản phẩm (đã nâng cấp)
    const updateRowTotal = (row) => {
        const giaNhapStr = row.querySelector('.gia-nhap').value;
        const giaNhap = parseFormattedNumber(giaNhapStr);
        
        const soLuong = parseInt(row.querySelector('.so-luong-nhap').value) || 0;
        const chietKhauPercent = parseFloat(row.querySelector('.chiet-khau-percent').value) || 0;

        // Tính số tiền chiết khấu thực tế từ %
        const tienChietKhau = giaNhap * (chietKhauPercent / 100);
        
        const thanhTien = (giaNhap - tienChietKhau) * soLuong;
        row.querySelector('.thanh-tien').textContent = formatCurrency(thanhTien > 0 ? thanhTien : 0);
        updateGrandTotal();
    };

    // Hàm thêm sản phẩm đã tìm được vào bảng chi tiết
    const addProductToTable = (product) => {
        if (receiptItemsTbody.querySelector(`.product-id[value="${product.id}"]`)) {
            Swal.fire('Sản phẩm đã tồn tại', 'Sản phẩm này đã có trong phiếu. Vui lòng tăng số lượng.', 'warning');
            return;
        }

        const newRowFragment = receiptItemTemplate.content.cloneNode(true);
        const newRowElement = newRowFragment.querySelector('.receipt-item-row');

        newRowElement.dataset.productId = product.id;
        newRowElement.querySelector('.product-id').value = product.id;
        newRowElement.querySelector('.product-id-text').textContent = product.id;
        newRowElement.querySelector('.product-name').textContent = product.ten_sach;
        newRowElement.querySelector('.product-img').src = product.img || '/images/placeholder.png';
        
        // 4. Lấy giá bìa từ đối tượng product
    const giaBia = parseFloat(product.gia_bia) || 0;
    
    // 5. Tự động điền giá bìa vào ô "Giá Nhập/SP" và định dạng nó
    // Dùng hàm formatNumberInput mà bạn đã có sẵn
    newRowElement.querySelector('.gia-nhap').value = formatNumberInput(giaBia); 

    // 6. Tự động điền số lượng mặc định là 10
    newRowElement.querySelector('.so-luong-nhap').value = 10;
    // ==========================================================

    // 7. Thêm dòng mới đã hoàn thiện vào bảng
    receiptItemsTbody.appendChild(newRowElement);

    // 8. Cập nhật lại tổng tiền cho dòng vừa thêm và toàn bộ phiếu
    updateRowTotal(newRowElement);

    // 9. Dọn dẹp ô tìm kiếm và đặt con trỏ vào ô số lượng để tiện sửa
    productSearchInput.value = '';
    searchResultsContainer.innerHTML = '';
    newRowElement.querySelector('.so-luong-nhap').focus(); 
    };


    // ====================================================================
    // ======================= GẮN CÁC SỰ KIỆN ===========================
    // ====================================================================

    // Sự kiện khi Modal được mở ra: Reset lại form
    addReceiptModalEl.addEventListener('show.bs.modal', () => {
        receiptForm.reset();
        receiptItemsTbody.innerHTML = '';
        updateGrandTotal();
    });

    // Sự kiện tìm kiếm sản phẩm (có debounce)
    productSearchInput.addEventListener('keyup', (e) => {
        clearTimeout(searchTimeout);
        const keyword = e.target.value.trim();
        if (keyword.length < 2) {
            searchResultsContainer.innerHTML = '';
            return;
        }
        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`/api/products?keyword=${keyword}&limit=5`, { headers: { 'Authorization': `Bearer ${token}` } });
                const result = await response.json();
                searchResultsContainer.innerHTML = '';
                if (result.products && result.products.length > 0) {
                    result.products.forEach(product => {
                        const item = document.createElement('a');
                        item.href = '#';
                        item.className = 'list-group-item list-group-item-action';
                        item.innerHTML = `
                            <div class="d-flex">
                                <img src="${product.img }" class="me-2" style="width: 30px; height: 45px; object-fit: cover;">
                                <div>[ID: ${product.id}] ${product.ten_sach}</div>
                            </div>
                        `;
                        item.addEventListener('click', (e) => { e.preventDefault(); addProductToTable(product); });
                        searchResultsContainer.appendChild(item);
                    });
                } else {
                    searchResultsContainer.innerHTML = '<span class="list-group-item disabled">Không tìm thấy sản phẩm</span>';
                }
            } catch (error) { console.error('Lỗi tìm kiếm sản phẩm:', error); }
        }, 300);
    });

    // Sự kiện khi người dùng nhập liệu vào bảng chi tiết
    receiptItemsTbody.addEventListener('input', e => {
        const target = e.target;
        const row = target.closest('.receipt-item-row');
        if (!row) return;

        // Xử lý định dạng cho ô Giá nhập
        if (target.matches('.gia-nhap')) {
            target.value = formatNumberInput(target.value);
        }

        // Khi thay đổi bất kỳ ô nào, tính toán lại
        if (target.matches('.so-luong-nhap, .gia-nhap, .chiet-khau-percent')) {
            updateRowTotal(row);
        }
    });

    // Sự kiện click để xóa một dòng sản phẩm
    receiptItemsTbody.addEventListener('click', e => {
        const deleteButton = e.target.closest('.delete-item-btn');
        if (deleteButton) {
            deleteButton.closest('.receipt-item-row').remove();
            updateGrandTotal();
        }
    });

    // Sự kiện submit form chính (đã nâng cấp)
    receiptForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const ten_nha_cung_cap = supplierNameInput.value.trim();
        const ghi_chu = document.getElementById('receipt-notes').value.trim();
        
        const items = Array.from(receiptItemsTbody.querySelectorAll('.receipt-item-row')).map(row => {
            const giaNhap = parseFormattedNumber(row.querySelector('.gia-nhap').value);
            const chietKhauPercent = parseFloat(row.querySelector('.chiet-khau-percent').value) || 0;
            const tienChietKhauThucTe = giaNhap * (chietKhauPercent / 100);

            return {
                product_id: row.querySelector('.product-id').value,
                so_luong_nhap: parseInt(row.querySelector('.so-luong-nhap').value),
                gia_nhap: giaNhap,
                chiet_khau: tienChietKhauThucTe
            };
        });

        if (!ten_nha_cung_cap) {
            return Swal.fire('Thiếu thông tin', 'Vui lòng nhập tên nhà cung cấp.', 'warning');
        }
        if (items.length === 0) {
            return Swal.fire('Chưa có sản phẩm', 'Vui lòng thêm ít nhất một sản phẩm vào phiếu nhập.', 'warning');
        }
        if (!token) {
             return Swal.fire('Lỗi xác thực', 'Không tìm thấy token. Vui lòng đăng nhập lại.', 'error');
        }

        try {
            const response = await fetch('/api/receipts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ten_nha_cung_cap, ghi_chu, items })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Có lỗi xảy ra từ server.');
            }

            bootstrap.Modal.getInstance(addReceiptModalEl).hide();
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Tạo phiếu nhập hàng thành công!',
                timer: 1500,
                showConfirmButton: false
            });
            window.location.reload();

        } catch (error) {
            Swal.fire('Thất bại!', error.message, 'error');
        }
    });
});