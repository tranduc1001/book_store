// File: /src/controllers/productController.js

// Import các model cần thiết và các toán tử của Sequelize
const { Product, Category } = require('../models');
const { Op } = require('sequelize'); // Op (Operators) dùng để tạo các điều kiện truy vấn phức tạp như LIKE, BETWEEN,...
// Import thư viện exceljs để xử lý file Excel
const excel = require('exceljs');

/**
 * @description     Admin: Tạo một sản phẩm mới.
 * @route           POST /api/products
 * @access          Private/Admin
 */
const createProduct = async (request, response) => {
    // Lấy tất cả thông tin sản phẩm từ body của request
    const {
        ten_sach,
        danh_muc_id,
        tac_gia,
        mo_ta_ngan,
        gia_bia,
        so_luong_ton_kho,
        nha_xuat_ban,
        nam_xuat_ban,
        img,
        product_type,
        ebook_url
    } = request.body;
    
    // Kiểm tra các trường bắt buộc
    if (!ten_sach || !danh_muc_id || !gia_bia) {
        return response.status(400).json({ message: "Tên sách, danh mục và giá bìa là các trường bắt buộc." });
    }

    try {
        const newProduct = await Product.create({
            ten_sach,
            danh_muc_id,
            tac_gia,
            mo_ta_ngan,
            gia_bia,
            so_luong_ton_kho,
            nha_xuat_ban,
            nam_xuat_ban,
            img,
            product_type,
            ebook_url
        });
        response.status(201).json(newProduct);
    } catch (error) {
        console.error("Lỗi khi tạo sản phẩm:", error);
        response.status(500).json({ message: "Lỗi server khi tạo sản phẩm.", error: error.message });
    }
};

/**
 * @description     Public: Lấy danh sách tất cả sản phẩm (có filter, search, sort, pagination).
 * @route           GET /api/products
 * @access          Public
 */
const getAllProducts = async (request, response) => {
    try {
        // Lấy các tham số từ query string của URL, ví dụ: /api/products?keyword=conan&category=1&minPrice=50000
        const { keyword, category, minPrice, maxPrice, sortBy, order = 'ASC', page = 1, limit = 12 } = request.query;
        
        // 1. XÂY DỰNG ĐIỀU KIỆN LỌC (WHERE)
        const whereCondition = {};
        
        // Lọc theo từ khóa (tìm kiếm tên sách)
        if (keyword) {
            // Sử dụng Op.iLike để tìm kiếm không phân biệt hoa thường (chỉ hoạt động trên PostgreSQL)
            whereCondition.ten_sach = { [Op.iLike]: `%${keyword}%` };
        }
        
        // Lọc theo danh mục
        if (category) {
            whereCondition.danh_muc_id = category;
        }
        
        // Lọc theo khoảng giá
        if (minPrice && maxPrice) {
            whereCondition.gia_bia = { [Op.between]: [minPrice, maxPrice] };
        } else if (minPrice) {
            whereCondition.gia_bia = { [Op.gte]: minPrice }; // gte: Greater than or equal (lớn hơn hoặc bằng)
        } else if (maxPrice) {
            whereCondition.gia_bia = { [Op.lte]: maxPrice }; // lte: Less than or equal (nhỏ hơn hoặc bằng)
        }

        // 2. XÂY DỰNG ĐIỀU KIỆN SẮP XẾP (ORDER)
        const orderCondition = [];
        if (sortBy) {
            // order.toUpperCase() để đảm bảo giá trị là 'ASC' hoặc 'DESC'
            orderCondition.push([sortBy, order.toUpperCase()]); 
        } else {
            // Mặc định sắp xếp theo ngày tạo mới nhất
            orderCondition.push(['createdAt', 'DESC']);
        }
        
        // 3. CẤU HÌNH PHÂN TRANG (PAGINATION)
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // 4. TRUY VẤN CSDL VỚI TẤT CẢ ĐIỀU KIỆN
        const { count, rows } = await Product.findAndCountAll({
            where: whereCondition,
            include: { // Join với bảng Category để lấy tên danh mục
                model: Category,
                as: 'category',
                attributes: ['id', 'ten_danh_muc'] // Chỉ lấy các trường cần thiết
            },
            order: orderCondition,
            limit: limitNum,
            offset: offset,
            distinct: true // Cần thiết khi có include để đếm cho đúng
        });

        // 5. TRẢ VỀ KẾT QUẢ
        response.status(200).json({
            products: rows,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(count / limitNum),
                totalProducts: count,
                limit: limitNum
            }
        });

    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
        response.status(500).json({ message: "Lỗi server khi lấy danh sách sản phẩm.", error: error.message });
    }
};

/**
 * @description     Public: Lấy thông tin chi tiết của một sản phẩm bằng ID.
 * @route           GET /api/products/:id
 * @access          Public
 */
const getProductById = async (request, response) => {
    try {
        const product = await Product.findByPk(request.params.id, {
            include: { // Lấy cả thông tin danh mục
                model: Category,
                as: 'category'
            }
        });
        if (product) {
            response.status(200).json(product);
        } else {
            response.status(404).json({ message: "Không tìm thấy sản phẩm." });
        }
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     Admin: Cập nhật thông tin sản phẩm.
 * @route           PUT /api/products/:id
 * @access          Private/Admin
 */
const updateProduct = async (request, response) => {
    try {
        const product = await Product.findByPk(request.params.id);
        if (product) {
            // Phương thức `update` sẽ cập nhật các trường được cung cấp trong request.body
            const updatedProduct = await product.update(request.body);
            response.status(200).json(updatedProduct);
        } else {
            response.status(404).json({ message: "Không tìm thấy sản phẩm." });
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật sản phẩm:", error);
        response.status(500).json({ message: "Lỗi server khi cập nhật sản phẩm.", error: error.message });
    }
};

/**
 * @description     Admin: Xóa một sản phẩm.
 * @route           DELETE /api/products/:id
 * @access          Private/Admin
 */
const deleteProduct = async (request, response) => {
    try {
        const product = await Product.findByPk(request.params.id);
        if (product) {
            await product.destroy();
            response.status(200).json({ message: "Xóa sản phẩm thành công." });
        } else {
            response.status(404).json({ message: "Không tìm thấy sản phẩm." });
        }
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        response.status(500).json({ message: "Lỗi server khi xóa sản phẩm.", error: error.message });
    }
};

/**
 * @description     Admin: Export danh sách sản phẩm ra file Excel.
 * @route           GET /api/products/export/excel
 * @access          Private/Admin
 */
const exportProductsToExcel = async (request, response) => {
    try {
        const products = await Product.findAll({
            include: { model: Category, as: 'category', attributes: ['ten_danh_muc'] },
            order: [['ten_sach', 'ASC']]
        });

        // 1. Tạo một workbook mới
        let workbook = new excel.Workbook();
        let worksheet = workbook.addWorksheet('Danh sách Sản phẩm');

        // 2. Định nghĩa các cột (header)
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Tên Sách', key: 'ten_sach', width: 40 },
            { header: 'Tác Giả', key: 'tac_gia', width: 25 },
            { header: 'Danh Mục', key: 'danh_muc', width: 25 },
            { header: 'Giá Bìa', key: 'gia_bia', width: 15 },
            { header: 'Tồn Kho', key: 'so_luong_ton_kho', width: 10 },
            { header: 'Loại', key: 'product_type', width: 15 },
        ];

        // 3. Thêm dữ liệu từng dòng
        products.forEach(product => {
            worksheet.addRow({
                id: product.id,
                ten_sach: product.ten_sach,
                tac_gia: product.tac_gia,
                danh_muc: product.category ? product.category.ten_danh_muc : 'N/A',
                gia_bia: parseFloat(product.gia_bia),
                so_luong_ton_kho: product.so_luong_ton_kho,
                product_type: product.product_type
            });
        });

        // 4. Thiết lập header cho response để trình duyệt hiểu và tải file về
        response.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        response.setHeader(
            'Content-Disposition',
            'attachment; filename=' + 'danh-sach-san-pham.xlsx'
        );

        // 5. Ghi workbook vào response và kết thúc
        await workbook.xlsx.write(response);
        response.status(200).end();

    } catch (error) {
        console.error("Lỗi khi export sản phẩm ra Excel:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    exportProductsToExcel
};