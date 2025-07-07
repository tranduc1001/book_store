// File: /public/js/checkout.js (Phiên bản nâng cấp)

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        // Nếu chưa đăng nhập, không cho vào trang này
        window.location.href = '/login?redirect=/checkout'; // Thêm redirect để sau khi đăng nhập quay lại
        return;
    }

    // === LẤY CÁC ELEMENT HTML ===
    const checkoutForm = document.getElementById('checkoutForm');
    const alertBox = document.getElementById('alertBox');
     
    // Form inputs
    const hoTenInput = document.getElementById('ten_nguoi_nhan');
    const emailInput = document.getElementById('email_nguoi_nhan');
    const sdtInput = document.getElementById('sdt_nguoi_nhan');
    //const diaChiInput = document.getElementById('dia_chi_giao_hang');

    // === CÁC ELEMENT MỚI CHO ĐỊA CHỈ ===
    const provinceSelect = document.getElementById('province');
    const districtSelect = document.getElementById('district');
    const wardSelect = document.getElementById('ward');
    const addressDetailInput = document.getElementById('address-detail');

    // Order summary elements
    const orderSummaryContainer = document.getElementById('order-summary');
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const totalElement = document.getElementById('total');

      // === PHẦN LOGIC XỬ LÝ ĐỊA CHỈ 3 CẤP (TỈNH - HUYỆN - XÃ) ===
    const apiHost = "/api/provinces";

    // Hàm gọi API
     async function callApi(endpoint) {
        try {
            // endpoint bây giờ sẽ là 'provinces', 'districts/1', 'wards/1'
            const response = await fetch(`/api/${endpoint}`); // <<< Sửa lại URL ở đây
            
            // Thêm kiểm tra nếu response không OK (ví dụ 404, 500) thì báo lỗi ngay
            if (!response.ok) {
                throw new Error(`Lỗi mạng: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            if (result.error === 0) {
                return result.data;
            }
            throw new Error(result.error_text || 'Lỗi không xác định từ API địa chỉ');
        } catch (error) {
            console.error("Lỗi gọi API địa chỉ:", error);
            return [];
        }
    }


    // Hàm render dữ liệu ra select
     function renderData(data, selectElement) {
        selectElement.innerHTML = `<option value="" selected disabled>Chọn...</option>`;
        if (!data || !Array.isArray(data)) return; // Kiểm tra data hợp lệ
        for (const item of data) {
            selectElement.innerHTML += `<option value="${item.id}">${item.full_name}</option>`;
        }
    }

    // Lấy và render danh sách Tỉnh/TP
    callApi('provinces').then(data => renderData(data, provinceSelect));

    // Bắt sự kiện khi chọn Tỉnh/TP
    provinceSelect.addEventListener('change', () => {
        districtSelect.disabled = false;
        wardSelect.disabled = true;
        wardSelect.innerHTML = '<option value="" selected disabled>Chọn Phường / Xã</option>';
        callApi(`provinces/districts/${provinceSelect.value}`).then(data => renderData(data, districtSelect)); // <<< Sửa lại endpoint
    });

    // Bắt sự kiện khi chọn Quận/Huyện
    districtSelect.addEventListener('change', () => {
        wardSelect.disabled = false;
        callApi(`provinces/wards/${districtSelect.value}`).then(data => renderData(data, wardSelect)); // <<< Sửa lại endpoint
    });

    /**
     * Tự động điền thông tin người dùng nếu đã có trong profile
     */
    async function prefillUserInfo() {
        try {
            const response = await fetch('/api/users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return; // Không làm gì nếu không lấy được profile
            
            const user = await response.json();
            hoTenInput.value = user.ho_ten || '';
            emailInput.value = user.email || '';
            sdtInput.value = user.phone || '';
            //diaChiInput.value = user.dia_chi || '';

        } catch (error) {
            console.error('Không thể tải thông tin người dùng:', error);
        }
    }

    /**
     * Lấy thông tin giỏ hàng và hiển thị tóm tắt đơn hàng
     */
    async function fetchAndRenderSummary() {
        try {
            const response = await fetch('/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Không thể tải thông tin giỏ hàng.');
            
            const cart = await response.json();

            if (!cart.items || cart.items.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'Giỏ hàng trống',
                    text: 'Giỏ hàng của bạn đang trống, hãy quay lại mua sắm nhé!',
                }).then(() => {
                    window.location.href = '/products';
                });
                return;
            }
            const discountAmount = parseFloat(sessionStorage.getItem('discountAmountApplied')) || 0;
            renderSummary(cart, discountAmount);
            
        } catch (error) {
            console.error('Lỗi:', error);
            orderSummaryContainer.innerHTML = `<p class="text-danger">${error.message}</p>`;
        }
    }

    /**
     * Render phần tóm tắt đơn hàng
     */
    function renderSummary(cart, discountAmount = 0) {
        orderSummaryContainer.innerHTML = ''; // Xóa chữ "Đang tải..."
        let subtotal = 0;
        const shipping = 30000;

        cart.items.forEach(item => {
            const itemTotal = item.so_luong * item.product.gia_bia;
            subtotal += itemTotal;

            const summaryItemHTML = `
                <div class="d-flex justify-content-between">
                    <p class="mb-2 small">${item.product.ten_sach} (x${item.so_luong})</p>
                    <p class="mb-2 small">${itemTotal.toLocaleString('vi-VN')}đ</p>
                </div>
            `;
            orderSummaryContainer.innerHTML += summaryItemHTML;
        });

        subtotalElement.textContent = `${subtotal.toLocaleString('vi-VN')}đ`;
        shippingElement.textContent = `${shipping.toLocaleString('vi-VN')}đ`;

        // Hiển thị dòng giảm giá nếu có
        const discountRowCheckout = document.getElementById('discount-row-checkout');
        const discountAmountCheckout = document.getElementById('discount-amount-checkout');
       if (discountAmount > 0) {
        discountAmountCheckout.textContent = `- ${discountAmount.toLocaleString('vi-VN')}đ`;
        discountRowCheckout.style.display = 'flex';
    } else {
        discountRowCheckout.style.display = 'none';
    }

    // <<< TÍNH LẠI TỔNG CỘNG CUỐI CÙNG >>>
    const finalTotal = subtotal + shipping - discountAmount;
    totalElement.textContent = `${finalTotal.toLocaleString('vi-VN')}đ`;
}
    /**
     * Lắng nghe sự kiện submit form thanh toán
     */
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const ten_nguoi_nhan = hoTenInput.value.trim();
        const sdt_nguoi_nhan = sdtInput.value.trim();
        const email_nguoi_nhan = emailInput.value.trim();
        const ghi_chu_khach_hang = document.getElementById('ghi_chu_khach_hang').value.trim();
        const provinceText = provinceSelect.options[provinceSelect.selectedIndex].text;
        const districtText = districtSelect.options[districtSelect.selectedIndex].text;
        const wardText = wardSelect.options[wardSelect.selectedIndex].text;
        const addressDetailValue = addressDetailInput.value.trim();

         if (!addressDetailValue || provinceSelect.value === "" || districtSelect.value === "" || wardSelect.value === "") {
            alert("Vui lòng điền đầy đủ thông tin địa chỉ.");
            return;
        }
        
        // Ghép thành một chuỗi duy nhất, ví dụ: "123 Đường ABC, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh"
        const dia_chi_giao_hang = `${addressDetailValue}, ${wardText}, ${districtText}, ${provinceText}`;
        const phuong_thuc_thanh_toan = document.querySelector('input[name="paymentMethod"]:checked').value;
        const ma_khuyen_mai = sessionStorage.getItem('promoCodeToCheckout') || null;


        // Vô hiệu hóa nút để tránh double-click
        const submitButton = checkoutForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';


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
                    phuong_thuc_thanh_toan,  
                    ma_khuyen_mai
                })
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.removeItem('promoCodeToCheckout');
                sessionStorage.removeItem('discountAmountApplied');
                 if (data.payUrl) {
                // Nếu server trả về payUrl (trường hợp thanh toán MoMo)
                // Chuyển hướng người dùng đến trang thanh toán của MoMo
                window.location.href = data.payUrl;
            } else {
                // Nếu không có payUrl (trường hợp COD)
                Swal.fire({
                    icon: 'success',
                    title: 'Đặt hàng thành công!',
                    text: 'Cảm ơn bạn đã mua hàng. Chúng tôi sẽ xử lý đơn hàng của bạn sớm nhất.',
                    allowOutsideClick: false,
                }).then(() => {
                    window.location.href = `/orders/${data.id}`; // Chuyển đến trang chi tiết đơn hàng vừa tạo
                });
            }
        } else {
                alertBox.className = 'alert alert-danger';
                alertBox.textContent = data.message || 'Đặt hàng thất bại. Vui lòng kiểm tra lại thông tin.';
                alertBox.style.display = 'block';
                // Kích hoạt lại nút submit
                submitButton.disabled = false;
                submitButton.textContent = 'Hoàn tất đặt hàng';
            }
        } catch (error) {
            console.error('Lỗi khi đặt hàng:', error);
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = 'Không thể kết nối đến server. Vui lòng thử lại sau.';
            alertBox.style.display = 'block';
            // Kích hoạt lại nút submit
            submitButton.disabled = false;
            submitButton.textContent = 'Hoàn tất đặt hàng';
        }
    });

    // === KHỞI CHẠY CÁC HÀM ===
    prefillUserInfo();
    fetchAndRenderSummary();
});