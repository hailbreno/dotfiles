var prefix = 'keep_main-prod';
  var appId = 'google-keep';

  var launchGoogleKeep = function (launchData) {
    var launchToDrawing = false;
    var imageEntry = undefined;

    var actionData = launchData.actionData;
    if (actionData && actionData.actionType == 'new_note') {
      launchToDrawing = true;
      if (launchData.id == 'image' && launchData.items && launchData.items.length) {
        imageEntry = launchData.items[0].entry;
      }
    }
    if (launchToDrawing) {
      chrome.app.window.create(prefix + 'index.html', {
        id: appId,
        state: 'maximized'
      }, function(createdWindow) {
        createdWindow.contentWindow._keep_launchToDrawing_ = true;
        createdWindow.contentWindow._keep_drawingImageEntry_ = imageEntry;
      });
    } else {
      chrome.app.window.create(prefix + 'index.html', {
        innerBounds: {
          width: 960,
          height: 700,
          minWidth: 360,
          minHeight: 540
        },
        id: appId
      });
    }
  }

  var onNotificationsClicked = function(id) {
    // Only launch if no other windows exist.
    var windows = chrome.app.window.getAll();
    if (windows && windows.length == 0) {
      chrome.notifications.clear(id, function() {}); // Callback required.
      launchGoogleKeep();
    }
  };
  chrome.app.runtime.onLaunched.addListener(launchGoogleKeep);
  chrome.notifications.onClicked.addListener(onNotificationsClicked);
