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

//routes for register, login, activation and passw reset
const authRoutes = require("./src/routes/authRoutes");
app.use("/auth", authRoutes);

//routes for account, profiles, subscription
//const userRoutes = require("./src/routes/userRoutes");
//app.use("/user", userRoutes);

//routes for movies
const movieRoutes = require("./src/routes/movieRoutes");
app.use("/movie", movieRoutes);

//routes for series, season and episodes
const seriesRoutes = require("./src/routes/seriesRoutes");
app.use("/series", seriesRoutes);

//routes for watchList
const watchListRoutes = require("./src/routes/watchListRoutes");
app.use("/watchlist", watchListRoutes);

//routes for watchHistory
const watchHistoryRoutes = require("./src/routes/watchHistoryRoutes");
app.use("./watchHistory", watchHistoryRoutes);

app.use((error, req, res) => {
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
