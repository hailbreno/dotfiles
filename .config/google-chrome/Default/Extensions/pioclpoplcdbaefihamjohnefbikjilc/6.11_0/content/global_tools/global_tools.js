/*! Copyright 2009-2017 Evernote Corporation. All rights reserved. */
function calcBodyWidth(){var a=154;/hidable/.test(document.body.className)&&(a=172);var b=0,c=document.querySelector(".tooltipon:first-child");if(c){var d=parseInt(window.getComputedStyle(c,":before").width)+23;b=d-25}if(c=document.querySelector(".tooltipon:last-child")){var d=parseInt(window.getComputedStyle(c,":before").width)+23;b=Math.max(d-78,0)}var e=document.querySelector(".subtool_panel.visible");return e?Math.max(a+b,330):a+b}function getIsBusinessAccountEnable(){Browser.sendToExtension({name:"getPersistentValue",key:"UserInfoKey"})}function finishNotebookLoading(){receivedPersonalNotebooks&&receivedSharedNotebooks&&receivedBusinessNotebooks&&smartFilingInfo&&(createdNotebookGuid&&(notebookSelector.setUserSelectedNotebookGuid(null),tempNotebooksData.createdNotebookGuid=createdNotebookGuid,createdNotebookGuid=null),getIsBusinessAccountEnable(),notebookSelector.addNotebooks(tempNotebooksData),setHeight())}function handleReceivedNotebooks(a,b){for(var c=0,d=a.notebooks.length;c<d;c++){var e=a.notebooks[c];e.accountSelector=b,tempNotebooksData.notebooks.push(e)}tempNotebooksData.account=tempNotebooksData.account||{},tempNotebooksData.account[b]={alwaysStartInNotebookGuid:a.alwaysStartInNotebookGuid,recentNotebookGuid:a.recentNotebookGuid},a.exception&&(tempNotebooksData.exception=a.exception)}function toggleMinimizeButtonVisibility(a){minimizeEnable="hide"!==a,minimizeButton.classList.toggle("hide",!minimizeEnable)}function handleClipperToolClick(){if(activeClipType!=this)switch(activeClipType&&activeClipType.classList.remove("active"),activeClipType=this,activeClipType.classList.add("active"),"screenshot"===this.id?(toggleMinimizeButtonVisibility("hide"),toggleMinimizeButtonVisibility("hide")):toggleMinimizeButtonVisibility("show"),this.id){case"article":var a=document.body.classList.contains("remember");a||Browser.sendToExtension({name:"setPersistentValue",key:"lastUsedAction",value:"ARTICLE"}),Browser.sendToExtension({name:"bounce",message:{name:"previewArticle",scrollToElement:!a}});break;case"clearly":Browser.sendToExtension({name:"setPersistentValue",key:"lastUsedAction",value:"CLEARLY"}),Browser.sendToExtension({name:"bounce",message:{name:"previewClearly"}});break;case"custom":Browser.sendToExtension({name:"bounce",message:{name:"previewCustom"}});break;case"fullPage":Browser.sendToExtension({name:"setPersistentValue",key:"lastUsedAction",value:"FULL_PAGE"}),Browser.sendToExtension({name:"bounce",message:{name:"previewFullPage"}});break;case"pdf":Browser.sendToExtension({name:"bounce",message:{name:"previewPdf"}});break;case"url":Browser.sendToExtension({name:"setPersistentValue",key:"lastUsedAction",value:"URL"}),Browser.sendToExtension({name:"bounce",message:{name:"previewUrl"}});break;case"screenshot":document.body.classList.contains("skitchReady")?Browser.sendToExtension({name:"bounce",message:{name:"clearPreview"}}):(document.body.classList.add("skitchWaiting"),Browser.sendToExtension({name:"bounce",message:{name:"previewSkitch"}}),setHeight());break;case"email":Browser.sendToExtension({name:"bounce",message:{name:"previewEmail"}});break;case"selection":Browser.sendToExtension({name:"bounce",message:{name:"previewSelection"}})}}function handleEscape(a,b,c){document.activeElement===title?title.blur():notebookSelector.close()||tagSelector.abort()||(document.activeElement===comments?comments.blur():Browser.sendToExtension({name:"bounce",message:{name:"duplicateKeyboardShortcut",keycode:a.keycode}}))}function handleSkitchToolClick(a){if("colors"!==this.id&&"zoomin"!==this.id&&"zoomout"!==this.id&&"crop"!==this.id){var b=document.getElementsByClassName("selectedSkitchTool")[0];b&&b.classList.remove("selectedSkitchTool"),this.classList.add("selectedSkitchTool")}"shapes"===this.id||"stamps"===this.id?Browser.sendToExtension({name:"bounce",message:{name:"skitch_useTool",tool:this.getAttribute("data-tool")}}):"zoomin"===this.id?Browser.sendToExtension({name:"bounce",message:{name:"skitch_zoomIn"}}):"zoomout"===this.id?Browser.sendToExtension({name:"bounce",message:{name:"skitch_zoomOut"}}):"colors"!==this.id&&(Browser.sendToExtension({name:"bounce",message:{name:"skitch_useTool",charCode:a?a.charCode:null,loc:a?a.loc:null,tool:this.id}}),"highlighter"===this.id&&Browser.sendToExtension({name:"getPersistentValue",key:"changedHighlighterColor"}));var c=document.querySelector(".subtools.open");c&&c.classList.remove("open"),(a&&!a.noOpenSubtools||!a)&&this.classList.contains("expandable")&&window[this.id+"Subtools"].classList.add("open"),handleSkitchTool=!0}function handleSubtoolClick(){SHAPE_NAMES.indexOf(this.id)>-1?(DOMTokenList.prototype.remove.apply(shapesTool.classList,SHAPE_NAMES),shapesTool.classList.add(this.id),shapesTool.setAttribute("data-tool",this.id),shapesSubtools.classList.remove("open")):STAMP_NAMES.indexOf(this.id)>-1?(DOMTokenList.prototype.remove.apply(stampsTool.classList,STAMP_NAMES),stampsTool.classList.add(this.id),stampsTool.setAttribute("data-tool",this.id),Browser.sendToExtension({name:"setPersistentValue",key:"lastSkitchStamp",value:this.id}),stampsSubtools.classList.remove("open")):COLOR_NAMES.indexOf(this.id)>-1&&(DOMTokenList.prototype.remove.apply(colorsTool.classList,COLOR_NAMES),colorsTool.classList.add(this.id),colorsTool.setAttribute("data-tool",this.id),Browser.sendToExtension({name:"setPersistentValue",key:"lastSkitchColor",value:this.id}),colorsSubtools.classList.remove("open"),Browser.sendToExtension({name:"bounce",message:{name:"skitch_useColor",color:this.id}}),"highlighter"===document.getElementsByClassName("selectedSkitchTool")[0].id&&Browser.sendToExtension({name:"setPersistentValue",key:"changedHighlighterColor",value:!0})),COLOR_NAMES.indexOf(this.id)<0&&Browser.sendToExtension({name:"bounce",message:{name:"skitch_useTool",tool:this.id}})}function initialize(a,b,c){a.ssoRequired?document.body.classList.add("ssoRequired"):document.body.classList.remove("ssoRequired"),title.value=a.title.substr(0,EDAM_NOTE_TITLE_LEN_MAX),title.dispatchEvent(new CustomEvent("input"))}function openNotebook(){notebookSelector.open()}function openTags(){tagSelector.focus()}function reactivateClipperTool(a,b,c){handleClipperToolClick.call(activeClipType)}function receiveBusinessNotebooks(a,b,c){receivedBusinessNotebooks||(handleReceivedNotebooks(a,GlobalUtils.ACCOUNT_SELECTOR_BUSINESS),receivedBusinessNotebooks=!0,finishNotebookLoading())}function receiveBusinessTags(a,b,c){tagSelector.addBusinessTags(a.tags),c&&c()}function receiveNotebookCreationResult(a,b,c){c&&c(),!a.error&&a.result&&(createdNotebookGuid=a.result.guid,Browser.sendToExtension({name:"trackEvent",category:"notebooks",action:"create_notebook",label:a.result.businessId?"business":"personal"})),notebookSelector.receiveNotebookCreationResult(a),setHeight()}function receiveOption(a,b,c){if("clipAction"==a.key){var d=new RegExp("(?:"+document.body.className.replace(/\s+/,"|")+")");document.body.classList.contains("remember")?handleClipperToolClick.call(article):document.body.classList.contains("selection")?handleClipperToolClick.call(selection):document.body.classList.contains("email")?handleClipperToolClick.call(email):document.body.classList.contains("custom")?handleClipperToolClick.call(custom):d.test(pdf.className)?handleClipperToolClick.call(pdf):"ARTICLE"==a.value&&d.test(article.className)?handleClipperToolClick.call(article):"CLEARLY"==a.value&&d.test(clearly.className)?handleClipperToolClick.call(clearly):"FULL_PAGE"==a.value&&d.test(fullPage.className)?handleClipperToolClick.call(fullPage):"URL"==a.value&&d.test(url.className)?handleClipperToolClick.call(url):d.test(article.className)?handleClipperToolClick.call(article):d.test(fullPage.className)?handleClipperToolClick.call(fullPage):d.test(url.className)&&handleClipperToolClick.call(url)}}function receivePersistentValue(a,b,c){"isMinimized"===a.key?a.value&&"true"==a.value&&toggleMinimizeClipper():"UserInfoKey"===a.key?a.value&&(accountSelector.setUserInfo(a.value),isToggle&&(isToggle=!1,notebookSelector.markStatus(!1),notebookSelector.clearNotebooksData(),toggleAccount())):"lastSkitchStamp"===a.key?(a.value||(a.value="stampAccept"),stampsTool.classList.add(a.value),stampsTool.setAttribute("data-tool",a.value)):"lastSkitchColor"===a.key?(a.value||(a.value="pink"),colorsTool.classList.add(a.value),colorsTool.setAttribute("data-tool",a.value)):"changedHighlighterColor"===a.key&&(a.value?Browser.sendToExtension({name:"bounce",message:{name:"skitch_useColor",color:colorsTool.getAttribute("data-tool")}}):handleSubtoolClick.call(document.getElementById("yellow")))}function receivePersonalNotebooks(a,b,c){receivedPersonalNotebooks||(handleReceivedNotebooks(a,GlobalUtils.ACCOUNT_SELECTOR_PERSONAL),receivedPersonalNotebooks=!0,finishNotebookLoading())}function receivePersonalTags(a,b,c){tagSelector.addPersonalTags(a.tags),c&&c()}function receiveSmartFilingInfo(a,b,c){smartFilingInfo=a||{},notebookSelector.setSmartFilingInfo(smartFilingInfo),tagSelector.setSmartFillingInfo(smartFilingInfo),finishNotebookLoading()}function receiveSharedNotebooks(a,b,c){receivedSharedNotebooks||(handleReceivedNotebooks(a,GlobalUtils.ACCOUNT_SELECTOR_PERSONAL),receivedSharedNotebooks=!0,finishNotebookLoading())}function save(){if(saveEnabled){var a=notebookSelector.getNotebooksData();if(a){var b=notebookSelector.getSelected(),c=!1;a.smartFilingNotebook&&b.guid!==a.smartFilingNotebook.guid&&(c={from:{type:a.smartFilingNotebook.type},to:{defaultNotebook:b.defaultNotebook,recentNotebook:!!a.recentNotebook&&a.recentNotebook.guid===b.guid,type:b.type}});accountSelector.getSelectedAccount();Browser.sendToExtension({name:"bounce",message:{name:"startSubmission",clipType:activeClipType.id,title:title.value,notebook:b,tags:tagSelector.getTags(),comment:comments.value,changedSmartFilingNotebook:c,smartFilingNotebookAvailable:!!a.smartFilingNotebook,userSelectedNotebook:!!notebookSelector.getUserSelectedNotebookGuid()}})}}}function toggleMinimizeClipper(){if(minimizeEnable===!0){main.classList.toggle("minified"),minimizeButton.classList.toggle("maximiseSidebar"),setHeight();var a="";main.classList.contains("minified")?(Browser.sendToExtension({name:"setPersistentValue",key:"isMinimized",value:"true"}),a="minimize_panel"):(Browser.sendToExtension({name:"setPersistentValue",key:"isMinimized",value:"false"}),a="maximize_panel"),Browser.sendToExtension({name:"trackEvent",category:"panel",action:a})}}function maximizeClipper(){main.classList.contains("minified")&&toggleMinimizeClipper()}function setHeight(a){var b=main.offsetHeight,c=(main.offsetHeight-main.clientHeight)/2,d=notebookSelector?notebookSelector.height-(b-notebook.offsetTop-c):0,e=tagSelector?tagSelector.height-(b-tags.offsetTop-c):0;"undefined"!=typeof a&&null!==a||(a=!1),Browser.sendToExtension({name:"bounce",message:{name:"setGlobalToolsHeight",height:b+Math.max(Math.max(d,e),0),recalculate:a}})}function generateUseClipTypeFunctionForShortcut(a){return function(){useClipType({clipType:a})}}function generateUseSkitchToolFunctionForShortcut(a){return function(){maximizeClipper(),useSkitchTool(a)}}function generateGeneralFunctionForShortcut(a){return function(){maximizeClipper(),a()}}function setKeyboardHandlers(a,b,c){if(shortcutsEnabled=a.enabled,a.handlers){var d={};for(var e in a.handlers)for(var f=0;f<a.handlers[e].length;f++)switch(["expandArticleShortcut","contractArticleShortcut","moveArticleUpShortcut","moveArticleDownShortcut"].indexOf(e)>-1?d[a.handlers[e][f]]=function(a,b){"function"==typeof shortcutHandlers[a]&&["INPUT","TEXTAREA"].indexOf(b.nodeName)<0&&"true"!==b.contentEditable&&shortcutHandlers[a](a,b)}:d[a.handlers[e][f]]=function(a,b){shortcutsEnabled&&"function"==typeof shortcutHandlers[a]&&["INPUT","TEXTAREA"].indexOf(b.nodeName)<0&&"true"!==b.contentEditable&&shortcutHandlers[a](a,b)},e){case"closeWebClipperShortcut":shortcutHandlers[a.handlers[e][f]]=function(a){handleEscape({keycode:a})},d[a.handlers[e][f]]=function(a,b){"function"==typeof shortcutHandlers[a]&&shortcutHandlers[a](a,b)};break;case"toggleAccountShortcut":shortcutHandlers[a.handlers[e][f]]=toggleAccount;break;case"previewArticleShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseClipTypeFunctionForShortcut("article");break;case"previewFullPageShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseClipTypeFunctionForShortcut("fullPage");break;case"previewUrlShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseClipTypeFunctionForShortcut("url");break;case"selectionModeShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseClipTypeFunctionForShortcut("selection");break;case"takeScreenshotShortcut":EDGE||(shortcutHandlers[a.handlers[e][f]]=generateUseClipTypeFunctionForShortcut("screenshot"));break;case"clearlyShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseClipTypeFunctionForShortcut("clearly");break;case"pdfShortcut":EDGE||(shortcutHandlers[a.handlers[e][f]]=generateUseClipTypeFunctionForShortcut("pdf"));break;case"emailShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseClipTypeFunctionForShortcut("email");break;case"selectNotebookShortcut":shortcutHandlers[a.handlers[e][f]]=generateGeneralFunctionForShortcut(openNotebook);break;case"addTagsShortcut":shortcutHandlers[a.handlers[e][f]]=generateGeneralFunctionForShortcut(openTags);break;case"saveShortcut":shortcutHandlers[a.handlers[e][f]]=function(){""!==notebookSelector.getCreateNewNotebookValue()?notebookSelector.saveNewNotebook():document.body.classList.contains("skitchWaiting")?Browser.sendToExtension({name:"bounce",message:{name:"captureScreen"}}):save()};break;case"minimizeClipperShortcut":shortcutHandlers[a.handlers[e][f]]=toggleMinimizeClipper;break;case"arrowShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseSkitchToolFunctionForShortcut({tool:"shapes",subtool:"arrow"});break;case"textShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseSkitchToolFunctionForShortcut({tool:"text"});break;case"rectangleShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseSkitchToolFunctionForShortcut({tool:"shapes",subtool:"rectangle"});break;case"roundedRectangleShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseSkitchToolFunctionForShortcut({tool:"shapes",subtool:"roundedRectangle"});break;case"ellipseShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseSkitchToolFunctionForShortcut({tool:"shapes",subtool:"ellipse"});break;case"lineShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseSkitchToolFunctionForShortcut({tool:"shapes",subtool:"line"});break;case"markerShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseSkitchToolFunctionForShortcut({tool:"marker"});break;case"highlighterShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseSkitchToolFunctionForShortcut({tool:"highlighter"});break;case"stampShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseSkitchToolFunctionForShortcut({tool:"stamps"});break;case"pixelateShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseSkitchToolFunctionForShortcut({tool:"pixelate"});break;case"cropShortcut":shortcutHandlers[a.handlers[e][f]]=generateUseSkitchToolFunctionForShortcut({tool:"crop"});break;default:shortcutHandlers[a.handlers[e][f]]=function(a){Browser.sendToExtension({name:"bounce",message:{name:"duplicateKeyboardShortcut",keycode:a}})}}Browser.addKeyboardHandlers(d)}}function setPossibleClipTypes(a,b,c){a.pageInfo.pdf?document.body.classList.add("pdf"):a.pageInfo.gmailThread?document.body.classList.add("email"):a.pageInfo.documentIsFrameset?document.body.classList.add("frameset"):a.pageInfo.custom?(document.body.classList.add("custom"),custom.textContent=Browser.i18n.getMessage(a.pageInfo.custom)):document.body.classList.add("html"),a.pageInfo.selection&&document.body.classList.add("selection"),a.rememberButton&&document.body.classList.add("remember"),setHeight()}function skitchSurfaceReady(){toggleMinimizeButtonVisibility("show"),document.body.classList.add("skitchReady"),handleSkitchToolClick.call(shapesTool,{noOpenSubtools:!0}),Browser.sendToExtension({name:"bounce",message:{name:"skitch_useColor",color:colorsTool.getAttribute("data-tool")}}),setHeight()}function getNotebooks(){receivedPersonalNotebooks=!1,receivedSharedNotebooks=!1,receivedBusinessNotebooks=!1,tempNotebooksData={notebooks:[],smartFilingNotebook:null,recentNotebook:null},Browser.sendToExtension({name:"getNotebooks"})}function createNotebook(a){Browser.sendToExtension({name:"createNotebook",notebook:a})}function updateUser(a,b,c){a.ssoRequired?document.body.classList.add("ssoRequired"):document.body.classList.remove("ssoRequired"),getNotebooks(),tagSelector.reset(),Browser.sendToExtension({name:"getTags"}),isToggle=!0,getIsBusinessAccountEnable(),a.ssoRequired||Browser.sendToExtension({name:"bounce",message:{name:"ttc_close",which:"ssoInProgress"}})}function useClipType(a,b,c){if(!document.body.classList.contains("skitchReady")){var d=new RegExp("(?:"+document.body.className.replace(/\s+/,"|")+")");d.test(window[a.clipType].className)&&(maximizeClipper(),handleClipperToolClick.call(window[a.clipType]))}}function toggleAccount(){accountSelector.toggleSelectedAccount()}function useSkitchTool(a,b,c){document.body.classList.contains("skitchReady")&&(handleSkitchToolClick.call(document.getElementById(a.tool),{charCode:a.charCode,loc:a.loc,noOpenSubtools:!0}),a.subtool&&handleSubtoolClick.call(document.getElementById(a.subtool)))}function setTitle(a,b,c){title.value=a.title}function getBrowserHeight(a,b,c){browserHeight=a.height||0,toggleSmallScreenMode()}function setSaveReady(a,b,c){saveEnabled=!!a.value,saveButton.classList.toggle("green",saveEnabled),saveButton.classList.toggle("gray",!saveEnabled)}function changeSvgToPng(){for(var a=document.querySelectorAll(".useSvg"),b=0,c=a.length;b<c;b++)a[b].classList.remove("useSvg"),a[b].classList.add("usePng")}function toggleSmallScreenMode(){var a=notebookSelector.isOpened(),b=main.offsetHeight;a&&!main.classList.contains("smallScreenMode")&&(dropdownHeight=main.querySelector(".nbDropdown").offsetHeight+main.querySelector(".nbDropdown").offsetTop);var c=document.getElementById("organize").offsetHeight,d=document.getElementById("organize").getElementsByTagName("h1")[0].offsetHeight,e=document.getElementById("account").offsetHeight,f=b-c-e+d+dropdownHeight,g=Math.max(b,f);main.classList.contains("smallScreenMode")?(main.classList.toggle("smallScreenMode",!1),g+clipSection.offsetHeight+20>=browserHeight&&main.classList.toggle("smallScreenMode",a)):g>=browserHeight?main.classList.toggle("smallScreenMode",a):main.classList.toggle("smallScreenMode",!1),setHeight()}var SHAPE_NAMES=["arrow","rectangle","roundedRectangle","ellipse","line"],STAMP_NAMES=["stampAccept","stampReject","stampExclaim","stampQuestion","stampPerfect"],COLOR_NAMES=["red","orange","yellow","black","green","blue","pink","white"],receivedPersonalNotebooks=!1,receivedBusinessNotebooks=!1,receivedSharedNotebooks=!1,shortcutsEnabled=!0,savedAuthInfo={},main,closeSidebar,title,saveButton,cancelScreenshotButton,article,clearly,custom,fullPage,selection,pdf,email,url,screenshot,activeClipType,account,accountSelector,notebook,notebookSelector,tags,tagSelector,comments,shapesTool,shapesSubtools,stampsTool,stampsSubtools,colorsTool,colorsSubtools,settings,smartFilingInfo,tempNotebooksData={notebooks:[],smartFilingNotebook:null,recentNotebook:null},shortcutHandlers={},handleSkitchTool=!1,saveEnabled=!0,createdNotebookGuid,minimizeEnable=!0,browserHeight=0,dropdownHeight=0,isToggle=!1;window.addEventListener("DOMContentLoaded",function(){function a(){var a=accountSelector.getSelectedAccount();notebookSelector.setSelectedAccount(a),tagSelector.setSelectedAccount(a)}function b(){Browser.sendToExtension({name:"openBusinessSSOPage"}),Browser.sendToExtension({name:"bounce",message:{name:"showSSOProgressTooltip"}})}main=document.getElementById("main"),closeSidebar=document.getElementById("closeSidebar"),minimizeButton=document.getElementById("minimizeButton"),title=document.getElementById("title"),saveButton=document.getElementById("saveButton"),cancelScreenshotButton=document.getElementById("cancelScreenshot"),article=document.getElementById("article"),clearly=document.getElementById("clearly"),custom=document.getElementById("custom"),fullPage=document.getElementById("fullPage"),selection=document.getElementById("selection"),pdf=document.getElementById("pdf"),email=document.getElementById("email"),url=document.getElementById("url"),screenshot=document.getElementById("screenshot"),activeClipType=null,account=document.getElementById("accountSelector"),notebook=document.getElementById("notebook"),tags=document.getElementById("tags"),comments=document.getElementById("comments"),shapesTool=document.getElementById("shapes"),stampsTool=document.getElementById("stamps"),colorsTool=document.getElementById("colors"),shapesSubtools=document.getElementById("shapesSubtools"),stampsSubtools=document.getElementById("stampsSubtools"),colorsSubtools=document.getElementById("colorsSubtools"),settings=document.getElementById("settings"),previewBanner=document.getElementById("previewBanner"),clipSection=document.getElementById("clip"),Browser.setInterceptSpecialKeys(!0),GlobalUtils.localize(document.body),title.placeholder=Browser.i18n.getMessage("quickNote_untitledNote"),comments.placeholder=Browser.i18n.getMessage("quickNote_addComment"),EDGE&&(screenshot.style.display="none",pdf.style.display="none",main.style["background-clip"]="border-box");for(var c=document.querySelectorAll("#clip h2"),d=0;d<c.length;d++)c.item(d).addEventListener("click",handleClipperToolClick);title.addEventListener("input",function(a){title.value=title.value.replace(/[\n\r]/g,""),title.rows="1",title.scrollHeight>title.clientHeight&&(title.rows="2"),setHeight()}),title.addEventListener("blur",function(){title.scrollTop=0}),FIREFOX&&title.addEventListener("focus",function(){main.classList.contains("minified")&&toggleMinimizeClipper()}),title.maxLength=EDAM_NOTE_TITLE_LEN_MAX,accountSelector=new AccountSelector(main,account,function(){a()},b),notebookSelector=new NotebookSelector(notebook,function(a){a.notebookType&&tagSelector.setActiveTrie(a.notebookType)},setHeight,getNotebooks,createNotebook),getNotebooks(),tagSelector=new TagSelector(tags,setHeight,setHeight),Browser.sendToExtension({name:"getTags"}),a(),comments.addEventListener("input",function(){comments.rows="1",comments.scrollHeight>comments.clientHeight&&(comments.rows="2"),setHeight()}),comments.addEventListener("blur",function(){comments.scrollTop=0}),FIREFOX&&comments.addEventListener("focus",function(){setHeight()});for(var e=document.getElementsByClassName("skitchTool"),d=0;d<e.length;d++)e[d].addEventListener("click",handleSkitchToolClick),"highlighter"==e[d].id?e[d].title=Browser.i18n.getMessage("imageHighlighter"):"shapes"==e[d].id?e[d].title=Browser.i18n.getMessage("shapeTool"):"marker"==e[d].id?e[d].title=Browser.i18n.getMessage("markerTool"):"crop"==e[d].id?e[d].title=Browser.i18n.getMessage("crop"):"zoomout"==e[d].id?e[d].title=Browser.i18n.getMessage("zoomout"):"stamps"==e[d].id?e[d].title=Browser.i18n.getMessage("stampTool"):"text"==e[d].id?e[d].title=Browser.i18n.getMessage("typeTool"):"pixelate"==e[d].id?e[d].title=Browser.i18n.getMessage("pixelatorTool"):"colors"==e[d].id?e[d].title=Browser.i18n.getMessage("colors"):"zoomin"==e[d].id&&(e[d].title=Browser.i18n.getMessage("zoomin"));for(var f=document.getElementsByClassName("subtool"),d=0;d<f.length;d++)f[d].addEventListener("click",handleSubtoolClick);cancelScreenshotButton.addEventListener("click",function(){toggleMinimizeButtonVisibility("show"),document.body.classList.remove("skitchWaiting","skitchReady");var a=new RegExp("(?:"+document.body.className.replace(/\s+/,"|")+")");a.test(article.className)?handleClipperToolClick.call(article):a.test(clearly.className)?handleClipperToolClick.call(clearly):a.test(fullPage.className)?handleClipperToolClick.call(fullPage):a.test(pdf.className)?handleClipperToolClick.call(pdf):a.test(email.className)?handleClipperToolClick.call(email):a.test(selection.className)?handleClipperToolClick.call(selection):a.test(url.className)&&handleClipperToolClick.call(url),setHeight()}),Browser.sendToExtension({name:"getPersistentValue",key:"lastSkitchColor"}),Browser.sendToExtension({name:"getPersistentValue",key:"lastSkitchStamp"}),Browser.sendToExtension({name:"getPersistentValue",key:"isMinimized"}),Browser.sendToExtension({name:"getPersistentValue",key:"UserInfoKey"}),closeSidebar.addEventListener("click",function(a){a.stopPropagation(),Browser.sendToExtension({name:"bounce",message:{name:"closeClipper",notClipping:!0}})}),minimizeButton.addEventListener("click",function(a){a.stopPropagation(),toggleMinimizeClipper()}),saveButton.addEventListener("click",save),settings.addEventListener("click",function(){Browser.sendToExtension({name:"bounce",message:{name:"showOptions"}})}),window.addEventListener("keydown",function(a){9===a.keyCode&&notebookSelector.contains(document.activeElement)&&notebookSelector.close()}),setHeight(),main.addEventListener("click",function(){notebookSelector.hideCreateNewNotebookBlock(),main.classList.contains("minified")&&toggleMinimizeClipper(),notebookSelector.isOpened()&&notebookSelector.close(),!handleSkitchTool&&shapesSubtools.classList.contains("open")?shapesSubtools.classList.remove("open"):!handleSkitchTool&&stampsSubtools.classList.contains("open")?stampsSubtools.classList.remove("open"):!handleSkitchTool&&colorsSubtools.classList.contains("open")&&colorsSubtools.classList.remove("open"),handleSkitchTool=!1})}),Browser.addMessageHandlers({gt_handleEscape:handleEscape,gt_initialize:initialize,gt_openNotebook:openNotebook,gt_openTags:openTags,gt_reactivateClipperTool:reactivateClipperTool,gt_save:save,gt_toggleMinimizeClipper:toggleMinimizeClipper,gt_maximizeClipper:maximizeClipper,gt_setKeyboardHandlers:setKeyboardHandlers,gt_setPossibleClipTypes:setPossibleClipTypes,gt_updateUser:updateUser,gt_useClipType:useClipType,gt_toggleAccount:toggleAccount,gt_useSkitchTool:useSkitchTool,gt_setSaveReady:setSaveReady,gt_setTitle:setTitle,gt_getBrowserHeight:getBrowserHeight,gt_toggleSmallScreenMode:toggleSmallScreenMode,receiveBusinessNotebooks:receiveBusinessNotebooks,receiveBusinessTags:receiveBusinessTags,receiveNotebookCreationResult:receiveNotebookCreationResult,receiveOption:receiveOption,receivePersistentValue:receivePersistentValue,receivePersonalNotebooks:receivePersonalNotebooks,receivePersonalTags:receivePersonalTags,receiveSharedNotebooks:receiveSharedNotebooks,receiveSmartFilingInfo:receiveSmartFilingInfo,skitchSurfaceReady:skitchSurfaceReady});