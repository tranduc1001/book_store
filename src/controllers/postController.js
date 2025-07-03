// File: /src/controllers/postController.js
const { Post } = require('../models');

/**
 * @description     Lấy các bài viết đã xuất bản cho trang chủ
 * @route           GET /api/posts/public
 * @access          Public
 */
const getPublicPosts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 4; // Lấy 4 bài mặc định

        const posts = await Post.findAll({
            where: { trang_thai: true },
            order: [['createdAt', 'DESC']],
            limit: limit
        });

        res.status(200).json(posts);
    } catch (error) {
        console.error("Lỗi khi lấy bài viết:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

module.exports = { getPublicPosts };