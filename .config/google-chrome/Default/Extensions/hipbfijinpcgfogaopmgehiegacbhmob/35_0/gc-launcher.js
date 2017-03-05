if( localStorage["https"] == "yes" )
	document.location =  localStorage["beta"] == "yes" ? "https://feedly.com/beta" : "https://feedly.com/";
else
	document.location =  localStorage["beta"] == "yes" ? "http://feedly.com/beta" : "http://feedly.com/";
	
