const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * @swagger
 * /api/created-collection:
 *   post:
 *     summary: Record a created collection
 *     tags: [Collection]
 */
router.post('/created-collection', async (req, res) => {
    const { collection_center_id, user_id, quantity, quality } = req.body;
    if (!collection_center_id || !user_id || quantity === undefined) {
        return res.status(400).json({ status: 'error', message: 'collection_center_id, user_id and quantity are required.' });
    }
    try {
        const center = await pool.query('SELECT id FROM collection_center WHERE id = $1', [collection_center_id]);
        if (center.rows.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Collection center not found.' });
        }
        const user = await pool.query('SELECT id FROM register WHERE id = $1', [user_id]);
        if (user.rows.length === 0) {
            return res.status(400).json({ status: 'error', message: 'User not found.' });
        }
        const result = await pool.query(
            'INSERT INTO created_collection (id, collection_center_id, user_id, quantity, quality) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [uuidv4(), collection_center_id, user_id, quantity, quality]
        );
        res.status(201).json({ status: 'success', message: 'Created collection recorded successfully.', collection: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Failed to record created collection.' });
    }
});


/**
 * @swagger
 * /api/created-collections/recent:
 *   get:
 *     summary: Get the most recent three created collections
 *     tags: [Collection]
 */
router.get('/created-collections/recent', async (req, res) => {
    try {
        const query = `
            SELECT cc.*, r.fullname AS user_fullname, c.name AS center_name
            FROM created_collection cc
            JOIN register r ON cc.user_id = r.id
            JOIN collection_center c ON cc.collection_center_id = c.id
            ORDER BY cc.created_at DESC
            LIMIT 3
        `;
        const result = await pool.query(query);
        const items = result.rows.map(row => {
            const date = new Date(row.created_at);
            const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            return {
                quantity: `${row.quantity} L`,
                user: row.user_fullname,
                date_center: `${formattedDate} • Center: ${row.center_name}`,
                quality: row.quality ? row.quality.toUpperCase() : null,
            };
        });
        res.status(200).json({ status: 'success', collections: items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch recent collections.' });
    }
});

module.exports = router;
