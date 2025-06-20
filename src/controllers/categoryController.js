// File: /src/controllers/categoryController.js

const { Category } = require('../models');

/**
 * @description     Admin: Tạo một danh mục mới
 * @route           POST /api/categories
 * @access          Private/Admin
 */
const createCategory = async (req, res) => {
    const { ten_danh_muc, mo_ta } = req.body;
    if (!ten_danh_muc) {
        return res.status(400).json({ message: "Tên danh mục là bắt buộc." });
    }
    try {
        const newCategory = await Category.create({ ten_danh_muc, mo_ta });
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

/**
 * @description     Public: Lấy tất cả danh mục
 * @route           GET /api/categories
 * @access          Public
 */
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

/**
 * @description     Public: Lấy một danh mục bằng ID
 * @route           GET /api/categories/:id
 * @access          Public
 */
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (category) {
            res.status(200).json(category);
        } else {
            res.status(404).json({ message: "Không tìm thấy danh mục." });
        }
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

/**
 * @description     Admin: Cập nhật một danh mục
 * @route           PUT /api/categories/:id
 * @access          Private/Admin
 */
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (category) {
            const updatedCategory = await category.update(req.body);
            res.status(200).json(updatedCategory);
        } else {
            res.status(404).json({ message: "Không tìm thấy danh mục." });
        }
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

/**
 * @description     Admin: Xóa một danh mục
 * @route           DELETE /api/categories/:id
 * @access          Private/Admin
 */
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (category) {
            await category.destroy();
            res.status(200).json({ message: "Xóa danh mục thành công." });
        } else {
            res.status(404).json({ message: "Không tìm thấy danh mục." });
        }
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};


// **ĐẢM BẢO EXPORT ĐẦY ĐỦ 5 HÀM NÀY**
module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};