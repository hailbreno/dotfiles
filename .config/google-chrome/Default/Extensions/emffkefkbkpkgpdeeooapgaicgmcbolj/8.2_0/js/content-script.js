var autoRedirectState;
var last_save_time = -1;
var last_save_string = '';

console.log=function(){};
//<editor-fold desc="Functions">
function toggleButtons() {
	//this function displays the buttons on wikiwand and on wikipedia which allow to toggle wikiwand on and off
	var validDomain = (window.location.hostname === 'www.local.wikiwand.com' || window.location.hostname === 'www.localwiki.com' || window.location.host === 'www.wikiwand.com'
	|| window.location.host === 'www.ww-web-stage.wikiwand.com' || window.location.host.indexOf('.wikipedia.org') > -1);
	if (!validDomain) return;

	chrome.runtime.sendMessage({command: 'get-auto-redirect'}, function(response) {
		autoRedirectState = response.autoRedirect;
		if (window.location.hostname === 'www.local.wikiwand.com' || window.location.hostname === 'www.localwiki.com' || window.location.host === 'www.wikiwand.com'
			|| window.location.host === 'www.ww-web-stage.wikiwand.com') {
			if (autoRedirectState == false) {
				$(document).ready(function() {
					$('.toggle_wiki').hide(); //don't show button if it is not alighned with the current state
				});
			}
		}
		if (autoRedirectState == true) {
			$(document).ready(function() {
				$('#switch_to_wikiwand').hide(); //don't show button if it is not alighned with the current state
			});
		}
	});
	$(document).ready(function() {
		var url = window.location.href;
		var buttonState = getRedirectUrl(url);
		if (buttonState.redirectURL !== null) {
			// Show the switch button on wikipedia
			var element;
			if (buttonState.domain === 'wikipedia') {
				var rtlString='';
				if ($('html').attr('dir')&&$('html').attr('dir')=='rtl'){
					rtlString=' toggle_wiki_wikiwand-RTL ';
				}
				var wikiwandLogo = chrome.extension.getURL("images/wikiwand_logo.png");
				var wikipediaLogo = chrome.extension.getURL("images/wikipedia_logo.png");
				var wandIcon = chrome.extension.getURL("images/wand.png");
				element = "<div class='toggle_wiki_wikiwand "+rtlString+"' id='switch_to_wikiwand'><i><img src='" + wandIcon +
				"' alt='wikwand icon'/></i>" +
				"<div class='switch_logo_wikiwand'>" +
				"<img src='" + wikipediaLogo + "' alt='wikipedia logo'/>" +
				"</div>" +
				"<a  href='javascript:void(0)' id='switch_btn_wikiwand' class='wikiwand_switch'></a>" +
				"<div class='switch_logo_wikiwand wikiwand_switch'>" +
				"<a href='javascript:void(0)' ><img src='" + wikiwandLogo + "' alt='wikipedia logo'/></a>" +
				"</div>" +
				"</div>";
				$('html').append($(element));
			}

			//bind click event to action.

			$(".wikiwand_switch , #switch_btn").click(function(event) {
				if (event.ctrlKey || event.shiftKey || event.altKey) {
					return true;
				}
				if (buttonState.domain === 'wikipedia') {
					chrome.extension.sendMessage({command: 'auto-redirect-on'});
					$('#switch_btn_wikiwand').addClass('wand_wikiwand');
					return false; // Ignore the href
				}
				else {  // From WikiWand to Wikipedia
					// We send a message to the background process to change the redirect setting.
					// This will trigger the redirect to Wikipedia immediately.
					chrome.extension.sendMessage({command: 'auto-redirect-off'});
					$('#switch_btn_wikiwand').addClass('wand_wikiwand');
					return false; // Ignore the href
				}
			});
		}
	});
}

function synchLocalStorage() {
	//sync wikiwand user prefs to background to save them from accidental deletion, and also to allow user
	//to sync preferences across
	if (!localStorage['wikiwand_last_save']) {localStorage['wikiwand_last_save'] = '0';}

	if (localStorage['wikiwand_last_save'] !== last_save_string) {
		last_save_string = localStorage['wikiwand_last_save'];
		last_save_time = parseInt(last_save_string);
		var bigObject = {};
		for (key in localStorage) {
			if (key.slice(0, 9) == 'wikiwand_') {
				bigObject[key] = localStorage[key];
			}
		}

		chrome.runtime.sendMessage({
			command: 'syncStorage',
			stamp: last_save_time,
			bigObject:bigObject
		}, function(response) {
			if (response.result == 'background newer') {
				for (key in response.bigObject){
					if (typeof ( response.bigObject[key]) != 'string') {
						//console.log('non string');
						return;
					}
					localStorage[key] = response.bigObject[key];
				}
				//console.log('restored from extension ', response.key);
			}
		});
	}


}

function setExtensionCookie() {
	//set the extension cookie so wikiwand.com can regard the user accordingly
	var date = new Date();
	date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000);
	document.cookie = "wikiwand.extension.installed=True; expires=" + date.toUTCString() + "; path=/";
	localStorage['ww_hovercards_anywhere']='true';
	localStorage['ww_extension_version']=chrome.runtime.getManifest().version;

}
//</editor-fold>

//<editor-fold desc="Run on all websites">
toggleButtons();
$(document).ready(function(){
});
//</editor-fold>

//<editor-fold desc="Run only on Wikiwand pages">

if ((document.location.host === 'www.wikiwand.com') ||
	(document.location.host === 'www.localwiki.com:3000') ||
	(document.location.host === 'www.local.wikiwand.com:3000') ||
	(document.location.host === 'www.ww-web-stage.wikiwand.com')) {
	setExtensionCookie();
	synchLocalStorage();
	setInterval(synchLocalStorage, 1000);
}

//</editor-fold>
