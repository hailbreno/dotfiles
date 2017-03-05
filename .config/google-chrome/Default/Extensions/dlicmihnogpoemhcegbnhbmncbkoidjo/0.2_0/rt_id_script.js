rtGetID();

function rtGetID() {
	var metas = document.getElementsByTagName('meta'); 

   for (i=0; i<metas.length; i++) { 
      if (metas[i].getAttribute("name") == "movieID") { 
         return metas[i].getAttribute("content"); 
      } 
   } 

    return "";
};