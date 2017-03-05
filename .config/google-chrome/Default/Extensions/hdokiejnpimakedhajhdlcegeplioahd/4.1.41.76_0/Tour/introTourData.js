var IntroTourData=IntroTourData||function(){return{introTour:{welcomeStep:{"class":"tour-welcome-step",title:Strings.translateString("Welcome to your vault!"),contentText1:Strings.translateString("Your vault is a safe place to store passwords, notes, profiles for online shopping, and even documents."),contentText2:Strings.translateString("And no matter where you work, your vault keeps everything in sync, so you can stay organized and save time."),buttons:[{style:"btn-blue",sizeStyle:"col-2 btn-container-lg",
text:Strings.translateString("Show me around"),action:"start"},{style:"btn-link",sizeStyle:"col-1 btn-container-sm",text:Strings.translateString("Later"),action:"later"},{style:"btn-link",sizeStyle:"col-1 btn-container-sm",text:Strings.translateString("Never"),action:"never"}],position:{targetId:"#header",align:"left",orientation:"top",fillWidth:"#main"},openAction:function(){LPVault.maximizeLeftMenu();$("#vault").addClass("tour-overrides")},closeAction:function(){$("#vault").removeClass("tour-overrides")},
exitAction:"never"},laterStep:{"class":"tour-welcome-step",title:Strings.translateString("Welcome back!"),contentText1:Strings.translateString("Ready to get started? We\u2019ll help you set up your vault. It\u2019s easy-to-use, searchable, and organized just the way you like."),buttons:[{style:"btn-blue",sizeStyle:"col-2 btn-container-lg",text:Strings.translateString("Show me around"),action:"start"},{style:"btn-link",sizeStyle:"col-2 btn-container-sm",text:Strings.translateString("No thanks"),action:"never"}],
position:{targetId:"#header",align:"left",orientation:"top",fillWidth:"#main"},openAction:function(){LPVault.maximizeLeftMenu();$("#vault").addClass("tour-overrides")},closeAction:function(){$("#vault").removeClass("tour-overrides")},exitAction:"never"},steps:[{title:Strings.translateString("All your passwords, in one safe place. "),contentText1:function(){return 1<=LPProxy.getModelCount()?Strings.translateString("LastPass remembers the login information for all of your favorite websites - and helps you create stronger passwords, too. Click any site in your vault to launch it and log in instantly."):
Strings.translateString("Save usernames and passwords for all the websites and apps you visit, so LastPass can remember and fill them for you. You can save as you browse, too!")},buttons:[{style:"btn-blue",sizeStyle:"col-6 col-push-6",text:Strings.translateString("Next"),action:"next"}],position:{targetId:"#vaultMenuItem",align:"top",orientation:"left",offset:{left:-20,top:-25},pingOffset:{left:80,top:0},arrowPosition:50},openAction:function(){LPVault.maximizeLeftMenu();$("#vaultMenuItem").click()},
exitAction:"exit"},{title:Strings.translateString("Who needs sticky notes?"),contentText1:Strings.translateString("Keep track of all the odds and ends of your digital life with secure notes. Store memberships, Wi-Fi passwords, credit card numbers, and more. They\u2019re always there, when and where you need them."),buttons:[{style:"btn-link",text:Strings.translateString("Back"),action:"previous"},{style:"btn-blue",text:Strings.translateString("Next"),action:"next"}],position:{targetId:"#notesMenuItem",
align:"top",orientation:"left",offset:{left:-20,top:-25},pingOffset:{left:80,top:0},arrowPosition:50},openAction:function(){$("#notesMenuItem").click()},exitAction:"exit"},{title:Strings.translateString("Don\u2019t reach for your wallet."),contentText1:Strings.translateString("We\u2019ve got you covered with form fill profiles. Add your payment cards and contact info, so you can checkout in a few clicks, no typing required."),buttons:[{style:"btn-link",text:Strings.translateString("Back"),action:"previous"},
{style:"btn-blue",text:Strings.translateString("Next"),action:"next"}],position:{targetId:"#formFillMenuItem",align:"top",orientation:"left",offset:{left:-20,top:-25},pingOffset:{left:80,top:0},arrowPosition:50},openAction:function(){$("#formFillMenuItem").click()},exitAction:"exit"},{title:Strings.translateString("Psst! Need to share a secret?"),contentText1:Strings.translateString("When you need to give friends or family access to one of your accounts, don\u2019t send a text or email. Just share through LastPass, so you both can login when and where you need to."),
buttons:[{style:"btn-link",text:Strings.translateString("Back"),action:"previous"},{style:"btn-blue",text:Strings.translateString("Next"),action:"next"}],position:{targetId:"#sharingMenuItem",align:"top",orientation:"left",offset:{left:-20,top:-25},pingOffset:{left:80,top:0},arrowPosition:50},openAction:function(){$("#sharingMenuItem").click()},exitAction:"exit"},{title:Strings.translateString("Save"),contentText1:Strings.translateString("Use this button to add new sites, notes, and profiles, from anywhere in your vault."),
buttons:[{style:"btn-link",text:Strings.translateString("Back"),action:"previous"},{style:"btn-blue",text:Strings.translateString("Next"),action:"next"}],position:{targetId:"#addMenuButton",align:"bottom",orientation:"right",offset:{left:-80,top:-35},pingOffset:{left:-150,top:-80},arrowPosition:90},openAction:function(){LPVault.openVault();setTimeout(function(){$("#addMenu").addClass("open");Topics.get(Topics.VAULT_LEFT_MENU_TOGGLE).publish()},400)},closeAction:function(){$("#addMenu").removeClass("open")},
exitAction:"exit"},{title:Strings.translateString("You\u2019re ready to get started!"),contentText1:Strings.translateString("There\u2019s a lot more to discover, but we hope this tour was a helpful start. You can revisit any time by selecting More options > Help > Vault Tour."),buttons:[{style:"btn-link",text:Strings.translateString("Back"),action:"previous"},{style:"btn-blue",text:Strings.translateString("Ok"),action:"close"}],exitAction:"close",position:{targetId:"#advancedMenuItem",align:"left",
orientation:"bottom",offset:{left:30,top:0},pingOffset:{left:90,top:0},arrowPosition:180}}],exitStep:{title:Strings.translateString("Not a good time?"),contentText1:Strings.translateString("If you change your mind, you can revisit this tour by selecting More options > Help > Vault Tour."),buttons:[{style:"btn-blue",sizeStyle:"col-6 col-push-6",text:Strings.translateString("Ok"),action:"close"}],exitAction:"close",position:{targetId:"#advancedMenuItem",align:"left",orientation:"bottom",offset:{left:30,
top:0},pingOffset:{left:90,top:0},arrowPosition:180},autoClose:5E3}}}}();
