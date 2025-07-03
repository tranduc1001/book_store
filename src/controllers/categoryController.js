// File: /src/controllers/categoryController.js

// <<< THÊM DÒNG NÀY VÀO ĐẦU FILE >>>
// Dòng này sẽ import đối tượng 'db' đã được Sequelize khởi tạo,
// trong đó chứa tất cả các model của chúng ta (User, Product, Category,...)
const { UniqueConstraintError, ValidationError, ForeignKeyConstraintError } = require('sequelize');
const db = require('../models');

// @desc    Lấy tất cả danh mục (có thể lấy theo cây)
// @route   GET /api/categories
// @access  Public
const getAllCategories = async (req, res) => {
    try {
        // Câu lệnh findAll đã được sửa lỗi
        const categories = await db.Category.findAll({
            // CHỈ LẤY CÁC DANH MỤC GỐC (CẤP 1)
            where: { danh_muc_cha_id: null },

            // INCLUDE (kèm theo) các model liên quan
             include: [
                {
                    // Lấy thông tin của danh mục cha
                    model: db.Category,
                    as: 'parentCategory',
                    attributes: ['id', 'ten_danh_muc'] // Chỉ lấy tên của cha
                },
                {
                    // Đếm số lượng sản phẩm thuộc về mỗi danh mục
                    model: db.Product,
                    as: 'products',
                    attributes: [] // Không cần lấy thông tin sản phẩm, chỉ cần đếm
                }
            ],
            // Group và đếm
            attributes: {
                include: [
                    [db.sequelize.fn("COUNT", db.sequelize.col("products.id")), "productCount"]
                ]
            },
            group: ['Category.id', 'parentCategory.id'] // Group theo cả id của cha và con
        });

        res.status(200).json(categories);

    } catch (error) {
        // Lỗi sẽ bị bắt ở đây
        console.error("Lỗi khi lấy danh sách danh mục:", error);
        res.status(500).json({ message: "Lỗi server khi lấy danh sách danh mục.", error: error.message });
    }
};

// @desc    Lấy chi tiết một danh mục
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
    try {
        const category = await db.Category.findByPk(req.params.id);
        if (category) {
            res.status(200).json(category);
        } else {
            res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết danh mục:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// @desc    Admin: Tạo danh mục mới
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    const { ten_danh_muc, mo_ta, danh_muc_cha_id, img } = req.body;

    if (!ten_danh_muc) {
        return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
    }
    try {
        const newCategory = await db.Category.create({
            ten_danh_muc,
            mo_ta,
            danh_muc_cha_id,
            img
        });
        res.status(201).json(newCategory);
    } catch (error) {
        console.error("LỖI KHI TẠO CATEGORY:", error);

        // Bắt lỗi trùng lặp dữ liệu (tên, hoặc id nếu có)
        if (error instanceof UniqueConstraintError) {
            const errorMessage = error.errors.map(e => `Giá trị '${e.value}' cho trường '${e.path}' đã tồn tại.`).join(', ');
            return res.status(409).json({ message: errorMessage }); // 409 Conflict
        }
        
        // Bắt lỗi validation chung
        if (error instanceof ValidationError) {
            const errorMessage = error.errors.map(e => e.message).join(', ');
             return res.status(400).json({ message: `Dữ liệu không hợp lệ: ${errorMessage}` }); // 400 Bad Request
        }

        // Lỗi server chung
        res.status(500).json({ message: "Lỗi server không xác định khi tạo danh mục.", error: error.message });
    }
};

// @desc    Admin: Cập nhật danh mục
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    try {
        const category = await db.Category.findByPk(req.params.id);
        if (category) {
            await category.update(req.body);
            res.status(200).json(category);
        } else {
            res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật danh mục:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// @desc    Admin: Xóa danh mục
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    try {
        const category = await db.Category.findByPk(req.params.id);
        if (category) {
            const productCount = await db.Product.count({ where: { danh_muc_id: req.params.id } });
            if (productCount > 0) {
                return res.status(400).json({ message: 'Không thể xóa danh mục vì vẫn còn sản phẩm.' });
            }
            await category.destroy();
            res.status(200).json({ message: 'Xóa danh mục thành công' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }
    } catch (error) {
        console.error("Lỗi khi xóa danh mục:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Đừng quên export tất cả các hàm
module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};