// File: /src/routes/dashboardRouter.js

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');

// ==========================================================
// ============== SỬA LẠI DÒNG REQUIRE Ở ĐÂY ================
// ==========================================================
// Dùng destructuring { } để lấy đúng hàm từ đối tượng module.exports
const { getDashboardStats } = require('../controllers/dashboardController');
// ==========================================================


// GET /api/dashboard/stats
// Đảm bảo getDashboardStats ở đây là một hàm, không phải undefined
router.get('/stats', protect, admin, getDashboardStats);

module.exports = router;