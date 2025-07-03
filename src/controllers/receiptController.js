// File: /src/controllers/receiptController.js (Đã sửa lại)

const db = require('../models');
const { sequelize } = require('../models');

const createReceipt = async (req, res) => {
    const { ten_nha_cung_cap, ghi_chu, items } = req.body;
    const user_id = req.user.id;

    if (!ten_nha_cung_cap || !ten_nha_cung_cap.trim()) {
        return res.status(400).json({ message: 'Vui lòng cung cấp tên nhà cung cấp.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Vui lòng thêm ít nhất một sản phẩm vào phiếu nhập.' });
    }

    const t = await sequelize.transaction();

    try {
        let tong_tien_phieu_nhap = 0;
        const receiptItemsData = items.map(item => {
            if (!item.product_id || !item.so_luong_nhap || item.so_luong_nhap <= 0 || item.gia_nhap === undefined || item.gia_nhap < 0) {
                throw new Error('Dữ liệu sản phẩm không hợp lệ. Vui lòng kiểm tra lại.');
            }
            const thanh_tien = (parseFloat(item.gia_nhap) - (parseFloat(item.chiet_khau) || 0)) * parseInt(item.so_luong_nhap);
            tong_tien_phieu_nhap += thanh_tien;
            return { ...item, thanh_tien };
        });

        // 5. Tạo phiếu nhập hàng chính
        const newReceipt = await db.Receipt.create({
            user_id,
            ten_nha_cung_cap: ten_nha_cung_cap.trim(),
            ghi_chu,
            tong_tien_phieu_nhap
        }, { transaction: t });
        
        // ====================================================================
        // ======================= THAY ĐỔI QUAN TRỌNG ======================
        // ====================================================================
        // Lấy ID của phiếu nhập vừa tạo một cách tường minh
        const receiptId = newReceipt.id;
        if (!receiptId) {
             throw new Error('Không thể tạo phiếu nhập hoặc lấy ID của phiếu nhập.');
        }

        // 6. Lặp qua các sản phẩm đã chuẩn bị để tạo chi tiết
        for (const item of receiptItemsData) {
            // Tạo chi tiết phiếu nhập với ID đã lấy được
            await db.ReceiptItem.create({
                receipt_id: receiptId, // SỬ DỤNG BIẾN ID TƯỜNG MINH
                product_id: item.product_id,
                so_luong_nhap: item.so_luong_nhap,
                gia_nhap: item.gia_nhap,
                chiet_khau: item.chiet_khau || 0,
                thanh_tien: item.thanh_tien
            }, { transaction: t });
            
            await db.Product.increment('so_luong_ton_kho', {
                by: item.so_luong_nhap,
                where: { id: item.product_id },
                transaction: t
            });
        }
        // ====================================================================

        await t.commit();
        // Trả về đối tượng đã tạo, đã có đầy đủ thông tin sau khi commit
        res.status(201).json({ message: 'Tạo phiếu nhập hàng thành công!', receipt: newReceipt });

    } catch (error) {
        await t.rollback();
        console.error("Lỗi khi tạo phiếu nhập hàng:", error);
        res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra ở server.' });
    }
};

module.exports = {
    createReceipt
};