LPFeatures=function(){var d=$(document.body),a=function(c){c=bg.get("g_prefoverrides")[c];return void 0===c||"1"===c};return{updateFeatures:function(c){for(var a in c){var e=c[a],b;b=a;var f=bg.get("g_prefoverrides");switch(b){case "showcredmon":b=bg.get("g_showcredmon");break;default:b=f&&f[b]}"boolean"===typeof b&&(b=b?"1":"0");d.removeClass("no-feature-"+a);d.removeClass("feature-"+a);e&&"0"===b?d.addClass("no-feature-"+a):e||"1"!==b||d.addClass("feature-"+a)}bg.get("g_new_settings_enabled")&&
$("#newSettingsMenuItem").addClass("visible")},allowIndividualSharing:function(){return this.allowShare()&&!this.allowShareOnlyFolders()},allowSharedFolders:function(){return this.allowShare()},allowClipboardCopy:function(){return bg.can_copy_to_clipboard()},allowImport:function(){return a("import")},allowShare:function(){return a("share")},allowShareOutsideEnterprise:function(){return a("shareout")},allowShareOnlyFolders:function(){return"1"===bg.get("g_prefoverrides").share_onlyfolders},allowShareDomain:function(a){return!0},
allowPasswordRevert:function(){return a("revert")},allowNotes:function(){return a("show_notes")},allowFingerprint:function(){return a("show_fingerprint")},allowBookmarklets:function(){return a("bookmarklets")},allowHint:function(){return a("hint")},allowGift:function(){var a=new Date;return 10===a.getMonth()&&25<=a.getDate()||11===a.getMonth()&&25>=a.getDate()?!0:!1},allowLaunchApplication:function(){return bg.canLaunchApplication()},allowNewSettings:function(){return bg.get("g_new_settings_enabled")},
canBackgroundOpenPopover:function(){return LPPlatform.canBackgroundOpenPopover()}}}();
