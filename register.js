
const express = require('express');
const router = express.Router();
const pool = require('./db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');


/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - phone
 *               - username
 *               - password
 *               - passwordConfirmation
 *             properties:
 *               fullname:
 *                 type: string
 *               phone:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               passwordConfirmation:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing username or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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
        // Check if username already exists
        const userCheck = await pool.query('SELECT id FROM register WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Username already exists.' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Insert user with UUID
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username or phone
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     fullname:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                     created_at:
 *                       type: string
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ status: 'error', message: 'Username/phone and password are required.' });
    }
    try {
        // Allow login with username or phone
        const userResult = await pool.query('SELECT * FROM register WHERE username = $1 OR phone = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid username/phone or password.' });
        }
        const user = userResult.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ status: 'error', message: 'Invalid username/phone or password.' });
        }
        // Return user info except password
        const { id, fullname, phone, username: uname, role, created_at } = user;
        res.status(200).json({
            status: 'success',
            message: 'Login successful.',
            user: { id, fullname, phone, username: uname, role, created_at }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Login failed.' });
    }
});

module.exports = router;
