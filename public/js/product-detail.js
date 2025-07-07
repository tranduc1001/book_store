// File: /public/js/product-detail.js
document.addEventListener('DOMContentLoaded', function () {
    const minusBtn = document.getElementById('button-minus');
    const plusBtn = document.getElementById('button-plus');
    const quantityInput = document.getElementById('quantity-input');
    
    // Xử lý khi nhấn nút trừ
    if (minusBtn) {
        minusBtn.addEventListener('click', function () {
            let currentValue = parseInt(quantityInput.value, 10);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });
    }

    // Xử lý khi nhấn nút cộng
    if (plusBtn) {
        plusBtn.addEventListener('click', function () {
            let currentValue = parseInt(quantityInput.value, 10);
            const maxQuantity = parseInt(quantityInput.max, 10);
            if (currentValue < maxQuantity) {
                quantityInput.value = currentValue + 1;
            } else {
                // Có thể thêm thông báo cho người dùng ở đây
                alert('Số lượng đã đạt tối đa trong kho.');
            }
        });
    }

    // Ngăn người dùng nhập số âm hoặc lớn hơn max
    if (quantityInput) {
        quantityInput.addEventListener('change', function() {
            let value = parseInt(this.value, 10);
            const min = parseInt(this.min, 10);
            const max = parseInt(this.max, 10);
            if (isNaN(value) || value < min) {
                this.value = min;
            } else if (value > max) {
                this.value = max;
            }
        });
    }
     // === XỬ LÝ FORM ĐÁNH GIÁ ===
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Vui lòng đăng nhập', 'Bạn cần đăng nhập để gửi đánh giá.', 'warning');
                return;
            }

            // Lấy dữ liệu từ form
            const rating = document.querySelector('input[name="rating"]:checked')?.value;
            const comment = document.getElementById('review-comment').value.trim();
            const productId = window.location.pathname.split('/').pop();

            if (!rating && !comment) {
                alert('Vui lòng chọn số sao hoặc viết nhận xét.');
                return;
            }
            
            const submitButton = reviewForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Đang gửi...';

            try {
                const response = await fetch(`/api/products/${productId}/reviews`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ rating, comment })
                });

                const result = await response.json();
                const reviewAlert = document.getElementById('review-alert');

                if (response.ok) {
                    reviewAlert.className = 'alert alert-success';
                    reviewAlert.textContent = 'Cảm ơn bạn đã gửi đánh giá!';
                    reviewForm.reset();
                    // Có thể thêm logic để hiển thị review mới ngay lập tức mà không cần tải lại trang
                } else {
                    reviewAlert.className = 'alert alert-danger';
                    reviewAlert.textContent = result.message || 'Gửi đánh giá thất bại.';
                }
                reviewAlert.style.display = 'block';

            } catch (error) {
                console.error('Lỗi khi gửi đánh giá:', error);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Gửi đánh giá';
            }
        });
    }
});
