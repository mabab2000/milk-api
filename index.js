
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const registerRouter = require('./register');
const migrate = require('./migrate');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');


const app = express();
app.use(express.json());

// Enable CORS for all origins
app.use(cors());

// Run DB migration on startup
migrate().then(() => {
	console.log('Migration complete.');
}).catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});

// Swagger setup
const swaggerOptions = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Milk Collection API',
			version: '1.0.0',
			description: 'API documentation for Milk Collection endpoints',
		},
	},
	apis: ['./register.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Register endpoint
app.use('/api', registerRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});
