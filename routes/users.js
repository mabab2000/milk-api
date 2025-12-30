const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * @swagger
 * /api/user/{id}/role:
 *   patch:
 *     summary: Update user role to admin
 *     tags: [User]
 */
router.patch('/user/:id/role', async (req, res) => {
    const { id } = req.params;
    try {
        const userResult = await pool.query('SELECT * FROM register WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }
        await pool.query('UPDATE register SET role = $1 WHERE id = $2', ['admin', id]);
        res.status(200).json({ status: 'success', message: 'User role updated to admin.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Failed to update user role.' });
    }
});


/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users information
 *     tags: [User]
 */
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, fullname, phone, username, role, created_at FROM register');
        res.status(200).json({ status: 'success', users: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch users.' });
    }
});


/**
 * @swagger
 * /api/user-names:
 *   get:
 *     summary: Get all user names and ids
 *     tags: [User]
 */
router.get('/user-names', async (req, res) => {
    try {
        const result = await pool.query("SELECT id, fullname FROM register WHERE role = 'user'");
        res.status(200).json({ status: 'success', users: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch user names.' });
    }
});

module.exports = router;
