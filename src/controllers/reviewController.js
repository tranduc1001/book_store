// File: /src/controllers/reviewController.js

// Import các model cần thiết và các toán tử của Sequelize
const { Review, Order, OrderItem, Product, User } = require('../models');
const { Op } = require('sequelize');

/**
 * @description     Tạo một đánh giá hoặc bình luận mới cho sản phẩm.
 * @route           POST /api/products/:productId/reviews
 * @access          Private (Yêu cầu đăng nhập)
 */
const createReview = async (request, response) => {
    const productId = request.params.id;
    const { rating, comment } = request.body;
    const userId = request.user.id;

    try {
        // Kiểm tra xem sản phẩm có tồn tại không
        const product = await Product.findByPk(productId);
        if (!product) {
            return response.status(404).json({ message: "Không tìm thấy sản phẩm." });
        }

        // === LOGIC KIỂM TRA ĐIỀU KIỆN ĐÁNH GIÁ ===
        // Nếu người dùng gửi lên `rating` (tức là muốn đánh giá sao)
        if (rating) {
            // 1. Kiểm tra xem người dùng đã mua sản phẩm này và đơn hàng đã được giao thành công chưa.
            const hasPurchased = await Order.findOne({
                where: {
                    user_id: userId,
                    trang_thai_don_hang: 'delivered' // Trạng thái phải là 'đã giao'
                },
                // Join với OrderItem để tìm xem trong các đơn hàng đó có sản phẩm này không
                include: {
                    model: OrderItem,
                    as: 'orderItems',
                    where: { product_id: productId }
                }
            });

            // Nếu không tìm thấy đơn hàng nào thỏa mãn, không cho phép đánh giá.
            if (!hasPurchased) {
                return response.status(403).json({ message: "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng thành công." });
            }

            // 2. Kiểm tra xem người dùng đã từng đánh giá sao cho sản phẩm này chưa.
            // Mỗi người dùng chỉ được đánh giá sao 1 lần cho mỗi sản phẩm.
            const alreadyReviewed = await Review.findOne({
                where: {
                    user_id: userId,
                    product_id: productId,
                    rating: { [Op.ne]: null } // Tìm những review có cột 'rating' không phải là null
                }
            });
            
            if (alreadyReviewed) {
                return response.status(400).json({ message: "Bạn đã đánh giá sản phẩm này rồi." });
            }
        }
        
        // Nếu tất cả điều kiện hợp lệ, hoặc nếu người dùng chỉ bình luận (không có rating), thì tạo review.
        const newReview = await Review.create({
            product_id: parseInt(productId),
            user_id: userId,
            rating: rating,
            comment: comment,
        });
        const reviewWithUser = await Review.findByPk(newReview.id, {
            include: {
                model: User,
                as: 'User',
                attributes: ['ho_ten']
            }
        });

        response.status(201).json(reviewWithUser);
    } catch (error) {
        console.error("Lỗi khi tạo đánh giá/bình luận:", error);
        response.status(500).json({ message: "Lỗi server khi tạo đánh giá.", error: error.message });
    }
};

/**
 * @description     Lấy tất cả đánh giá/bình luận của một sản phẩm.
 * @route           GET /api/products/:productId/reviews
 * @access          Public
 */
const getProductReviews = async (request, response) => {
    try {
        // Lấy tất cả các review/comment gốc (không có parent_id)
        const reviews = await Review.findAll({
            where: {
                product_id: request.params.id,
                //parent_id: null
            },
            order: [['createdAt', 'DESC']], // Hiển thị bình luận mới nhất lên đầu
            // Include để lấy thông tin người dùng và các câu trả lời (replies)
            include: [
                {
                    model: User,
                    as: 'User', // Lấy thông tin người viết review
                    attributes: ['id', 'ho_ten'] // Chỉ lấy các trường cần thiết
                },
                
            ]
        });
        
        response.status(200).json(reviews);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách đánh giá:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     Admin: Xóa một review/comment.
 * @route           DELETE /api/reviews/:id
 * @access          Private/Admin
 */
const deleteReviewByAdmin = async (request, response) => {
    try {
        const review = await Review.findByPk(request.params.id);
        if (review) {
            // Nếu review này là một bình luận cha, chúng ta cũng cần xóa các bình luận con (replies) của nó
            // để tránh dữ liệu mồ côi trong CSDL.
            await Review.destroy({ where: { parent_id: request.params.id } });
            
            // Xóa bình luận chính
            await review.destroy();

            response.status(200).json({ message: "Xóa bình luận và các trả lời thành công." });
        } else {
            response.status(404).json({ message: "Không tìm thấy bình luận." });
        }
    } catch (error) {
        console.error("Lỗi khi xóa bình luận:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};
// /**
//  * @description     Lấy tất cả bình luận/đánh giá của một sản phẩm cụ thể.
//  * @route           GET /api/products/:productId/reviews
//  * @access          Public
//  */
// const getReviewsByProductId = async (request, response) => {
//     try {
//         const reviews = await Review.findAll({
//             where: { product_id: request.params.id }, // Lấy id từ params của product router
//             include: {
//                 model: User,
//                 as: 'User',
//                 attributes: ['ho_ten', 'img'] // Chỉ lấy những thông tin cần thiết của người dùng
//             },
//             order: [['createdAt', 'DESC']]
//         });
//         response.status(200).json(reviews);
//     } catch (error) {
//         console.error("Lỗi khi lấy reviews theo sản phẩm:", error);
//         response.status(500).json({ message: "Lỗi server", error: error.message });
//     }
// };

module.exports = { 
    createReview, 
    getProductReviews,
    deleteReviewByAdmin
    //getReviewsByProductId
};