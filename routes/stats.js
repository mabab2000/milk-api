const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * @openapi
 * /api/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Stats]
 *     responses:
 *       '200':
 *         description: Dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalRes = await pool.query("SELECT COUNT(*)::int AS total FROM register WHERE role = 'user'");
    const registeredFarmers = totalRes.rows[0].total || 0;

    const activeRes = await pool.query('SELECT COUNT(DISTINCT user_id)::int AS active FROM created_collection');
    const activeFarmers = activeRes.rows[0].active || 0;

    // total_farmers should reflect active farmers per request
    const totalFarmers = activeFarmers;

    const todayRes = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0)::float AS today_liters
      FROM created_collection
      WHERE created_at::date = CURRENT_DATE
    `);
    const todaysCollection = parseFloat(todayRes.rows[0].today_liters) || 0;

    const monthRes = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0)::float AS month_liters
      FROM created_collection
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
        AND created_at < (date_trunc('month', CURRENT_DATE) + interval '1 month')
    `);
    const monthlyCollection = parseFloat(monthRes.rows[0].month_liters) || 0;

    const lowQualRes = await pool.query(`
      SELECT COUNT(*)::int AS low_count
      FROM created_collection
      WHERE quality IS NOT NULL
        AND (
          LOWER(quality) LIKE '%low%'
          OR LOWER(quality) LIKE '%poor%'
          OR LOWER(quality) LIKE '%bad%'
        )
    `);
    const lowQualityDeliveries = lowQualRes.rows[0].low_count || 0;

    const revenueRes = await pool.query(`
      SELECT COALESCE(SUM(amount), 0)::float AS month_revenue
      FROM payments
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
        AND created_at < (date_trunc('month', CURRENT_DATE) + interval '1 month')
    `);
    const monthlyRevenue = parseFloat(revenueRes.rows[0].month_revenue) || 0;

    res.status(200).json({
      status: 'success',
      data: {
        total_farmers: totalFarmers,
        registered_farmers: registeredFarmers,
        active_farmers: activeFarmers,
        todays_collection_liters: todaysCollection,
        monthly_collection_liters: monthlyCollection,
        low_quality_deliveries: lowQualityDeliveries,
        monthly_revenue: monthlyRevenue
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch stats.' });
  }
});

module.exports = router;
