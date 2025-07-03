// File: /src/controllers/adminViewController.js
const { Op } = require('sequelize');
const db = require('../models');
const { sequelize } = db; 

/**
 * @description Render trang Dashboard cho Admin
 * @route       GET /admin
 * @access      Private/Admin
 */
const renderAdminDashboard = async (req, res) => {
    try {
        // Trong tương lai, bạn có thể lấy các số liệu thống kê ở đây
        // const userCount = await db.User.count();
        // const orderCount = await db.Order.count();
        res.render('admin/pages/dashboard', {
            title: 'Dashboard',
            user: req.user,
            path: '/'
            // stats: { userCount, orderCount } // ví dụ
        });
    } catch (error) {
        console.error("Lỗi khi render Admin Dashboard:", error);
        res.status(500).render('pages/error', { title: 'Lỗi Server', message: 'Không thể tải trang Dashboard.' });
    }
};
/**
 * @description Render trang Quản lý Sản phẩm cho Admin
 * @route       GET /admin/products
 * @access      Private/Admin
 */
// Biến hàm này thành async để có thể dùng await
const renderAdminProducts = async (req, res) => {
    try {
        // ======================= BƯỚC 1: LẤY CÁC THAM SỐ TỪ URL =======================
        // Lấy các tham số từ URL, nếu không có thì gán giá trị mặc định
        const { 
            keyword = '', 
            sortBy = 'createdAt', 
            order = 'DESC', 
            page = 1 
        } = req.query;

        const limit = 10; // Giới hạn 10 sản phẩm mỗi trang
        const offset = (parseInt(page) - 1) * limit;

        // ======================= BƯỚC 2: VALIDATE CÁC THAM SỐ SẮP XẾP =======================
        // Đây là bước quan trọng để tránh lỗi SQL Injection và lỗi tên cột không tồn tại
        const allowedSortBy = ['id', 'ten_sach', 'gia_bia', 'so_luong_ton_kho', 'createdAt'];
        const allowedOrder = ['ASC', 'DESC'];

        // Nếu sortBy hoặc order không hợp lệ, sử dụng giá trị mặc định
        const finalSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'createdAt';
        const finalOrder = allowedOrder.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
        // Điều kiện lọc (WHERE)
        const whereCondition = {};
        if (keyword) {
            // Tìm kiếm không phân biệt hoa thường
            whereCondition.ten_sach = { [Op.iLike]: `%${keyword}%` };
        }

        // Điều kiện sắp xếp (ORDER)
        const orderCondition = [[finalSortBy, finalOrder]];

        // ======================= BƯỚC 3: TRUY VẤN CSDL VỚI CÁC ĐIỀU KIỆN MỚI =======================
        // Dùng findAndCountAll để lấy cả tổng số sản phẩm cho việc phân trang
        const { count, rows } = await db.Product.findAndCountAll({
            where: whereCondition,
            order: orderCondition,
            limit: limit,
            offset: offset,
            include: {
                model: db.Category,
                as: 'category',
                attributes: ['ten_danh_muc']
            },
            distinct: true // Quan trọng khi có include để đếm đúng
        });

        // ======================= BƯỚC 4: RENDER VIEW VÀ TRUYỀN ĐẦY ĐỦ DỮ LIỆU =======================
        res.render('admin/pages/products', {
            title: 'Quản lý Sản phẩm',
            user: req.user,
            path: '/products',
            products: rows, // Chỉ truyền danh sách sản phẩm của trang hiện tại

            // --- TRUYỀN CÁC BIẾN CẦN THIẾT CHO PHÂN TRANG & TÌM KIẾM ---
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            keyword: keyword,
            sortBy: finalSortBy,
            order: finalOrder,
            
        });

    } catch (error) {
        console.error("Lỗi khi render trang Quản lý Sản phẩm:", error);
        res.status(500).render('pages/error', { 
            title: 'Lỗi Server', 
            message: 'Không thể tải trang Quản lý Sản phẩm.' 
        });
    }
};

/**
 * @description Render trang form Thêm/Sửa sản phẩm cho Admin
 * @route       GET /admin/products/add hoặc /admin/products/edit/:id
 * @access      Private/Admin
 */
const renderProductFormPage = async (req, res) => {
    try {
        // --- SỬA LỖI Ở ĐÂY: Lấy danh sách tất cả danh mục ---
        const categories = await db.Category.findAll({ order: [['ten_danh_muc', 'ASC']] });

        let product = null; // Khởi tạo sản phẩm là null (cho trường hợp thêm mới)
        let pageTitle = 'Thêm Sản phẩm mới';

        // --- SỬA LỖI Ở ĐÂY: Xử lý trường hợp SỬA sản phẩm ---
        // Nếu có ID trong URL, nghĩa là đang ở trang sửa
        if (req.params.id) {
            product = await db.Product.findByPk(req.params.id);
            pageTitle = `Sửa Sản phẩm #${product.id}`;

            // Nếu không tìm thấy sản phẩm với ID đó, báo lỗi 404
            if (!product) {
                 return res.status(404).render('pages/error', { title: '404 - Không tìm thấy', message: 'Không tìm thấy sản phẩm bạn yêu cầu.' });
            }
        }
        
        // --- SỬA LỖI Ở ĐÂY: Truyền cả 'categories' và 'product' vào view ---
        res.render('admin/pages/product-form', {
            title: pageTitle,
            user: req.user,
            path: '/products',
            categories: categories, // << BIẾN QUAN TRỌNG
            product: product      // << BIẾN QUAN TRỌNG
        });

    } catch (error) {
        console.error("Lỗi khi render trang form sản phẩm:", error);
        res.status(500).render('pages/error', { title: 'Lỗi Server', message: 'Không thể tải trang form sản phẩm.' });
    }
};


/**
 * @description Render trang Quản lý Danh mục cho Admin
 * @route       GET /admin/categories
 * @access      Private/Admin
 */
const renderAdminCategoriesPage = (req, res) => {
    try {
        res.render('admin/pages/categories', {
            title: 'Quản lý Danh mục',
            user: req.user,
            path: '/categories'
        });
    } catch (error) {
        console.error("Lỗi khi render trang Quản lý Danh mục:", error);
        res.status(500).render('pages/error', { title: 'Lỗi Server', message: 'Không thể tải trang Quản lý Danh mục.' });
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
            title: 'Quản lý Đơn hàng',
            user: req.user,
            path: '/orders'
        });
    } catch (error) {
        console.error("Lỗi khi render trang Quản lý Đơn hàng:", error);
        res.status(500).render('pages/error', { title: 'Lỗi Server', message: 'Không thể tải trang Quản lý Đơn hàng.' });
    }
};

/**
 * @description Render trang Chi tiết Đơn hàng cho Admin
 * @route       GET /admin/orders/:id
 * @access      Private/Admin
 */
const renderAdminOrderDetailPage = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        const order = await db.Order.findByPk(orderId, {
            // SỬA LẠI HOÀN TOÀN CÂU INCLUDE CHO ĐÚNG VỚI MODEL
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'ho_ten', 'email', 'phone', 'dia_chi']
                },
                {
                    model: db.OrderItem, // <<< DÙNG ĐÚNG MODEL OrderItem
                    as: 'orderItems',  // <<< DÙNG ĐÚNG BÍ DANH orderItems
                    include: [
                        {
                            model: db.Product,
                            as: 'product' // Bí danh này đã đúng
                        }
                    ]
                }
            ]
        });
        if (!order) {
            return res.status(404).render('pages/error', {
                title: '404 - Không tìm thấy',
                message: 'Không tìm thấy đơn hàng bạn yêu cầu.'
            });
        }

        res.render('admin/pages/order-detail', {
            title: `Admin - Chi tiết Đơn hàng #${order.id}`,
            user: req.user,
            path: '/orders',
            order: order
        });

    } catch (error) {
        console.error("Lỗi khi render trang chi tiết đơn hàng:", error);
        res.status(500).render('pages/error', {
            title: '500 - Lỗi Server',
            message: 'Đã có lỗi xảy ra ở phía máy chủ.'
        });
    }
};
/**
 * @description Render trang Quản lý Người dùng cho Admin
 * @route       GET /admin/users
 * @access      Private/Admin
 */
const renderAdminUsersPage = (req, res) => {
    try {
        res.render('admin/pages/users', {
            title: 'Quản lý Người dùng',
            user: req.user,
            path: '/users' // Dùng để highlight sidebar
        });
    } catch (error) {
        console.error("Lỗi khi render trang Quản lý Người dùng:", error);
        res.status(500).render('pages/error', { title: 'Lỗi Server' });
    }
};

/**
 * @description Render trang danh sách Phiếu nhập cho Admin (THEO STYLE MỚI)
 * @route       GET /admin/receipts
 * @access      Private/Admin
 */
const renderReceiptsListPage = async (req, res) => {
    try {
        const { page = 1, limit = 10, keyword = '' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Xây dựng điều kiện truy vấn trực tiếp
        let whereCondition = {};
        if (keyword) {
            whereCondition = {
                [Op.or]: [
                    sequelize.where(sequelize.cast(sequelize.col('Receipt.id'), 'varchar'), { [Op.iLike]: `%${keyword}%` }),
                    { 'ten_nha_cung_cap': { [Op.iLike]: `%${keyword}%` } }
                ]
            };
        }

        // Truy vấn trực tiếp vào CSDL
        const { count, rows } = await db.Receipt.findAndCountAll({
            where: whereCondition,
            include: [
                  {
                    model: db.User,
                    as: 'creator',
                    attributes: ['ho_ten']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset,
            distinct: true
        });

        res.render('admin/pages/receipts', {
            title: 'Danh sách Phiếu Nhập',
            user: req.user,
            path: '/receipts',
            receipts: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            keyword: keyword,
        });

    } catch (error) {
        console.error("Lỗi khi render trang danh sách phiếu nhập:", error);
        res.status(500).render('pages/error', { title: 'Lỗi Server', message: error.message });
    }
};

/**
 * @description Render trang chi tiết Phiếu nhập cho Admin (THEO STYLE MỚI)
 * @route       GET /admin/receipts/:id
 * @access      Private/Admin
 */
const renderReceiptDetailPage = async (req, res) => {
    try {
        const receiptId = req.params.id;

        // Truy vấn chi tiết phiếu nhập trực tiếp từ CSDL
        const receipt = await db.Receipt.findByPk(receiptId, {
            include: [
                 {
                    model: db.User,
                    as: 'creator',
                    attributes: ['id', 'ho_ten', 'email']
                },
                {
                    model: db.ReceiptItem,
                    as: 'receiptItems',
                    include: {
                        model: db.Product,
                        as: 'product',
                        attributes: ['id', 'ten_sach', 'img']
                    }
                }
            ]
        });

        if (!receipt) {
            return res.status(404).render('pages/error', { title: 'Lỗi 404', message: 'Không tìm thấy phiếu nhập này.' });
        }

        res.render('admin/pages/receipt-detail', {
            title: `Chi Tiết Phiếu Nhập #${receipt.id}`,
            user: req.user,
            path: '/receipts',
            receipt: receipt
        });
    } catch (error) {
        console.error("Lỗi khi render trang chi tiết phiếu nhập:", error);
        res.status(500).render('pages/error', { title: 'Lỗi Server', message: error.message });
    }
};
const renderAdminPromotionsPage = (req, res) => {
    res.render('admin/pages/promotions', { 
        title: 'Quản lý Khuyến mãi',
        path: '/promotions' 
    });
};

const renderPromotionFormPage = async (req, res) => {
    try {
        let promotion = null;
        if (req.params.id) {
            promotion = await db.Promotion.findByPk(req.params.id);
        }
        // Truyền thêm danh sách sản phẩm và danh mục để admin chọn
        const products = await db.Product.findAll({ attributes: ['id', 'ten_sach'], order: [['ten_sach', 'ASC']] });
        const categories = await db.Category.findAll({ attributes: ['id', 'ten_danh_muc'], order: [['ten_danh_muc', 'ASC']] });

        res.render('admin/pages/promotion-form', {
            title: promotion ? 'Sửa Khuyến mãi' : 'Thêm Khuyến mãi',
            promotion,
            products,
            categories
        });
    } catch (error) {
        console.error(error);
        res.redirect('/admin/promotions');
    }
};

// Đừng quên export tất cả các hàm
module.exports = {
    renderAdminDashboard,
    renderAdminProducts,
    renderProductFormPage,
    renderAdminCategoriesPage,
    renderAdminOrdersPage,
    renderAdminOrderDetailPage,
    renderAdminUsersPage,
    renderReceiptsListPage,
    renderReceiptDetailPage,
    renderAdminPromotionsPage,
    renderPromotionFormPage
};