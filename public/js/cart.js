// File: /public/js/cart.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    
    // Nếu chưa đăng nhập, chuyển hướng về trang login
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');

    // Hàm để fetch và hiển thị giỏ hàng
    async function fetchAndRenderCart() {
        try {
            const response = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) { // Token hết hạn hoặc không hợp lệ
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
                throw new Error('Không thể tải giỏ hàng.');
            }
            
            const cart = await response.json();
            renderCart(cart);

        } catch (error) {
            console.error('Lỗi:', error);
            cartItemsContainer.innerHTML = `<p class="text-danger">${error.message}</p>`;
        }
    }

    // Hàm để render giao diện giỏ hàng
    function renderCart(cart) {
        cartItemsContainer.innerHTML = ''; // Xóa nội dung cũ
        let cartTotal = 0;

        if (!cart.items || cart.items.length === 0) {
            cartItemsContainer.innerHTML = '<p>Giỏ hàng của bạn đang trống.</p>';
            cartTotalElement.textContent = '0đ';
            return;
        }

        cart.items.forEach(item => {
            const itemTotal = item.so_luong * item.product.gia_bia;
            cartTotal += itemTotal;

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
                        <input id="form1" min="1" name="quantity" value="${item.so_luong}" type="number"
                            class="form-control form-control-sm item-quantity" data-item-id="${item.id}" />
                    </div>
                    <div class="col-md-3 col-lg-2 col-xl-2 offset-lg-1">
                        <h6 class="mb-0">${itemTotal.toLocaleString('vi-VN')}đ</h6>
                    </div>
                    <div class="col-md-1 col-lg-1 col-xl-1 text-end">
                        <button class="btn btn-link text-muted remove-item-btn" data-item-id="${item.id}"><i class="fas fa-times"></i>Xóa</button>
                    </div>
                </div>
                <hr class="my-4">
            `;
            cartItemsContainer.innerHTML += cartItemHTML;
        });

        cartTotalElement.textContent = `${cartTotal.toLocaleString('vi-VN')}đ`;
        addEventListenersToCartItems();
    }

    // Hàm để gán sự kiện cho các nút trong giỏ hàng (cập nhật, xóa)
    function addEventListenersToCartItems() {
        // Sự kiện xóa sản phẩm
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const itemId = event.target.dataset.itemId;
                if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
                    await removeItemFromCart(itemId);
                }
            });
        });

        // Sự kiện cập nhật số lượng (khi thay đổi input)
        document.querySelectorAll('.item-quantity').forEach(input => {
            input.addEventListener('change', async (event) => {
                const itemId = event.target.dataset.itemId;
                const newQuantity = event.target.value;
                await updateCartItemQuantity(itemId, newQuantity);
            });
        });
    }

    // Hàm gọi API xóa sản phẩm
    async function removeItemFromCart(itemId) {
        try {
            const response = await fetch(`/api/cart/items/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchAndRenderCart(); // Tải lại giỏ hàng
            } else {
                alert('Xóa sản phẩm thất bại.');
            }
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm:', error);
        }
    }

    // Hàm gọi API cập nhật số lượng
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
                fetchAndRenderCart(); // Tải lại giỏ hàng
            } else {
                alert('Cập nhật số lượng thất bại.');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật số lượng:', error);
        }
    }

    // Chạy hàm fetch lần đầu khi trang được tải
    fetchAndRenderCart();
});

// Hàm thêm sản phẩm vào giỏ (có thể gọi từ trang sản phẩm hoặc trang chi tiết)
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
            alert('Đã thêm sản phẩm vào giỏ hàng!');
            // Có thể cập nhật icon giỏ hàng ở đây
        } else {
            const data = await response.json();
            alert(`Thêm thất bại: ${data.message}`);
        }
    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
    }
}