var LPDOMHelper=new LPDOMHelper_lib;
function LPDOMHelper_lib(){var e=this;this.InputIsText=function(a){return a&&"string"==typeof a?lp_in_array(a.toLowerCase(),["text","email","tel"])?!0:!1:!1};this.InputIsPassword=function(a){return a&&"string"==typeof a?"password"==a.toLowerCase()?!0:!1:!1};this.InputIsCheckable=function(a){return a&&"string"==typeof a?lp_in_array(a.toLowerCase(),["radio","checkbox"])?!0:!1:!1};this.elt_getId=function(a){if(!a)return"";if("string"==typeof a.id)return a.id;a=a.getAttribute("id");null===a&&(a="");return a};
this.elt_getName=function(a){if(!a)return"";if("string"==typeof a.name)return a.name;a=a.getAttribute("name");null===a&&(a="");return a};this.elt_getType=function(a){if(!a)return"";if("string"==typeof a.type)return a.type;a=a.getAttribute("type");null===a&&(a="");return a};this.elt_getAttribute=function(a,b){return a&&b&&"undefined"!=typeof a.getAttribute?a.getAttribute(b):""};this.is_encrypted_field=function(a){return"function"==typeof is_encrypted_field?is_encrypted_field(a):"text"==a||"password"==
a||"textarea"==a||"email"==a||"tel"==a||"url"==a};this.getDocumentMode=function(a){return LP_getDocumentMode(a)};this.getQuirksMode=function(a){return LP_getQuirksMode(a)};this.GetHrefFromDocument=function(a){var b="";if(!a)return"";if("function"==typeof get_doc_location_ref)return get_doc_location_href(a);try{var c=e.GetLocationFromDocument(a);c&&(b=c.href);"undefined"==typeof b&&(b="")}catch(d){is_user_debug_enabled()&&console_warn(d.message),b=""}return b};this.GetHrefFromWindow=function(a){var b=
"";if(!a)return"";try{var c=e.GetLocationFromWindow(a);c&&(b=c.href);"undefined"==typeof b&&(b="")}catch(d){is_user_debug_enabled()&&console_warn(d.message),b=""}return b};this.GetLocationFromDocument=function(a){var b=null;if(!a)return null;try{var c=a.location;c&&(b=c);isEmptyObject(c)&&(b=null);"undefined"==typeof b&&(b=null)}catch(d){is_user_debug_enabled()&&console_warn(d.message),b=null}return b};this.GetLocationFromWindow=function(a){var b=null;if(!a)return null;try{var c=a.location;c&&(b=
c);isEmptyObject(c)&&(b=null);"undefined"==typeof b&&(b=null)}catch(d){is_user_debug_enabled()&&console_warn(d.message),b=null}return b};this.GetOriginFromDocument=function(a){if(!a)return"";var b="";try{var c=e.GetLocationFromDocument(a);c&&(b="undefined"!=typeof a.origin?c.origin:sprintf("%s//%s%s",c.protocol,c.hostname,c.port?":"+c.port:""))}catch(d){is_user_debug_enabled()&&console_warn(d.message),b=""}return b};this.GetOriginFromWindow=function(a){if(!a)return"";var b="";try{var c=e.GetLocationFromWindow(a);
c&&(b="undefined"!=typeof a.origin?a.origin:sprintf("%s//%s%s",c.protocol,c.hostname,c.port?":"+c.port:""))}catch(d){is_user_debug_enabled()&&console_warn(d.message),b=""}return b};this.GetOriginFromLocation=function(a){if(!a)return"";var b="";try{b="undefined"==typeof a.origin?sprintf("%s//%s%s",a.protocol,a.hostname,a.port?":"+a.port:""):a.origin}catch(c){is_user_debug_enabled()&&console_warn(c.message),b=""}return b};this.GetTagName=function(a){return a?"undefined"==typeof a.tagName?null:a.tagName:
""};this.GetOwnerDocument=function(a){return a&&"undefined"!=typeof a.ownerDocument?a.ownerDocument:null};this.GetWindowFromDocument=function(a){return a&&"undefined"!=typeof a.defaultView?a.defaultView:null};this.FieldIsReadOnly=function(a){return LP_fieldIsReadOnly(a)};this.FieldIsDisabled=function(a){return LP_fieldIsDisabled(a)};this.GetDocumentReadyState=function(a){return a&&"undefined"!=typeof a.readyState?a.readyState:""};this.DoFocus=function(a){if(!a)return!1;var b=!1;try{a.focus(),b=!0}catch(c){b=
!1}return b};this.DoBlur=function(a){if(!a)return!1;var b=!1;try{a.blur(),b=!0}catch(c){b=!1}return b};this.set_aria_hidden=function(a,b){return a?a.setAttribute("aria_hidden",b):!1};this.dump_page=function(){pass};this.GetName=function(){return LP_getname.apply(this,arguments)};this.GetValue=function(a){return a?"undefined"!=typeof a.value?a.value:a.getAttribute("value"):null};this.GetElementById=function(a){var b=LP_derive_doc();return b&&a?b.getElementById(a):null};this.IsVisible=function(a){return lpIsVisible.apply(this,
arguments)};this.win_getName=function(a){return a?a.name:null};this.GetDocumentTld=function(a){a||(a=LP_derive_doc());return a?lp_gettld_url(punycode.URLToASCII(get_doc_location_href())):null};this.GetOwnerForm=function(a){return a?LP_getFormEquivalent(e.GetOwnerDocument(a),a):null};this.FindElementById=function(a){var b=LP_derive_doc();return"undefined"!=typeof LPDriver&&"undefined"!=typeof LPDriver.find_element_by_id?LPDriver.find_element_by_id(b,a):e.GetElementById(a)};this.FindElementByName=function(a){var b=
LP_derive_doc();if("undefined"!=typeof LPDriver&&"undefined"!=typeof LPDriver.find_element_by_name)return LPDriver.find_element_by_name(b,a);a=b.getElementsByName(a);return!a||1>a.length?null:a[0]};this.SetFieldDisabled=function(a){return a?a.disabled=!0:!1};this.DetachElement=function(a){if(!a)return null;var b=a.parentNode;b&&b.removeChild(a);return a};this.AppendChild=function(a,b){if(!a||!b)return null;a.appendChild(b);return b};this.GetParentElement=function(a){return a?a.parentElement:null};
this.ElementIsDetached=function(a){var b=e.GetOwnerDocument(a);return element_is_detached(b,a)};this.SetAttribute=function(a,b,c){return a&&b?"undefined"!=typeof a.setAttribute?(a.setAttribute(b,c),!0):!1:!1};this.RemoveAttribute=function(a,b){return a?"undefined"!=typeof a.removeAttribute?(a.removeAttribute(b),!0):!1:!1};this.CASE_INSENSITIVE=function(){return 0};this.CASE_SENSITIVE=function(){return 1};this.GetAttribute=function(a,b){return e.elt_getAttribute(a,b)}};
