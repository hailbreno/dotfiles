var utils = (function() {

    var parser = new UAParser();
    var browser = parser.getBrowser();
    var manifest = chrome.runtime.getManifest();

    // A little hack to determine if the browser is Baidu, as many Baidu versions got the same user agent as a regular Chrome browser
    if(manifest.short_name.indexOf("网") != -1 || manifest.short_name.indexOf("肤") != -1 || manifest.short_name.indexOf("皮") != -1) {
        browser.name = "Baidu";
    }

    function getBrowser() {
        return browser;
    }

    function getSubID(){
        return localStorage.getItem("subid");
    }

    function setSubID(subId){
        return localStorage.setItem("subid", subId);
    }

    return {
        getBrowser:getBrowser,
        getSubID:getSubID,
        setSubID:setSubID
    };

})();