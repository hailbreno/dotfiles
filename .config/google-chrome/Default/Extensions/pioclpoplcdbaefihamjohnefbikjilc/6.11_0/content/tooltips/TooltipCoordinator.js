/*! Copyright 2009-2017 Evernote Corporation. All rights reserved. */
function TooltipCoordinator(a,b,c,d){"use strict";function e(){function e(a,b,c){a&&h.style.setProperty("left",a+"px","important"),b&&h.style.setProperty("top",b+"px","important"),c?h.style.setProperty("position",c,"important"):h.style.removeProperty("position")}if(h=document.createElement("iframe"),h.id=c,h.className="evernoteTooltip",h.src=a,h.addEventListener("load",function(){this.classList.add("evernoteTooltipShow")}),d){if(d.generatePosition){var g=d.generatePosition();e(g.left,g.top,g.fixed?"fixed":"absolute"),d.updatePosition&&(i=setInterval(function(){var a=d.generatePosition();e(a.left,a.top,a.fixed?"fixed":"absolute")},250))}d.closeOnOutsideClick&&window.addEventListener("click",function(){f({which:b})}),d.classList&&d.classList.forEach(function(a){h.classList.add(a)})}document.documentElement.appendChild(h)}function f(a,c,d){a.which===b&&h&&(h.addEventListener(Browser.whichTransitionEnd(),function(){h&&h.parentNode&&h.parentNode.removeChild(h),h=null,clearInterval(i)}),h.classList.remove("evernoteTooltipShow"))}function g(a){a.which===b&&h&&h.parentNode&&h.style.setProperty("height",a.height+"px","important")}var h,i;Browser.addMessageHandlers({ttc_close:f,ttc_setHeight:g}),e(),Object.preventExtensions(this)}Object.preventExtensions(TooltipCoordinator);