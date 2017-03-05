var PERSIST_SHOW = "showIcon"

// STATIC LOADER
function $feedly( msg )
{
	window.console.log( msg );
}

function GET( url, onComplete )
{
	IO( { url: url, onComplete: onComplete });
}

function IO( xhrOptions )
{
	// Local URLs?
	var url = xhrOptions.url;

	if( url.indexOf( "://" ) == -1 )
		url = chrome.extension.getURL( url );

	if( xhrOptions.headers == null )
		xhrOptions.headers = {};

	var xhr = new XMLHttpRequest();

	if( xhrOptions.timeout != null )
	{
		xhr.timeout = xhrOptions.timeout;
	    xhr.ontimeout = function () {
	    	xhrOptions.onComplete( 504, "timeout" );
	    };
	}

	xhr.onreadystatechange = function() {

		if( this.readyState == 4 )
		{
			if( this.status == 0 )
		      	$feedly( "[io] received status 0 for:" + url );

			var text = this.responseText;

			// for chrome-extensions:// protocols, 0 is really a 200 (ie successful code)
			var status = this.status;
			if( this.status == 0 && url.indexOf( "http" ) != 0 )
				status = 200;

			xhrOptions.onComplete( status, text );
     	}
  	};

	xhr.open( xhrOptions.method || "GET", url, true );

	for( var name in xhrOptions.headers )
	{
		if( xhrOptions.headers[name] == null || xhrOptions.headers[name] == "" )
			continue;

		xhr.setRequestHeader( name, xhrOptions.headers[name] );
	}

  	xhr.send( xhrOptions.body );
}

function select( re, content, defaultValue )
{
	if( content == null )
		return defaultValue;

	var parts = re.exec( content );
	if( parts && parts.length )
		return parts[1];
	else
		return defaultValue;
}


chrome.runtime.onMessage.addListener(
	function( message, sender, onComplete )
	{
		switch( message.type )
		{
			case "engagement":
				askEngagement( message, onComplete );

				// return true so that we can send a callback after this method
				// has completed.
				return true;

			case "getLocalStorage":
				onComplete({"data": localStorage[message.key]});
				return true;

			case "openPrefs":
				window.open(chrome.extension.getURL("gc-options.htm"));
				return true;

			case "openPro":
				window.open("https://feedly.com/#pro/evernote.mini");
				return true;

			default:
				return false;
		}
	}
);

function askEngagement( message, onComplete )
{
	var fbLikes = null;
	var gpLikes = null;

	GET(	"https://plusone.google.com/_/+1/fastbutton?url=" + encodeURIComponent( message.url ),
			function( status, content )
			{
				if( status == 200 )
				{
					try
					{
						var val = parseInt( select( /c:\s*([0-9]+)/gi, content, "0" ) );
						if( isNaN( val ) )
							val = 0;

						gpLikes = val;
					}
					catch( e )
					{
						gpLikes = 0;
					}
				}
				else
				{
					gpLikes = 0;
				}

				if( gpLikes != null && fbLikes != null )
				{
					// callback time
					message.engagement = gpLikes + fbLikes;
					message.fbLikes = fbLikes;
					message.gpLikes = gpLikes;
					onComplete( message );
				}
			}
			);

	GET(	"https://graph.facebook.com/?ids=" + encodeURIComponent( message.url ),
			function( status, content )
			{
				if( status == 200 )
				{
					try
					{
						var map = JSON.parse( content );

						var val = 0;
						if(map != null && map[ message.url ] != null)
							val = map[ message.url ].share.share_count || 0;

						fbLikes = val;
					}
					catch( e )
					{
						fbLikes = 0;
					}
				}
				else
				{
					fbLikes = 0;
				}

				if( gpLikes != null && fbLikes != null )
				{
					// callback time
					message.engagement = gpLikes + fbLikes;
					message.fbLikes = fbLikes;
					message.gpLikes = gpLikes;
					onComplete( message );
				}
			}
			);
}


	// If this is the very first time the extension is loaded, we should launch
	//
	var launched = window.localStorage.getItem( "app.launched" );
	if( launched == null )
	{
		window.localStorage.setItem( "app.launched", "0.0" );
		chrome.tabs.create( { url: "http://feedly.com/", selected: true } );
	}


function navigate( url ){
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.update(tab.id, {url: url});
	});
}

// Default options:
if (localStorage[ "https" ] == null)
	localStorage[ "https" ] = "yes";
if (localStorage[ "beta" ] == null)
	localStorage[ "beta" ] = "no";
if (localStorage[ "hashtags" ] == null)
	localStorage[ "hashtags" ] = "yes";
if (localStorage[ PERSIST_SHOW ] == null)
	localStorage[ PERSIST_SHOW ] = true;
if (localStorage[ "urlBlackList" ] == null)
	localStorage[ "urlBlackList" ] = [
	    "wikipedia",
		"tuenti.com",
		"faqoverflow.com",
		"postrank.com",
		"mail.google.",
		"mail.yahoo." ,
		"docs.google.com",
		"facebook.",
		"twitter.com",
		"//feedly.com",
		"netvibes.com",
		"acidtests.org",
		"bloglovin.com"
	];
