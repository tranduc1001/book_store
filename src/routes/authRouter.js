const express = require('express');
const router = express.Router();
const { registerUser,
        loginUser,
        logoutUser,
        forgotPassword, // import hàm mới
        resetPassword 
    } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// <<< THÊM 2 ROUTE MỚI >>>
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;