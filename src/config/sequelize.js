const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
	database: "netflix",
	username: "postgres",
	password: "root",
	host: "localhost",
	dialect: "postgres",
});

module.exports = sequelize;
