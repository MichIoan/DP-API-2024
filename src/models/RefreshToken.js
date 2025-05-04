const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const BaseModel = require("./BaseModel");

/**
 * RefreshToken model for managing JWT refresh tokens
 * Extends BaseModel to inherit common functionality
 */
class RefreshToken extends BaseModel {
    /**
     * Check if token is expired
     * @returns {boolean} True if token is expired
     */
    isExpired() {
        return new Date() > this.expires_at;
    }
}

RefreshToken.initialize(
    {
        token_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        token: {
            type: DataTypes.STRING(500),
            allowNull: false,
            unique: true,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        is_revoked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        ip_address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        user_agent: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    },
    {
        timestamps: false,
        indexes: [
            {
                name: 'refresh_token_user_id',
                fields: ['user_id']
            },
            {
                name: 'refresh_token_token',
                fields: ['token']
            }
        ]
    },
    sequelize
);

module.exports = RefreshToken;
