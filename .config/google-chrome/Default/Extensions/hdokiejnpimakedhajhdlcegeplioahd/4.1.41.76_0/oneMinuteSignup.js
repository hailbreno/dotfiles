var oneMinuteSignup=function(){function p(a){if(0===a.origin.indexOf(d))if("ShowTour"===a.data.type)e&&!l&&(e(),l=!0);else if("GetApplications"===a.data.type)q();else if("AddSiteToVault"===a.data.type){var f=LPProxy.getGroupByName(a.data.account.group)||new DummyGroup(a.data.account.group,null);(new Account).addFromDialog(a.data.account,f,{source:"vault"})}else if("Collapse"===a.data.type)$("body").removeClass("oneminfull"),$("body").addClass("oneminsmall");else if("Expand"===a.data.type)$("body").removeClass("oneminsmall"),
$("body").addClass("oneminfull");else if("Close"===a.data.type)$("body").removeClass("oneminsmall"),$("body").removeClass("oneminfull"),$("#oneminutesignup").empty(),k=!1,$("#showReminders").removeAttr("disabled");else if("ReminderDeleted"===a.data.type){if(f=b.filter(function(b){return b.id===a.data.reminder.id})[0])b.splice(b.indexOf(f),1),0===b.length?$("#reminderCountContainer").hide():($("#reminderCountContainer").show(),$("#reminderCount").text(b.length))}else"RemindersAdded"===a.data.type&&
(bg.set("g_reminders",bg.get("g_reminders").concat(a.data.reminders)),m())}function m(){b=bg.get("g_reminders");0===b.length?$("#reminderCountContainer").hide():($("#reminderCountContainer").show(),$("#reminderCount").text(b.length))}function q(){var a=$("#oneminutesignup iframe")[0],b=LPProxy.getAllModelItems().map(function(a){return{url:a._data.url,userName:a._data.unencryptedUsername}});a.contentWindow.postMessage({type:"SendApplications",applications:b},d)}function n(a,f){!bg.get("g_one_minute_signup_enabled")&&
!bg.get("g_onemin_advert_enabled")||k||(a=a||h.normal,bg.get_method_async(function(g){g=g||"Unknown";k=!0;$("#showReminders").attr("disabled","disabled");$("#inProgressWithSpinner").toggle();$.ajax({global:!1,type:"GET",dataType:"json",url:LPProxy.getBaseURL()+"lmiapi/clientconfig",success:function(e){var c=document.createElement("iframe");d=e["1minUiBaseUrl"];c.setAttribute("src",d+"/index.html");c.setAttribute("class","onemin");c.setAttribute("width","100%");c.setAttribute("height","100%");c.setAttribute("frameborder",
"0");c.style.position="absolute";$(c).load(function(){$("#inProgressWithSpinner").toggle();a===h.reminder&&c.contentWindow.postMessage({type:"DisplayMode",mode:a,reminders:b,method:g},d);a===h.normal&&c.contentWindow.postMessage({type:"DisplayMode",mode:a,reminders:b,provider:f,method:g},d)});$("#oneminutesignup").empty();$("#oneminutesignup").append(c);window.addEventListener("message",p)}})}))}var h={normal:"normal",reminder:"reminder"},b=[],e=null,l=null,k=!1,d=null;return{show:n,showWithProvider:function(){if("started"!==
bg.OmsNotificationPopup.getState()){var a;a=bg.get("g_username");a=-1!==a.indexOf("@gmail")?"Gmail":-1!==a.indexOf("@yahoo")?"Yahoo":-1!==a.indexOf("@outlook")?"Office365":"Unknown";n("normal",a);bg.OmsNotificationPopup.setState("started")}},setOpenTourFn:function(a){e=a},fetchReminders:m,getReminderCount:function(){return b?b.length:0},modes:h}}();
