// File: /src/controllers/slideshowController.js

// Import model Slideshow
const { Slideshow } = require('../models');

/**
 * @description     Admin: Tạo một slide mới.
 * @route           POST /api/slideshows
 * @access          Private/Admin
 */
const createSlide = async (request, response) => {
    // Lấy thông tin của slide từ body request
    const { image_url, tieu_de, phu_de, link_to, thu_tu_hien_thi, trang_thai } = request.body;

    // Kiểm tra trường bắt buộc
    if (!image_url) {
        return response.status(400).json({ message: "URL hình ảnh là bắt buộc." });
    }

    try {
        const newSlide = await Slideshow.create({
            image_url,
            tieu_de,
            phu_de,
            link_to,
            thu_tu_hien_thi,
            trang_thai
        });
        response.status(201).json(newSlide);
    } catch (error) {
        console.error("Lỗi khi tạo slide:", error);
        response.status(500).json({ message: "Lỗi server khi tạo slide.", error: error.message });
    }
};

/**
 * @description     Public: Lấy danh sách các slide đang hoạt động để hiển thị cho người dùng.
 * @route           GET /api/slideshows/public
 * @access          Public
 */
const getPublicSlides = async (request, response) => {
    try {
        const slides = await Slideshow.findAll({
            // Chỉ lấy các slide có trạng thái là true (đang hoạt động)
            where: { trang_thai: true },
            // Sắp xếp theo thứ tự hiển thị (số nhỏ hơn lên trước), sau đó là ngày tạo mới nhất
            order: [['thu_tu_hien_thi', 'ASC'], ['createdAt', 'DESC']]
        });
        response.status(200).json(slides);
    } catch (error) {
        console.error("Lỗi khi lấy slide công khai:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     Admin: Lấy tất cả các slide (cả ẩn và hiện) để quản lý.
 * @route           GET /api/slideshows
 * @access          Private/Admin
 */
const getAllSlidesForAdmin = async (request, response) => {
    try {
        const slides = await Slideshow.findAll({
            order: [['thu_tu_hien_thi', 'ASC']]
        });
        response.status(200).json(slides);
    } catch (error) {
        console.error("Lỗi khi Admin lấy danh sách slide:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     Admin: Cập nhật thông tin một slide.
 * @route           PUT /api/slideshows/:id
 * @access          Private/Admin
 */
const updateSlide = async (request, response) => {
    try {
        const slide = await Slideshow.findByPk(request.params.id);
        if (slide) {
            const updatedSlide = await slide.update(request.body);
            response.status(200).json(updatedSlide);
        } else {
            response.status(404).json({ message: "Không tìm thấy slide." });
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật slide:", error);
        response.status(500).json({ message: "Lỗi server khi cập nhật slide.", error: error.message });
    }
};

/**
 * @description     Admin: Xóa một slide.
 * @route           DELETE /api/slideshows/:id
 * @access          Private/Admin
 */
const deleteSlide = async (request, response) => {
    try {
        const slide = await Slideshow.findByPk(request.params.id);
        if (slide) {
            await slide.destroy();
            response.status(200).json({ message: "Xóa slide thành công." });
        } else {
            response.status(404).json({ message: "Không tìm thấy slide." });
        }
    } catch (error) {
        console.error("Lỗi khi xóa slide:", error);
        response.status(500).json({ message: "Lỗi server khi xóa slide.", error: error.message });
    }
};

module.exports = {
    createSlide,
    getPublicSlides,
    getAllSlidesForAdmin,
    updateSlide,
    deleteSlide
};