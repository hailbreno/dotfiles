/*! Copyright 2009-2017 Evernote Corporation. All rights reserved. */
function countSerializableFrames(){for(var a=document.getElementsByTagName("iframe"),b=0,c=0;c<a.length;c++)a[c].dataset&&a[c].dataset.en_id&&b++;return b}function completedFrameCount(){var a=0;for(var b in frameData)a++;return a}function isAlive(){Browser.sendToExtension({name:"isAlive",message:{name:"frame_loader"}})}if(window.self==top.self){var frameData={},completed=!1,addedEventListeners=!1,timeout,serializeFrames=function(a,b){function c(){completed||(log.warn("Some frames seem stuck, continuing with what we've got."),completed=!0,a(frameData))}return 0==countSerializableFrames()?void a(null):(addedEventListeners||(window.addEventListener("message",function(b){b&&b.data&&b.data.name&&"EN_serialized"==b.data.name?(frameData[b.data.id]=b.data.data,clearTimeout(timeout),completed||(completedFrameCount()==countSerializableFrames()?(completed=!0,a(frameData)):timeout=setTimeout(c,3e3))):b&&b.data&&b.data.name&&"main_getTextResource"==b.data.name&&Browser.sendToExtension({name:"main_getTextResource",href:b.data.href})},!1),addedEventListeners=!0),frameData={},completed=!1,timeout=setTimeout(c,3e3),void Browser.sendToExtension({name:"bounce",message:{name:"startSerialize",config:b}}))};Browser.addMessageHandlers({content_textResource:function(a,b,c){window.postMessage(a,"*")}})}else Browser.addMessageHandlers({startSerialize:function(a,b,c){JSON.stringify&&(script=document.createElement("script"),script.type="text/javascript",script.textContent="var config = "+JSON.stringify(a.config)+"; serializeFrame();",document.head.appendChild(script))}},!0);var addedScripts=!1;Browser.addMessageHandlers({insertSerializationScripts:function(a,b,c){var d=function(a){document.head&&!document.querySelector("script[src='"+Browser.extension.getURL(a)+"']")&&(script=document.createElement("script"),script.type="text/javascript",script.src=Browser.extension.getURL(a),document.head.appendChild(script))};window!=window.parent&&(addedScripts||(d("third_party/port.js"),d("js/GlobalUtils.js"),d("content/HtmlSerializer.js"))),addedScripts||(d("content/frame.js"),addedScripts=!0)},contextIsAlive:isAlive},!0);