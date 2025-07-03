const express = require('express');
const router = express.Router();
const db = require('../models');
const { protect, admin } = require('../middlewares/authMiddleware');

// GET /api/roles - Lấy danh sách tất cả vai trò
router.get('/', protect, admin, async (req, res) => {
    try {
        const roles = await db.Role.findAll();
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy vai trò.' });
    }
});

module.exports = router;