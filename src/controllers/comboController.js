// File: /src/controllers/comboController.js

// Import các model cần thiết và đối tượng sequelize để sử dụng transaction
const { Combo, ComboItem, Product, sequelize } = require('../models');

/**
 * @description     Admin: Tạo một combo sản phẩm mới.
 * @route           POST /api/combos
 * @access          Private/Admin
 */
const createCombo = async (request, response) => {
    // Admin cần gửi lên tên, giá và một mảng các ID của sản phẩm thuộc combo này.
    const { ten_combo, mo_ta, img, gia_combo, productIds } = request.body;

    // Kiểm tra dữ liệu đầu vào
    if (!ten_combo || !gia_combo || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return response.status(400).json({ message: "Vui lòng cung cấp đầy đủ tên, giá và danh sách ID sản phẩm cho combo." });
    }

    // Sử dụng transaction để đảm bảo tính toàn vẹn: hoặc tạo thành công cả combo và các item, hoặc không tạo gì cả.
    const transaction = await sequelize.transaction();
    try {
        // 1. Tạo bản ghi cho combo chính trong bảng `combos`
        const newCombo = await Combo.create({
            ten_combo,
            mo_ta,
            img,
            gia_combo
        }, { transaction });

        // 2. Chuẩn bị dữ liệu cho các mục chi tiết trong bảng `combo_items`
        // Dùng `map` để biến mảng `productIds` thành một mảng các object phù hợp để chèn vào CSDL.
        const comboItemsData = productIds.map(id => ({
            combo_id: newCombo.id,
            product_id: id
        }));

        // 3. Chèn đồng loạt tất cả các mục chi tiết vào bảng `combo_items`
        // `bulkCreate` hiệu quả hơn nhiều so với việc tạo từng cái một trong vòng lặp.
        await ComboItem.bulkCreate(comboItemsData, { transaction });
        
        // 4. Nếu mọi thứ thành công, commit transaction
        await transaction.commit();

        // Lấy lại thông tin combo vừa tạo bao gồm cả sản phẩm để trả về
        const result = await Combo.findByPk(newCombo.id, {
            include: { model: Product, as: 'products' }
        });
        
        response.status(201).json(result);

    } catch (error) {
        // Nếu có lỗi, rollback transaction
        await transaction.rollback();
        console.error("Lỗi khi tạo combo:", error);
        response.status(400).json({ message: "Tạo combo thất bại.", error: error.message });
    }
};

/**
 * @description     Public: Lấy danh sách tất cả các combo đang được bán.
 * @route           GET /api/combos
 * @access          Public
 */
const getAllCombos = async (request, response) => {
    try {
        const combos = await Combo.findAll({
            where: { trang_thai: true }, // Chỉ lấy các combo đang hoạt động
            order: [['createdAt', 'DESC']],
            // Include để lấy thông tin chi tiết của các sản phẩm thuộc về mỗi combo.
            include: {
                model: Product,
                as: 'products', // 'products' là alias đã định nghĩa trong `models/index.js`
                attributes: ['id', 'ten_sach', 'img', 'gia_bia'], // Chỉ lấy các trường cần thiết của sản phẩm
                through: { attributes: [] } // Không lấy thông tin từ bảng trung gian `combo_items`
            }
        });
        response.status(200).json(combos);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách combo:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

/**
 * @description     Public: Lấy thông tin chi tiết của một combo bằng ID.
 * @route           GET /api/combos/:id
 * @access          Public
 */
const getComboById = async (request, response) => {
    try {
        const combo = await Combo.findByPk(request.params.id, {
            include: {
                model: Product,
                as: 'products',
                attributes: ['id', 'ten_sach', 'img', 'gia_bia', 'tac_gia'],
                through: { attributes: [] }
            }
        });

        if (combo) {
            response.status(200).json(combo);
        } else {
            response.status(404).json({ message: "Không tìm thấy combo." });
        }
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết combo:", error);
        response.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};


// Các hàm update và delete cho Admin có thể được thêm vào đây, logic sẽ tương tự như create.
// Ví dụ: khi update, có thể cần xóa các ComboItem cũ và tạo lại các ComboItem mới.

module.exports = {
    createCombo,
    getAllCombos,
    getComboById
    // Thêm các hàm update, delete ở đây
};