const express = require('express');
const { login, me } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/login', authLimiter, login);
router.get('/me', authMiddleware, me);

module.exports = router;
