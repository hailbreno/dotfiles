can_clear_clipboard=function(){return"undefined"!=typeof g_can_clear_clipboard&&g_can_clear_clipboard};can_copy_to_clipboard=function(){return"undefined"!=typeof g_can_copy_to_clipboard&&g_can_copy_to_clipboard};db_prepend=function(a){return a};have_binary=function(){return have_nplastpass()||have_native_messaging()||have_ws()};have_nplastpass=function(){return"undefined"!=typeof g_have_nplastpass&&g_have_nplastpass};
have_native_messaging=function(){return"undefined"!=typeof g_have_native_messaging&&g_have_native_messaging};have_ws=function(){return"undefined"!=typeof g_have_ws&&g_have_ws};setcurrenttabid=function(a){g_currenttabid=a};setcurrenturl=function(a){g_currenturl=a};getClearRecentTime=function(){return clearRecentTime};getmatchingsites=function(){return g_sites_tld};is_chrome_portable=function(){return"undefined"!=typeof this.g_is_chrome_portable&&this.g_is_chrome_portable};
is_user_debug_enabled=function(){return"undefined"!=typeof g_user_debug_enabled?g_user_debug_enabled:!1};clear_badge=function(){g_badgedata=null};get_key_iterations=function(a){return g_key_iterations};
