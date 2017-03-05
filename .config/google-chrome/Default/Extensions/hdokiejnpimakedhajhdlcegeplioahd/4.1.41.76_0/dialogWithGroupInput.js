DialogWithGroupInput=function(f,e){e=e||{};e.additionalHeaderClasses=void 0===e.additionalHeaderClasses?[]:e.additionalHeaderClasses;e.additionalHeaderClasses.push("icon");e.buttonAlign=e.buttonAlign||this.RIGHT_ALIGN;VaultItemDialog.call(this,f,e);this.updateFavButtonText=null};DialogWithGroupInput.prototype=Object.create(VaultItemDialog.prototype);DialogWithGroupInput.prototype.constructor=DialogWithGroupInput;
(function(){var f=Strings.translateString("Add Site to Favorites"),e=Strings.translateString("Remove Site from Favorites");DialogWithGroupInput.prototype.setup=function(a,d){var b=LPProxy.getGroups();b.sort(VaultItemBase.prototype.sortByNameAsc);for(var c=[],e=0,f=b.length;e<f;++e){var g=b[e];g instanceof DefaultGroup||(g=g.getName(),g!==Strings.Vault.NONE_GROUP&&g!==Strings.Consts.NONE_GROUP&&c.push(g))}this.setGroupDropdownValues(c);this.updateFavButtonText&&this.updateFavButtonText();VaultItemDialog.prototype.setup.apply(this,
arguments)};DialogWithGroupInput.prototype.setGroupDropdownValues=function(a){this.inputFields.group.setValues(a)};DialogWithGroupInput.prototype.save=function(a,d){a.saveFromDialog(d,this.getGroup(d),this.data.saveOptions)};DialogWithGroupInput.prototype.add=function(a){if(this.options.type){var d=new this.options.type;if(this.data.saveOptions)if(a.group){var b=bg.get("siteCats"),c;for(c in b){if(b[c]===a.group){this.data.saveOptions.folder=a.group;break}this.data.saveOptions.folder="user"}}else this.data.saveOptions.folder=
"none";d.addFromDialog(a,this.getGroup(a),this.data.saveOptions)}else throw"Dialog must provide a type for new item or override this function.";};DialogWithGroupInput.prototype.allowNoneGroup=function(){return!0};DialogWithGroupInput.prototype.addFavButton=function(){var a=LPTools.createElement("div","itemButtons dialogItemButtons");this.buttonContainer.prepend(a);var d=LPTools.createElement("input",{type:"checkbox","class":"favButton"});a.appendChild(d);this.inputFields.fav=new DialogInput.Input(d);
var b=LPTools.createElement("label",{"class":"favButtonLabel itemButton",title:f});a.appendChild(b);var c=this.updateFavButtonText=function(){d.checked?b.setAttribute("title",e):b.setAttribute("title",f)};$(b).bind("click",function(){d.checked=!d.checked;c()});this.actionButtonContainer=LPTools.createElement("div","actionButtonContainer");a.appendChild(this.actionButtonContainer);this.actionButtonContainer=$(this.actionButtonContainer);return a};DialogWithGroupInput.prototype.getGroupField=function(a){return"group"};
DialogWithGroupInput.prototype.validate=function(a){var d=VaultItemDialog.prototype.validate.apply(this,arguments),b=this.getGroupField(a);if(a[b]){var c=LPProxy.getExistingGroupParent(a[b]);null===c&&-1<a[b].indexOf(SharedGroup.prototype.SHARED_FOLDER_NAME_PREFIX)&&(this.addError(b,Strings.translateString("Sorry - group names starting with 'Shared-' are created by LastPass to indicate groups shared with other people. Please use a different name.")),d=!1);this.originalData[b]!==a[b]&&c&&c.isReadOnly()&&
(this.addError(b,Strings.translateString("You do not have permission to add items to this folder.")),d=!1)}return d};DialogWithGroupInput.prototype.getGroup=function(a,d){var b=a[this.getGroupField(a)];!b&&this.allowNoneGroup()&&(b=Strings.Consts.NONE_GROUP);var c=LPProxy.getGroupByName(b);!c&&b&&(c=LPProxy.getExistingGroupParent(b),c=new DummyGroup(b,c?c.getSharedGroup():null));return c}})();
