const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post('/register', async (req, res) => {
    const { fullname, phone, username, password, passwordConfirmation } = req.body;
    if (!fullname || !phone || !username || !password || !passwordConfirmation) {
        return res.status(400).json({ status: 'error', message: 'All fields are required.' });
    }
    if (password !== passwordConfirmation) {
        return res.status(400).json({ status: 'error', message: 'Passwords do not match.' });
    }
    try {
        const userCheck = await pool.query('SELECT id FROM register WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Username already exists.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO register (id, fullname, phone, username, password, role) VALUES ($1, $2, $3, $4, $5, $6)',
            [uuidv4(), fullname, phone, username, hashedPassword, 'user']
        );
        res.status(201).json({ status: 'success', message: 'User registered successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Registration failed.' });
    }
});


/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ status: 'error', message: 'Username/phone and password are required.' });
    }
    try {
        const userResult = await pool.query('SELECT * FROM register WHERE username = $1 OR phone = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid username/phone or password.' });
        }
        const user = userResult.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ status: 'error', message: 'Invalid username/phone or password.' });
        }
        const { id, fullname, phone: ph, username: uname, role, created_at } = user;
        res.status(200).json({ status: 'success', message: 'Login successful.', user: { id, fullname, phone: ph, username: uname, role, created_at } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Login failed.' });
    }
});

module.exports = router;
