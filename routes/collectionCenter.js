const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

const isValidUUID = (id) => {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
};

/**
 * @openapi
 * /api/collection-center/{id}:
 *   patch:
 *     summary: Update a collection center
 *     tags: [CollectionCenter]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection center ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               manager:
 *                 type: string
 *               phone:
 *                 type: string
 *               price:
 *                 type: number
 *               location:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Collection center updated successfully
 *       '400':
 *         description: Bad request - invalid id or no fields to update
 *       '404':
 *         description: Collection center not found
 *       '500':
 *         description: Internal server error
 */
router.patch('/collection-center/:id', async (req, res) => {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        return res.status(400).json({ status: 'error', message: 'Invalid collection center id.' });
    }
    const body = req.body || {};
    const { name, code, manager, phone, price, location } = body;
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
 * @openapi
 * /api/collection-center/{id}:
 *   delete:
 *     summary: Delete a collection center
 *     tags: [CollectionCenter]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection center ID
 *     responses:
 *       '200':
 *         description: Collection center deleted successfully
 *       '400':
 *         description: Bad request - invalid id
 *       '404':
 *         description: Collection center not found
 *       '500':
 *         description: Internal server error
 */
router.delete('/collection-center/:id', async (req, res) => {
    const { id } = req.params;
    if (!isValidUUID(id)) {
        return res.status(400).json({ status: 'error', message: 'Invalid collection center id.' });
    }
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
 * @openapi
 * /api/collection-centers:
 *   get:
 *     summary: Get all collection centers
 *     tags: [CollectionCenter]
 *     responses:
 *       '200':
 *         description: A list of collection centers
 *       '500':
 *         description: Internal server error
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
 * @openapi
 * /api/collection-center:
 *   post:
 *     summary: Create a new collection center
 *     tags: [CollectionCenter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - manager
 *               - phone
 *               - price
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               manager:
 *                 type: string
 *               phone:
 *                 type: string
 *               price:
 *                 type: number
 *               location:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Collection center created successfully
 *       '400':
 *         description: Bad request - missing or duplicate fields
 *       '500':
 *         description: Internal server error
 */
router.post('/collection-center', async (req, res) => {
    const body = req.body || {};
    const { name, code, manager, phone, price, location } = body;
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
