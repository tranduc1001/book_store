// File: /src/controllers/productController.js

// Import các model cần thiết và các toán tử của Sequelize
const { Product, Category, Order  } = require('../models');
const db = require('../models');
const { Op } = require('sequelize');
const sequelize = db.sequelize; // Op (Operators) dùng để tạo các điều kiện truy vấn phức tạp như LIKE, BETWEEN,...
// Import thư viện exceljs để xử lý file Excel
const excel = require('exceljs');

/**
 * @description     Admin: Tạo một sản phẩm mới.
 * @route           POST /api/products
 * @access          Private/Admin
 */
const createProduct = async (request, response) => {
    try {
        // BƯỚC 1: LẤY DỮ LIỆU TỪ FORM (req.body) VÀ FILE (req.file)
        // Middleware `multer` đã xử lý form multipart và điền dữ liệu vào req.body và req.file
        const {
            ten_sach,
            danh_muc_id,
            tac_gia,
            mo_ta_ngan,
            gia_bia,
            so_luong_ton_kho,
            nha_xuat_ban,
            nam_xuat_ban,
            so_trang,
            product_type,
            ebook_url
        } = request.body;

        // BƯỚC 2: KIỂM TRA CÁC TRƯỜNG BẮT BUỘC
        if (!ten_sach || !gia_bia || !danh_muc_id) {
            return response.status(400).json({ message: "Tên sách, Giá bìa, và Danh mục là bắt buộc." });
        }

        // BƯỚC 3: XỬ LÝ FILE ẢNH
        let imageUrl = '/images/placeholder.png'; // Ảnh mặc định
        if (request.file) {
            imageUrl = `/images/${request.file.filename}`;
        }

        // BƯỚC 4: TẠO SẢN PHẨM MỚI (MỘT LẦN DUY NHẤT)
        const newProduct = await Product.create({
            ten_sach,
            mo_ta_ngan,
            gia_bia,
            tac_gia,
            nha_xuat_ban,
            danh_muc_id,
            img: imageUrl,
            product_type,
            ebook_url,
            // Xử lý các trường số để tránh lỗi 'invalid input'
            so_luong_ton_kho: so_luong_ton_kho || 0,
            nam_xuat_ban: nam_xuat_ban || null,
            so_trang: so_trang || null,
        });

        // BƯỚC 5: TRẢ VỀ KẾT QUẢ THÀNH CÔNG
        response.status(201).json(newProduct);

    } catch (error) {
        console.error("Lỗi khi tạo sản phẩm:", error);
        
        // Xử lý các lỗi validation từ Sequelize
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return response.status(400).json({
                message: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
                errors: messages
            });
        }
        
        // Xử lý các lỗi khác
        response.status(500).json({
            message: "Lỗi server khi tạo sản phẩm.",
            error: error.message
        });
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
        // BƯỚC 1: TÌM SẢN PHẨM CẦN CẬP NHẬT TRONG DATABASE DỰA VÀO ID TỪ URL
        const productId = request.params.id;
        const product = await Product.findByPk(productId);
        
        // Nếu không tìm thấy sản phẩm, trả về lỗi 404 (Not Found)
        if (!product) {
            return response.status(404).json({ message: "Không tìm thấy sản phẩm để cập nhật." });
        }

        // BƯỚC 2: CHUẨN BỊ DỮ LIỆU CẬP NHẬT TỪ REQUEST.BODY
        const updateData = { ...request.body };

        // Xử lý các trường hợp giá trị có thể là chuỗi rỗng từ form để chuyển thành null
        if (updateData.so_trang === '' || updateData.so_trang === undefined) {
            updateData.so_trang = null;
        }

        // BƯỚC 3: XỬ LÝ FILE ẢNH MỚI ĐƯỢC UPLOAD (NẾU CÓ)
        if (request.file) {
            updateData.img = '/images/' + request.file.filename;
            // Tùy chọn nâng cao: Bạn có thể thêm logic ở đây để xóa file ảnh cũ của sản phẩm
            // Ví dụ: const fs = require('fs'); fs.unlinkSync(`public${product.img}`);
        }

        // BƯỚC 4: CẬP NHẬT SẢN PHẨM VỚI DỮ LIỆU MỚI
        // Sử dụng phương thức 'update' của đối tượng product đã tìm thấy
        const updatedProduct = await product.update(updateData);
        
        // Trả về mã trạng thái 200 (OK) và thông tin sản phẩm sau khi đã cập nhật
        response.status(200).json(updatedProduct);

    } catch (error) {
        console.error("Lỗi trong quá trình cập nhật sản phẩm:", error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(function(e) { return e.message; });
            return response.status(400).json({ 
                message: 'Dữ liệu cập nhật không hợp lệ.', 
                errors: messages 
            });
        }
        response.status(500).json({ message: "Đã có lỗi xảy ra ở phía máy chủ khi cập nhật sản phẩm." });
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
const getBestsellerProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // COPY Y HỆT TRUY VẤN TỪ DASHBOARD CONTROLLER
        const topSellingItemsData = await db.OrderItem.findAll({
            attributes: [
                'product_id',
                [sequelize.fn('SUM', sequelize.col('so_luong_dat')), 'total_sold']
            ],
            include: [
                // Quan trọng: Phải include Product ở đây để lấy được thông tin
                { model: db.Product, as: 'product', attributes: ['id', 'ten_sach', 'gia_bia', 'img'] },
                {
                    model: db.Order, as: 'order',
                    where: {
                        trang_thai_don_hang: { [Op.in]: ['delivered', 'shipping'] }
                    },
                    attributes: [] 
                }
            ],
            group: ['product_id', 'product.id'], // Phải group theo cả 2
            order: [[sequelize.fn('SUM', sequelize.col('so_luong_dat')), 'DESC']],
            limit: limit,
            raw: true,
            nest: true,
        });
        
        // Kết quả trả về từ truy vấn này đã có đủ thông tin sản phẩm
        // Ví dụ: { product_id: 10, total_sold: 5, product: { id: 10, ten_sach: '...', gia_bia: '...' } }
        // Chúng ta chỉ cần trích xuất phần 'product' ra
        const bestsellerProducts = topSellingItemsData.map(item => item.product);

        res.status(200).json(bestsellerProducts);

    } catch (error) {
        console.error("LỖI CHI TIẾT KHI LẤY SẢN PHẨM BÁN CHẠY:", error);
        res.status(500).json({ message: "Lỗi server khi lấy sản phẩm bán chạy.", error: error.message });
    }
};
/**
 * @description     Lấy danh sách duy nhất các nhà xuất bản
 * @route           GET /api/products/publishers
 * @access          Public
 */
const getAllPublishers = async (req, res) => {
    try {
        const publishers = await Product.findAll({
            attributes: [
                [sequelize.fn('DISTINCT', sequelize.col('nha_xuat_ban')), 'publisher_name']
            ],
            where: { nha_xuat_ban: { [Op.not]: null, [Op.ne]: '' } }, // Lọc bỏ NXB null hoặc rỗng
            order: [['nha_xuat_ban', 'ASC']],
            raw: true
        });
        // Trả về một mảng các chuỗi tên nhà xuất bản
        res.status(200).json(publishers.map(p => p.publisher_name));
    } catch (error) {
        console.error("Lỗi khi lấy danh sách nhà xuất bản:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách nhà xuất bản' });
    }
};
module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    exportProductsToExcel,
    getBestsellerProducts,
    getAllPublishers
    
};