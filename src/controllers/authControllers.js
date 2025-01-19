const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const register = async (req, res) => {
	try {
		const email = req.body.email;

		//check if user exists
		const existingUser = await User.findOne({
			where: {
				email: email,
			},
		});

		if (userExists) {
			return res
				.status(400)
				.json({ error: "User with this email already exists" });
		}

		//if not, get passwd and generate referral
		const password = await bcrypt.hash(req.body.password, 10);
		const referral_code = await generateUniqueReferralCode(email);

		const token = jwt.sign({ email: req.body.email }, process.env.JWT_KEY, {
			expiresIn: "1d",
		});

		await User.create({
			email: email,
			password: password,
			referral_code: referral_code,
		});

		res.status(201).json({
			message: "User was created succesfully.",
		});
	} catch (error) {
		res.status(500).json({ error: error });
	}
};

const login = async (req, res) => {
	try {
		const email = req.body.email;
		const password = req.body.password;

		//get existing user if there is one
		const existingUser = await User.findOne({
			where: {
				email: email,
			},
		});

		if (!existingUser) {
			return res.status(404).json({ error: "No user with these credentials" });
		}

		if (existingUser.status == "notActive") {
			return res
				.status(403)
				.json({ error: "Your account wasn't activated yet!" });
		}

		if (existingUser.status == "suspended") {
			const timeNow = new Date();
			if (timeNow > existingUser.locked_until) {
				existingUser.update({
					status: "active",
					locked_until: null,
					failed_login_attempts: 0,
				});
			} else {
				return res
					.status(403)
					.json({ error: `You need wait until ${lockedUntil}` });
			}
		}

		const isPasswordValid = await bcrypt.compare(
			password,
			existingUser.password
		);

		if (!isPasswordValid) {
			const counter = existingUser.failed_login_attempts + 1;

			if (counter === 3) {
				const oneHourFromNow = new Date();
				oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

				existingUser.update({
					status: "suspended",
					locked_until: oneHourFromNow,
					failed_login_attempts: counter,
				});

				return res
					.status(403)
					.json({ error: `You need wait until ${lockedUntil}` });
			}

			existingUser.update({
				failed_login_attempts: counter,
			});

			const leftAttempts = 3 - counter;
			return res.status(401).json({
				error: `Invalid password. You have ${leftAttempts} attempts left.`,
			});
		}

		// If the password is valid, generate a JWT token
		const token = jwt.sign(
			{ userId: existingUser.id, email: existingUser.email },
			process.env.JWT_KEY, // Secret key
			{ expiresIn: "6h" }
		);

		existingUser.update({
			failed_login_attempts: 0,
			locked_until: null,
		});

		res.status(200).json({ message: "Login successful", token: token });
	} catch (error) {
		console.error("Error during login:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

module.exports = { register, login };
