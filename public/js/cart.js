// Bắt đầu thực thi code sau khi toàn bộ cây DOM của trang đã được tải xong.
// Điều này đảm bảo tất cả các element HTML đã sẵn sàng để JavaScript thao tác.
document.addEventListener('DOMContentLoaded', () => {

    // Lấy token xác thực từ localStorage.
    const token = localStorage.getItem('token');
    
    // Nếu không có token, nghĩa là người dùng chưa đăng nhập.
    // Chuyển hướng họ về trang đăng nhập và dừng thực thi script.
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // === BƯỚC 1: LẤY CÁC ELEMENT HTML CẦN THIẾT ===
    const cartItemsContainer = document.getElementById('cart-items-container');
      if (!cartItemsContainer) {
        // Nếu không phải trang giỏ hàng, dừng thực thi ngay lập tức
        return; 
    }
    sessionStorage.removeItem('promoCodeToCheckout');
    sessionStorage.removeItem('discountAmountApplied');
    // Các element mới cho phần tóm tắt đơn hàng
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingFeeEl = document.getElementById('shipping-fee');
    const discountRow = document.getElementById('discount-row');
    const discountAmountEl = document.getElementById('discount-amount');
    const finalTotalEl = document.getElementById('final-total');
    // Các element cho phần khuyến mãi
    const applyBtn = document.getElementById('apply-promo-btn');
    const promoInput = document.getElementById('promo-code-input');
    const promoMessage = document.getElementById('promo-message');
    // <<< LẤY THÊM ELEMENT CHO CHỨC NĂNG HỦY >>>
    const promoTextMessage = document.getElementById('promo-text-message');
    const removePromoBtn = document.getElementById('remove-promo-btn');

    // Biến để lưu trữ trạng thái của giỏ hàng và khuyến mãi trên toàn trang.
    let currentCart = null;
    let currentDiscountAmount = 0; // Số tiền được giảm
    
    // Hàm helper để định dạng số thành chuỗi tiền tệ Việt Nam (vd: 50000 -> 50.000 ₫)
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };


    // === BƯỚC 2: CÁC HÀM XỬ LÝ GIAO DIỆN (RENDER) ===

    /**
     * Hàm này chịu trách nhiệm vẽ lại danh sách các sản phẩm trong giỏ hàng.
     * @param {Array} items - Mảng các sản phẩm từ API giỏ hàng.
     */
    function renderCartItems(items) {
        cartItemsContainer.innerHTML = ''; // Luôn xóa nội dung cũ trước khi vẽ lại.

         if (!items || items.length === 0) {
            cartItemsContainer.innerHTML = '<div class="text-center p-5"><p>Giỏ hàng của bạn đang trống.</p><a href="/products" class="btn btn-primary">Tiếp tục mua sắm</a></div>';
            return;
        }

        items.forEach(item => {
            const itemTotal = item.so_luong * item.product.gia_bia;
            const cartItemHTML = `
                <div class="row mb-4 d-flex justify-content-between align-items-center">
                    <div class="col-md-2 col-lg-2 col-xl-2">
                        <img src="${item.product.img || '/images/placeholder.png'}" class="img-fluid rounded-3" alt="${item.product.ten_sach}">
                    </div>
                    <div class="col-md-3 col-lg-3 col-xl-3">
                        <h6 class="text-muted">${item.product.ten_sach}</h6>
                        <h6 class="text-black mb-0">${parseFloat(item.product.gia_bia).toLocaleString('vi-VN')}đ</h6>
                    </div>
                    <div class="col-md-3 col-lg-3 col-xl-2 d-flex">
                        <input min="1" max="${item.product.so_luong_ton_kho}" value="${item.so_luong}" type="number"
                            class="form-control form-control-sm item-quantity" data-item-id="${item.id}" />
                    </div>
                    
                    <div class="col-md-3 col-lg-2 col-xl-2 offset-lg-1">
                        <h6 class="mb-0">${itemTotal.toLocaleString('vi-VN')}đ</h6>
                    </div>
                    <div class="col-md-1 col-lg-1 col-xl-1 text-end">
                        <button class="btn btn-link text-muted remove-item-btn" data-item-id="${item.id}"><i class="fas fa-times"></i> Xóa</button>
                    </div>
                </div>
                <hr class="my-4">
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', cartItemHTML);
        });
        
        // Sau khi vẽ xong, gắn lại các event listener cho các nút vừa tạo.
        addEventListenersToCartItems();
    }

    /**
     * Hàm này chịu trách nhiệm cập nhật lại toàn bộ phần "Tóm tắt đơn hàng".
     * Nó sẽ được gọi mỗi khi có thay đổi trong giỏ hàng hoặc áp dụng khuyến mãi.
     */
    function updateOrderSummary() {
        if (!currentCart || !currentCart.items|| currentCart.items.length === 0)  {
            // Nếu không có giỏ hàng, reset mọi thứ về 0.
            subtotalEl.textContent = formatCurrency(0);
            shippingFeeEl.textContent = formatCurrency(0);
            finalTotalEl.textContent = formatCurrency(0);
            discountRow.style.display = 'none';
            return;
        }
        
        // Tính toán các giá trị
        const subtotal = currentCart.items.reduce((sum, item) => sum + (item.so_luong * item.product.gia_bia), 0);
        const shippingFee = (subtotal > 0) ? 30000 : 0; // Chỉ tính phí ship khi có hàng.

        // Cập nhật giao diện
        subtotalEl.textContent = formatCurrency(subtotal);
        shippingFeeEl.textContent = formatCurrency(shippingFee);

        // Xử lý hiển thị dòng giảm giá
        if (currentDiscountAmount > 0) {
            discountAmountEl.textContent = `- ${formatCurrency(currentDiscountAmount)}`;
            discountRow.style.display = 'flex'; // Hiện dòng giảm giá
        } else {
            discountRow.style.display = 'none'; // Ẩn dòng giảm giá
        }
        
        // Tính tổng tiền cuối cùng và đảm bảo không bị âm
        const finalTotal = subtotal - currentDiscountAmount + shippingFee;
        finalTotalEl.textContent = formatCurrency(finalTotal > 0 ? finalTotal : 0);
    }

    // === BƯỚC 3: CÁC HÀM GỌI API (TƯƠNG TÁC VỚI SERVER) ===

    /**
     * Hàm chính: Lấy dữ liệu giỏ hàng từ server và khởi chạy quá trình render.
     */
    async function fetchAndRenderCart() {
        try {
            const response = await fetch('/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401) { // Xử lý trường hợp token hết hạn
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
                throw new Error('Không thể tải giỏ hàng từ server.');
            }
            
            const cartData = await response.json();
            currentCart = cartData; // Lưu lại dữ liệu giỏ hàng
            
            renderCartItems(currentCart.items);
            updateOrderSummary();

        } catch (error) {
            console.error('Lỗi khi fetch giỏ hàng:', error);
            cartItemsContainer.innerHTML = `<p class="text-center text-danger">${error.message}</p>`;
        }
    }

    /**
     * Gọi API để xóa một sản phẩm khỏi giỏ hàng.
     * @param {string|number} itemId - ID của sản phẩm trong giỏ hàng.
     */
    async function removeItemFromCart(itemId) {
        try {
            const response = await fetch(`/api/cart/items/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchAndRenderCart(); // Tải lại toàn bộ giỏ hàng để cập nhật
            } else {
                alert('Xóa sản phẩm thất bại. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Lỗi API khi xóa sản phẩm:', error);
        }
    }

    /**
     * Gọi API để cập nhật số lượng của một sản phẩm.
     * @param {string|number} itemId - ID của sản phẩm.
     * @param {number} quantity - Số lượng mới.
     */
    async function updateCartItemQuantity(itemId, quantity) {
        try {
            const response = await fetch(`/api/cart/items/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ soLuong: quantity })
            });
            if (response.ok) {
                fetchAndRenderCart(); // Tải lại toàn bộ giỏ hàng
            } else {
                alert('Cập nhật số lượng thất bại. Vui lòng thử lại.');
                fetchAndRenderCart(); // Tải lại để trả về số lượng cũ
            }
        } catch (error) {
            console.error('Lỗi API khi cập nhật số lượng:', error);
        }
    }


    // === BƯỚC 4: GẮN CÁC BỘ LẮNG NGHE SỰ KIỆN (EVENT LISTENERS) ===

    /**
     * Gắn các sự kiện 'click' và 'change' cho các nút trong giỏ hàng.
     * Hàm này phải được gọi lại mỗi khi giỏ hàng được render.
     */
    function addEventListenersToCartItems() {
        // Gắn sự kiện cho tất cả các nút "Xóa"
        document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', (event) => {
        const buttonElement = event.target.closest('button');
        const itemId = buttonElement.dataset.itemId;

        // SỬ DỤNG SWEETALERT2 ĐỂ THAY THẾ CONFIRM
        Swal.fire({
            title: 'Bạn chắc chắn?',
            text: "Bạn sẽ không thể hoàn tác hành động này!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33', // Màu đỏ cho nút xóa
            cancelButtonColor: '#3085d6', // Màu xanh cho nút hủy
            confirmButtonText: 'Vâng, xóa nó!',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            // Nếu người dùng nhấn vào nút "Vâng, xóa nó!"
            if (result.isConfirmed) {
                // Gọi hàm để xóa sản phẩm
                removeItemFromCart(itemId);
            }
        })
    });
});


        // Gắn sự kiện cho tất cả các ô input số lượng
        document.querySelectorAll('.item-quantity').forEach(input => {
            input.addEventListener('change', (event) => {
                const itemId = event.target.dataset.itemId;
                const newQuantity = parseInt(event.target.value, 10);
                if (newQuantity > 0) {
                    updateCartItemQuantity(itemId, newQuantity);
                }
            });
        });
    }

    // Gắn sự kiện cho nút "Áp dụng" mã khuyến mãi
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            const promoCode = promoInput.value.trim().toUpperCase();
            if (!promoCode) {
                promoTextMessage.textContent = 'Vui lòng nhập mã khuyến mãi.'; 
                promoMessage.className = 'mt-2 small d-flex align-items-center text-danger';
                removePromoBtn.style.display = 'none';
                return;
            }
    if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
                promoTextMessage.textContent = 'Giỏ hàng của bạn đang trống để áp dụng mã.'; // Sửa lại thông báo lỗi
                promoMessage.className = 'mt-2 small d-flex align-items-center text-danger';
                return;
    }
        // Tính toán tổng tiền hàng ngay tại thời điểm áp dụng
        const cartSubtotal = currentCart.items.reduce((sum, item) => sum + (item.so_luong * item.product.gia_bia), 0);

            // Vô hiệu hóa nút và hiển thị spinner để người dùng biết đang xử lý
            applyBtn.disabled = true;
            applyBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

            try {
                const response = await fetch('/api/promotions/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ 
                    ma_khuyen_mai: promoCode,
                    currentSubtotal: cartSubtotal 
                })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Có lỗi không xác định.');

                // XỬ LÝ KHI ÁP DỤNG THÀNH CÔNG
                promoTextMessage.textContent = result.message;
                promoMessage.className = 'mt-2 small d-flex align-items-center text-success';
                removePromoBtn.style.display = 'inline'; // HIỆN NÚT HỦY

                currentDiscountAmount = result.discountAmount; // Lưu lại số tiền được giảm
                sessionStorage.setItem('discountAmountApplied', currentDiscountAmount);
                updateOrderSummary(); // Cập nhật lại toàn bộ phần tóm tắt

            } catch (error) {
                // XỬ LÝ KHI ÁP DỤNG THẤT BẠI
                promoTextMessage.textContent = error.message;
                promoMessage.className = 'mt-2 small d-flex align-items-center text-danger';
                removePromoBtn.style.display = 'none'; // ẨN NÚT HỦY
                
                currentDiscountAmount = 0;
                sessionStorage.removeItem('discountAmountApplied');
                updateOrderSummary();
            } finally {
                // Luôn kích hoạt lại nút sau khi xử lý xong, dù thành công hay thất bại
                applyBtn.disabled = false;
                applyBtn.innerHTML = 'Áp dụng';
            }
        });
    }
 // <<< THÊM SỰ KIỆN CLICK CHO NÚT HỦY MỚI >>>
    if (removePromoBtn) {
        removePromoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // 1. Reset các biến và ô input
            promoInput.value = '';
            currentDiscountAmount = 0;
            // 2. Xóa thông báo và ẩn nút Hủy
            promoTextMessage.textContent = '';
            promoMessage.className = 'mt-2 small d-flex align-items-center';
            removePromoBtn.style.display = 'none';
            // 3. Xóa dữ liệu khuyến mãi khỏi sessionStorage
            sessionStorage.removeItem('promoCodeToCheckout');
            sessionStorage.removeItem('discountAmountApplied');
            // 4. Cập nhật lại giao diện
            updateOrderSummary();
        });
    }
    const checkoutButton = document.querySelector('a[href="/checkout"]');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', (e) => {
            const promoCode = promoInput.value.trim().toUpperCase();
            if (promoCode && currentDiscountAmount > 0) { // Thêm điều kiện: phải có giảm giá thực tế
                sessionStorage.setItem('promoCodeToCheckout', promoCode);
                // Số tiền giảm đã được lưu khi nhấn "Áp dụng", không cần lưu lại ở đây
            } else {
                // Nếu không có mã hoặc mã không hợp lệ, xóa sạch
                sessionStorage.removeItem('promoCodeToCheckout');
                sessionStorage.removeItem('discountAmountApplied');
            }
        });
    }

    const promoModal = document.getElementById('promo-modal');
    if (promoModal) {
    const promoListContainer = document.getElementById('promo-list-container');
    const selectPromoBtn = document.getElementById('select-promo-btn');
    const promoCodeInput = document.getElementById('promo-code-input');
    const applyPromoBtn = document.getElementById('apply-promo-btn');
     const token = localStorage.getItem('token');
    // Biến để lưu mã KM đang được chọn trong modal
    let selectedPromoCode = null;

    // Sự kiện được kích hoạt ngay khi modal bắt đầu mở ra
    promoModal.addEventListener('show.bs.modal', async () => {
        // Reset trạng thái
        selectedPromoCode = null;
        promoListContainer.innerHTML = '<p class="text-center">Đang tìm các ưu đãi tốt nhất...</p>';
        
        // Lấy tổng tiền tạm tính hiện tại của giỏ hàng
        const subtotalText = document.getElementById('cart-subtotal').textContent;
        const subtotal = parseFloat(subtotalText.replace(/[^0-9]/g, ''));
        
        try {
            // Gọi API mới để lấy các mã KM hợp lệ
            const response = await fetch(`/api/promotions/available?subtotal=${subtotal}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Không thể tải ưu đãi.');
            
            const promos = await response.json();
            
            // Render danh sách KM vào modal
            promoListContainer.innerHTML = '';
            if (promos.length === 0) {
                promoListContainer.innerHTML = '<p class="text-center text-muted">Rất tiếc, chưa có ưu đãi nào phù hợp cho giỏ hàng của bạn.</p>';
                return;
            }

            promos.forEach(promo => {
                const discountText = promo.loai_giam_gia === 'percentage'
                    ? `Giảm ${parseInt(promo.gia_tri_giam)}%`
                    : `Giảm ${parseInt(promo.gia_tri_giam).toLocaleString('vi-VN')}đ`;

                // Tạo từng item khuyến mãi
                const promoItemHTML = `
                    <div class="promo-item border rounded p-3 mb-2" style="cursor: pointer;" data-code="${promo.ma_khuyen_mai}">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1 text-success">${discountText}</h6>
                                <small class="text-muted d-block">${promo.mo_ta}</small>
                            </div>
                            <i class="far fa-circle promo-check-icon fs-4 text-muted"></i>
                        </div>
                    </div>
                `;
                promoListContainer.insertAdjacentHTML('beforeend', promoItemHTML);
            });

        } catch (error) {
            promoListContainer.innerHTML = `<p class="text-center text-danger">${error.message}</p>`;
        }
    });

    // Xử lý sự kiện khi click chọn một mã KM trong modal
    promoListContainer.addEventListener('click', (e) => {
        const selectedItem = e.target.closest('.promo-item');
        if (!selectedItem) return;

        // Bỏ chọn tất cả các item khác (reset giao diện)
        document.querySelectorAll('.promo-item').forEach(item => {
            item.classList.remove('border-primary', 'bg-light');
            item.querySelector('.promo-check-icon').className = 'far fa-circle promo-check-icon fs-4 text-muted';
        });

        // Đánh dấu item được chọn
        selectedItem.classList.add('border-primary', 'bg-light');
        selectedItem.querySelector('.promo-check-icon').className = 'fas fa-check-circle promo-check-icon fs-4 text-primary';
        
        // Lưu lại mã đã chọn
        selectedPromoCode = selectedItem.dataset.code;
    });

    // Xử lý sự kiện khi nhấn nút "Áp dụng mã đã chọn"
    selectPromoBtn.addEventListener('click', () => {
        if (selectedPromoCode) {
            // Điền mã đã chọn vào ô input
            promoCodeInput.value = selectedPromoCode;
            // Tự động nhấn nút "Áp dụng" để tái sử dụng logic có sẵn
            applyPromoBtn.click();
        }
        // Đóng modal
        const modalInstance = bootstrap.Modal.getInstance(promoModal);
        modalInstance.hide();
    });
}

    // === BƯỚC 5: KHỞI CHẠY ===
    // Gọi hàm này lần đầu tiên để tải và hiển thị giỏ hàng khi người dùng truy cập trang.
    fetchAndRenderCart();
});


// Hàm này có thể được gọi từ các trang khác (ví dụ: trang chi tiết sản phẩm)
// nên nó được đặt bên ngoài 'DOMContentLoaded'.
async function addToCart(productId, quantity = 1) {
    const token = localStorage.getItem('token');
    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Vui lòng đăng nhập',
            text: 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.',
            showCancelButton: true,
            confirmButtonText: 'Đăng nhập ngay',
            cancelButtonText: 'Để sau'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/login';
            }
        });
        return;
    }

    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId: productId, soLuong: quantity })
        });

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Đã thêm sản phẩm vào giỏ hàng.',
                showConfirmButton: false,
                timer: 1500,
                toast: true,
                position: 'top-end'
            });
        } else {
            const data = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Thất bại...',
                text: data.message || 'Không thể thêm sản phẩm vào giỏ hàng.'
            });
        }
    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi kết nối',
            text: 'Không thể kết nối đến máy chủ.'
        });
    }
}