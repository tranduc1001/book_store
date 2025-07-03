const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser } = require('../controllers/authController');

// http://localhost:8080/api/auth/register
router.post('/register', registerUser);

// http://localhost:8080/api/auth/login
router.post('/login', loginUser);
router.post('/logout', logoutUser);
module.exports = router;