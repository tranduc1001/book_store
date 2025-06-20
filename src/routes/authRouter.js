const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// http://localhost:8080/api/auth/register
router.post('/register', registerUser);

// http://localhost:8080/api/auth/login
router.post('/login', loginUser);

module.exports = router;