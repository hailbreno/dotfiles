TypeaheadDropdown=function(d,a,b){this.hint=this.hintElement=null;this.autoCompleteBlurs=LPTools.getOption(b,"autoCompleteBlurs",!0);this.hasMatches=!1;DropdownInput.call(this,d,a,b);(function(a){a.getElement().bind("keydown",function(b){if(a.dropdownEnabled)switch(b.keyCode||b.which){case 9:a.autocomplete(b);break;case 27:a.shown&&(a.hide(),b.stopPropagation(),b.preventDefault())}});a.optionFocusHandler=function(b){b=a.options[a.getDropdownValue(b)];var c=a.inputObject.getValue();a.queryMatches(b,
c)?a.setHint(c,b):a.clearHint()}})(this)};TypeaheadDropdown.prototype=Object.create(DropdownInput.prototype);TypeaheadDropdown.prototype.constructor=TypeaheadDropdown;
(function(){TypeaheadDropdown.prototype.adjustView=function(){DropdownInput.prototype.adjustView.apply(this,arguments);var a=this.inputObject.getElement(),b=$(this.hintElement.parentElement);b.css({"line-height":a.css("height"),"padding-left":a.css("padding-left"),"padding-right":a.css("padding-right"),"font-weight":a.css("font-weight")});"border-box"===a.css("box-sizing")&&b.css({left:a.css("border-left-width"),right:a.css("border-right-width")})};TypeaheadDropdown.prototype.build=function(){DropdownInput.prototype.build.apply(this,
arguments);var a=$(LPTools.createElement("div","dropdownHint"));this.hintElement=LPTools.createElement("span");a.append(this.hintElement);var b=this.inputObject.getElement(),c=$(LPTools.createElement("div","relative"));b.before(c);c.append(a);c.append(b);b.prop("readonly",!1)};TypeaheadDropdown.prototype.autocomplete=function(a){this.hint&&(this.setValue(this.hint.value),this.autoCompleteBlurs||(a.preventDefault(),a.stopPropagation()))};TypeaheadDropdown.prototype.getDropdownClass=function(){return"typeaheadDropdown"};
TypeaheadDropdown.prototype.clear=function(){DropdownInput.prototype.clear.apply(this,arguments);this.dynamic&&this.setOptions([])};TypeaheadDropdown.prototype["default"]=function(){DropdownInput.prototype["default"].apply(this,arguments);this.updateDropdown("")};TypeaheadDropdown.prototype.hide=function(){DropdownInput.prototype.hide.apply(this);this.clearHint()};TypeaheadDropdown.prototype.show=function(a){(this.hasMatches||a)&&DropdownInput.prototype.show.apply(this)};TypeaheadDropdown.prototype.setHint=
function(a,b){0<a.length?(this.hintElement.textContent=a+b.label.substring(Math.min(a.length,b.label.length)),this.hint=b):this.clearHint()};TypeaheadDropdown.prototype.clearHint=function(){this.hintElement.textContent="";this.hint=null};var d=function(a,b){a=a.get(0);var c=a.value,g=a.selectionStart||0,e=a.selectionEnd||0,f=c.substring(0,g),d=c.substring(e,c.length);g===e&&(0<g&&8===b?f=f.substring(0,f.length-1):e<c.length&&46===b&&(d=d.substring(1)));"number"!==typeof b&&(f+=b);return f+d};TypeaheadDropdown.prototype.handleKeypress=
function(a){this.updateDropdown(d(this.inputObject.getElement(),a))};TypeaheadDropdown.prototype.handleDelete=function(a){this.updateDropdown(d(this.inputObject.getElement(),a))};TypeaheadDropdown.prototype.handleDownArrow=function(){this.show();LPTools.setNavIndex(0)};DropdownInput.prototype.getKeyboardNavigationFocusHandler=function(){return this.optionFocusHandler};TypeaheadDropdown.prototype.updateDropdown=function(a){var b=!1;this.hasMatches=!1;var c=this.dropdownElement.children().first();c.empty();
for(var d in this.options){var e=this.options[d];this.queryMatches(e,a,!0)&&(c.append(e.element),this.hasMatches=!0,!b&&this.queryMatches(e,a)&&(this.setHint(a,e),b=!0))}b||this.clearHint();this.hasMatches?this.shown?this.addKeyBoardNavigation():a&&this.show():this.hide()}})();
