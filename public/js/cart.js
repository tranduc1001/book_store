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
    
    // Các element mới cho phần tóm tắt đơn hàng
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingFeeEl = document.getElementById('shipping-fee');
    const discountRow = document.getElementById('discount-row');
    const discountAmountEl = document.getElementById('discount-amount');
    const finalTotalEl = document.getElementById('final-total');
    const applyBtn = document.getElementById('apply-promo-btn');
    const promoInput = document.getElementById('promo-code-input');
    const promoMessage = document.getElementById('promo-message');

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
            cartItemsContainer.innerHTML = '<p class="text-center">Giỏ hàng của bạn đang trống.</p>';
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
        if (!currentCart || !currentCart.items) {
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
                if (confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
                    removeItemFromCart(itemId);
                }
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
                promoMessage.textContent = 'Vui lòng nhập mã khuyến mãi.';
                promoMessage.className = 'mt-2 text-danger small';
                return;
            }
    if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
            promoMessage.textContent = 'Giỏ hàng của bạn đang trống để áp dụng mã.';
            promoMessage.className = 'mt-2 text-danger small';
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
                promoMessage.textContent = result.message;
                promoMessage.className = 'mt-2 text-success small';
                currentDiscountAmount = result.discountAmount; // Lưu lại số tiền được giảm
                updateOrderSummary(); // Cập nhật lại toàn bộ phần tóm tắt

            } catch (error) {
                // XỬ LÝ KHI ÁP DỤNG THẤT BẠI
                promoMessage.textContent = error.message;
                promoMessage.className = 'mt-2 text-danger small';
                currentDiscountAmount = 0; // Reset số tiền giảm về 0
                updateOrderSummary(); // Cập nhật lại phần tóm tắt để xóa giảm giá cũ
            } finally {
                // Luôn kích hoạt lại nút sau khi xử lý xong, dù thành công hay thất bại
                applyBtn.disabled = false;
                applyBtn.innerHTML = 'Áp dụng';
            }
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
        alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
        window.location.href = '/login';
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
                timer: 1500
            });
            // Tùy chọn: cập nhật số lượng trên icon giỏ hàng ở header
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
    }
}