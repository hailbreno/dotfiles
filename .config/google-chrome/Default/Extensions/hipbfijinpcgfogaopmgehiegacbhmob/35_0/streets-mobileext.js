module.exports = {
  net: {
    factory: require('./mobile/net.js')
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

  reader: {
    factory: 'devhd.cloud.createReader',
    dependencies: ['enterprisetags', 'enterprisecollections']
  },

};
