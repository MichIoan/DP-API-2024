const { Subscription, User } = require("../models");

const subscriptionController = {
    getAllSubscriptions: async (req, res) => {
        try {
            const subscriptions = await Subscription.findAll({
                include: [
                    {
                        model: User,
                        attributes: ["email", "has_discount", "referral_id"], 
                    },
                ],
            });
    
            if (!subscriptions.length) {
                return res.response(req, res, 404, {message: "No subscriptions found."});
            }
    
            return res.response(req, res, 200, subscriptions);
        } catch (error) {
            console.error(error);
            return res.response(req, res, 500, {error: error.message});
        }
    },

    updateSubscription: async (req, res) => {
        const { subscriptionId } = req.params;
        const { new_plan } = req.body;
    
        if (!new_plan) {
            return res.response(req, res, 400, {
                message: "Please provide a new plan to update the subscription.",
            });
        }
    
        try {
            const subscription = await Subscription.findByPk(subscriptionId);
    
            if (!subscription) {
                return res.response(req, res, 404, { message: "Subscription not found." });
            }
    
            await sequelize.query(
                `CALL updateSubscription(:user_id, :new_plan)`,
                {
                    replacements: {
                        user_id: subscription.user_id,
                        new_plan: new_plan,
                    },
                    type: sequelize.QueryTypes.RAW,
                }
            );
    
            return res.response(req, res, 200, {
                message: "Subscription updated successfully.",
                updated_subscription: subscription,
            });
        } catch (error) {
            console.error(error);
            return res.response(req, res, 500, {error: error.message});
        }
    },    
    
    deleteSubscription: async (req, res) => {
        const { subscriptionId } = req.params;

        try {
            const subscription = await Subscription.findByPk(subscriptionId);

            if (!subscription) {
                return res.response(req, res, 404, {message: "Subscription not found."});
            }

            await subscription.destroy();

            return res.response(req, res, 200, { message: "Subscription deleted successfully." });
        } catch (error) {
            console.error(error);
            return res.response(req, res, 500, {error: error.message});
        }
    },
};

module.exports = subscriptionController;
