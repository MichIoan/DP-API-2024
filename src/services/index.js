/**
 * Services index file
 * Export all services from a single entry point
 */

const userService = require('./userService');
const profileService = require('./profileService');
const subscriptionService = require('./subscriptionService');
const mediaService = require('./mediaService');
const seriesService = require('./seriesService');
const watchHistoryService = require('./watchHistoryService');
const watchListService = require('./watchListService');

module.exports = {
    userService,
    profileService,
    subscriptionService,
    mediaService,
    seriesService,
    watchHistoryService,
    watchListService,
};
