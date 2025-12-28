const express = require('express');
const { register, login, verify } = require('../controllers/authController');

const router = express.Router();

// POST /auth/register
router.post('/register', register);

// POST /auth/login
router.post('/login', login);

// POST /auth/verify
router.post('/verify', verify);

module.exports = router;
