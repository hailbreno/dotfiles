// Save this script as `options.js`
var httpsSelect = document.getElementById("https");
var betaSelect = document.getElementById("beta");
var showIconButton = document.getElementById('show-icon');
var urlBlackListText = document.getElementById('url-black-list');
var statusText = document.getElementById('status');

var PERSIST_SHOW = "showIcon"

// Saves options to localStorage.
function save_options() {
  
	var https = httpsSelect.children[httpsSelect.selectedIndex].value;
	localStorage[ "https" ] = https;

	var beta = betaSelect.children[betaSelect.selectedIndex].value;
	localStorage[ "beta" ] = beta;

	var urlBlackList = urlBlackListText.value.split(/\n/);
	// Remove blank lines
	for (var i = 0; i < urlBlackList.length; i++) {
		if (urlBlackList[i] == "") {         
			urlBlackList.splice(i, 1);
			i--;
		}
	}
	
	// Uncomment if only allowing domain names
//	for (var i = 0; i < urlBlackList.length; i++) {
//		if (!checkUrl(urlBlackList[i])) {
//			statusText.innerText = urlBlackList[i] + " is not a valid domain name.";
//			return;
//		}
//	};
	localStorage[ "urlBlackList" ] = urlBlackList.toString();
  
	var showIcon = showIconButton.checked;
	localStorage[ PERSIST_SHOW ] = showIcon;
  
	// Update status to let user know options were saved.
	statusText.innerHTML = "Options Saved.";
	setTimeout(function() {
		statusText.innerHTML = "";
	}, 750);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
	var https = localStorage[ "https" ];
	for (var i = 0; i < httpsSelect.children.length; i++) 
	{
		var child = httpsSelect.children[i];
		if( child.value == https ) 
		{
			child.selected = "true";
			break;
		}
	}

	var beta = localStorage[ "beta" ];
	for (var i = 0; i < betaSelect.children.length; i++) 
	{
		var child = betaSelect.children[i];
		if( child.value == beta ) 
		{
			child.selected = "true";
			break;
		}
	}

	var showIcon = localStorage[ PERSIST_SHOW ];
	showIconButton.checked = showIcon == "true";
	
	var urlBlackList = localStorage[ "urlBlackList" ].split(',');
	var defaultText = "";
    for (var i = urlBlackList.length - 1; i >= 0; i--) {
      defaultText += urlBlackList[i] + "\n";
    }
    urlBlackListText.value = defaultText;
}

// Only matches domain names
function checkUrl(url) {
	var reg = new RegExp(/^((?:(?:(?:\w[\.\-\+]?)*)\w)+)((?:(?:(?:\w[\.\-\+]?){0,62})\w)+)\.(\w{2,6})$/); 
	return url.match(reg);
}


document.addEventListener('DOMContentLoaded', restore_options);
showIconButton.addEventListener('click', save_options);
httpsSelect.addEventListener('change', save_options);
betaSelect.addEventListener('change', save_options);
document.querySelector('#save').addEventListener('click', save_options);
