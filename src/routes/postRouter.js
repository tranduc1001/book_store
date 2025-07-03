// File: /src/routes/postRouter.js
const express = require('express');
const { getPublicPosts } = require('../controllers/postController');
const router = express.Router();

router.route('/public').get(getPublicPosts);

module.exports = router;