// File: /src/services/momoService.js

const axios = require('axios');
const crypto = require('crypto');

// Tự động tải các biến từ file .env
require('dotenv').config();

const partnerCode = process.env.MOMO_PARTNER_CODE;
const accessKey = process.env.MOMO_ACCESS_KEY;
const secretKey = process.env.MOMO_SECRET_KEY;
const apiEndpoint = process.env.MOMO_API_ENDPOINT;

/**
 * Tạo yêu cầu thanh toán MoMo.
 * @param {string} orderId - Mã đơn hàng của bạn.
 * @param {number} amount - Tổng số tiền cần thanh toán.
 * @param {string} orderInfo - Mô tả ngắn về đơn hàng.
 * @param {string} redirectUrl - URL để MoMo chuyển người dùng về sau khi thanh toán xong.
 * @param {string} ipnUrl - URL để MoMo gọi và báo kết quả thanh toán.
 * @param {string} extraData - Dữ liệu thêm (nếu cần), có thể để trống.
 * @returns {Promise<Object>} - Trả về object chứa payUrl và các thông tin khác từ MoMo.
 */
async function createMomoPayment({ orderId, amount, orderInfo, redirectUrl, ipnUrl, extraData = "" }) {
    const requestId = partnerCode + new Date().getTime();
    const requestType = "captureWallet";

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto.createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    const requestBody = {
        partnerCode,
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang: 'vi',
        extraData,
        requestType,
        signature,
    };

    try {
        const result = await axios.post(apiEndpoint, requestBody);
        return result.data; // Trả về toàn bộ response từ MoMo
    } catch (error) {
        console.error("Lỗi khi tạo yêu cầu thanh toán MoMo:", error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = { createMomoPayment };