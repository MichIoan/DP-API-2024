const db = require("../db");

const profileController = {
	getAllProfiles: async (req, res) => {
		const { userId } = req.params;

		if (!userId) {
			return res.status(400).json({
				message: "Please provide a valid userId to retrieve profiles.",
			});
		}

		try {
			const query = `
                SELECT * FROM "profile_details"
                WHERE user_id = $1;
                `;

			const result = await db.query(query, [userId]);

			if (result.rows.length === 0) {
				return res.status(404).json({
					message: "No profiles found for the specified user.",
				});
			}

			return res.status(200).json(result.rows);
		} catch (error) {
			console.error(error);
			return res.status(500).json({
				message: "Internal server error",
				error: error.message,
			});
		}
	},

	createProfile: async (req, res) => {
		const { userId, name, age, photoPath } = req.body;

		if (!userId || !name) {
			return res.status(400).json({
				message: "Please provide both userId and name to create a profile.",
			});
		}

		try {
			const query = `CALL "CreateProfile"($1, $2, $3, $4, $5);`;

			const isChildProfile = age && age < 18;
			const values = [
				userId,
				name,
				age || null,
				photoPath || null,
				isChildProfile,
			];

			await db.query(query, values);

			return res.status(201).json({
				message: "Profile created successfully.",
			});
		} catch (error) {
			console.error(error);

			if (error.message.includes("unique constraint violation")) {
				return res.status(400).json({
					message: "A profile with this userId already exists.",
				});
			}

			return res.status(500).json({
				message: "Internal server error",
				error: error.message,
			});
		}
	},

	getProfileById: async (req, res) => {
		const { profileId } = req.params;

		if (!profileId) {
			return res.status(400).json({
				message: "Please provide a valid profileId.",
			});
		}

		try {
			const query = `
            SELECT * FROM "profile_details" 
            WHERE profile_id = $1 LIMIT 1;
            `;
			const values = [profileId];

			const result = await db.query(query, values);

			if (result.rows.length === 0) {
				return res.status(404).json({
					message: "Profile not found.",
				});
			}

			return res.status(200).json({
				message: "Profile retrieved successfully.",
				profile: result.rows[0],
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({
				message: "Internal server error",
				error: error.message,
			});
		}
	},

	updateProfile: async (req, res) => {
		const { profileId } = req.params;
		const {
			name,
			age,
			photoPath,
			contentType,
			minimumAge,
			viewingClassification,
		} = req.body;

		if (!profileId) {
			return res.status(400).json({
				message: "Please provide a valid profileId.",
			});
		}

		const updateFields = [];
		const values = [];

		if (name) {
			updateFields.push("name = $" + (values.length + 1));
			values.push(name);
		}
		if (age !== undefined) {
			updateFields.push("age = $" + (values.length + 1));
			values.push(age);
		}
		if (photoPath) {
			updateFields.push("photo_path = $" + (values.length + 1));
			values.push(photoPath);
		}

		if (updateFields.length === 0) {
			return res.status(400).json({
				message: "Please provide at least one field to update.",
			});
		}

		try {
			const profileQuery = `
                UPDATE "Profiles"
                SET ${updateFields.join(", ")}
                WHERE profile_id = $${values.length + 1}
                RETURNING *;
            `;
			values.push(profileId);

			const profileResult = await db.query(profileQuery, values);

			if (profileResult.rows.length === 0) {
				return res.status(404).json({
					message: "Profile not found.",
				});
			}

			if (contentType || minimumAge || viewingClassification) {
				const preferenceFields = [];
				const preferenceValues = [];

				if (contentType) {
					preferenceFields.push(
						"content_type = $" + (preferenceValues.length + 1)
					);
					preferenceValues.push(contentType);
				}
				if (minimumAge !== undefined) {
					preferenceFields.push(
						"minimum_age = $" + (preferenceValues.length + 1)
					);
					preferenceValues.push(minimumAge);
				}
				if (viewingClassification) {
					preferenceFields.push(
						"viewing_classification = $" + (preferenceValues.length + 1)
					);
					preferenceValues.push(viewingClassification);
				}

				if (preferenceFields.length > 0) {
					const preferenceQuery = `
                        UPDATE "Preferences"
                        SET ${preferenceFields.join(", ")}
                        WHERE profile_id = $${preferenceValues.length + 1}
                        RETURNING *;
                    `;
					preferenceValues.push(profileId);

					await db.query(preferenceQuery, preferenceValues);
				}
			}

			return res.status(200).json({
				message: "Profile updated successfully.",
				profile: profileResult.rows[0],
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({
				message: "Internal server error",
				error: error.message,
			});
		}
	},

	deleteProfile: async (req, res) => {
		const { profileId } = req.params;

		if (!profileId) {
			return res.status(400).json({
				message: "Please provide a valid profileId to delete.",
			});
		}

		try {
			const deleteProfileQuery = `
                DELETE FROM "Profiles"
                WHERE profile_id = $1
                RETURNING *;
            `;
			const result = await db.query(deleteProfileQuery, [profileId]);

			if (result.rows.length === 0) {
				return res.status(404).json({
					message: "Profile not found.",
				});
			}

			return res.status(200).json({
				message: "Profile deleted successfully.",
				profile: result.rows[0],
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({
				message: "Internal server error",
				error: error.message,
			});
		}
	},
};

module.exports = profileController;
