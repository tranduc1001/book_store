document.addEventListener('DOMContentLoaded', () => {
    // === LẤY CÁC ELEMENT TỪ DOM ===
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/login'; // Chuyển hướng nếu không có token
        return;
    }

    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const filterBtn = document.getElementById('filter-btn');
    const chartTitleEl = document.getElementById('chart-title');
    const topProductsBody = document.getElementById('top-products-body');
    const topCustomersBody = document.getElementById('top-customers-body');

    // Biến để lưu trữ instance của biểu đồ
    let revenueChartInstance = null;

    // === CÁC HÀM HELPER ===
    const formatCurrency = (amount) => {
        if (typeof amount !== 'number' && typeof amount !== 'string') return '0 ₫';
        const numberAmount = parseFloat(amount);
        if (isNaN(numberAmount)) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numberAmount);
    };

    const showLoadingState = () => {
        if (filterBtn) {
            filterBtn.disabled = true;
            filterBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang tải...';
        }
        const loadingRow = '<tr><td colspan="3" class="text-center">Đang tải...</td></tr>';
        if (topProductsBody) topProductsBody.innerHTML = loadingRow;
        if (topCustomersBody) topCustomersBody.innerHTML = loadingRow;
    };

    const hideLoadingState = () => {
        if (filterBtn) {
            filterBtn.disabled = false;
            filterBtn.innerHTML = '<i class="fas fa-filter mr-2"></i>Lọc';
        }
    };

    // === CÁC HÀM RENDER GIAO DIỆN ===
    const renderRevenueChart = (revenueData, startDateStr, endDateStr) => {
        if (revenueChartInstance) {
            revenueChartInstance.destroy();
        }

        const canvas = document.getElementById('revenue-chart');
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        if (chartTitleEl) chartTitleEl.textContent = "Biểu đồ doanh thu";

        if (!revenueData || revenueData.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = "16px Arial";
            ctx.fillStyle = "#858796";
            ctx.textAlign = "center";
            ctx.fillText("Không có dữ liệu doanh thu trong khoảng thời gian này.", canvas.width / 2, canvas.height / 2);
            return;
        }

         const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const labels = [];
    const data = [];
    const monthlyDataMap = new Map(); // Dùng Map để truy cập nhanh

    // Đưa dữ liệu từ API vào Map với key là "năm-tháng"
    revenueData.forEach(item => {
        const key = `${item.year}-${item.month}`;
        monthlyDataMap.set(key, parseFloat(item.total));
    });

    // Lặp qua từng tháng trong khoảng thời gian đã chọn
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // getMonth() trả về 0-11
        const key = `${year}-${month}`;

        // Thêm nhãn "Tháng X/YYYY" vào mảng labels
        labels.push(`Tháng ${month}/${year}`);

        // Lấy dữ liệu từ Map, nếu không có thì mặc định là 0
        data.push(monthlyDataMap.get(key) || 0);
        
        // Chuyển sang tháng tiếp theo
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
        
        revenueChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: "Doanh thu",
                    data: data,
                    backgroundColor: 'rgba(78, 115, 223, 0.8)',
                    borderColor: 'rgba(78, 115, 223, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: (value) => formatCurrency(value) }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (tooltipItems) => `Doanh thu ${tooltipItems[0].label}`,
                            label: (context) => formatCurrency(context.parsed.y)
                        }
                    }
                }
            }
        });
    };
    
    const renderTopProducts = (products) => {
        if (!topProductsBody) return;
        topProductsBody.innerHTML = '';
        if (!products || products.length === 0) {
            topProductsBody.innerHTML = '<tr><td colspan="3" class="text-center">Không có dữ liệu.</td></tr>';
            return;
        }
        products.forEach((item, index) => {
            const row = `
                <tr>
                    <td><strong>${index + 1}</strong></td>
                    <td>${item.product.ten_sach}</td>
                    <td class="text-right font-weight-bold">${item.total_sold}</td>
                </tr>
            `;
            topProductsBody.insertAdjacentHTML('beforeend', row);
        });
    };

    const renderTopCustomers = (customers) => {
        if (!topCustomersBody) return;
        topCustomersBody.innerHTML = '';
        if (!customers || customers.length === 0) {
            topCustomersBody.innerHTML = '<tr><td colspan="3" class="text-center">Không có dữ liệu.</td></tr>';
            return;
        }
        customers.forEach((item, index) => {
            const row = `
                <tr>
                    <td><strong>${index + 1}</strong></td>
                    <td>${item.user.ho_ten || 'Khách vãng lai'}</td>
                    <td class="text-right font-weight-bold">${item.order_count}</td>
                </tr>
            `;
            topCustomersBody.insertAdjacentHTML('beforeend', row);
        });
    };

    // === HÀM CHÍNH ===
    const fetchAndRenderDashboard = async (startDate, endDate) => {
        showLoadingState();
        
        const params = new URLSearchParams({ startDate, endDate });
        const apiUrl = `/api/dashboard/stats?${params.toString()}`;

        try {
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Lỗi không xác định.');

            renderRevenueChart(data.revenueByMonth, startDate, endDate);
            renderTopProducts(data.topSellingProducts);
            renderTopCustomers(data.topCustomers);

        } catch (error) {
            console.error('Lỗi khi tải dữ liệu dashboard:', error);
            alert(`Đã có lỗi xảy ra: ${error.message}`);
        } finally {
            hideLoadingState();
        }
    };

    // === EVENT LISTENERS & KHỞI TẠO ===
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            if (!startDate || !endDate) {
                alert('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.');
                return;
            }
            if (new Date(startDate) > new Date(endDate)) {
                alert('Ngày bắt đầu không thể lớn hơn ngày kết thúc.');
                return;
            }
            fetchAndRenderDashboard(startDate, endDate);
        });
    }

    // Thiết lập giá trị mặc định cho bộ lọc (30 ngày gần nhất)
    const today = new Date();
    const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));
    if (endDateInput) {
        endDateInput.value = today.toISOString().split('T')[0];
    }
    if (startDateInput) {
        startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
    }
    
    // Tải dữ liệu lần đầu khi trang được mở
    fetchAndRenderDashboard(startDateInput.value, endDateInput.value);
});