// console.log=function(){};

var tabs={};

console.log("Initializing " + localStorage['hash']);

// =====================================================================================================================
// Analytics
// =====================================================================================================================
var WIKIWAND_ANALYTICS_STATS_VIEW = 'UA-49207730-8';
try {
	// This is Google Analytics code, used to anonymously report to GA. This is used by us to count the number of active anonymous users
	(function (i, s, o, g, r, a, m) {
		i['GoogleAnalyticsObject'] = r;
		i[r] = i[r] || function () {
			(i[r].q = i[r].q || []).push (arguments)
		}, i[r].l = 1 * new Date ();
		a = s.createElement (o),
			m = s.getElementsByTagName (o)[0];
		a.async = 1;
		a.src = g;
		m.parentNode.insertBefore (a, m)
	}) (window, document, 'script',  chrome.extension.getURL('lib/google-analytics.js'), 'ga');
	/*
	 IMPORTANT NOTE:
	 We are using a modified version of the file google-analytics.js and not the one available through google cdn
	 The reason is a known issue with the google-analytics file which does not allow reporting from extensions (protocol
	 test allows http and https but not chrome-extension protocol), when in universal analytics mode.
	 This issue and workaround are describe in:
	 http://stackoverflow.com/questions/16135000/how-do-you-integrate-universal-analytics-in-to-chrome-extensions
	 */

	gaCreate = function () {
		console.log("Calling ga.create");
		ga ('create', WIKIWAND_ANALYTICS_STATS_VIEW, 'auto');
	};
	gaCreate();
}
catch (err) {
	console.log ('Could not load analytics');
}


function makeid()
{
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	for( var i=0; i < 8; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}

if (!localStorage['hash']){
	localStorage['hash'] =makeid();
}

// Reset autoRedirect to true on every browser start
localStorage['autoRedirect'] = 'true';


// =====================================================================================================================
// Handle navigation events
// =====================================================================================================================

chrome.webRequest.onBeforeRequest.addListener(
	//this code redirects wikipedia pages to wikiwand pages.
	function(details) {
		if (localStorage['autoRedirect'] !== 'true') {
			return {cancel:false};
		}
		// console.log('onbeforerequest:',details);
		var requestedURL = details.url;
		var returnVal = testAutoRedirect (requestedURL);
		if (returnVal.redirectURL !== null) {
			//Do we need to redirect to the HTTPS wikiwand?
			returnVal.redirectURL = returnVal.redirectURL.replace('http://', 'https://');
			return {redirectUrl: returnVal.redirectURL}
		}else{
			return {cancel:false};
		}
	},
	{urls: ["*://*.wikipedia.org/*"]},
	["blocking"]
);

// =====================================================================================================================
// Helpers for content scripts
// =====================================================================================================================

function redirectCurrentTab() {
	chrome.tabs.query ({currentWindow: true, active: true}, function (tabs) {
		var tab = tabs[0];
		var returnVal = getRedirectUrl (tab.url);
		if (returnVal.redirectURL) {
			chrome.tabs.update (tab.id, {url: returnVal.redirectURL});
		}
	});
}
// This listener is used to communicate with the content_script which runs on both wikipedia pages and wikiwand pages
// This allows the button presented within the DOM to manipulate the redirect-state desired by the user.
chrome.extension.onMessage.addListener (function (message, sender,sendResponse) {
	//messaging system between content scripts and background.
	console.log('message:', message);
	if (message.command === 'auto-redirect-on') {
		localStorage['autoRedirect'] = 'true';
		redirectCurrentTab ();
	}

	if (message.command === 'auto-redirect-off') {
		localStorage['autoRedirect'] = 'false';
		redirectCurrentTab ();
	}

	if (message.command==='get-auto-redirect'){
		if (localStorage['autoRedirect']=='true'){
			sendResponse({'autoRedirect':true});
		}else {
			sendResponse({'autoRedirect': false});
		}
	}
	if (message.command === 'version') {
		sendResponse({'ver': chrome.app.getDetails().version.toString()});
	}
	if (message.command === 'analytics') {
		ga ('send', 'event',message.category,message.action,message.label);
		sendResponse({});
	}
	if (message.command === 'analytics-user') {
		ga ('send', 'event','hovercard','pop-user',localStorage['hash']);
		sendResponse({});
	}
	if (message.command === 'openOptionsPage') {
		chrome.runtime.openOptionsPage();
	}
	if (message.command === 'syncStorage'){
		//console.log('command syncstorage');
		if (!localStorage['wikiwand_last_save']){
			localStorage['wikiwand_last_save']=-1;
		}
		if (message.stamp>parseInt(localStorage['wikiwand_last_save'])) {
			try{
				for (key in message.bigObject){
					if (typeof ( message.bigObject[key]) != 'string') {
						//console.log('non string');
						return;
					}
					localStorage[key] = message.bigObject[key];
				}
				//console.log('backing up');
				var data=JSON.parse(localStorage['wikiwand_activation']);
				sendResponse({result:'background updated',stamp:localStorage['wikiwand_last_save']});
				return;
			}catch(e){
				//console.log('error saving to local storage ',e);
			}
		}else{
			if (message.stamp<parseInt(localStorage['wikiwand_last_save'])){

				var data=JSON.parse(localStorage['wikiwand_activation']);
				//console.log('restoring ',data.userID);

				var bigObject = {};
				for (key in localStorage) {
					if (key.slice(0, 9) == 'wikiwand_') {
						bigObject[key] = localStorage[key];
					}
				}
				sendResponse({result:'background newer',bigObject:bigObject,stamp:localStorage['wikiwand_last_save']});
				return;
			}
			// if stamps are equal
			sendResponse({result:'background is same',stamp:localStorage['wikiwand_last_save']});
		}
	}
});

if (chrome.runtime.setUninstallURL) {
	chrome.runtime.setUninstallURL("https://www.wikiwand.com/extension/uninstalled");
}

chrome.runtime.onInstalled.addListener(function(){ //this happens on install and on update
	//install/update code
	localStorage['installed'] = 'true';
	chrome.tabs.query ({}, function (tabs) {
		for (var i = 0; i < tabs.length; i++) {
			var appRegExp = new RegExp ("^https?://([a-zA-Z0-9_\\-\\.]+)?\\.(wikiwand|localwiki)\\.com", "i");
			var match = tabs[i].url.match (appRegExp);
			if (!match) {
				var wikipediaRegExp = new RegExp ("^https?://([a-zA-Z0-9\\-_]+)\\.(?:m\\.)?wikipedia\\.org", "i");
				match = tabs[i].url.match (wikipediaRegExp);
			}
			if (match) {
				chrome.tabs.reload (tabs[i].id, {}, null);
			}
		}
	});

	if (localStorage['thank you']) { //this happens only on update

	}else{
		localStorage['thank you'] = 'already opened thank you page';
		chrome.tabs.create ({url: "http://www.wikiwand.com/extension/thank-you"});
	}
});

