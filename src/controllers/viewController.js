// File: /src/controllers/viewController.js
const axios = require('axios');


/**
 * Hàm trợ giúp để tạo URL API cơ sở
 * @param {object} req - Đối tượng request
 * @returns {string} - URL API cơ sở (ví dụ: http://localhost:8080/api)
 */
const getApiBaseUrl = (req) => `${req.protocol}://${req.get('host')}/api`;
/**
 * @description     Render trang chủ
 * @route           GET /
 * @access          Public
 */
const renderHomePage = (request, response) => {
    try {
        // Phương thức `response.render()` sẽ tìm file EJS và "biên dịch" nó thành HTML.
        // Tham số thứ nhất: đường dẫn tới file EJS (không cần .ejs, tính từ thư mục 'views').
        // Tham số thứ hai: một đối tượng chứa dữ liệu để truyền vào file EJS.
        response.render('pages/home', {
            title: 'Trang Chủ' // Biến `title` này sẽ được dùng trong header.ejs
        });
    } catch (error) {
        console.error("Lỗi khi render trang chủ:", error);
        response.status(500).send("Lỗi server");
    }
};

const renderProductListPage = async (req, res) => {
    try {
        const apiBaseUrl = getApiBaseUrl(req);
        
        // 1. Lấy đồng thời tất cả dữ liệu cần thiết cho trang
        const [productsResponse, categoriesResponse, publishersResponse] = await Promise.all([
            // Lấy danh sách sản phẩm đã được lọc/phân trang
            axios.get(`${apiBaseUrl}/products`, { params: req.query }),
            // Lấy tất cả danh mục cho sidebar
            axios.get(`${apiBaseUrl}/categories`),
            // Lấy tất cả nhà xuất bản cho bộ lọc
           // axios.get(`${apiBaseUrl}/products/publishers`) // Giả định bạn có API này
        ]);

        const { products, pagination } = productsResponse.data;
        const allCategories = categoriesResponse.data;
        //const allPublishers = publishersResponse.data;

        // 2. Lấy thông tin của danh mục hiện tại (nếu có)
        let currentCategoryInfo = null;
        if (req.query.category) {
            // Tìm trong danh sách đã lấy về để không phải gọi API lần nữa
            currentCategoryInfo = allCategories.find(cat => cat.id == req.query.category);
        }

        // 3. Render trang EJS và truyền tất cả dữ liệu vào
        res.render('pages/products', {
            title: currentCategoryInfo ? currentCategoryInfo.ten_danh_muc : 'Tất Cả Sản Phẩm',
            products: products,
            pagination: pagination,
            allCategories: allCategories,
            //allPublishers: allPublishers,
            currentCategory: currentCategoryInfo,
            queryParams: req.query
        });

    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu trang sản phẩm:", error.response ? error.response.data : error.message);
        res.status(500).render('pages/error', {
             title: 'Lỗi',
             message: 'Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.'
        });
    }
};
 /***
* @description     Render trang chi tiết sản phẩm
 * @route           GET /products/:id
 * @access          Public
 */
const renderProductDetailPage = async (req, res) => {
    try {
        const { id } = req.params;
        const apiBaseUrl = getApiBaseUrl(req);

        const [productResponse, reviewsResponse] = await Promise.all([
            axios.get(`${apiBaseUrl}/products/${id}`),
            axios.get(`${apiBaseUrl}/products/${id}/reviews`)
        ]);

        res.render('pages/product-detail', {
            title: productResponse.data.ten_sach,
            product: productResponse.data,
            reviews: reviewsResponse.data
        });

    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu chi tiết sản phẩm:", error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 404) {
             res.status(404).render('pages/error', { title: 'Không tìm thấy', message: 'Sản phẩm bạn đang tìm kiếm không tồn tại.' });
        } else {
            res.status(500).render('pages/error', { title: 'Lỗi', message: 'Không thể tải trang chi tiết sản phẩm.' });
        }
    }
};
/**
 * @description     Render trang Đăng nhập
 * @route           GET /login
 * @access          Public
 */
const renderLoginPage = (request, response) => {
    response.render('pages/login', {
        title: 'Đăng Nhập'
    });
};
/**
 * @description     Render trang Đăng ký
 * @route           GET /register
 * @access          Public
 */
const renderRegisterPage = (request, response) => {
    response.render('pages/register', {
        title: 'Đăng Ký'
    });
};
const renderCartPage = (request, response) => {
    // Chỉ cần render trang EJS. Việc lấy dữ liệu sẽ do JavaScript phía client đảm nhận.
    response.render('pages/cart', {
        title: 'Giỏ Hàng'
    });
};
/**
 * @description     Render trang Thanh toán
 * @route           GET /checkout
 * @access          Private (Logic kiểm tra đăng nhập sẽ ở phía client)
 */
const renderCheckoutPage = (request, response) => {
    response.render('pages/checkout', {
        title: 'Thanh toán'
    });
};
/**
 * @description     Render trang Lịch sử đơn hàng
 * @route           GET /my-orders
 * @access          Private (Logic kiểm tra đăng nhập sẽ ở phía client)
 */
const renderMyOrdersPage = (request, response) => {
    response.render('pages/my-orders', {
        title: 'Lịch Sử Đơn Hàng'
    });
};
/**
 * @description     Render trang Chi tiết đơn hàng của người dùng
 * @route           GET /orders/:id
 * @access          Private
 */
const renderOrderDetailPage = async (request, response) => {
    try {
        const { id } = request.params;
        // Logic xác thực sẽ được xử lý phía client JS,
        // nơi nó gửi token để gọi API. Server chỉ render trang.
        response.render('pages/order-detail', {
            title: `Chi tiết đơn hàng #${id}`,
            orderId: id, // Truyền ID đơn hàng vào trang EJS
        });
    } catch (error) {
        console.error("Lỗi khi render trang chi tiết đơn hàng:", error);
        response.status(500).send("Lỗi server");
    }
};
/**
 * @description     Render trang Thông tin tài khoản
 * @route           GET /profile
 * @access          Private
 */
const renderProfilePage = (request, response) => {
    response.render('pages/profile', {
        title: 'Thông Tin Tài Khoản'
    });
};
/**
 * Render trang Quên mật khẩu.
 */
const renderForgotPasswordPage = (req, res) => {
    // <<< ĐẢM BẢO RẰNG DÒNG NÀY ĐANG RENDER ĐÚNG FILE EJS >>>
    res.render('pages/forgot-password', {
        title: 'Quên Mật Khẩu'
    });
};

/**
 * Render trang Đặt lại mật khẩu.
 */
const renderResetPasswordPage = (req, res) => { // <<< Dùng const
    // Chúng ta không cần truyền token vào EJS vì JS sẽ tự lấy từ URL
    res.render('pages/reset-password', {
        title: 'Đặt Lại Mật Khẩu'
    });
};
module.exports = {
    renderHomePage,
    renderProductListPage,
    renderProductDetailPage,
    renderLoginPage,
    renderRegisterPage,
    renderCartPage,
    renderCheckoutPage,
    renderMyOrdersPage,
    renderOrderDetailPage,
    renderProfilePage,
    renderForgotPasswordPage,
    renderResetPasswordPage
};
