lbGetID();

function lbGetID() {
var links = document.links;
	var re = /tt\d\d\d\d\d\d\d/i;
	var id;
	for(i=0;i<links.length;i++){
		if(links[i].href.indexOf("www.imdb.com/title/") > -1){
			id = links[i].href.match(re)[0];
		}
	}
	console.log("Imdb id is"+ id);
	return id;
};
