function LP_getElementByXPath(a,b){return a||(a=LP_derive_doc(),a)?LP_lookupElementByXPath(a,b):null}function LP_getElementsByXPath(a,b){return a||(a=LP_derive_doc(),a)?LP_lookupElementsByXPath(a,b):null}
function LP_createXPathFromElement(a,b){if(!a&&(a=LP_derive_doc(),!a)||!b)return null;var e=a.getElementsByTagName("*"),d,c;if(0<e.length&&("undefined"==typeof e[0].hasAttribute||"undefined"==typeof e[0].localName))return LP_getXPath(b);for(segs=[];b&&1==b.nodeType;b=b.parentNode)if(b.hasAttribute("id")){for(c=d=0;c<e.length&&!(e[c].hasAttribute("id")&&e[c].id==b.id&&d++,1<d);c++);if(1==d)return segs.unshift('id("'+b.getAttribute("id")+'")'),segs.join("/");d=b.parentNode?b.parentNode.children:[];
for(var f=c=0;f<d.length&&!("undefined"!=typeof d[f].hasAttribute&&d[f].hasAttribute("id")&&d[f].id==b.id&&c++,1<c);f++);if(1<c){d=1;for(c=b.previousSibling;c;c=c.previousSibling)c.localName==b.localName&&d++;segs.unshift(b.localName.toLowerCase()+"["+d+"]")}else segs.unshift(b.localName.toLowerCase()+'[@id="'+b.getAttribute("id")+'"]')}else if(b.hasAttribute("name"))segs.unshift(b.localName.toLowerCase()+'[@name="'+b.getAttribute("name")+'"]');else if(b.hasAttribute("action")&&"FORM"==b.nodeName.toUpperCase())segs.unshift(b.localName.toLowerCase()+
'[@action="'+b.getAttribute("action")+'"]');else if(b.hasAttribute("class"))segs.unshift(b.localName.toLowerCase()+'[contains(@class,"'+b.getAttribute("class")+'")]');else{d=1;for(c=b.previousSibling;c;c=c.previousSibling)c.localName==b.localName&&d++;segs.unshift(b.localName.toLowerCase()+"["+d+"]")}return segs.length?"/"+segs.join("/"):null}
function LP_lookupElementByXPath(a,b){return!a||!a.documentElement||g_isfirefox&&a&&!a.defaultView||"undefined"==(g_isfirefox?typeof a.defaultView.XPathEvaluator:typeof XPathEvaluator)?null:(g_isfirefox?new a.defaultView.XPathEvaluator:new XPathEvaluator).evaluate(b,a.documentElement,null,g_isfirefox?a.defaultView.XPathResult.FIRST_ORDERED_NODE_TYPE:XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue}
function LP_lookupElementsByXPath(a,b){var e=[];if(!a||!a.documentElement||"undefined"==(g_isfirefox?typeof a.defaultView.XPathEvaluator:typeof XPathEvaluator))return e;var d=(g_isfirefox?new a.defaultView.XPathEvaluator:new XPathEvaluator).evaluate(b,a.documentElement,null,g_isfirefox?a.defaultView.XPathResult.ORDERED_NODE_ITERATOR_TYPE:XPathResult.ORDERED_NODE_ITERATOR_TYPE,null);if(d)for(var c=d.iterateNext();c;)c&&e.push(c),c=d.iterateNext();return e}
if("undefined"==typeof Node)var Node={ELEMENT_NODE:1,ATTRIBUTE_NODE:2,TEXT_NODE:3,CDATA_SECTION_NODE:4,ENTITY_REFERENCE_NODE:5,ENTITY_NODE:6,PROCESSING_INSTRUCTION_NODE:7,COMMENT_NODE:8,DOCUMENT_NODE:9,DOCUMENT_TYPE_NODE:10,DOCUMENT_FRAGMENT_NODE:11,NOTATION_NODE:12};
function LP_getXPath(a){function b(a){return"undefined"!=typeof Document?a instanceof Document:a&&9==a.nodeType}var e,d=[],c="",f=function(a){var b=1,c;if(2==a.nodeType)return null;for(c=a.previousSibling;c;c=c.previousSibling)c.nodeName==a.nodeName&&++b;return b};if(b(a))return"/";for(;a&&!b(a);a=2==a.nodeType?a.ownerElement:a.parentNode){e=d[d.length]={};switch(a.nodeType){case 1:e.name="text()";break;case 2:e.name="@"+a.nodeName;break;case 7:e.name="processing-instruction()";break;case 8:e.name=
"comment()";break;case 3:e.name=a.nodeName}e.position=f(a)}for(a=d.length-1;0<=a;a--)e=d[a],c+="/"+e.name,null!=e.position&&(c+="["+e.position+"]");return c};
