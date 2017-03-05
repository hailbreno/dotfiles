// ---------------------------------------------------------------------
// FEEDLY AND ASSOCIATED MODULES
// ---------------------------------------------------------------------
module.exports = {
  feedly: {
    factory: 'devhd.services.createFeedly',
    dependencies: ['preferences', 'reader', 'reco', 'suggesto', 'trends', 'popup',
      'quicklook', 'edito',
      'signs', 'helpSigns',
      'profile', 'progressDialog', 'io',
      'analytics', 'quickGoto',
      'navigo', 'intercom',
      'kodak', 'dialog', 'effects', 'channel',
      'leftNav', 'back', 'hercule', 'sliderService', 'reactBridge', 'tags', 'enterprisetags', 'enterprisecollections'
    ],
    properties: {
      sideAreaModuleIds: [
        'featuredModule',
        'memesModule',
        'sourcesModule',
        'discoverModule',
        'helpSearchModule',
        'topicsSearchModule',
        'feedsSearchModule',
        'proAdModule'
      ]
    }
  },

  addSubscriptionForm: {
    factory: 'devhd.forms.createAddSubscriptionForm',
    dependencies: ['reader', 'dialog', 'signs', 'analytics', 'feedly']
  },

  followSubscriptionForm: {
    factory: 'devhd.forms.createFollowSubscriptionForm',
    dependencies: ['dialog']
  },

  editSubscriptionForm: {
    factory: 'devhd.forms.createEditSubscriptionForm',
    dependencies: ['reader', 'dialog', 'signs']
  },

  navigo: {
    factory: require('./scripts/navigo.js'),
    dependencies: []
  },


  // ---------------------------------------------------------------------
  // SIDEAREA MODULES
  // ---------------------------------------------------------------------

  hercule: {
    factory: 'devhd.services.createHercule',
    dependencies: ['preferences', 'reader', 'feedly', 'suggesto', 'analytics', 'reactBridge']
  },

  sliderService: {
    factory: 'devhd.services.createSliderService',
    dependencies: ['reactBridge']
  },

  reactBridge: {
    factory: 'devhd.services.createReactBridge',
    dependencies: ['reader']
  },

  leftNav: {
    factory: 'devhd.services.createLeftNav',
    dependencies: ['reader', 'preferences', 'feedly', 'trends', 'suggesto', 'profile', 'tags', 'enterprisetags', 'enterprisecollections']
  },

  discoverModule: {
    factory: 'devhd.modules.createDiscoverModule',
    dependencies: ['reader', 'preferences', 'suggesto', 'feedly', 'trends', 'analytics', 'hercule']
  },

  helpSearchModule: {
    factory: 'devhd.modules.createHelpSearchModule',
    dependencies: ['reader', 'preferences', 'suggesto', 'feedly', 'trends', 'analytics', 'hercule']
  },

  memesModule: {
    factory: 'devhd.modules.createMemesModule',
    dependencies: ['reader', 'preferences', 'suggesto', 'feedly', 'trends', 'analytics', 'hercule']
  },

  topicsSearchModule: {
    factory: 'devhd.modules.createTopicsSearchModule',
    dependencies: ['reader', 'preferences', 'suggesto', 'feedly', 'trends', 'analytics', 'hercule']
  },

  feedsSearchModule: {
    factory: 'devhd.modules.createFeedsSearchModule',
    dependencies: ['reader', 'preferences', 'suggesto', 'feedly', 'trends', 'analytics', 'hercule']
  },

  sourcesModule: {
    factory: 'devhd.modules.createSourcesModule',
    dependencies: ['reader', 'preferences', 'feedly', 'trends']
  },

  featuredModule: {
    factory: 'devhd.modules.createFeaturedModule',
    dependencies: ['reader', 'preferences', 'feedly', 'trends', 'suggesto']
  },

  proAdModule: {
    factory: 'devhd.modules.createProAdModule',
    dependencies: ['analytics', 'reader', 'profile']
  },

  // ---------------------------------------------------------------------
  // VARIOUS UI RELATED SERVICES
  // ---------------------------------------------------------------------
  channel: {
    factory: 'devhd.services.createChannel',
    dependencies: ['reader', 'feedly', 'analytics']
  },

  edito: {
    factory: 'devhd.services.createEdito',
    dependencies: ['reader', 'preferences', 'trends']
  },

  effects: {
    factory: 'devhd.services.createEffects'
  },

  popup: {
    factory: 'devhd.services.createPopup',
    dependencies: ['preferences']
  },

  back: {
    factory: 'devhd.services.createBack'
  },

  dialog: {
    factory: 'devhd.services.createDialog'
  },

  progressDialog: {
    factory: 'devhd.services.createProgressDialog',
    dependencies: ['dialog']
  },

  quicklook: {
    factory: 'devhd.services.createQuicklook',
    dependencies: ['reader']
  },

  signs: {
    factory: 'devhd.services.createSigns',
    dependencies: ['preferences']
  },

  helpSigns: {
    factory: 'devhd.services.createHelpSigns',
    dependencies: ['preferences']
  },

  quickGoto: {
    factory: 'devhd.services.createQuickGoto',
    dependencies: ['preferences', 'reader', 'feedly', 'effects']
  },

  kodak: {
    factory: 'devhd.services.createKodak'
  }
};
