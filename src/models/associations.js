/**
 * Model associations for the Netflix API
 * This file sets up all the relationships between models
 */

// Import models directly to avoid circular dependencies
const User = require('./User');
const Profile = require('./Profile');
const { Subscription } = require('./Subscription');
const Series = require('./Series');
const Season = require('./Season');
const Media = require('./Media');
const Genre = require('./Genre');
const MediaGenres = require('./MediaGenres');
const { WatchHistory } = require('./WatchHistory');
const WatchList = require('./WatchList');
const RefreshToken = require('./RefreshToken');
const Subtitle = require('./Subtitle');
const ViewingClassification = require('./ViewingClassification');

// User associations
User.hasMany(Profile, { foreignKey: 'user_id' });
User.hasOne(Subscription, { foreignKey: 'user_id' });
User.hasMany(User, { as: 'ReferredUsers', foreignKey: 'referral_id' });
User.belongsTo(User, { as: 'Referrer', foreignKey: 'referral_id' });
User.hasMany(RefreshToken, { foreignKey: 'user_id' });

// RefreshToken associations
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

// Profile associations
Profile.belongsTo(User, { foreignKey: 'user_id' });
Profile.hasMany(WatchHistory, { foreignKey: 'profile_id' });
Profile.hasMany(WatchList, { foreignKey: 'profile_id' });

// Subscription associations
Subscription.belongsTo(User, { foreignKey: 'user_id' });

// Series associations
Series.hasMany(Season, { foreignKey: 'series_id' });

// Season associations
Season.belongsTo(Series, { foreignKey: 'series_id' });
Season.hasMany(Media, { foreignKey: 'season_id' });

// Media associations
Media.belongsTo(Season, { foreignKey: 'season_id' });
Media.hasMany(Subtitle, { foreignKey: 'media_id' });
Media.hasMany(WatchHistory, { foreignKey: 'media_id' });
Media.hasMany(WatchList, { foreignKey: 'media_id' });

// Many-to-many: Media and Genres using MediaGenres junction table
Media.belongsToMany(Genre, { 
    through: MediaGenres,
    foreignKey: 'media_id',
    otherKey: 'genre_id'
});

Genre.belongsToMany(Media, { 
    through: MediaGenres,
    foreignKey: 'genre_id',
    otherKey: 'media_id'
});

// Direct access to junction table
Media.hasMany(MediaGenres, { foreignKey: 'media_id' });
MediaGenres.belongsTo(Media, { foreignKey: 'media_id' });

Genre.hasMany(MediaGenres, { foreignKey: 'genre_id' });
MediaGenres.belongsTo(Genre, { foreignKey: 'genre_id' });

// WatchHistory associations
WatchHistory.belongsTo(Profile, { foreignKey: 'profile_id' });
WatchHistory.belongsTo(Media, { foreignKey: 'media_id' });

// WatchList associations
WatchList.belongsTo(Profile, { foreignKey: 'profile_id' });
WatchList.belongsTo(Media, { foreignKey: 'media_id' });

// Subtitle associations
Subtitle.belongsTo(Media, { foreignKey: 'media_id' });

module.exports = {
    User,
    Profile,
    Subscription,
    Series,
    Season,
    Media,
    Genre,
    MediaGenres,
    WatchHistory,
    WatchList,
    Subtitle,
    ViewingClassification,
    RefreshToken
};
