module.exports = {

  dots: {
    factory: require('./services/dots.js'),
    dependencies: ['preferences']
  },

  checklist: {
    factory: require('./services/checklists.js'),
    dependencies: ['preferences']
  },

  heartbeat: {
    factory: require('./services/heartbeat.js'),
    dependencies: ['net']
  },

  enterprise: {
    factory: require('./services/enterprise.js'),
    dependencies: ['net']
  },

  search: {
    factory: require('./services/search.js'),
    dependencies: ['net']
  },

  enterprisetags: {
    factory: require('./services/enterprise.tags.js'),
    dependencies: ['net','reader']
  },

  enterprisecollections: {
    factory: require('./services/enterprise.collections.js'),
    dependencies: ['net', 'reader', 'preferences']
  },

  tags: {
    factory: require('./services/tags.js'),
    dependencies: ['net', 'reader']
  },

  cache: {
    factory: 'devhd.services.createCache',
    dependencies: ['timers', 'storage']
  },

  storage: {
    factory: 'devhd.services.createStorage'
  },

  timers: {
    factory: 'devhd.services.createTimers'
  },

  net: {
    factory: require('./services/net.js'),
    dependencies: ['io']
  },

  image: {
    factory: require('./services/image.js'),
    dependencies: ['io'],
  },

  intercom: {
    factory: require('./services/intercom.js'),
    dependencies: ['reader', 'analytics', 'preferences', 'profile'],
  },

  io: {
    factory: 'devhd.cloud.createIO'
  },

  reco: {
    factory: 'devhd.services.createReco',
    dependencies: ['io', 'preferences', 'reader', 'timers', 'enterprisetags', 'enterprisecollections']
  },

  analytics: {
    factory: 'devhd.services.createAnalytics',
    dependencies: ['io', 'reader', 'preferences', 'profile']
  },

  profile: {
    factory: 'devhd.cloud.createProfile',
    dependencies: ['io']
  },

  preferences: {
    factory: 'devhd.cloud.createPreferences',
    dependencies: ['io', 'timers', 'storage']
  },

  reader: {
    factory: 'devhd.cloud.createReader',
    dependencies: ['preferences', 'io', 'timers', 'cache', 'analytics', 'enterprisetags', 'tags', 'enterprisecollections', 'net', 'enterprise']
  },

  googleNow: {
    factory: 'devhd.services.createGoogleNow',
    dependencies: ['profile', 'io']
  },

  trends: {
    factory: 'devhd.services.createTrends',
    dependencies: ['preferences', 'reader', 'reco', 'io', 'timers', 'suggesto', 'enterprisecollections']
  },

  suggesto: {
    factory: 'devhd.services.createSuggesto',
    dependencies: ['io', 'reader', 'preferences', 'profile']
  }
};
