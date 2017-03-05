var t;
var tId;
var rtApiKey = "gc38hz5d3bygcgqm99873zyj";
var validSites = new Array("imdb.com/title/", "rottentomatoes.com/m/");

//listners
chrome.pageAction.onClicked.addListener(actionClicked);
chrome.tabs.onUpdated.addListener(checkForValidUrl);
chrome.tabs.onActivated.addListener(checkForValidUrl2);

// MIGHT BE ABLE TO GET RID OF THIS ONE, TEST LATER!!!!!!!!!!!!!!!!!!!
// Check to see if we are on a valid Site- This is called on every tab load
function checkForValidUrl(tabId, changeInfo, tab) {
	var site = tab.url.toString();
  	for (i=0;i<validSites.length;i++){
  		if(site.indexOf(validSites[i]) > -1){
  			t=tab;
			tId=tabId;
			chrome.pageAction.show(tabId);
			console.log("Valid url");
			chrome.pageAction.setPopup({tabId:tId, popup:""});
		}
	}	
}

// Check to see if we are on a valid Site- This is called for every active tab change
function checkForValidUrl2(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab){
		var site=tab.url.toString();
	  	for (i=0;i<validSites.length;i++){
	  		if(site.indexOf(validSites[i]) > -1){
				t=tab;
				tId=tab.id;
				chrome.pageAction.show(tId);
				console.log("Valid url");
				chrome.pageAction.setPopup({tabId:tId, popup:""});
			}
		}
	});
}

//Actions for imdb and RT, Lb's actions are covered under the Popup js file
function actionClicked() {
	var site = t.url.toString();
	console.log("Grabbing site: "+site);
	if (site.indexOf("imdb.com/title/") > -1) {
		imdbToLB(site);
	}
	if (site.indexOf("rottentomatoes.com/m/") > -1) {
		rtToLB(site);
	}
}


// Gets the imdb id from imdb.com a sets it as our global id variable
function imdbToLB(site) {
	var re = /tt\d\d\d\d\d\d\d/i;
	launchLB(site.match(re)[0]);
}

// Gets the imdb id from RottenTomatoes API based on the movie name and site address and then calls the launch lb function
function rtToLB(site) {
	// Script grabs rotten tomato ID by searching the web page for the id
	chrome.tabs.executeScript({ file: "rt_id_script.js"}, function(rtId){
	if(rtId != ''){
		var mName = rtGetName(site).replace(/_/g, '%');
		console.log("Rotten Tomato Id for "+mName+" is "+rtId);
		var apiCall = 'http://api.rottentomatoes.com/api/public/v1.0/movies/' + rtId + '.json?apikey=' + rtApiKey;
		console.log("Readying api call: "+apiCall);
		$.ajax({
			url : apiCall,
			success : rtsetId
		});
		
		function rtsetId(data) {
			var mInfo = JSON.parse(data);
			console.log("Api call results:");
			console.log(mInfo);
			launchLB('tt' + mInfo.alternate_ids.imdb);
		}
	}
	else
		console.log("Could not get RT ID");
	});
}

function rtGetName(site) {
	var s = site.split("/m/");
	return s[1].substr(0, s[1].length - 1);
}

function launchLB(id){
	var address = "http://letterboxd.com/imdb/" + id;
	console.log("Launching "+address);
	window.open(address);
}

