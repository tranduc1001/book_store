// File: /src/controllers/provinceController.js
const axios = require('axios');

const API_HOST = "https://esgoo.net/api-tinhthanh";

const getProvinces = async (req, res) => {
    try {
        const response = await axios.get(`${API_HOST}/1/0.htm`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách tỉnh/thành phố" });
    }
};

const getDistricts = async (req, res) => {
    try {
        const provinceId = req.params.provinceId;
        const response = await axios.get(`${API_HOST}/2/${provinceId}.htm`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách quận/huyện" });
    }
};

const getWards = async (req, res) => {
    try {
        const districtId = req.params.districtId;
        const response = await axios.get(`${API_HOST}/3/${districtId}.htm`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách phường/xã" });
    }
};

module.exports = { getProvinces, getDistricts, getWards };