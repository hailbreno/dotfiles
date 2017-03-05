module.exports = {
  net: {
    factory: require('./mobile/net.js')
  },

  enterprise: {
    factory: require('./services/enterprise.js'),
    dependencies: ['net']
  },

  enterprisetags: {
    factory: require('./services/enterprise.tags.js'),
    dependencies: ['net','reader']
  },

  enterprisecollections: {
    factory: require('./services/enterprise.collections.js'),
    dependencies: ['net', 'reader']
  },

  tags: {
    factory: require('./services/tags.js'),
    dependencies: ['net', 'reader']
  },

  nikon: {
    factory: 'devhd.mobile.createNikon'
  },

  tracker: {
    factory: 'devhd.mobile.createTracker',
    dependencies: ['reader', 'mag', 'suggesto']
  },

  mag: {
    factory: 'devhd.mobile.createMag',
    dependencies: ['reader', 'nikon', 'suggesto', 'tracker', 'grid', 'profile', 'googleNow', 'enterprisetags', 'enterprisecollections']
  },

  grid: {
    factory: 'devhd.mobile.createGrid',
    dependencies: ['mag']
  },

  reader: {
    factory: 'devhd.cloud.createReader',
    dependencies: ['mag', 'suggesto', 'enterprisetags', 'enterprisecollections', 'enterprise', 'net']
  },

  googleNow: {
    factory: 'devhd.cloud.createGoogleNow',
    dependencies: []
  },

  suggesto: {
    factory: 'devhd.mobile.createSuggesto',
    dependencies: ['mag', 'reader']
  },

  profile: {
    factory: 'devhd.mobile.createProfile',
    dependencies: []
  }

};
