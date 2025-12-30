const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * @swagger
 * /api/collection-center/{id}:
 *   patch:
 *     summary: Update a collection center
 *     tags: [CollectionCenter]
 */
router.patch('/collection-center/:id', async (req, res) => {
    const { id } = req.params;
    const { name, code, manager, phone, price, location } = req.body;
    try {
        const center = await pool.query('SELECT * FROM collection_center WHERE id = $1', [id]);
        if (center.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Collection center not found.' });
        }
        const updates = [];
        const values = [];
        let idx = 1;
        if (name) { updates.push(`name = $${idx++}`); values.push(name); }
        if (code) { updates.push(`code = $${idx++}`); values.push(code); }
        if (manager) { updates.push(`manager = $${idx++}`); values.push(manager); }
        if (phone) { updates.push(`phone = $${idx++}`); values.push(phone); }
        if (price !== undefined) { updates.push(`price = $${idx++}`); values.push(price); }
        if (location) { updates.push(`location = $${idx++}`); values.push(location); }
        if (updates.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No fields to update.' });
        }
        values.push(id);
        const updateQuery = `UPDATE collection_center SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
        const result = await pool.query(updateQuery, values);
        res.status(200).json({ status: 'success', message: 'Collection center updated successfully.', center: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Failed to update collection center.' });
    }
});


/**
 * @swagger
 * /api/collection-center/{id}:
 *   delete:
 *     summary: Delete a collection center
 *     tags: [CollectionCenter]
 */
router.delete('/collection-center/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const del = await pool.query('DELETE FROM collection_center WHERE id = $1 RETURNING *', [id]);
        if (del.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Collection center not found.' });
        }
        res.status(200).json({ status: 'success', message: 'Collection center deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Failed to delete collection center.' });
    }
});


/**
 * @swagger
 * /api/collection-centers:
 *   get:
 *     summary: Get all collection centers
 *     tags: [CollectionCenter]
 */
router.get('/collection-centers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM collection_center ORDER BY created_at DESC');
        res.status(200).json({ status: 'success', centers: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Failed to retrieve collection centers.' });
    }
});


/**
 * @swagger
 * /api/collection-center:
 *   post:
 *     summary: Create a new collection center
 *     tags: [CollectionCenter]
 */
router.post('/collection-center', async (req, res) => {
    const { name, code, manager, phone, price, location } = req.body;
    if (!name || !code || !manager || !phone || price === undefined || !location) {
        return res.status(400).json({ status: 'error', message: 'All fields are required.' });
    }
    try {
        const codeCheck = await pool.query('SELECT id FROM collection_center WHERE code = $1', [code]);
        if (codeCheck.rows.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Code already exists.' });
        }
        const result = await pool.query(
            'INSERT INTO collection_center (id, name, code, manager, phone, price, location) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [uuidv4(), name, code, manager, phone, price, location]
        );
        res.status(201).json({ status: 'success', message: 'Collection center created successfully.', center: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Failed to create collection center.' });
    }
});

module.exports = router;
