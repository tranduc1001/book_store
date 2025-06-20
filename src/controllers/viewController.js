// File: /src/controllers/viewController.js
const axios = require('axios');
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

const renderProductListPage = async (request, response) => {
    try {
        // 1. Gọi đến API để lấy dữ liệu sản phẩm.
        //    Đây là một HTTP request từ server backend đến chính server backend.
        //    Chúng ta cần cung cấp đường dẫn đầy đủ.
        const apiUrl = `${request.protocol}://${request.get('host')}/api/products`;
        
        // Sử dụng axios để thực hiện GET request đến API
        const apiResponse = await axios.get(apiUrl, {
            // Truyền các tham số query (lọc, sắp xếp,...) từ URL của trang view
            // đến URL của API. Ví dụ: nếu người dùng truy cập /products?page=2,
            // thì API cũng sẽ được gọi với /api/products?page=2.
            params: request.query
        });

        // 2. Lấy dữ liệu từ kết quả trả về của API
        const { products, pagination } = apiResponse.data;

        // 3. Render trang EJS và truyền dữ liệu đã lấy được vào.
        response.render('pages/products', {
            title: 'Tất cả sản phẩm',
            products: products,         // Mảng các sản phẩm
            pagination: pagination      // Thông tin phân trang
        });

    } catch (error) {
        // Xử lý lỗi nếu API không trả về dữ liệu hoặc có lỗi khác
        console.error("Lỗi khi lấy dữ liệu sản phẩm từ API:", error);
        response.status(500).render('pages/error', {
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
const renderProductDetailPage = async (request, response) => {
    try {
        const productId = request.params.id;
        const apiUrl = `${request.protocol}://${request.get('host')}/api`;

        // Sử dụng `Promise.all` để thực hiện đồng thời nhiều request API, giúp tăng tốc độ tải trang.
        const [productResponse, reviewsResponse] = await Promise.all([
            // Request 1: Lấy thông tin chi tiết sản phẩm
            axios.get(`${apiUrl}/products/${productId}`),
            // Request 2: Lấy danh sách bình luận của sản phẩm
            axios.get(`${apiUrl}/products/${productId}/reviews`)
        ]);

        // Lấy dữ liệu từ kết quả trả về
        const product = productResponse.data;
        const reviews = reviewsResponse.data;

        // Render trang EJS và truyền dữ liệu vào
        response.render('pages/product-detail', {
            title: product.ten_sach, // Lấy tên sách làm tiêu đề trang
            product: product,
            reviews: reviews
        });

    } catch (error) {
        // Xử lý lỗi nếu không tìm thấy sản phẩm (API trả về lỗi 404) hoặc có lỗi server
        console.error("Lỗi khi lấy dữ liệu chi tiết sản phẩm:", error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 404) {
             response.status(404).render('pages/error', {
                title: 'Không tìm thấy',
                message: 'Sản phẩm bạn đang tìm kiếm không tồn tại.'
            });
        } else {
            response.status(500).render('pages/error', {
                title: 'Lỗi',
                message: 'Không thể tải trang chi tiết sản phẩm. Vui lòng thử lại sau.'
            });
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
    renderProfilePage
};
