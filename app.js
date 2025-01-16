const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");

const port = 8081;

const app = express();
app.use(helmet());
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cors({ origin: true, credentials: true }));

app.options("*", cors());

const authRoutes = require("./src/routes/authRoutes");
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
	const status = error.statusCode || 500;
	const message = error.message;
	const data = error.data;
	res.status(status).json({ message: message, data: data });
});

app.use((req, res) => {
	res.status(404).json({ message: "Route not found" });
});

app.listen(port, () => console.log(`Server is running on port ${port}`));

process.on("unhandledRejection", (error) => {
	console.error("Unhandled Rejection:", error);
});
