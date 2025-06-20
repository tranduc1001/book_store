// File: /public/js/checkout.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    
    // Nếu chưa đăng nhập, không thể vào trang checkout
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const orderSummaryContainer = document.getElementById('order-summary');
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const totalElement = document.getElementById('total');
    const checkoutForm = document.getElementById('checkoutForm');
    const alertBox = document.getElementById('alertBox');

    let currentCart = null; // Biến để lưu thông tin giỏ hàng

    // Hàm để fetch và hiển thị tóm tắt đơn hàng
    async function fetchAndRenderSummary() {
        try {
            const response = await fetch('/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Không thể tải thông tin giỏ hàng.');
            
            const cart = await response.json();
            currentCart = cart; // Lưu lại giỏ hàng

            if (!cart.items || cart.items.length === 0) {
                // Nếu giỏ hàng trống, chuyển về trang giỏ hàng
                alert('Giỏ hàng của bạn đang trống.');
                window.location.href = '/cart';
                return;
            }

            renderSummary(cart);
        } catch (error) {
            console.error('Lỗi:', error);
            orderSummaryContainer.innerHTML = `<p class="text-danger">${error.message}</p>`;
        }
    }

    // Hàm để render giao diện tóm tắt
    function renderSummary(cart) {
        orderSummaryContainer.innerHTML = '';
        let subtotal = 0;
        const shipping = 30000; // Phí ship cố định

        cart.items.forEach(item => {
            const itemTotal = item.so_luong * item.product.gia_bia;
            subtotal += itemTotal;

            const summaryItemHTML = `
                <div class="d-flex justify-content-between">
                    <p class="mb-2">${item.product.ten_sach} (x${item.so_luong})</p>
                    <p class="mb-2">${itemTotal.toLocaleString('vi-VN')}đ</p>
                </div>
            `;
            orderSummaryContainer.innerHTML += summaryItemHTML;
        });

        subtotalElement.textContent = `${subtotal.toLocaleString('vi-VN')}đ`;
        shippingElement.textContent = `${shipping.toLocaleString('vi-VN')}đ`;
        totalElement.textContent = `${(subtotal + shipping).toLocaleString('vi-VN')}đ`;
    }

    // Lắng nghe sự kiện submit form thanh toán
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Lấy dữ liệu từ form
        const ten_nguoi_nhan = document.getElementById('ten_nguoi_nhan').value;
        const sdt_nguoi_nhan = document.getElementById('sdt_nguoi_nhan').value;
        const dia_chi_giao_hang = document.getElementById('dia_chi_giao_hang').value;
        const email_nguoi_nhan = document.getElementById('email_nguoi_nhan').value;
        const ghi_chu_khach_hang = document.getElementById('ghi_chu_khach_hang').value;
        const phuong_thuc_thanh_toan = document.querySelector('input[name="paymentMethod"]:checked').value;

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ten_nguoi_nhan,
                    sdt_nguoi_nhan,
                    dia_chi_giao_hang,
                    email_nguoi_nhan,
                    ghi_chu_khach_hang,
                    phuong_thuc_thanh_toan
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Đặt hàng thành công! Cảm ơn bạn đã mua hàng.');
                // Chuyển hướng đến trang lịch sử đơn hàng (sẽ tạo sau)
                window.location.href = '/my-orders'; 
            } else {
                alertBox.className = 'alert alert-danger';
                alertBox.textContent = data.message || 'Đặt hàng thất bại.';
                alertBox.style.display = 'block';
            }
        } catch (error) {
            console.error('Lỗi khi đặt hàng:', error);
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = 'Không thể kết nối đến server.';
            alertBox.style.display = 'block';
        }
    });

    // Chạy hàm fetch lần đầu
    fetchAndRenderSummary();
});