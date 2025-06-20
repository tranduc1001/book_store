// File: /src/controllers/adminViewController.js
const axios = require('axios');

/**
 * @description     Render trang Dashboard của Admin
 * @route           GET /admin
 * @access          Private/Admin
 */
const renderAdminDashboard = async (request, response) => {
    try {
        const apiUrl = `${request.protocol}://${request.get('host')}/api/dashboard/overview`;
        // Chúng ta cần một cách để truyền token từ client lên đây.
        // Tạm thời bỏ qua bước xác thực API để render giao diện trước.
        // const apiResponse = await axios.get(apiUrl, { headers: ... });
        // const overviewData = apiResponse.data;
        
        response.render('admin/pages/dashboard', {
            title: 'Dashboard',
            // overview: overviewData,
            layout: 'admin/layout' // Chỉ định layout admin
        });
    } catch (error) {
        console.error("Lỗi khi render Admin Dashboard:", error);
        response.status(500).send("Lỗi server");
    }
};

/**
 * @description     Render trang Quản lý Sản phẩm của Admin
 * @route           GET /admin/products
 * @access          Private/Admin
 */
const renderAdminProducts = async (request, response) => {
     try {
        const apiUrl = `${request.protocol}://${request.get('host')}/api/products`;
        const apiResponse = await axios.get(apiUrl, { params: request.query });
        const { products, pagination } = apiResponse.data;

        response.render('admin/pages/products', {
            title: 'Quản lý Sản phẩm',
            products: products,
            pagination: pagination,
            layout: 'admin/layout'
        });
    } catch (error) {
        console.error("Lỗi khi render trang quản lý sản phẩm:", error);
        response.status(500).send("Lỗi server");
    }
};

/**
 * @description     Render trang form Thêm/Sửa sản phẩm
 * @route           GET /admin/products/add
 * @route           GET /admin/products/edit/:id
 * @access          Private/Admin
 */
const renderProductFormPage = async (request, response) => {
    try {
        const { id } = request.params;
        const apiUrl = `${request.protocol}://${request.get('host')}/api`;

        // Lấy danh sách tất cả danh mục để hiển thị trong thẻ <select>
        const categoriesResponse = await axios.get(`${apiUrl}/categories`);
        const categories = categoriesResponse.data;

        let product = null; // Biến để lưu thông tin sản phẩm nếu là trang sửa

        if (id) {
            // Nếu có ID trong URL, đây là trang SỬA
            // Gọi API để lấy thông tin sản phẩm cần sửa
            const productResponse = await axios.get(`${apiUrl}/products/${id}`);
            product = productResponse.data;
        }

        // Render cùng một file form cho cả hai trường hợp
        response.render('admin/pages/product-form', {
            title: id ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới',
            product: product,      // Sẽ là null nếu là trang THÊM
            categories: categories, // Luôn truyền danh sách danh mục
            action: id ? `/admin/products/edit/${id}` : '/admin/products/add', // Đường dẫn submit form
            id: id ? id : null, // ID của sản phẩm
        });

    } catch (error) {
        console.error("Lỗi khi render form sản phẩm:", error);
        response.status(500).send("Lỗi server");
    }
};
/**
 * @description     Render trang Chi tiết đơn hàng cho Admin
 * @route           GET /admin/orders/:id
 * @access          Private/Admin
 */
const renderAdminOrderDetailPage = async (request, response) => {
    try {
        const { id } = request.params;
        response.render('admin/pages/order-detail', {
            title: `Chi tiết đơn hàng #${id}`,
            orderId: id
        });
    } catch (error) {
        console.error("Lỗi khi render trang chi tiết đơn hàng (Admin):", error);
        response.status(500).send("Lỗi server");
    }
};
/**
 * @description Render trang Quản lý Danh mục cho Admin
 * @route       GET /admin/categories
 * @access      Private/Admin
 */
const renderAdminCategoriesPage = (req, res) => {
    try {
        res.render('admin/pages/categories', { // Render file EJS chúng ta vừa tạo
            title: 'Admin - Quản lý Danh mục',
            user: req.user,
            layout: 'admin/layouts/main', // Giả sử layout của bạn tên là 'main' trong thư mục 'admin/layouts'
            path: '/categories' // Dùng để xác định menu nào đang active trong sidebar
        });
    } catch (error) {
        console.error("Lỗi khi render trang quản lý danh mục:", error);
        res.render('pages/error', { message: 'Có lỗi xảy ra' }); // Render trang lỗi chung
    }
};
/**
 * @description Render trang Quản lý Đơn hàng cho Admin
 * @route       GET /admin/orders
 * @access      Private/Admin
 */
const renderAdminOrdersPage = (req, res) => {
    try {
        res.render('admin/pages/orders', {
            title: 'Admin - Quản lý Đơn hàng',
            user: req.user,
            path: '/orders'
        });
    } catch (error) {
        console.error("Lỗi khi render trang quản lý đơn hàng:", error);
        res.render('pages/error', { message: 'Có lỗi xảy ra' });
    }
};
module.exports = {
    renderAdminDashboard,
    renderAdminProducts,
    renderProductFormPage,
    renderAdminOrderDetailPage,
    renderAdminCategoriesPage,
    renderAdminOrdersPage
    
};