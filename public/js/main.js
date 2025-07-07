// File: /public/js/main.js (Phiên bản cuối cùng cho bố cục 2 cột)

/**
 * Sự kiện này sẽ được kích hoạt khi toàn bộ cấu trúc HTML của trang đã được tải xong.
 * Đây là điểm khởi đầu cho tất cả các mã JavaScript phía client.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // ====================================================================
    // PHẦN 1: CÁC HÀM LUÔN CHẠY TRÊN MỌI TRANG
    // ====================================================================
    handleAuthLinks();
    loadCategoriesForMenu();

    // ====================================================================
    // PHẦN 2: CÁC HÀM CHỈ CHẠY RIÊNG CHO TRANG CHỦ
    // ====================================================================
    if (document.getElementById('hero-swiper')) {
        initializeAllSwipers();
        loadHomePageData();
    }
});


/**
 * ===================================================================
 * ĐỊNH NGHĨA CÁC HÀM CHI TIẾT
 * ===================================================================
 */

/**
 * Xử lý việc hiển thị link Đăng nhập/Đăng ký hoặc "Xin chào [tên]" với menu dropdown.
 */
function handleAuthLinks() {
    const authLinksContainer = document.getElementById('auth-links');
    if (!authLinksContainer) return;

    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (token && userString) {
        const user = JSON.parse(userString);
        authLinksContainer.innerHTML = `
            <div class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    Xin chào, ${user.ho_ten}
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="/profile">Thông tin tài khoản</a></li>
                    <li><a class="dropdown-item" href="/my-orders">Lịch sử đơn hàng</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logout-btn">Đăng xuất</a></li>
                </ul>
            </div>
        `;
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (event) => {
                event.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            });
        }
    } else {
        authLinksContainer.innerHTML = `
            <a class="btn btn-outline-primary me-2" href="/login">Đăng nhập</a>
            <a class="btn btn-primary" href="/register">Đăng ký</a>
        `;
    }
}

/**
 * Lấy dữ liệu danh mục từ API và render ra menu dropdown ở header.
 */
async function loadCategoriesForMenu() {
    const menuList = document.getElementById('category-menu-list');
    if (!menuList) return;

    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const categories = await response.json();
        
        menuList.innerHTML = '';
        categories.forEach(cat => {
            menuList.innerHTML += `<li><a class="dropdown-item" href="/products?category=${cat.id}">${cat.ten_danh_muc}</a></li>`;
        });
    } catch (error) {
        console.error("Error loading categories:", error);
        menuList.innerHTML = '<li><a class="dropdown-item text-danger" href="#">Lỗi tải danh mục</a></li>';
    }
}

/**
 * Khởi tạo tất cả các thư viện Swiper.js cho slideshow và các carousel sản phẩm.
 */
function initializeAllSwipers() {
    new Swiper('#hero-swiper', {
        loop: true,
        autoplay: { delay: 4000, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });

    const productSwiperOptions = {
        slidesPerView: 2,
        spaceBetween: 10,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            768: { slidesPerView: 3, spaceBetween: 20 },
            992: { slidesPerView: 4, spaceBetween: 20 },
            1200: { slidesPerView: 5, spaceBetween: 20 },
        }
    };

    new Swiper('#bestseller-swiper', productSwiperOptions);
    new Swiper('#vh-vietnam-swiper', productSwiperOptions);
    new Swiper('#vh-nuoc-ngoai-swiper', productSwiperOptions);
    new Swiper('#finance-swiper', productSwiperOptions);
}

/**
 * Hàm điều phối việc tải tất cả dữ liệu cần thiết cho trang chủ.
 */
function loadHomePageData() {
    // Tải slideshow chính
    fetchSlideshow();

    // Tải dữ liệu cho cột trái
    fetchNewArrivals();
    fetchPostsAndRender();

    // Tải dữ liệu cho cột phải
    fetchProductsAndRender('#bestseller-products-wrapper', '/bestsellers?limit=10');
    fetchProductsAndRender('#vh-vietnam-products-wrapper', '?category=31&limit=10');
    fetchProductsAndRender('#vh-nuoc-ngoai-products-wrapper', '?category=30&limit=10');
    fetchProductsAndRender('#finance-products-wrapper', '?category=29&limit=10');
    
}

/**
 * Lấy dữ liệu slideshow từ API và render ra giao diện.
 */
async function fetchSlideshow() {
    const wrapper = document.getElementById('hero-swiper-wrapper');
    if (!wrapper) return;

    try {
        const response = await fetch('/api/slideshows/public');
        if (!response.ok) throw new Error('Failed to fetch slideshows');
        const slides = await response.json();

        if (slides && slides.length > 0) {
            wrapper.innerHTML = slides.map(slide => `
                <div class="swiper-slide">
                     <a href="${slide.link_to || '#'}">
                        <img src="${slide.image_url}" class="img-fluid" alt="${slide.tieu_de || 'Banner'}">
                    </a>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error("Error loading slideshow:", error);
    }
}

/**
 * Hàm chung để lấy sản phẩm từ API và render ra các carousel ở cột phải.
 */
async function fetchProductsAndRender(wrapperId, pathAndQuery) {
    const wrapper = document.querySelector(wrapperId);
    if (!wrapper) return;

    try {
        const apiUrl = `/api/products${pathAndQuery}`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API call failed for ${apiUrl} with status ${response.status}`);
        
        const result = await response.json();
        let products;

        if (Array.isArray(result)) {
            products = result;
        } else if (result && result.products) {
            products = result.products;
        } else {
            products = [];
        }
        
        if (products && products.length > 0) {
            const productsHTML = products.map(product => `
                <div class="swiper-slide">
                    <div class="card h-100 product-card border-0 shadow-sm">
                        <a href="/products/${product.id}">
                            <img src="${product.img }" class="card-img-top" alt="${product.ten_sach}" style="height: 200px; object-fit: contain; padding: 10px;">
                        </a>
                        <div class="card-body d-flex flex-column p-2">
                            <h6 class="card-title flex-grow-1 mb-2" style="font-size: 0.9rem;">
                                <a href="/products/${product.id}" class="text-decoration-none text-dark">${product.ten_sach}</a>
                            </h6>
                            <p class="card-text text-danger fw-bold mb-2">${parseFloat(product.gia_bia).toLocaleString('vi-VN')}₫</p>
                            <button onclick="addToCart('${product.id}')" class="btn btn-sm btn-outline-primary w-100 mt-auto">Thêm vào giỏ</button>
                        </div>
                    </div>
                </div>
            `).join('');
            wrapper.innerHTML = productsHTML;
        } else {
            wrapper.innerHTML = '<div class="text-muted p-3">Không có sản phẩm nào thuộc mục này.</div>';
        }
    } catch (error) {
        console.error(`Lỗi khi tải sản phẩm cho ${wrapperId}:`, error);
        wrapper.innerHTML = '<p class="text-danger p-3">Lỗi tải sản phẩm.</p>';
    }
}

/**
 * Lấy dữ liệu sách mới nhất và render ra cột trái.
 */
async function fetchNewArrivals() {
    const wrapper = document.getElementById('new-arrivals-wrapper');
    if (!wrapper) return;

    try {
        const response = await fetch(`/api/products?sortBy=createdAt&order=DESC&limit=5`);
        if (!response.ok) throw new Error('Failed to fetch new arrivals');
        
        const result = await response.json();
        const products = result.products;

        if (products && products.length > 0) {
            wrapper.innerHTML = products.map(product => `
                <div class="card mb-3 border-0">
                    <div class="row g-0">
                        <div class="col-4">
                            <a href="/products/${product.id}">
                                <img src="${product.img || '/images/placeholder.png'}" class="img-fluid rounded-start" alt="${product.ten_sach}">
                            </a>
                        </div>
                        <div class="col-8">
                            <div class="card-body p-2">
                                <h6 class="card-title mb-1" style="font-size: 0.9rem;">
                                    <a href="/products/${product.id}" class="text-decoration-none text-dark">${product.ten_sach}</a>
                                </h6>
                                <p class="card-text text-danger fw-bold">${parseFloat(product.gia_bia).toLocaleString('vi-VN')}₫</p>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            wrapper.innerHTML = '<p class="text-muted">Không có sản phẩm mới.</p>';
        }
    } catch (error) {
        console.error("Error loading new arrivals:", error);
        wrapper.innerHTML = '<p class="text-danger">Lỗi tải sản phẩm mới.</p>';
    }
}

/**
 * Lấy dữ liệu các bài viết mới nhất và render ra cột trái.
 */
async function fetchPostsAndRender() {
    const wrapper = document.getElementById('posts-wrapper');
    if (!wrapper) return;

    try {
        const response = await fetch(`/api/posts/public?limit=3`);
        if (!response.ok) throw new Error('Failed to fetch posts');
        
        const posts = await response.json();
        
        if (posts && posts.length > 0) {
            wrapper.innerHTML = posts.map(post => `
                <div class="card mb-3 shadow-sm">
                    <a href="/blog/${post.slug}">
                        <img src="${post.anh_dai_dien || '/images/placeholder.png'}" class="card-img-top" alt="${post.tieu_de}">
                    </a>
                    <div class="card-body p-2">
                        <h6 class="card-title mb-1" style="font-size: 0.95rem;">
                            <a href="/blog/${post.slug}" class="text-decoration-none text-dark">${post.tieu_de}</a>
                        </h6>
                    </div>
                </div>
            `).join('');
        } else {
            wrapper.innerHTML = '<p class="text-muted">Chưa có bài viết nào.</p>';
        }
    } catch (error) {
        console.error("Lỗi khi tải bài viết:", error);
        wrapper.innerHTML = '<p class="text-danger">Lỗi tải bài viết.</p>';
    }
}