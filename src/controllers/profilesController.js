const { Profile } = require('../models'); 

const profileController = {
    getAllProfiles: async (req, res) => {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                message: "Please provide a valid userId to retrieve profiles.",
            });
        }

        try {
            const profiles = await Profile.query(
                `SELECT * FROM profile_details WHERE user_id = :userId`,
                {
                    replacements: { userId },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            if (!profiles || profiles.length === 0) {
                return res.status(404).json({
                    message: "No profiles found for the specified user.",
                });
            }

            return res.status(200).json(profiles);
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Internal server error",
                error: error.message,
            });
        }
    },

    createProfile: async (req, res) => {
        const { userId, name, age, photoPath, language, dateOfBirth } = req.body;

        if (!userId || !name) {
            return res.status(400).json({
                message: "Please provide both userId and name to create a profile.",
            });
        }

        try {
            const result = await Profile.query(
                `CALL CreateProfile(:userId, :name, :age, :photoPath, :language, :dateOfBirth)`,
                {
                    replacements: { userId, name, age, photoPath, language, dateOfBirth },
                    type: sequelize.QueryTypes.RAW
                }
            );

            return res.status(201).json({
                message: "Profile created successfully.",
                profile: result, 
            });
        } catch (error) {
            console.error(error);
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
                message: "Please provide a valid profileId to retrieve the profile.",
            });
        }

        try {
            const profile = await Profile.query(
                `SELECT * FROM profile_details WHERE profile_id = :profileId`,
                {
                    replacements: { profileId },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            if (!profile || profile.length === 0) {
                return res.status(404).json({
                    message: "Profile not found with the specified ID.",
                });
            }

            return res.status(200).json(profile[0]);
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
        const { name, age, photoPath, language, dateOfBirth } = req.body;

        if (!profileId) {
            return res.status(400).json({
                message: "Please provide a valid profileId to update the profile.",
            });
        }

        try {
            const [updatedRowsCount] = await Profile.query(
                `UPDATE "Profiles" 
                 SET name = :name, age = :age, photo_path = :photoPath, language = :language, date_of_birth = :dateOfBirth 
                 WHERE profile_id = :profileId`,
                {
                    replacements: { name, age, photoPath, language, dateOfBirth, profileId },
                    type: sequelize.QueryTypes.UPDATE
                }
            );

            if (updatedRowsCount === 0) {
                return res.status(404).json({
                    message: "Profile not found or no updates made.",
                });
            }

            return res.status(200).json({
                message: "Profile updated successfully.",
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
                message: "Please provide a valid profileId to delete the profile.",
            });
        }

        try {
            const deletedRowsCount = await Profile.destroy({ where: { profile_id: profileId } });

            if (deletedRowsCount === 0) {
                return res.status(404).json({
                    message: "Profile not found.",
                });
            }

            return res.status(200).json({
                message: "Profile deleted successfully.",
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
