LPMessaging=function(q){var r=0,h={},t=0,k=function(a){var b={},c=!1,d;for(d in a)if(a.hasOwnProperty(d)){var e=a[d];switch(typeof e){case "function":c=c||!0;b[d]=!0;break;case "object":b[d]=k(e),c=c||null!==b[d]}}return c?b:null},l=function(a){var b={},c;for(c in a)if(a.hasOwnProperty(c)){var d=a[c];switch(typeof d){case "function":b[c]=d;delete a[c];break;case "object":b[c]=l(d)}}return b},m=function(a){var b="[object Array]"===Object.prototype.toString.call(a)?[]:{};if("[object Object]"!==Object.prototype.toString.call(a)||
null===Object.getPrototypeOf(Object.getPrototypeOf(a)))for(var c in a)if(a.hasOwnProperty(c)){var d=a[c];b[c]="[object Object]"===Object.prototype.toString.call(d)?m(d):d}return b},n=function(a){a.args=m(a.args);var b=k(a.args);if(b){var c=++t;h[c]=l(a.args);a.requestID=c;a.functions=b}},u=function(a,b,c){return function(d){for(var e={responseRequestID:b.requestID,callbackPath:c},f=[],g=0,h=arguments.length;g<h;++g)f.push(arguments[g]);e.args=f;n(e);a(e)}},p=function(a,b,c,d,e){e=e||[];for(var f in c){var g=
c[f];switch(typeof g){case "object":p(a,b[f],g,d,e.concat(f));break;default:b[f]=u(a,d,e.concat(f))}}};return{handleRequest:function(a,b,c,d){var e=b.args;p(c,e,b.functions,b);LPReflection.callFunction(a,b.cmd,e,d)},makeRequest:function(a,b){n(b.data);return a(b)},handleResponse:function(a){var b=h[a.responseRequestID];delete h[a.responseRequestID];for(var c=0,d=a.callbackPath.length;c<d;++c)b=b[a.callbackPath[c]];b.apply(q,a.args)},getNewMessageSourceID:function(a){return++r}}}(this);
