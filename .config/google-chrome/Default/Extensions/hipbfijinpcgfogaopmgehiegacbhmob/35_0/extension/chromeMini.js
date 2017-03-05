var feed; // The feed object. Contains 1 attribute for now only: href

// Let's make sure that both the app and the extension are not inserting feedly
// mini to the page.
var miniedAlready = document.body.getAttribute("data-feedly-mini") == "yes";

if (miniedAlready == false) {
  document.body.setAttribute("data-feedly-mini", "yes");

  // Test if the current document is already a feed xml
  // In that case, we just show a green banner
  if (feedDocument()) {
    // Show the banner
    document.body.style.marginTop = "60px";
    var mini = document.createElement('div');
    mini.setAttribute('id', 'feedly-mini-banner');
    var link = document.createElement('a');
    link.setAttribute('href', "http://feedly.com/#subscription/" + encodeURIComponent('feed/' + window.location));
    link.setAttribute('target', "_blank");
    link.innerHTML = 'Open in feedly';
    link.addEventListener('click', function() {
      location.href = "http://feedly.com/#subscription" + encodeURIComponent("/feed/" + window.location);
    });
    mini.appendChild(link);
    document.body.appendChild(mini);
  } else {
    // We load the user's preferences
    (function() {
      // Load preferences before loading main function
      chrome.runtime.sendMessage({
        type: "getLocalStorage",
        key: "urlBlackList"
      }, function(response) {
        localStorage["urlBlackList"] = response.data;
        var blackList = localStorage["urlBlackList"].split(',');
        for (var i = blackList.length - 1; i >= 0; i--) {
          if (location.href.indexOf(blackList[i]) > -1) {
            return;
          }
        }
        chrome.runtime.sendMessage({
          type: "getLocalStorage",
          key: "showIcon"
        }, function(response2) {
          localStorage["showIcon"] = response2.data;
          // Show the icon?
          if (localStorage["showIcon"] == "false")
            return;
          insertMini();
        });
      });
    })();
  }
}


//Check to see if the current document is a feed delivered as plain text,
//which Chrome does for some mime types, or a feed wrapped in an html.
//If yes, return the feed, or return null otherwise
function feedDocument() {
  var result = document.evaluate(
    '//*[local-name()="rss" or local-name()="feed" or local-name()="RDF"]',
    document, null, 0, null
  );

  var item = result.iterateNext();
  if (item) {
    return {
      "href": location.href,
      "xml": true
    };
  }
  return null;
}

// Insert the feedly mini icon
function insertMini() {
  var mini = document.createElement("div");
  mini.setAttribute("id", "feedly-mini");
  mini.setAttribute("title", "feedly Mini tookit");
  document.body.appendChild(mini);

  var popup, // the popup containing the iframe
    iFrame,
    arrow, // the small arrow between the popup and the mini icon
    iFrameLoaded = false; // is the iframe correctly loaded?

  // Show iFrame when when click on the feedly mini icon
  mini.addEventListener("click", function() {

    // If iframe popup is already created, then toggle show hide
    if (popup) {
      if (popup.style.display != "none")
        hidePopup();
      else
        showPopup();
      return;
    }

    // Or else, it means that the iframe is still not created, so we create it

    var currentUrl = document.URL; // The url of our page, take the canonical url if there's one
    (function() {
      var result = document.evaluate(
        '//*[local-name()="link"][contains(@rel, "canonical")]',
        document, null, 0, null
      );
      if (item = result.iterateNext())
        currentUrl = item.href;
    })();

    var currentTitle; // the title of our page
    (function() {

      // Try fb open graph title
      var meta = document.querySelector("meta[name='og:title']") || document.querySelector("meta[property='og:title']") || document.querySelector("meta[name='twitter:title']") || {};
      currentTitle = meta.getAttribute ? meta.getAttribute('content') : document.title;
    })();

    // Check if there are any feeds in current page
    if (!feed) feed = getFeed(); // Feed can already be the xml document itself, if it's not, then we find feed in the current HTML document

    // Handle message (HTML5 messages) receptions from the iframe to perform actions (resize iframe, open preferences page etc)
    window.addEventListener('message', function(event) {

      if (event.origin.indexOf("feedly.com") < 0) return; // only accept messages from the specified domain

      /// console.log('MESSAGE RECEIVED ' + event.data + ' from ' + event.origin);

      // Message format is "key=value"
      // e.g. "height:100" or "status=ok"
      switch (event.data.slice(0, event.data.indexOf("="))) {
        case "height":
          var height = event.data.split('=')[1];
          popup.style.height = height;

          // Now this is the proof that our iFrame has loaded without any errors
          iFrameLoaded = true;

          // Show the iframe
          window.setTimeout(function() {
            iFrame.style.visibility = "visible";
          }, 10);
          break;
        case "width":
          var width = event.data.split('=')[1];
          popup.style.width = width;
          break;
        case "action":
          switch (event.data.split('=')[1]) {
            case "openPro":
              chrome.runtime.sendMessage({
                type: "openPro"
              });
              iFrameLoaded = false;
              document.body.removeChild(popup);
              document.body.removeChild(arrow);
              delete popup;
              popup = null;
              mini.style.removeProperty('background-image');
              mini.style.removeProperty('opacity');
              break;
            case "openPrefs":
              chrome.runtime.sendMessage({
                type: "openPrefs"
              });
              break;
          }
        default:
      }
    }, false);

    popup = document.createElement('div');
    popup.setAttribute('id', 'feedly-mini-popup');
    document.body.insertBefore(popup, mini);
    iFrame = document.createElement('iframe');
    popup.appendChild(iFrame);
    iFrame.setAttribute('src', 'http://feedly.com/mini.html?feedUrl=' + encodeURIComponent(feed.href) + "&entryUrl=" + encodeURIComponent(currentUrl) + "&entryTitle=" + encodeURIComponent(currentTitle));
    iFrame.setAttribute('scrolling', 'no');

    // Only for animation
    var blockContainer = document.createElement('div');
    blockContainer.className = "block-container";
    popup.appendChild(blockContainer);
    var blocks = {};
    for (var i = 1; i <= 8; i++) {
      blocks["n" + i] = document.createElement('div');
      blocks["n" + i].className = "block";
      blockContainer.appendChild(blocks["n" + i]);
    }
    //		// Animation to show the blocks
    //		// UNFOLDING EFFECT
    //		setTimeout(function() {
    //			for (var i = 1; i <= 8; i++) {
    //				blocks["n" + i].style.webkitTransform = "perspective(40px) rotateX(0deg)";
    //			}
    //		},10);
    //		// Animation to show the blocks
    //		// FADE IN EFFECT
    //		setTimeout(function() {
    //			for (var i = 2; i <= 8; i++) {
    //				blocks["n" + i].style.opacity = "0.7";
    //			}
    //		},10);


    arrow = document.createElement('div');
    arrow.setAttribute('id', 'feedly-mini-popup-arrow');
    document.body.insertBefore(arrow, mini);
    showPopup();

    // Show error if there's one after 5s
    /* >>>
    setTimeout(function() {
    	// If our iFrame is loaded then there is no error
    	if (iFrameLoaded) return;

    	// TODO Better error
    	popup.innerHTML = "<span>feedly Mini offline</span>";
    	popup.className = popup.className + " error";
    	console.log('[feedly mini] Unable to load the iframe.');
    }, 5000); // 5s before showing error
    */

    // Hide popup when clicking else where on page
    document.body.addEventListener('click', function(event) {
      if (!popup) return;
      if (event.target == mini) return; // prevent popup from hiding and reopening
      if (event.target.className.indexOf('block') > -1 || event.target.id == "feedly-mini-popup") return; // don't hide popup if click on popup
      hidePopup();
    });

    // Functions used above

    // Show/Hide popup
    function showPopup() {
      popup.style.display = "block";
      arrow.style.display = "block";
      mini.style.backgroundImage = "url('" + chrome.extension.getURL("feedly-icon-48.png") + "')";
      mini.style.opacity = 1;

      // fade the popup in
      window.setTimeout(function() {
          popup.style.opacity = 1;
        },
        50
      );
    }

    function hidePopup() {
      popup.style.display = "none";
      arrow.style.display = "none";
      mini.style.removeProperty('background-image');
      mini.style.removeProperty('opacity');
    }

    // Find if there are any rss feeds in the html page, and return the feed
    function getFeed() {
      // First check if it has embedded feed links, such as:
      // (<link rel="alternate" type="application/rss+xml" etc). If so, show the
      // page action icon.
      var feeds = [];

      // Find all the RSS <link> elements.
      var result = document.evaluate(
        '//*[local-name()="link"][contains(@rel, "alternate")] [contains(@type, "rss") or contains(@type, "atom") or contains(@type, "rdf")]',
        document, null, 0, null
      );

      var item;
      while (item = result.iterateNext()) {
        // EK - We should exclude Comment feeds
        if (item.title != null && item.title.toLowerCase().indexOf("comment") == -1)
          return {
            "href": item.href
          };
      }

      // Second check the URLs in the page:
      // Regex to test url finishing by "feed" or "rss" or "feed/" or "rss/"
      var reg = new RegExp(/\.[a-z]{2,6}\/.*(feed|rss)/);
      // Test that regex on all <a> tags in the page
      if (url = Array.prototype.filter.call(document.querySelectorAll("a[href]"), function(el) {
          return el.href.match(reg);
        })[0]) {
        return {
          "href": url.href
        };
      }

      // Third try the current url with the regex:
      if (location.href.match(reg) && location.href.match(reg).length > 0) {
        return {
          "href": location.href
        };
      }

      return {};
    }

  }, false);
  // End on mini click
}
