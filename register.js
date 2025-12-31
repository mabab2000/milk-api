const express = require('express');
const router = express.Router();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const collectionCenterRoutes = require('./routes/collectionCenter');
const collectionsRoutes = require('./routes/collections');
const paymentsRoutes = require('./routes/payments');

router.use('/', authRoutes);
router.use('/', userRoutes);
router.use('/', collectionCenterRoutes);
router.use('/', collectionsRoutes);
router.use('/', paymentsRoutes);

module.exports = router;
