const { Sequelize } = require("sequelize");
require('dotenv').config(); // Load environment variables from .env file

const sequelize = new Sequelize({
	database: process.env.DB_NAME || "netflix",
	username: process.env.DB_USER || "postgres",
	password: process.env.DB_PASSWORD || "postgres",
	host: process.env.DB_HOST || "localhost",
	port: parseInt(process.env.DB_PORT || "5432"),
	dialect: "postgres",
	logging: process.env.NODE_ENV !== 'production',
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000
	}
});

module.exports = sequelize;
