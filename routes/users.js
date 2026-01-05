const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * @openapi
 * /api/user/{id}/role:
 *   patch:
 *     summary: Update user role to admin
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       '200':
 *         description: User role updated to admin
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
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
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get all users information
 *     tags: [User]
 *     responses:
 *       '200':
 *         description: List of users
 *       '500':
 *         description: Internal server error
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
 * @openapi
 * /api/user-names:
 *   get:
 *     summary: Get all user names, ids, total collected quantity, and unit price from collection center
 *     tags: [User]
 *     responses:
 *       '200':
 *         description: List of user ids, fullnames, summed quantities, and unit price from collection center
 *       '500':
 *         description: Internal server error
 */
router.get('/user-names', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                r.id,
                r.fullname,
                COALESCE(SUM(cc.quantity), 0)::float AS total_quantity,
                COALESCE(MAX(c.price), 0)::float AS unit_price
            FROM register r
            LEFT JOIN created_collection cc ON cc.user_id = r.id
            LEFT JOIN collection_center c ON c.id = cc.collection_center_id
            WHERE r.role = 'user'
            GROUP BY r.id, r.fullname
            ORDER BY r.fullname
        `);
        res.status(200).json({ status: 'success', users: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch user names.' });
    }
});

module.exports = router;
