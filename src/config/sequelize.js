const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
	database: process.env.db_name,
	username: process.env.db_username,
	password: process.env.db_password,
	host: process.env.db_host,
	dialect: "postgres",
});

module.exports = sequelize;
