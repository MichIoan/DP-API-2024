/**
 * Central model index file to avoid circular dependencies
 */

// Import models with direct exports
const User = require('./User');
const Profile = require('./Profile');
const RefreshToken = require('./RefreshToken');
const Media = require('./Media');
const Series = require('./Series');
const Season = require('./Season');
const Genre = require('./Genre');

// Import models with object exports
const { Subscription } = require('./Subscription');
const { WatchList } = require('./WatchList');
const { WatchHistory } = require('./WatchHistory');
const { MediaGenres } = require('./MediaGenres');

// Export all models
module.exports = {
  User,
  Subscription,
  Profile,
  RefreshToken,
  WatchList,
  WatchHistory,
  Media,
  Series,
  Season,
  Genre,
  MediaGenres
};
