const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * @openapi
 * /api/payment:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - farmer_id
 *               - quantity
 *               - amount
 *               - payment_method
 *             properties:
 *               farmer_id:
 *                 type: string
 *               quantity:
 *                 type: number
 *               amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Payment created successfully
 *       '400':
 *         description: Bad request - missing or invalid fields
 *       '500':
 *         description: Internal server error
 */
router.post('/payment', async (req, res) => {
  const body = req.body || {};
  const { farmer_id, quantity, amount, payment_method } = body;
  if (!farmer_id || quantity === undefined || amount === undefined || !payment_method) {
    return res.status(400).json({ status: 'error', message: 'farmer_id, quantity, amount and payment_method are required.' });
  }
  try {
    // Optional: validate farmer exists
    const user = await pool.query('SELECT id FROM register WHERE id = $1', [farmer_id]);
    if (user.rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Farmer not found.' });
    }
    const result = await pool.query(
      'INSERT INTO payments (id, farmer_id, quantity, amount, payment_method) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [uuidv4(), farmer_id, quantity, amount, payment_method]
    );
    res.status(201).json({ status: 'success', payment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to create payment.' });
  }
});

/**
 * @openapi
 * /api/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payment]
 *     responses:
 *       '200':
 *         description: List of payments
 *       '500':
 *         description: Internal server error
 */
router.get('/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
    res.status(200).json({ status: 'success', payments: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to retrieve payments.' });
  }
});

/**
 * @openapi
 * /api/payment/{id}:
 *   delete:
 *     summary: Delete a payment
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       '200':
 *         description: Payment deleted successfully
 *       '404':
 *         description: Payment not found
 *       '500':
 *         description: Internal server error
 */
router.delete('/payment/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const del = await pool.query('DELETE FROM payments WHERE id = $1 RETURNING *', [id]);
    if (del.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Payment not found.' });
    }
    res.status(200).json({ status: 'success', message: 'Payment deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to delete payment.' });
  }
});

module.exports = router;
