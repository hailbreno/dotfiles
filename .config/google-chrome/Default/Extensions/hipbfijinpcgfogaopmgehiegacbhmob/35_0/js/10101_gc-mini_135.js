
// From: lib/log.js
"use strict";

(function() {

  /** ------------------ The "log" section  ------------------------ */
  var log = devhd.pkg("log")
  var logLevels = ["fatal", "error", "warn", "info", "debug", "trace"]
  var defLogLevel = 3

  /**
   * Logger has an id (one.two.three) and a level which is from 0..5
   * 0 - fatal, 1-error, 2-warn, 3-info, 4-debug, 5-trace
   *
   * @param {Object} id a dot separated name of the logger
   * @param {Object} level the initial level (warn 1 is used by default)
   */

  log.Logger = function(id, level) {
    this.id = id
    this.appenders = []
    this.parent = null
    if (level) {
      this.setLevel(level)
    }
  }

  function last(p, l) {
    var a = p.split("/");
    l = Math.min(l, a.length)
    a.splice(0, a.length - l, "...")
    return a.join("/")
  }

  function node2text(node) {
    var i, j, a, text = []
    if (node.nodeType == 1) {
      text.push("<")
      text.push(node.nodeName)
      if (node.attributes.length) {
        text.push(" ");
      }
      for (i = 0, j = node.attributes.length; i < j; i++) {
        a = node.attributes.item(i)
        text.push(a.nodeName)
        text.push("=")
        text.push(a.nodeValue)
        if (i + 1 < j) {
          text.push(" ");
        }
      }
      text.push(">");
      if (node.firstChild) {
        text.push("...");
      }
      text.push("</");
      text.push(node.nodeName)
      text.push(">");
    } else {
      text.push("<");
      text.push("nodeType=")
      text.push(node.nodeType)
      text.push(" value=");
      text.push(node.nodeValue)
      text.push(">")
    }
    return text.join("")
  }


  function exceptionFormat(e) {
    var m = []
    if (e.name == null && e.message == null) {
      m.push(e.toString())
    } else {
      if (e.name) {
        m.push(e.name)
        m.push(" -- ")
      }
      if (e.message) {
        m.push(e.message)
      }
      m.push(" [")
      if (e.fileName) {
        m.push(last(e.fileName, 3))
      }
      if (e.lineNumber) {
        m.push("@")
        m.push(e.lineNumber)
      }
      m.push("]")
      if (e.stack) {
        m.push("\n")
        m.push(devhd.stackTrace(e.stack, -1).join("\n"))
      }
    }
    return m.join("")
  }

  function _source(a, t) {
    var x, k;
    t.push("{");
    for (k in a) {
      t.push(k);
      t.push(":");
      x = typeof a[k];
      if (x == "function") {
        t.push("fn...");
      } else {
        t.push(a[k])
      }
      t.push(", ");
    }
    t.push("}");
  }

  function messageFormat() {

    var i = 0,
      m = {},
      text = [],
      a, k, isObj

    // first argument is the line number ?
    if (typeof arguments[0] == "number") {
      i++;
      m.line = arguments[0]
    }

    for (; i < arguments.length; i++) {
      a = arguments[i]
      if (a == null) {
        text.push("null");
      } else if (typeof a == "number" || typeof a == "string" || typeof a == "date") {
        text.push(a)
      } else if (a.stack && a.lineNumber) {
        // exception
        m.error = a
        m.errmsg = exceptionFormat(a)
      } else if (typeof a == "array") {
        // flatten it out ?
        text.push("[")
        text.push(a.join(","));
        text.push("]")
      } else if (a.nodeType) {
        // assume a XML/HTML node
        text.push(node2text(a))
      } else if (typeof a.toJSON == "function") {
        text.push(a.toJSON())
      } else {
        //
        isObj = false
        for (k in a) {
          if (typeof a[k] == "function") {
            isObj = true
            break;
          }
        }
        if (isObj || a.toSource == null) {
          _source(a, text)
        } else {
          text.push(a.toSource())
        }
      }
    }

    m.text = text.join("");
    return m
  }



  function doAppend(id, l, msg) {
    var i, a, m, lid = logLevels[l]
    if (typeof l != "number") {
      l = null
    }
    for (i = 0; i < this.appenders.length; i++) {
      a = this.appenders[i]
      if (typeof a == "function") {
        a(id, lid, msg.text, msg.context, msg.errmsg, msg.line)
      } else {
        m = a[lid]
        if (m) {
          m.call(a, id, msg.text, msg.context, msg.errmsg, msg.line)
        } else if (typeof a.log == "function") {
          a.log(lid, id, msg.text, msg.context, msg.errmsg, msg.line)
        }

      }
    }

    // if parent, append in the prent
    if (this.parent) {
      doAppend.call(this.parent, id, l, msg)
    }
    // and done.
  }


  log.Logger.prototype = {
    setLevel: function(level) {
      if (typeof level == "string") {
        level = level.toLowerCase()
        level = logLevels.indexOf(level)
      }

      if (level == null || level < 0 || level >= logLevels.length) {
        this.level = defLogLevel
      } else if (typeof level == "number") {
        this.level = level
      } else {
        this.level = defLogLevel
      }
    },
    getLevel: function() {
      return this.level
    },
    getLevelText: function() {
      return logLevels[this.level]
    },
    getComputedLevel: function() {
      if (this.level != undefined) {
        return this.level
      }
      if (this.parent) {
        return this.level = this.parent.getComputedLevel()
      }
      return 1
    },

    addAppender: function(appender) {
      var i = this.appenders.indexOf(appender)
      if (i >= 0) {
        return;
      }
      this.appenders.push(appender)
    },
    removeAppender: function(appender) {
      var i = this.appenders.indexOf(appender)
      if (i < 0) {
        return;
      }
      this.appenders.splice(i, 1)
    },

    fatal: function() {
      doAppend.call(this, this.id, 0, messageFormat.apply(messageFormat, arguments))
    },
    error: function() {
      if (this.getComputedLevel() >= 1) {
        doAppend.call(this, this.id, 1, messageFormat.apply(messageFormat, arguments))
      }
    },
    warn: function() {
      if (this.getComputedLevel() >= 2) {
        doAppend.call(this, this.id, 2, messageFormat.apply(messageFormat, arguments))
      }
    },
    info: function() {
      if (this.getComputedLevel() >= 3) {
        doAppend.call(this, this.id, 3, messageFormat.apply(messageFormat, arguments))
      }
    },
    debug: function() {
      if (this.getComputedLevel() >= 4) {
        doAppend.call(this, this.id, 4, messageFormat.apply(messageFormat, arguments))
      }
    },
    trace: function() {
      if (this.getComputedLevel() >= 5) {
        doAppend.call(this, this.id, 5, messageFormat.apply(messageFormat, arguments))
      }
    },
    toString: function() {
      return "[log.Logger: appenders=" + this.appenders + ", level=" + logLevels[this.level] + "]"
    }
  }


  log.Appender = function(prefix) {
    this.setPrefix(prefix)
  }


  log.Appender.prototype = {

    setPrefix: function(prefix) {
      this.prefix = prefix || "devhd"
    },

    log: function(kind, id, text, context, err, line) {
      var m = ["[", this.prefix, ".", id, ".", kind]
      if (line > 0) {
        m.push("@")
        m.push(line)
      }
      m.push("] ")
      m.push(text)
      if (err) {
        m.push("; hint ")
        m.push(err)
      }
      this.out(m.join(""))
    },
    out: function(msg) {
      $feedly(msg, 1);
    },
    error_XXX: function(id, text, context, err) {
      var m = ["[", this.prefix, ".", id, ".error] ", text]
      this.out(m.join(""))
    }
  }


  var LOGS = {}

  log.get = function(id, level) {
    var parts, p, l, i, j, name, next

    if (id == null || id.length == 0) {
      parts = [""]
    } else {
      parts = id.split(".")
    }

    // root
    // root -> one
    // root -> one -> two
    // root -> one -> two -> three
    p = LOGS[""]
    for (i = 0; i < parts.length; i++) {
      name = []
      for (j = 0; j <= i; j++) {
        name.push(parts[j])
      }
      next = name.join(".")

      l = LOGS[next]
      if (!l) {
        l = LOGS[next] = new log.Logger(next, level)
      }
      if (p) {
        l.parent = p
      }
      p = l
    }

    return l
  }

  /** configure logLevels */
  function configureLogLevels(level, logs) {
    var i, a = logs.split(/\s*[,;:]\s*/);
    for (i = 0; i < a.length; i++) {
      var n = a[i]
      if (n.length) {
        log.get(n, level)
      }
    }
  }

  /** The main logger singleton */
  log.main = log.get("")
    // add a default appender
  log.appender = new log.Appender("feedly")

  // make the main log have the main appender
  log.main.addAppender(log.appender);

  log.main.setLevel("warn")



})();

;

// From: lib/i18n.js
"use strict";

(function() {

  var pkg = devhd.pkg("i18n")
  var locales = devhd.pkg("i18n.locales")

  // all the locale data, one per locale, hidden to this closure
  var data = {}

  // current locale data (indexed by integer, normal array that is)
  var K = []
    // current locale (that's selected)
  var defaultLocale = "en-us"
  var localeID = defaultLocale;

  // Returns the locale ids that are registered.
  pkg.getLocales = function() {
    var list = [],
      k
    for (k in data) {
      list.push(k)
    }
    return list
  }

  // sets the current locale as the current locale.
  pkg.setLocale = function(id) {

    if (id == null)
      id = "en-us";

    var parts = id.split(/_|\-/),
      id = parts.join("-")
    if (data[id]) {
      localeID = id
      K = data[id]
    } else if (data[parts[0]]) {
      localeID = parts[0]
      K = data[parts[0]]
    }
  }

  pkg.getLocale = function() {
    return localeID
  }

  // externally call-able, to set locale data. This is done by the translated resource
  // bundles ... you really don't call this here.
  // by convention, at 0 is the locale id (en,pl,fr-fr, etc.)
  pkg.setData = function(arg) {
    data[arg[0]] = arg
      // default locale set
    if (arg[0] == localeID) {
      K = arg
    }
  }


  function Sealed(n) {}

  /**
   *  After calling this, no more calls to setData()
   */

  pkg.sealData = function() {
    pkg.setData = function() {
      Sealed("setData")
    }
  }

  // The localize "printf" type of function. This is the function that should be used
  // in pure javascript code like this:
  //    devhd.i18n.L("@{key.of.message.id}", arg1, arg2, arg3, ....)
  // If any of your code uses the message id syntax, that is,
  //     "@message.id"
  // You MUST defined a variable which reference this function as _L ... shown below.
  //     var _L = devhd.i18n.L
  //     ...
  //     _L("@{message.id}",arg1,....)
  //
  // Please note that all the message id keys will be converted to integers during post processing
  // of the javascript files. Thus the final format of the javascript code that ships is something like
  // this:
  //     _L(453,arg1,...)
  // In general, string constants that have the format "@{...}" WILL GET REPLACED BY A NUMBER during
  // post processing
  //
  //
  pkg.L = function(key, args) {
    var v, i, fargs = []
      // if number, we are good. otherwise we assume something like this has happened:
      ///  _L(_L (5))
    if (typeof key == "number") {
      v = K[key] || key
    } else {
      v = key
    }
    // strings are just constants, just return
    if (typeof v == "string") {
      return v
    }
    // functions produce strings.
    if (typeof v == "function") {
      // if there are args, we apply them and get the result (string)
      for (i = 1; i < arguments.length; i++) {
        fargs.push(arguments[i])
      }
      if (fargs.length > 0) {
        return v.apply(v, fargs)
      }
      // TODO: FIX THIS !!!!
      // if this is _L(3) call we just return the function in this case.
      return v;
    }
    // numbers ...  unknown message
    if (typeof v == "number") {
      return "M." + v // non-i18n
    }
    throw "bad call 2 i18n.L(...)" // non-i18n
  }

  // This is like the L function above, but it does not have the
  // ambiguity when no args are present and there is a function for
  // the resource.
  pkg.$L = function(key, args) {
    var v = key,
      i, fargs = []
    if (typeof key == "number") {
      v = K[key] || key
    }
    if (typeof v == "string") {
      return v
    }
    if (typeof v == "function") {
      for (i = 1; i < arguments.length; i++) {
        fargs.push(arguments[i])
      }
      return v.apply(v, fargs)
    }
    if (typeof v == "number") {
      return "M." + v // non-i18n
    }
    throw "bad call - i18n.L$(...)" // non-i18n
  }


  // This function is called to format the given argument using the format name given.
  // return is always a string or something that will be concatenated with a string.
  // This function is called from the "compiled" resources for the given locale.

  pkg.F = function(arg, f1, f2, f3, f4, f5, f6, f7, f8, f9, f10) {
    var obj = pkg.locales[localeID]
    if (f1) {
      if (obj && obj[f1]) {
        return obj[f1](arg, f2, f3, f4, f5, f6, f7, f8, f9, f10)
      }
      return "no-format{" + f1 + "} " + arg
    }
    return arg
  }

})();

;

// From: lib/locales.js
"use strict";

(function() {

  var pkg = devhd.pkg("i18n.locales")
    // the _L reference, must be there for the post processor!
  var _L = devhd.i18n.L;

  // a format function which formats the {0,tag} argument.
  // The argument that can be passed to this format is a string
  // if it's a string, then it is assumed to be something like
  //    span onclick="foobar"
  // or
  //    span

  function formatTag(arg, f2, f3) {
    var i, r = ""
    if (typeof arg == "string") {
      r = "<" + arg + ">"
    } else if (arg && arg.length) {
      // array, several mark-ups
      for (i = 0; i < arg.length; i++) {
        r += "<" + arg[i] + ">";
      }
    }
    return r
  }

  function formatEndTag(arg, f2, f3) {
    var i, x, r = ""
    if (typeof arg == "string") {
      x = arg.indexOf(' ');
      r = "</" + (x < 0 ? arg : arg.substring(0, x)) + ">";
    } else if (arg && arg.length) {
      for (i = 0; i < arg.length; i++) {
        x = arg[i].indexOf(' ');
        r += "</" + (x < 0 ? arg[i] : arg[i].substring(0, x)) + ">";
      }
    }
    return r;
  }

  function formatLowercase(arg, f2, f3) {
    return arg.toLowerCase();
  }

  function formatUppercase(arg, f2, f3) {
    return arg.toUpperCase();
  }

  function formatUpper(arg, f2, f3) {
    var i, parts = arg.split(/\s+/)
    for (i = 0; i < parts.length; i++) {
      parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].substring(1)
    }
    return parts.join(" ");
  }


  function formatCapitalize(arg, f2, f3) {
    return arg.charAt(0) + arg.substring(1)
  }

  function formatStr(arg, f2, f3) {
    return devhd.str.toSafeHTML(arg)
  }

  function formatHtml(arg, f2, f3) {
    if (typeof arg == "string") {
      return arg
    }
    if (arg != null) {
      return arg.toString()
    }
    return f3 || "";
  }

  // this one is a bit tricky
  // a choice format is written like this in a resource bundle:
  //     {0,choice,1==address,2>=addresses}
  // the resource compiler will generate this type of javascript call:
  //   function(a){ return [I.F(a,"choice",[1,0,"address"],[2,1,"addresses"])].join("")};
  //
  // function(a){return[I.F(a,"number"),I.F(a,"choice",[1000,0,"+"])," unread"].join(E)};
  // The arguments to this function represent either arrays of decisions or a strings.
  //

  function formatChoice(n) {
    var j, f
    for (j = 1; j < arguments.length; j++) {
      f = arguments[j]
      if (typeof f == "string") {
        return f
      }
      // the magical 3 >= element array which is translated from each
      // 'choice' specification.
      //
      // f[1] is either 0,-1,-2,1,2 indicating: ==, <=, <<, >=, >>
      // f[0] is the test number (LHS)
      // f[2] is the string result.
      // This information is pre-parsed by the resource compiler so that here
      // the only thing we have to do is: choose.

      // idiot check
      if (f && f.length >= 3) {
        // the magic comparison.
        if ((f[1] == 0 && n == f[0]) ||
          (f[1] == -1 && n <= f[0]) || (f[1] < -1 && n < f[0]) ||
          (f[1] == 1 && n >= f[0]) || (f[1] > 1 && n > f[0])) {
          return f[2]
        }
      }
    }
    // ignore, no choicable element is present present.
    return ""
  }

  // the formats for these are borrowed from Java.

  function formatDate(arg, f2, f3) {
    if (f2 == "long") {
      return devhd.date.formatDate(arg, _L(50))
    }
    if (f2 == "short") {
      return devhd.date.formatDate(arg, _L(51))
    }
    // short
    return devhd.date.formatDate(arg, _L(52))
  }

  function formatTime(arg, f2, f3) {
    if (f2 == "long") {
      return devhd.date.formatDate(arg, _L(53))
    }
    if (f2 == "short") {
      return devhd.date.formatDate(arg, _L(54))
    }
    // short
    return devhd.date.formatDate(arg, _L(55))
  }

  function formatDateTime(arg, f2, f3) {
    return _L(_L(56),
      formatTime(arg, f2, f3),
      formatDate(arg, f2, f3))
  }

  function formatNumber(arg, f2, f3) {
    return devhd.number.formatNumber(arg, _L(57), f2, f3)
  }

  function formatCurrency(arg, f2, f3) {
    return devhd.number.formatNumber(arg, _L(58), f2, f3)
  }

  function formatPercent(arg, f2, f3) {
    return devhd.number.formatNumber(arg * 100, _L(59), f2, f3)
  }

  function formatHilite(arg, f2, f3) {
    var t = arg[0],
      h = arg[1]
    return devhd.utils.AnnotationUtils.highlightTerm(devhd.str.toSafeHTML(t), h)
  }

  // these are common formats, which are already "local" to each locale.
  var common = {}

  common.tag = formatTag
  common.t0 = formatEndTag
  common.lowercase = formatLowercase
  common.uppercase = formatUppercase
  common.upper = formatUpper
  common.capitalize = formatCapitalize
  common.choice = formatChoice
  common.text = formatStr
  common.html = formatHtml
  common.hilite = formatHilite
  common.date = formatDate
  common.time = formatTime
  common.datetime = formatDateTime
  common.number = formatNumber
  common.currency = formatCurrency
  common.percent = formatPercent

  //

  // English US locale format hooks
  // ------------------------------
  var that = devhd.extend({}, common)
  pkg["en-us"] = that

  // Polish US locale format hooks
  // ------------------------------
  that = devhd.extend({}, common)
  pkg["pl"] = that


  // French locale format hooks
  // ------------------------------
  that = devhd.extend({}, common)
  pkg["fr"] = that


  // Canadian locale format hooks
  // ------------------------------
  that = devhd.extend({}, common)
  pkg["en-ca"] = that


  // German locale format hooks
  // ------------------------------
  that = devhd.extend({}, common)
  pkg["de"] = that


  // UK locale format hooks
  // ------------------------------
  that = devhd.extend({}, common)
  pkg["en-gb"] = that


  // Italian locale format hooks
  // ------------------------------
  that = devhd.extend({}, common)
  pkg["it"] = that

})();

;

// From: lib/l10n.js
// generated (do not edit) enc=UTF-8
(function(){
var I=devhd.i18n,T=[],E="";
T[0]="en-us";
T[1]="en-us";
T[2]="en";
T[3]="us";
T[149]="Cards";
T[209]="close";
T[142]="download";
T[151]="Full articles";
T[62]="Search Google";
T[94]="next";
T[208]="open in new tab";
T[147]="Mosaic";
T[93]="previous";
T[90]="refresh";
T[129]="sign out";
T[116]="collection";
T[154]="all";
T[161]="Undo open directly";
T[160]="Open in website directly";
T[179]="browser information";
T[84]="cancel";
T[107]="Daily Strip";
T[177]="context";
T[83]="create";
T[110]="create new collection";
T[170]="Edit subscription";
T[166]="create France24/RFI mix";
T[165]="embed in ning network";
T[164]="embed in web page";
T[92]="End of List";
T[171]="explore";
T[157]="filters";
T[68]="no unread articles";
T[176]="internal information";
T[111]="label";
T[65]="All";
T[86]="Loading articles ...";
T[60]="Loading...";
T[85]="Loading and filtering articles ...";
T[189]="Loading. Please wait ...";
T[167]="mark all as read";
T[168]="promote to must read";
T[169]="undo must read";
T[153]="mark as read";
T[188]="There are new articles available.";
T[198]="No";
T[200]="no articles";
T[202]="All stories have been read.";
T[155]="older than one day";
T[156]="older than one week";
T[159]="oldest first";
T[118]="or";
T[205]="preview";
T[139]="recommends";
T[207]="... ?";
T[115]="rename";
T[113]="rename collection";
T[206]="save for later";
T[174]=function(a){return[I.F(a,"number"),I.F(a,"choice",[1,0,"d"],"d")].join(E)};
T[173]=function(a){return[I.F(a,"number"),I.F(a,"choice",[1,0,"h"],"h")].join(E)};
T[172]=function(a){return[I.F(a,"number"),"min"].join(E)};
T[117]=function(a){return["Cannot be changed because ",I.F(a,"text")].join(E)};
T[148]="cards";
T[127]="Change layout and filtering";
T[150]="entire content inlined";
T[163]="Embed";
T[102]="Facebook";
T[162]="edit subscription";
T[146]="a grid of pictures";
T[152]="grouped by subscriptions";
T[103]="Mail";
T[125]="mark as read";
T[131]="mark all as read";
T[112]="How would you like to name the new collection?";
T[145]="a picture and a summary";
T[128]="change the internal settings of the feedly service";
T[126]="Refresh";
T[73]="Remove collection";
T[72]="Rename collection";
T[114]="What would you like to rename this collection to?";
T[130]="Saved for later";
T[101]="Twitter";
T[104]="Today";
T[195]="Turn off confirmation";
T[132]="Uncategorized";
T[197]="remove";
T[158]="unread only";
T[186]="version";
T[196]="Yes";
T[105]="Yesterday";
T[141]="You";
T[138]=function(a){return[I.F(a,"number")," more"].join(E)};
T[192]=function(a,b){return[I.F(b,"tag"),I.F(a,"number"),I.F(b,"t0")," ",I.F(a,"choice",[1,0,"share"],"shares")].join(E)};
T[178]=function(a){return[I.F(a,"text")," version information"].join(E)};
T[201]=function(a,b){return["articles ",I.F(a,"number")," - ",I.F(b,"number")].join(E)};
T[182]="Access to this feed might require a username and password (feedly does not know yet how to access and load authenticated feeds).";
T[183]="The specified URL does not point to a valid RSS or ATOM feed (in which case you might want to contact the owner of the website you are trying to subscribe to and let them know about the problem).";
T[184]="You are running into a feedly bug.";
T[181]="Feedly was not able to load feed";
T[190]=function(a){return["Sorry. We were unable to find page <b>",I.F(a,"text"),"</b> ! This is most likely a bug. Please report it."].join(E)};
T[180]=function(a,b,c,d){return["Please open a ticket on ",I.F(a,"tag"),I.F(b,"text"),I.F(a,"t0")," or send an email to ",I.F(c,"tag"),I.F(d,"text"),I.F(c,"t0"),". To help reproduce the problem, \tplease include some context as to what was the last action you performed before this error occured as well as any [feedly] related information you can find the \"errors\" and \"messages\" tabs of the Firefox error console. Thank you!"].join(E)};
T[191]="Thank you and sorry for the inconvenience.";
T[185]=function(a){return["Please ",I.F(a,"tag"),"open a ticket",I.F(a,"t0")," so that we can track it down"].join(E)};
T[61]=function(a,b){return[I.F(a,"tag"),I.F(b,"text"),I.F(a,"t0")," commented"].join(E)};
T[187]=function(a){return["You have reached the end of this feed. This feed only contains ",I.F(a,"number")," ",I.F(a,"choice",[1,0,"article"],"articles"),". Please verify the unread checkbox if you expected more content here."].join(E)};
T[98]=function(a,b){return["Failed to perform search because: ",I.F(a,"tag"),I.F(b,"text"),I.F(a,"t0"),"."].join(E)};
T[106]=function(a){return[I.F(a,"number")," featured articles."].join(E)};
T[135]=function(a){return[I.F(a,"tag"),"Feedly",I.F(a,"t0")," organizes your favorite sites into a fun, magazine-like start page."].join(E)};
T[124]="Sorry. Your feedly session has expired. Please <b>reload this page</b> or restart your browser to try to create a new session.";
T[136]="Start Here";
T[134]="Upgrade";
T[133]=function(a){return[I.F(a,"tag"),"Upgrade to Feedly 2.x",I.F(a,"t0"),": A lot more memory efficient, better exception management and 47 minor UI bug fixes."].join(E)};
T[204]="<b style=\"color:#606060\">You need to add 5-10 sites to your feedly to get a meaningful experience</b>. Visit the feedly <span class=\"action\" data-uri=\"contents/edit\">personalize page</span> to find and add your favorite websites. Feedly will collect the best articles from those sites and organize them into a live magazine-like start page. <a href=\"http://blog.feedly.com/personalize\" target=\"_new\">help</a>";
T[66]=function(a){return["Loading ",I.F(a,"number")," ",I.F(a,"choice",[1,0,"article"],"articles")," ..."].join(E)};
T[99]=function(a){return[I.F(a,"number")," ",I.F(a,"choice",[1,0,"collection"],"collections")].join(E)};
T[203]=function(a){return["Your feedly includes ",I.F(a,"number")," ",I.F(a,"choice",[1,0,"source"]," sources")," but there are not enough new stories to generate a digest."].join(E)};
T[69]=function(a){return[I.F(a,"number")," ",I.F(a,"choice",[1,0,"source"],"sources")].join(E)};
T[63]=function(a){return["No unread stories in the '",I.F(a,"text"),"' collection."].join(E)};
T[64]="If you would like to view read stories, please click on the pen icon at the top of the page and uncheck the unread only filter.";
T[140]="No unread stories";
T[97]=function(a){return[I.F(a,"number")," ",I.F(a,"choice",[1,0,"result"],"results")," found."].join(E)};
T[109]=function(a){return[I.F(a,"number")].join(E)};
T[137]="One moment please ...";
T[175]="Oops ! We just ran into a bug. See error console for more information";
T[194]="Are you sure you want to continue ?";
T[143]=function(a){return["(size: ",I.F(a,"number")," MB )"].join(E)};
T[67]=function(a,b){return[I.F(a,"number")," ",I.F(b,"tag"),I.F(a,"choice",[1,0,"unread article"],"unread articles"),I.F(b,"t0")].join(E)};
T[100]=function(a){return[I.F(a,"number")," unread ",I.F(a,"choice",[1,0,"article"],"articles")].join(E)};
T[199]=function(a,b){return["Deleting the collection ",I.F(a,"tag"),I.F(b,"text"),I.F(a,"t0")," will remove it from your feedly."].join(E)};
T[193]=function(a,b){return["Unsubscribing from ",I.F(a,"tag"),I.F(b,"text"),I.F(a,"t0")," will remove it from both Feedly and Google Reader."].join(E)};
T[89]=function(a,b,c){return["No results found for ",I.F(a,"tag"),I.F(b,"text"),I.F(a,"t0")," in ",I.F(c,"text"),"."].join(E)};
T[91]=function(a,b){return["Search Results for ",I.F(a,"tag"),I.F(b,"text"),I.F(a,"t0"),"."].join(E)};
T[96]=function(a,b){return["Searching for ",I.F(a,"tag"),I.F(b,"text"),I.F(a,"t0"),". Please wait ..."].join(E)};
T[95]=function(a,b,c,d){return["Searching for ",I.F(a,"tag"),I.F(b,"text"),I.F(a,"t0")," in ",I.F(c,"tag"),I.F(d,"text"),I.F(c,"t0"),". Please wait ..."].join(E)};
T[88]=function(a){return["Filter ",I.F(a,"text")].join(E)};
T[87]=function(a,b){return[I.F(a,"text")," in ",I.F(b,"text")].join(E)};
T[119]="ESC to close";
T[120]="Keyboard Shortcuts Help";
T[123]="Note: Google is not affiliated with Feedly. Your password will not be shared with the feedly service.";
T[121]="<b>Feed your mind</b>. A magazine-like start page based on best content from your favorite websites. Powered by Google Reader and Twitter.";
T[122]="<b>Why do I need an account?</b> So you can synchronize your feedly with Google Reader and access it from all your devices. Except for the list of articles you recommend, no other information is collected or stored by the feedly service.";
T[108]="General";
T[71]="Drag and drop a source here to create a new collection";
T[70]="new collection";
T[76]=function(a,b,c){return["Subscription ",I.F(c,"tag"),I.F(a,"text"),I.F(c,"t0")," was added to ",I.F(c,"tag"),I.F(b,"text"),I.F(c,"t0"),"."].join(E)};
T[81]=function(a,b){return["The source is already in collection ",I.F(b,"tag"),I.F(a,"text"),I.F(b,"t0"),"."].join(E)};
T[74]=function(a,b,c){return["Subscription ",I.F(c,"tag"),I.F(a,"text"),I.F(c,"t0")," was moved to ",I.F(c,"tag"),I.F(b,"text"),I.F(c,"t0"),"."].join(E)};
T[82]="New Collection:";
T[77]=function(a,b){return["Nothing happened to subscription ",I.F(b,"tag"),I.F(a,"text"),I.F(b,"t0"),"."].join(E)};
T[80]=function(a,b,c){return["Subscription ",I.F(c,"tag"),I.F(a,"text"),I.F(c,"t0")," cannot be added to ",I.F(c,"tag"),I.F(b,"text"),I.F(c,"t0"),"."].join(E)};
T[78]=function(a,b,c){return["Subscription ",I.F(c,"tag"),I.F(a,"text"),I.F(c,"t0")," cannot be moved to ",I.F(c,"tag"),I.F(b,"text"),I.F(c,"t0"),"."].join(E)};
T[79]=function(a,b,c){return["Subscription ",I.F(c,"tag"),I.F(a,"text"),I.F(c,"t0")," cannot be removed from ",I.F(c,"tag"),I.F(b,"text"),I.F(c,"t0"),"."].join(E)};
T[75]=function(a,b,c){return["Subscription ",I.F(c,"tag"),I.F(a,"text"),I.F(c,"t0")," was removed from ",I.F(c,"tag"),I.F(b,"text"),I.F(c,"t0"),"."].join(E)};
T[46]="AM";
T[45]="PM";
T[53]="h:mm:ss a z";
T[55]="h:mm:ss a";
T[54]="h:mm a";
T[50]="MMMM d, yyyy";
T[52]="MMM d, yyyy";
T[51]="M/d/yy";
T[56]=function(a,b){return[I.F(b)," ",I.F(a)].join(E)};
T[33]="Jan";
T[34]="Feb";
T[43]="Nov";
T[44]="Dec";
T[35]="Mar";
T[36]="Apr";
T[37]="May";
T[38]="Jun";
T[39]="Jul";
T[40]="Aug";
T[41]="Sep";
T[42]="Oct";
T[21]="January";
T[22]="February";
T[31]="November";
T[32]="December";
T[23]="March";
T[24]="April";
T[25]="May";
T[26]="June";
T[27]="July";
T[28]="August";
T[29]="September";
T[30]="October";
T[14]="Sun";
T[15]="Mon";
T[16]="Tue";
T[17]="Wed";
T[18]="Thu";
T[19]="Fri";
T[20]="Sat";
T[7]="Sunday";
T[8]="Monday";
T[9]="Tuesday";
T[10]="Wednesday";
T[11]="Thursday";
T[12]="Friday";
T[13]="Saturday";
T[48]=".";
T[49]=",";
T[47]=";";
T[57]="#,##0.###;-#,##0.###";
T[58]="\u00a4#,##0.00;(\u00a4#,##0.00)";
T[59]="#,##0%";
I.setData(T);
})();
devhd.i18n.sealData();

;

// From: lib/nitro.js
"use strict";

var srcset = require('srcset');

window.feedlyTerms = {
  "my": "Today"
};

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (function() {
    return window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();
}

(function() {
  var utils = devhd.pkg("utils");

  utils.TimerUtils = function() {
    var that = {};

    /**
    Copyright (c) 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative
    Reporters & Editors

    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.
    **/
    that.debounce = function(func, wait) {
      let timeout, args, context, timestamp, result;

      let later = function() {
        let last = Date.now() - timestamp;

        if (last < wait && last >= 0) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          result = func.apply(context, args);

          if (!timeout) {
            context = args = null;
          }
        }
      };

      return function() {
        context = this;
        args = arguments;
        timestamp = Date.now();

        if (!timeout) {
          timeout = setTimeout(later, wait);
        }

        return result;
      };
    }

    return that;
  }();


  utils.AnnotationUtils = function() {
    var that = {};

    that.highlightTextTerms = function(content, terms, dontAtomize) {
      try {
        if (terms == null || terms.length == 0)
          return content;

        var annotated = new String(content);
        var atoms = [];

        for (var i = 0; i < terms.length; i++) {
          var aTerm = terms[i];
          var re = new RegExp("(" + aTerm + ")", "gi");
          annotated = annotated.replace(re, "<span class='highlightedTerm'>$1</span>");

          var ps = aTerm.split(" ");

          if (ps.length > 1) {
            for (var j = 0; j < ps.length; j++)
              if (ps[j].length > 3)
                atoms.push(ps[j]);
          }
        }

        if (atoms.length > 0 && annotated.length == content.length && dontAtomize != true) {
          return that.highlightTextTerms(content, atoms, true);
        } else {
          return annotated;
        }
      } catch (e) {
        $feedly("[annotation utils] failed to highlight terms because:" + e.name + " -- " + e.message);
        return content;
      }
    };

    that.highlightTerms = function(content, terms, dontAtomize) {
      try {
        if (terms == null || terms.length == 0)
          return content;

        var parts = breakHTMLIntoParts(content);

        var annotated = [];
        var atoms = [];

        for (var i = 0; i < terms.length; i++) {
          var aTerm = terms[i];
          var ps = aTerm.split(" ");
          if (ps.length > 1) {
            for (var j = 0; j < ps.length; j++)
              if (ps[j].length > 3)
                atoms.push(ps[j]);
          }
        }

        for (var j = 0; j < parts.length; j++) {
          if (j % 2 == 0) {
            var ahtml = parts[j];
            for (var i = 0; i < terms.length; i++) {
              var aTerm = terms[i];
              var re = new RegExp("(" + aTerm + ")", "gi");
              ahtml = ahtml.replace(re, "<span class='highlightedTerm'>$1</span>");
            }

            annotated.push(ahtml);
          } else {
            annotated.push(parts[j]);
          }
        }

        var r = annotated.join("");
        if (atoms.length > 0 && r.length == parts.join("").length && dontAtomize != true) {
          return that.highlightTerms(content, atoms, true);
        } else {
          return r;
        }
      } catch (e) {
        $feedly("[annotation utils] failed to highlight terms because:" + e.name + " -- " + e.message);
        return content;
      }
    };

    that.breakHTMLIntoParts = breakHTMLIntoParts;

    function breakHTMLIntoParts(htmlContent) {
      var parts = [];

      htmlContent = new String(htmlContent);

      var cursor = 0;
      var mode = "content";

      for (var i = 0; i < htmlContent.length; i++) {
        if (mode == "content") {
          if (htmlContent.charAt(i) != "<")
            continue;

          parts.push(htmlContent.slice(cursor, i));
          cursor = i;
          mode = "tag";
        } else {
          if (htmlContent.charAt(i) != ">")
            continue;

          parts.push(htmlContent.slice(cursor, i + 1));
          cursor = i + 1;
          mode = "content";
        }
      }

      parts.push(htmlContent.slice(cursor));

      return parts;
    }

    that.highlightTerm = function(content, term) {
      try {
        if (term == null)
          return content;

        var annotated = new String(content);

        var t = term.replace("\"", "", "g");
        var parts = t.split(" ");

        for (var i = 0; i < parts.length; i++) {
          var aTerm = parts[i];
          var re = new RegExp("(" + aTerm + ")", "gi");
          annotated = annotated.replace(re, "<span class='highlightedTerm'>$1</span>");
        }

        return annotated;
      } catch (e) {
        $feedly("[annotation utils] failed to highlight term because:" + e.name + " -- " + e.message);
        return content;
      }
    };

    return that;
  }();

  utils.ThingsUtils = function() {
    var that = {};

    that.things = ["blogs",
      "news sites",
      "thinkers",
      "journals",
      "youtube shows",
      "podcasts",
      "google alerts",
      "tumblr blogs",
      "stocks",
      "500px channels",
      "magazines",
      "ebay listings",
      "hulu shows",
      "recipes",
      "comics",
      "craiglists",
      "buzzfeeds",
      "flick photos",
      "vimeo shows",
      "soundclouds",
      "medium blogs",
      "#topics"
    ];

    return that;
  }();

  /**
  Utility functions that accept a `keydown`, `keyup`, or `keypress` event and
  determine status for those events.
  **/
  utils.KeyEventUtils = {
    /**
    Whether a modifier key is being pressed or not.
    @param {Event} keyEvent
    **/
    hasModifierKey: function(keyEvent) {
      return (keyEvent.ctrlKey || keyEvent.metaKey || keyEvent.altKey);
    },

    /**
    Whether the target of the event can accept user input, i.e. an input,
    textarea, or contenteditable element.
    @param {Event} keyEvent
    **/
    isTargetTextInput: function(keyEvent) {
      var target = keyEvent.target;
      var targetName = target.localName.toLowerCase();
      var contenteditable = target.getAttribute('contenteditable');
      var isContentEditable = contenteditable === 'true' || contenteditable === '';

      return (targetName === 'input' || targetName === 'textarea' || isContentEditable);
    }
  };

  utils.LoginUtils = function() {
    var that = {};

    that.getProviderLabel = function(provider, team) {
      switch (provider) {
        case "FeedlyLogin":
          return "Feedly";
        case "WindowsLive":
          return "Microsoft";
        case "GooglePlus":
          return "Google";
        case "Twitter":
          return "Twitter";
        case "Evernote":
          return "Evernote";
        case "SAML":
          if (team != null)
            return team + " SSO";
          else
            return "Enterprise SSO";
        default:
          return provider;
      }
    }

    return that;
  }();

  utils.TopicUtils = function() {
    var that = {};

    var LANGUAGES = ["en-US", "de", "es", "fr", "it"];

    that.augment = function() {
      var us = that["en-US"];

      var findSame = function(language, usT) {
        var topic = that[language];
        var parts;
        var t;
        for (var i = 0; i < topic.length; i++) {
          t = topic[i];
          if (t.label == usT.label)
            return i;

          if (t.visual && usT.visual && usT.visual == t.visual)
            return i;

          if (t.visual) {
            parts = /.+\/(.+?).jpg/.exec(topic[i].visual);
            if (parts && parts[1] && parts[1] == usT.label)
              return i;
          }
        }
        return -1;

      }

      us.forEach(function(t) {
        LANGUAGES.slice(1).forEach(function(l) {
          var i = findSame(l, t);
          if (i != -1) {
            var c = that[l][i];
            c.unit = t.unit;
            c.cover = t.cover;
            c.theme = t.theme;
          }
        })
      })

    }


    that.isEssential = function(input) {
      var l = input.toLowerCase();
      for (var i = 0; i < LANGUAGES.length; i++) {
        var pack = that[LANGUAGES[i]];

        for (var j = 0; j < pack.length; j++) {
          if ((pack[j].label != null && l == "#" + pack[j].label.toLowerCase()) || (pack[j].keyword != null && l == pack[j].keyword.toLowerCase()))
            return true;
        }
      }

      return false;
    };

    that.suggestRelated = function(input) {
      var l = input.toLowerCase();

      for (var i = 0; i < LANGUAGES.length; i++) {
        var pack = that[LANGUAGES[i]];

        for (var j = 0; j < pack.length; j++) {
          if ((pack[j].label != null && l == "#" + pack[j].label.toLowerCase()) || (pack[j].keyword != null && l == pack[j].keyword.toLowerCase()))
            return pack[j].related;
        }
      }

      return [];
    };

    that["en-US"] = [{
      "label": "tech",
      "related": ["apple", "android", "bitcoin", "big data", "gadgets"],
      "cover": "https://s3.feedly.com/explore/topics-tech-ffffff.jpeg",
      "unit": 3,
      "importance": 1,
      "bgcolor": "#ffffff",
      "theme": "light"
    }, {
      "label": "marketing",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-marketing-3a0202.jpeg",
      "bgcolor": "#3a0202",
      "theme": "dark",
      "importance": 3,
      "related": ["advertising", "seo", "content marketing", "growth", "digital marketing", "copywriting"]

    }, {
      "label": "design",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-design-170e0a.jpeg",
      "bgcolor": "#170e0a",
      "theme": "dark",
      "importance": 3,
      "related": ["architecture", "typography", "decoration", "web design", "packaging", "art", "visual design"]
    }, {
      "label": "business",
      "cover": "https://s3.feedly.com/explore/topics-business-7c89a5.jpeg",
      "bgcolor": "#7c89a5",
      "unit": 3,
      "theme": "dark",
      "related": ["finance", "marketing", "entrepreneurship", "startups"]
    }, {
      "label": "food",
      "visual": "https://s3.feedly.com/explore/cooking.v2.jpg",
      "related": ["healthy", "vegetarian", "dessert and baking"],
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-food-392a31.jpeg",
      "bgcolor": "#392a31",
      "theme": "dark"
    }, {
      "label": "news",
      "visual": "https://s3.feedly.com/explore/world-news.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-news-000000.jpeg",
      "bgcolor": "#000000",
      "theme": "dark",
      "related": ["local", "international", "politics"]
    }, {
      "label": "fashion",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-fashion-d4d1d5.jpeg",
      "bgcolor": "#d4d1d5",
      "theme": "light",
      "related": ["business", "news", "style", "men"]
    }, {
      "label": "startups",
      "visual": "https://s3.feedly.com/explore/entrepreneurship.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-startup-1f323f.jpeg",
      "bgcolor": "#1f323f",
      "theme": "dark",
      "keyword": "#entrepreneurship"
    }, {
      "label": "photography",
      "theme": "dark",
      "cover": "https://s3.feedly.com/explore/topics-photography-686976.jpeg",
      "bgcolor": "#686976",
      "unit": 3
    }, {
      "label": "gaming",
      "related": ["pc", "xbox", "fps", "flash games"],
      "theme": "dark",
      "cover": "https://s3.feedly.com/explore/topics-gaming-383b31.jpeg",
      "bgcolor": "#383b31",
      "unit": 3
    }, {
      "label": "baking",
      "cover": "https://s3.feedly.com/explore/topics-baking-f4f1e9.jpeg",
      "bgcolor": "#f4f1e9",
      "unit": 3,
      "related": ["bread", "desserts", "sweets"],
      "theme": "light"
    }, {
      "label": "DIY",
      "cover": "https://s3.feedly.com/explore/topics-doityourself-f1b86c.jpeg",
      "bgcolor": "#f1b86c",
      "unit": 3,
      "theme": "light",
      "related": ["vintage", "home makeover", "scrapbooking"]
    }, {
      "label": "beauty",
      "theme": "dark",
      "cover": "https://s3.feedly.com/explore/topics-beauty-aa8f7c.jpeg",
      "bgcolor": "#aa8f7c",
      "unit": 3,
      "related": ["lifestyle", "makeup", "style"]
    }, {
      "label": "comics",
      "cover": "https://s3.feedly.com/explore/topics-comics-bec08f.jpeg",
      "bgcolor": "#bec08f",
      "unit": 3,
      "theme": "light",
      "related": ["comic strips", "digital comics", "science"]
    }, {
      "label": "cars",
      "theme": "dark",
      "cover": "https://s3.feedly.com/explore/topics-cars-181b21.jpeg",
      "bgcolor": "#181b21",
      "unit": 3,
      "related": ["essay", "formula 1", "motorcycle"]
    }, {
      "label": "culture",
      "theme": "dark",
      "cover": "https://s3.feedly.com/explore/topics-culture-5e473f.jpeg",
      "bgcolor": "#5e473f",
      "unit": 3,
      "related": ["art", "history", "lifestyle", "urban"]
    }, {
      "label": "SEO",
      "cover": "https://s3.feedly.com/explore/topics-seo-ffffff.jpeg",
      "bgcolor": "#ffffff",
      "unit": 3,
      "theme": "light",
      "related": ["inbound marketing", "analytics", "content strategy"]
    }, {
      "label": "education",
      "cover": "https://s3.feedly.com/explore/topics-education-6c7270.jpeg",
      "bgcolor": "#6c7270",
      "unit": 3,
      "theme": "dark",
      "related": ["teaching", "technology", "methodology"]
    }, {
      "label": "science",
      "visual": "https://s3.feedly.com/explore/science.v2.jpg",
      "cover": "https://s3.feedly.com/explore/topics-science-000000.jpeg",
      "bgcolor": "#000000",
      "unit": 3,
      "related": ["biology", "neuroscience", "health"],
      "theme": "dark"
    }, {
      "label": "finance",
      "cover": "https://s3.feedly.com/explore/topics-finance-9db4cb.jpeg",
      "bgcolor": "#9db4cb",
      "theme": "dark",
      "unit": 3,
      "related": ["business", "economics", "news"]
    }, {
      "label": "film",
      "visual": "https://s3.feedly.com/explore/cinema.jpg",
      "cover": "https://s3.feedly.com/explore/topics-film-6d6d6d.jpeg",
      "bgcolor": "#6d6d6d",
      "unit": 3,
      "theme": "dark",
      "keyword": "#cinema",
      "related": ["reviews", "indie", "hollywood", "anime"]
    }, {
      "label": "travel",
      "cover": "https://s3.feedly.com/explore/topics-travel-f0bd9b.jpeg",
      "bgcolor": "#f0bd9b",
      "unit": 3,
      "theme": "light",
      "related": ["travel hacking", "adventure"]
    }, {
      "label": "YouTube",
      "visual": "https://s3.feedly.com/explore/YouTube.v2.jpg",
      "cover": "https://s3.feedly.com/explore/topics-youtube-ffffff.jpeg",
      "bgcolor": "#ffffff",
      "unit": 3,
      "keyword": "#youtube",
      "related": ["sport", "tech", "viral vidoes"],
      "theme": "light"
    }, {
      "label": "vimeo",
      "cover": "https://s3.feedly.com/explore/topics-vimeo-232f3a.jpeg",
      "bgcolor": "#232f3a",
      "unit": 3,
      "theme": "dark",
      "visual": "https://s3.feedly.com/explore/vimeo.v2.jpg",
      "related": ["inspiration", "documentary", "film"]
    }];

    that["de"] = [{
      "label": "High-Tech",
      "visual": "https://s3.feedly.com/explore/tech.jpg",
      "unit": 3,
      "importance": 1,
      "cover": "https://s3.feedly.com/explore/topics-tech-ffffff.jpeg",
      "bgcolor": "#ffffff",
      "theme": "light"
    }, {
      "label": "Nachrichten",
      "visual": "https://s3.feedly.com/explore/world-news.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-news-000000.jpeg",
      "bgcolor": "#000000",
      "theme": "dark"
    }, {
      "label": "Kultur",
      "visual": "https://s3.feedly.com/explore/culture.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-culture-5e473f.jpeg",
      "bgcolor": "#5e473f",
      "theme": "dark"
    }, {
      "label": "Marketing",
      "visual": "https://s3.feedly.com/explore/marketing.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-marketing-3a0202.jpeg",
      "bgcolor": "#3a0202",
      "theme": "dark"
    }, {
      "label": "Wirtschaft",
      "visual": "https://s3.feedly.com/explore/politics.jpg",
      "cover": "https://s3.feedly.com/explore/topics-finance-9db4cb.jpeg",
      "bgcolor": "#9db4cb",
      "theme": "dark",
      "unit": 3
    }, {
      "label": "Sport",
      "visual": "https://s3.feedly.com/explore/sport.jpg",
      "theme": "dark",
      "cover": "https://s3.feedly.com/explore/topics-sports-618a3d.jpeg",
      "bgcolor": "#618a3d",
      "unit": 3
    }, {
      "label": "Automobil",
      "visual": "https://s3.feedly.com/explore/auto.jpg",
      "theme": "dark",
      "cover": "https://s3.feedly.com/explore/topics-cars-181b21.jpeg",
      "bgcolor": "#181b21",
      "unit": 3
    }, {
      "label": "Architektur",
      "visual": "https://s3.feedly.com/explore/architecture.jpg",
      "theme": "dark",
      "cover": "https://s3.feedly.com/explore/topics-architecture-53633f.jpeg",
      "bgcolor": "#53633f",
      "unit": 3
    }, {
      "label": "Design",
      "visual": "https://s3.feedly.com/explore/design.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-design-170e0a.jpeg",
      "bgcolor": "#170e0a",
      "theme": "dark"
    }, {
      "label": "Fotoblogs",
      "visual": "https://s3.feedly.com/explore/photography.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-photography-686976.jpeg",
      "bgcolor": "#686976",
      "theme": "dark"
    }, {
      "label": "Gastronomie",
      "visual": "https://s3.feedly.com/explore/cooking.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-food-392a31.jpeg",
      "bgcolor": "#392a31",
      "theme": "dark"
    }, {
      "label": "Handwerk",
      "visual": "https://s3.feedly.com/explore/do-it-yourself.jpg",
      "cover": "https://s3.feedly.com/explore/topics-doityourself-f1b86c.jpeg",
      "bgcolor": "#f1b86c",
      "unit": 3,
      "theme": "light"
    }, {
      "label": "Fashion",
      "visual": "https://s3.feedly.com/explore/fashion.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-fashion-d4d1d5.jpeg",
      "bgcolor": "#d4d1d5",
      "theme": "light"
    }, {
      "label": "Kino",
      "visual": "https://s3.feedly.com/explore/cinema.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-film-6d6d6d.jpeg",
      "bgcolor": "#6d6d6d",
      "theme": "dark"
    }]

    that["es"] = [{
      "label": "Tecnología",
      "visual": "https://s3.feedly.com/explore/tech.jpg",
      "unit": 3,
      "importance": 1,
      "cover": "https://s3.feedly.com/explore/topics-tech-ffffff.jpeg",
      "bgcolor": "#ffffff",
      "theme": "light"
    }, {
      "label": "moda",
      "visual": "https://s3.feedly.com/explore/fashion.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-fashion-d4d1d5.jpeg",
      "bgcolor": "#d4d1d5",
      "theme": "light"
    }, {
      "label": "videojuegos",
      "keyword": "#juegosvideos",
      "visual": "https://s3.feedly.com/explore/gaming.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-gaming-383b31.jpeg",
      "bgcolor": "#383b31",
      "theme": "dark"
    }, {
      "label": "gastronomía",
      "visual": "https://s3.feedly.com/explore/cooking.jpg",
      "keyword": "#gastronomia",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-food-392a31.jpeg",
      "bgcolor": "#392a31",
      "theme": "dark"
    }, {
      "label": "decoración",
      "visual": "https://s3.feedly.com/explore/deco.jpg",
      "theme": "light",
      "cover": "https://s3.feedly.com/explore/topics-decoration-ffffff.jpeg",
      "bgcolor": "#ffffff",
      "unit": 3
    }, {
      "label": "diseño",
      "visual": "https://s3.feedly.com/explore/design.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-design-170e0a.jpeg",
      "bgcolor": "#170e0a",
      "theme": "dark"
    }, {
      "label": "cine",
      "visual": "https://s3.feedly.com/explore/cinema.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-film-6d6d6d.jpeg",
      "bgcolor": "#6d6d6d",
      "theme": "dark"
    }, {
      "label": "Turismo",
      "visual": "https://s3.feedly.com/explore/travel.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-travel-f0bd9b.jpeg",
      "bgcolor": "#f0bd9b",
      "theme": "light"
    }, {
      "label": "publicidad",
      "visual": "https://s3.feedly.com/explore/marketing.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-marketing-3a0202.jpeg",
      "bgcolor": "#3a0202",
      "theme": "dark"
    }, {
      "label": "ciencia",
      "visual": "https://s3.feedly.com/explore/science.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-science-000000.jpeg",
      "bgcolor": "#000000",
      "theme": "dark"
    }]

    that["fr"] = [{
      "label": "Technologie",
      "visual": "https://s3.feedly.com/explore/tech.jpg",
      "unit": 3,
      "importance": 1,
      "cover": "https://s3.feedly.com/explore/topics-tech-ffffff.jpeg",
      "bgcolor": "#ffffff",
      "theme": "light"
    }, {
      "label": "Design",
      "visual": "https://s3.feedly.com/explore/design.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-design-170e0a.jpeg",
      "bgcolor": "#170e0a",
      "theme": "dark"
    }, {
      "label": "Decoration",
      "visual": "https://s3.feedly.com/explore/deco.jpg",
      "theme": "light",
      "cover": "https://s3.feedly.com/explore/topics-decoration-ffffff.jpeg",
      "bgcolor": "#ffffff",
      "unit": 3
    }, {
      "label": "BD",
      "visual": "https://s3.feedly.com/explore/comics.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-comics-bec08f.jpeg",
      "bgcolor": "#bec08f",
      "theme": "light"
    }, {
      "label": "Photographie",
      "visual": "https://s3.feedly.com/explore/photography.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-photography-686976.jpeg",
      "bgcolor": "#686976",
      "theme": "dark"
    }, {
      "label": "Finance",
      "visual": "https://s3.feedly.com/explore/finance.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-finance-9db4cb.jpeg",
      "bgcolor": "#9db4cb",
      "theme": "dark"
    }, {
      "label": "Politique",
      "visual": "https://s3.feedly.com/explore/politics.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-politic-000000.jpeg",
      "bgcolor": "#000000",
      "theme": "dark"
    }, {
      "label": "Actualites",
      "visual": "https://s3.feedly.com/explore/news.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-news-000000.jpeg",
      "bgcolor": "#000000",
      "theme": "dark"
    }, {
      "label": "International",
      "visual": "https://s3.feedly.com/explore/world-news.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-international-593314.jpeg",
      "bgcolor": "#593314",
      "theme": "dark"
    }, {
      "label": "Automobile",
      "visual": "https://s3.feedly.com/explore/auto.jpg",
      "theme": "dark",
      "cover": "https://s3.feedly.com/explore/topics-cars-181b21.jpeg",
      "bgcolor": "#181b21",
      "unit": 3
    }, {
      "label": "Mode",
      "visual": "https://s3.feedly.com/explore/fashion.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-fashion-d4d1d5.jpeg",
      "bgcolor": "#d4d1d5",
      "theme": "light"
    }, {
      "label": "gastronomie",
      "visual": "https://s3.feedly.com/explore/cooking.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-food-392a31.jpeg",
      "bgcolor": "#392a31",
      "theme": "dark"
    }, {
      "label": "cinema",
      "visual": "https://s3.feedly.com/explore/cinema.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-film-6d6d6d.jpeg",
      "bgcolor": "#6d6d6d",
      "theme": "dark"
    }]

    that["it"] = [{
      "label": "tecnologia",
      "visual": "https://s3.feedly.com/explore/tech.jpg",
      "unit": 3,
      "importance": 1,
      "cover": "https://s3.feedly.com/explore/topics-tech-ffffff.jpeg",
      "bgcolor": "#ffffff",
      "theme": "light"
    }, {
      "label": "design",
      "visual": "https://s3.feedly.com/explore/design.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-design-170e0a.jpeg",
      "bgcolor": "#170e0a",
      "theme": "dark"
    }, {
      "label": "gastronomia",
      "visual": "https://s3.feedly.com/explore/cooking.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-food-392a31.jpeg",
      "bgcolor": "#392a31",
      "theme": "dark"
    }, {
      "label": "economia",
      "visual": "https://s3.feedly.com/explore/finance.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-finance-9db4cb.jpeg",
      "bgcolor": "#9db4cb",
      "theme": "dark"
    }, {
      "url": "mix://15175512314742267750/gossip",
      "label": "gossip",
      "theme": "dark",
      "cover": "https://s3.feedly.com/explore/topics-gossip-494949.jpeg",
      "bgcolor": "#494949",
      "unit": 3
    }, {
      "url": "mix://15175512314742267750/tendenze",
      "label": "tendenze",
      "visual": "https://s3.feedly.com/explore/fashion.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-fashion-d4d1d5.jpeg",
      "bgcolor": "#d4d1d5",
      "theme": "light"
    }, {
      "label": "scienza",
      "visual": "https://s3.feedly.com/explore/science.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-science-000000.jpeg",
      "bgcolor": "#000000",
      "theme": "dark"
    }, {
      "label": "marketing",
      "visual": "https://s3.feedly.com/explore/marketing.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-marketing-3a0202.jpeg",
      "bgcolor": "#3a0202",
      "theme": "dark"
    }, {
      "label": "fumetti",
      "visual": "https://s3.feedly.com/explore/comics.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-comics-bec08f.jpeg",
      "bgcolor": "#bec08f",
      "theme": "light"
    }, {
      "label": "viaggi",
      "visual": "https://s3.feedly.com/explore/travel.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-travel-f0bd9b.jpeg",
      "bgcolor": "#f0bd9b",
      "theme": "light"
    }, {
      "label": "cinema",
      "visual": "https://s3.feedly.com/explore/cinema.jpg",
      "unit": 3,
      "cover": "https://s3.feedly.com/explore/topics-film-6d6d6d.jpeg",
      "bgcolor": "#6d6d6d",
      "theme": "dark"
    }]

    that["ja"] = [{
      "label": "tech",
      "related": ["apple", "android"]
    }, {
      "label": "news",
      "visual": "https://s3.feedly.com/explore/world-news.jpg",
      "keyword": "#world news"
    }, {
      "label": "business",
      "visual": "https://s3.feedly.com/explore/business.v2.jpg"
    }, {
      "label": "gaming"
    }, {
      "label": "photography"
    }, {
      "label": "design",
      "related": ["architecture", "deco", "branding", "design thinking", "graphic design", "packaging", "typography", "web design", "infography"]
    }, {
      "label": "fashion",
      "related": ["wedding", "gardening"]
    }, {
      "label": "cooking"
    }, {
      "label": "do it yourself",
      "visual": "https://s3.feedly.com/explore/do-it-yourself.jpg"
    }, {
      "label": "sport"
    }, {
      "label": "cinema"
    }, {
      "label": "youtube"
    }, {
      "label": "vimeo"
    }];

    that["ko"] = [{
      "label": "tech",
      "related": ["apple", "android"]
    }, {
      "label": "news",
      "visual": "https://s3.feedly.com/explore/world-news.jpg",
      "keyword": "#world news"
    }, {
      "label": "business",
      "visual": "https://s3.feedly.com/explore/business.v2.jpg"
    }, {
      "label": "gaming"
    }, {
      "label": "photography"
    }, {
      "label": "design",
      "related": ["architecture", "deco", "branding", "design thinking", "graphic design", "packaging", "typography", "web design", "infography"]
    }, {
      "label": "fashion",
      "related": ["wedding", "gardening"]
    }, {
      "label": "cooking"
    }, {
      "label": "do it yourself",
      "visual": "https://s3.feedly.com/explore/do-it-yourself.jpg"
    }, {
      "label": "sport"
    }, {
      "label": "cinema"
    }, {
      "label": "youtube"
    }, {
      "label": "vimeo"
    }];

    return that;
  }();

  utils.MapUtils = function() {
    var that = {};

    that.size = function(aMap) {
      var count = 0;
      for (var k in aMap)
        if (aMap[k] != null)
          count++;

      return count;
    };

    that.toArray = function(aMap) {
      var result = [];

      for (var k in aMap)
        result.push(aMap[k]);

      return result;
    };

    that.inc = function(map, name) {
      if (map[name] == null)
        map[name] = 0;
      map[name]++;
    };

    return that;
  }();

  utils.JSONUtils = function() {
    var that = {};

    that.decode = function(frag) {
      return JSON.parse(frag);
    };

    that.encode = function(jsObject) {
      return JSON.stringify(jsObject);
    };

    return that;
  }();

  // Copyright (c) 2010 Thomas Peri http://www.tumuski.com/
  utils.Nibbler = function(options) {
    var construct,

      // options
      pad, dataBits, codeBits, keyString, arrayData,

      // private instance variables
      mask, group, max,

      // private methods
      gcd, translate,

      // public methods
      encode, decode;

    // pseudo-constructor
    construct = function() {
      var i, mag, prev;

      // options
      pad = options.pad || '';
      dataBits = options.dataBits;
      codeBits = options.codeBits;
      keyString = options.keyString;
      arrayData = options.arrayData;

      // bitmasks
      mag = Math.max(dataBits, codeBits);
      prev = 0;
      mask = [];
      for (i = 0; i < mag; i += 1) {
        mask.push(prev);
        prev += prev + 1;
      }
      max = prev;

      // ouput code characters in multiples of this number
      group = dataBits / gcd(dataBits, codeBits);
    };

    // greatest common divisor
    gcd = function(a, b) {
      var t;
      while (b !== 0) {
        t = b;
        b = a % b;
        a = t;
      }
      return a;
    };

    // the re-coder
    translate = function(input, bitsIn, bitsOut, decoding) {
      var i, len, chr, byteIn,
        buffer, size, output,
        write;

      // append a byte to the output
      write = function(n) {
        if (!decoding) {
          output.push(keyString.charAt(n));
        } else if (arrayData) {
          output.push(n);
        } else {
          output.push(String.fromCharCode(n));
        }
      };

      buffer = 0;
      size = 0;
      output = [];

      len = input.length;
      for (i = 0; i < len; i += 1) {
        // the new size the buffer will be after adding these bits
        size += bitsIn;

        // read a character
        if (decoding) {
          // decode it
          chr = input.charAt(i);
          byteIn = keyString.indexOf(chr);
          if (chr === pad) {
            break;
          } else if (byteIn < 0) {
            throw 'the character "' + chr + '" is not a member of ' + keyString;
          }
        } else {
          if (arrayData) {
            byteIn = input[i];
          } else {
            byteIn = input.charCodeAt(i);
          }
          if ((byteIn | max) !== max) {
            throw byteIn + " is outside the range 0-" + max;
          }
        }

        // shift the buffer to the left and add the new bits
        buffer = (buffer << bitsIn) | byteIn;

        // as long as there's enough in the buffer for another output...
        while (size >= bitsOut) {
          // the new size the buffer will be after an output
          size -= bitsOut;

          // output the part that lies to the left of that number of bits
          // by shifting the them to the right
          write(buffer >> size);

          // remove the bits we wrote from the buffer
          // by applying a mask with the new size
          buffer &= mask[size];
        }
      }

      // If we're encoding and there's input left over, pad the output.
      // Otherwise, leave the extra bits off, 'cause they themselves are padding
      if (!decoding && size > 0) {

        // flush the buffer
        write(buffer << (bitsOut - size));

        // add padding keyString for the remainder of the group
        len = output.length % group;
        for (i = 0; i < len; i += 1) {
          output.push(pad);
        }
      }

      // string!
      return (arrayData && decoding) ? output : output.join('');
    };

    /**
     * Encode.  Input and output are strings.
     */
    encode = function(input) {
      return translate(input, dataBits, codeBits, false);
    };

    /**
     * Decode.  Input and output are strings.
     */
    decode = function(input) {
      return translate(input, codeBits, dataBits, true);
    };

    this.encode = encode;
    this.decode = decode;
    construct();
  };



  utils.ContentTypes = {
    JSON: "text/javascript; charset=UTF-8"
  };

  utils.ExceptionUtils = function() {
    var that = {};
    var stackRE = /\@(.+?):[0-9]+/gm;

    function right(s, l) {
      if (s.length > l + 3) {
        return "..." + s.substring(s.length - l);
      }
      return s;
    }

    that.formatError = function(task, e) {
      try {
        if (window != null && window.console != null && window.console.trace != null)
          window.console.trace();
      } catch (ignore) {
        $feedly("[nitro] trace failed");
      }

      try {
        var m = [];

        if (e.name == null && e.message == null) {
          m.push(e.toString());
        } else {
          m.push("[error] failed to ");
          m.push(task);
          m.push(" because ");
          m.push(e.name);
          m.push(" -- ");
          m.push(e.message);
        }
        return m.join("");
      } catch (innerError) {
        return "failed to " + task;
      }
    };

    return that;
  }();

  utils.RandomUtils = function() {
    var that = {};

    that.shuffle = function(o) {
      for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    };

    return that;
  }();

  utils.NoneResizable = {
    "C0": true,
    "C0l": true,
    "C1": true,
    "C3": true,
    "C3l": true,
    "C4": true,
    "C5": true,
    "C5l": true,
    "C6": true,
    "C7": true,
    "C7l": true,
    "C11l": true,
    "C11p": true,
    "C12": true,
    "C14": true,
    "C15l": true,
    "C15p": true,
    "C19l": true,
    "C19p": true,
    "C22l": true,
    "C20": true,
    "C23": true,
    "C53": true,
    "C55": true
  };

  utils.LeftBottomable = {
    "C2": true
  };

  utils.NoneHidable = {
    "C3": true,
    "C4": true,
    "C3l": true,
    "C4l": true,
    "C6": true,
    "C7": true,
    "C7l": true,
    "C14": true,
    "C22l": true,
    "C23": true
  };

  utils.Placeholders = {
    "C3": "hidden",
    "C4": "hidden",
    "C3l": "hidden",
    "C4l": "hidden",
    "C6": "hidden",
    "C7": "hidden",
    "C7l": "hidden",
    "C14": "hidden",
    "C22l": "hidden",
    "C23": "hidden"
  };

  utils.CustomFlex = {
    "C2": 0.70
  };

  utils.PageConstants = {
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DESKTOP
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    UR_IMAGE_WIDTH: 202,
    UR_IMAGE_HEIGHT: 132,

    U3_IMAGE_WIDTH: 68,
    U3_IMAGE_HEIGHT: 34,

    U4_IMAGE_WIDTH: 202,
    U4_IMAGE_HEIGHT: 109,

    U5_IMAGE_WIDTH: 264,
    U5_IMAGE_HEIGHT: "*",

    U6_IMAGE_WIDTH: 152,
    U6_IMAGE_HEIGHT: 130,

    U8_IMAGE_WIDTH: 646 - 2,
    U8_IMAGE_HEIGHT: 424,

    U9_IMAGE_WIDTH: 645,
    U9_IMAGE_HEIGHT: 14 * 17,

    U10_IMAGE_WIDTH: 324 - 2,
    U10_IMAGE_HEIGHT: 260 - 2,

    U14_IMAGE_WIDTH: 264,
    U14_IMAGE_HEIGHT: 206,

    U16_IMAGE_WIDTH: 60,
    U16_IMAGE_HEIGHT: 60,

    U15_IMAGE_WIDTH: 63,
    U15_IMAGE_HEIGHT: 63,

    U17_IMAGE_WIDTH: 66,
    U17_IMAGE_HEIGHT: 66,

    U18_IMAGE_WIDTH: 49,
    U18_IMAGE_HEIGHT: 49,

    U19_IMAGE_WIDTH: 152,
    U19_IMAGE_HEIGHT: 68,

    U20_IMAGE_WIDTH: 51,
    U20_IMAGE_HEIGHT: 51,

    FEED_HEADER_HEIGHT: 28,
    USER_INDEX_HEIGHT: 26,
    FEED_INDEX_HEIGHT: 25,
    U_HEIGHT: function(u) {
      if (u == 12)
        return 17;
      if (u == 4)
        return 86;
      if (u == 6)
        return this.U6_IMAGE_HEIGHT + 1 + 1;
      if (u == 7)
        return 161;
      if (u == 1)
        return 34; // 6 + 6 + 16 + 6
      if (u == 0)
        return 34; // 6 + 6 + 16 + 6
      return 22 * u;
    },
    MODULE_TITLE_HEIGHT: 28,
    U10_WIDTH: 221,
    UR_HEIGHT: 300,
    UR_SPACER: 6,

    UE_WIDTH: 221,

    UC_WIDTH: 170,
    UC_SPACER: 6,
    UC_IMAGE_WIDTH: 199 - 2,
    UC_IMAGE_HEIGHT: 120 - 2
  };

  // Associated a type to this feed/set of entries
  //
  // promoted feed
  // podcast channel
  // photo channel
  // video channel
  // partial content -> moreable
  // full content
  // must read - full content, high engagement, low velocity
  utils.FeedTypeUtils = function() {
    var that = {};

    that.process = function(feed) {
      if (feed.enterpriseName != null)
        return {
          primary: "private",
          secondary: (feed.enterpriseDescription || feed.enterpriseName) + " only"
        }

      if (feed.promoted == true)
        return {
          primary: "Promoted"
        };

      if (feed.contentType == "video")
        return {
          primary: "Video",
          secondary: "channel"
        };

      if (feed.contentType == "podcast")
        return {
          primary: "Podcast",
          secondary: "channel"
        };

      if (feed.partial)
        return {
          primary: "Abstract",
          secondary: "only"
        };

      if (feed.velocity != null && feed.velocity < 10 && feed.estimatedEngagement != null && feed.estimatedEngagement > 100)
        return {
          primary: "Must",
          secondary: "read"
        };

      if (feed.velocity != null && feed.velocity < 30 && feed.estimatedEngagement != null && feed.estimatedEngagement > 500)
        return {
          primary: "Must",
          secondary: "read"
        };

      return {
        primary: "Full",
        secondary: "content"
      };
    };

    return that;
  }();

  utils.URLUtils = function() {
    var that = {};

    that.unprotocol = function(url) {
      // We should only unprotocol urls if we are in a http or https window.
      if (window.location.protocol != "https:" && window.location.protocol != "http:") {
        return url;
      }

      if (url==null)
        return null;

      return url.replace("http:", "").replace("https:","");
    };

    that.extractParameter = function(aURL, paramName) {
      if (paramName == null)
        return null;
      paramName = paramName.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
      var regexS = "[\\?&]" + paramName + "=([^&#]*)";
      var regex = new RegExp(regexS);
      var results = regex.exec(aURL);
      if (results == null)
        return null;
      else
        return decodeURIComponent(results[1]);
    }

    that.extractDomain = function(aURL) {
      return (aURL + "/").split("/").slice(0, 4).join("/");
    }

    return that;
  }();

  utils.VisualsUtils = function() {
    var that = {};

    that.isException = function(anEntry) {
      try {
        var url = anEntry.getBestAlternateLink();
        var feedId = anEntry.getFeedId();

        if (url == null || feedId == null)
          return false;

        // EK - 10/12/2015 - Working around the gawkey lazyloader element
        //
        /*
        if( feedId.indexOf( "gawker.com" ) > -1 ||  feedId.indexOf( "http://gizmodo.com" ) > -1 ||  feedId.indexOf( "http://kotaku.com" ) > -1 )
        	return true;
        */

        if (url.indexOf("/TheVegetarianFoodie") > -1)
          return true;

        if (feedId.indexOf("pi.co/feed") > -1)
          return true;

        if (url.indexOf("guardian.co.uk") > -1)
          return true;

        if (url.indexOf("adventure.com") > -1)
          return true;

        if (feedId.indexOf("adventure.com") > -1)
          return true;

        if (feedId.indexOf("europeanforeignpolicy.eu") > -1)
          return true;

        if (url.indexOf("europeanforeignpolicy.eu") > -1)
          return true;


        if (feedId.indexOf("harvardbusiness") > -1)
          return true;

        if (url.indexOf("www.businessoffashion.com") > -1)
          return true;

        if (url.indexOf("entrepreneur.com") > -1)
          return true;

        if (url.indexOf("theverge.com") > -1)
          return true;

        if (feedId.indexOf("fastcompany") > -1)
          return true;

        if (url.indexOf("fastcompany") > -1)
          return true;

        if (feedId.indexOf("fastcodesign") > -1)
          return true;

        if (url.indexOf("fastcodesign") > -1)
          return true;

        if (url.indexOf("www.sfgate.com") > -1)
          return true;

        if (url.indexOf("slate.com") > -1)
          return true;

        if (url.indexOf("betakit.com") > -1)
          return true;

        if (url.indexOf("etsy.com") > -1)
          return true;

        if (feedId.indexOf("arstechnica") > -1)
          return true;

        if (feedId.indexOf("tennisnow") > -1)
          return true;

        if (feedId.indexOf("hanielas.blogspot.com") > -1)
          return true;

        return false;
      } catch (e) {
        $feedly("[nitro] failed to test exception:" + e.name + " -- " + e.message);
        return false;
      }
    };

    that.isComic = function(anEntry) {
      var url = anEntry.getAlternateLink();

      if (url.indexOf("dilbert.com") > -1)
        return true;

      return false;
    };

    that.disableInjection = function(anEntry) {
      var feedId = anEntry.getFeedId();
      var url = anEntry.getBestAlternateLink();

      if (feedId != null && feedId.indexOf("daringfireball.net") > -1)
        return true;

      if (anEntry.metadata.promoted == true)
        return true;

      if (url && url.indexOf("twitter.com") > -1) {
        return true;
      }

      return false;
    };



    that.fitsSize = function(aVisual, frameWidth, frameHeight, tol, allVisualsIncluded) {
      if (aVisual == null)
        return 0;

      if (aVisual.width == null || aVisual.height == null)
        return allVisualsIncluded == true ? 0 : 1;

      if ((frameWidth == "*" || (aVisual.width >= frameWidth * tol)) && (frameHeight == "*" || (aVisual.height >= frameHeight * tol)))
        return 2;
      else
        return 0;
    };

    that.fitsSizes = function(aVisual, sizes, allVisualsIncluded) {
      if (aVisual == null)
        return 0;

      if (aVisual.width == null || aVisual.height == null)
        return allVisualsIncluded == true ? 0 : 1;

      var max = 0;

      for (var i = 0; i < sizes.length; i++) {
        var width = sizes[i][0];
        var height = sizes[i][1];
        var tol = sizes[i][2] || 1;

        var f = that.fitsSize(aVisual, width, height, tol, allVisualsIncluded);
        if (f == 2) {
          return f;
        } else {
          max = Math.max(max, f);
        }
      }

      return max;
    };

    return that;
  }();

  ///////////////////////////////////////////
  // VIDEO UTILS    					     //
  ///////////////////////////////////////////
  utils.VideoUtils = function() {
    var that = {};

    that.extractThumbnail = function(html) {
      try {
        var RE_YOUTUBE1 = /youtube\.com\/embed\/([A-Za-z0-9\-_]+)/gi;
        var RE_YOUTUBE2 = /youtube\.com\/v\/([A-Za-z0-9\-_]+)/gi;
        var RE_YOUTUBE3 = /ytimg\.com\/vi\/([A-Za-z0-9\-_]+)/gi;
        var RE_YOUTUBE4 = /youtube\.com\/watch\?v=([A-Za-z0-9\-_]+)/gi;

        var videoId = devhd.utils.RegExUtils.select(RE_YOUTUBE1, html) || devhd.utils.RegExUtils.select(RE_YOUTUBE2, html) || devhd.utils.RegExUtils.select(RE_YOUTUBE3, html) || devhd.utils.RegExUtils.select(RE_YOUTUBE4, html);

        // Edwin K. Nov 19th. Changed the Youtube image index to 2 because sometimes the first image is
        // black. Let's see how the second image performs.
        if (videoId != null)
          return {
            url: "http://img.youtube.com/vi/" + videoId + "/0.jpg",
            videoId: "youtube:" + videoId,
            width: 480,
            height: 360
          };
      } catch (ignore) {
        $feedly("[video utils] YT Extraction failed:" + ignore.name + " -- " + ignore.message);
      }
      return null;
    };

    that.embedsYoutube = function(html) {
      return that.extractThumbnail(html) != null;
    };

    return that;
  }();

  utils.RegExUtils = function() {
    var that = {};

    that.select = function(re, content, defaultValue) {
      if (content == null)
        return defaultValue;

      var parts = re.exec(content);
      if (parts && parts.length)
        return parts[1];
      else
        return defaultValue;
    };

    that.selectN = function(re, content) {
      if (content == null)
        return [];

      var values = [];

      var value = null;
      do {
        var m = re.exec(content);
        value = m === null ? null : m[1];

        if (value != null)
          values.push(value);
      }
      while (value != null);

      return values;
    };

    that.extractVar = function(content, varName) {
      var aRegEx = new RegExp(varName + " =\\s*(.*);\\s*[\n|<]", "m");
      return that.select(aRegEx, content);
    };

    that.extractAttributeValue = function(content, attributeName) {
      var aRegEx = new RegExp(attributeName + "[\S]*=[\S]*\"([^\"]*)\"", "m");
      var result = that.select(aRegEx, content);

      if (result == null) {
        aRegEx = new RegExp(attributeName + "[\S]*=[\S]*'([^']*)'", "m");
        result = that.select(aRegEx, content);
      }

      return result;
    };

    that.extractEmbeddedVariable = function(html, varName, hashName) {
      try {
        var extract = devhd.utils.StringUtils.extractBetween(html, varName + " =", ";\n\"\";");

        if (extract == null || extract.content == null)
          return null;

        var map = devhd.utils.JSONUtils.decode(extract.content);

        return map[hashName];
      } catch (e) {
        $feedly("[extract variable] failed because " + e.name + " -- " + e.message + " -- " + varName + " -- " + extract.content);
        return null;
      }
    };

    return that;
  }();

  utils.DurationUtils = function() {
    var that = {};

    var MIN = 60 * 1000; // 1 minute

    that.MINUTES = function(m) {
      return m * MIN;
    };
    that.HOURS = function(h) {
      return h * 60 * MIN;
    };
    that.DAYS = function(d) {
      return d * 24 * 60 * MIN;
    };

    // "wave": "2013.7"
    that.isRecentWave = function(wave) {
      if (wave == null)
        return true;

      var parts = wave.split(".");

      if (parts.length != 2)
        return true;

      var yyyy = parseInt(parts[0]);
      var ww = parseInt(parts[1]);

      var cy = new Date().getFullYear();
      var wy = that.getCurrentWeekNumber();

      var delta = (cy - yyyy) * 52 + (wy - ww);
      return delta < 4;
    }

    that.getCurrentWeekNumber = function() {
      var d = new Date();
      d.setHours(0, 0, 0);
      d.setDate(d.getDate() + 4 - (d.getDay() || 7));
      return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
    }


    return that;
  }();

  utils.StreamUtils = function() {
    var that = {};

    that.formatTitle = function(label) {
      if (label == null)
        return null;

      switch (label) {
        case "global.all":
        case "feedly.all":
          return "All";

        case "#my":
          return feedlyTerms.my;

        case "global.uncategorized":
          return "uncategorized";

        case "#sources":
          return "all sources";

        case "feedly.history":
          return "recently read";

        case "feedly.saved":
        case "starred":
          return "saved for later";

        case "feedly.shared":
          return "shared";

        case "global.must":
          return "must reads";

        case "feedly.annotated":
          return "annotated";

        default:
      }

      var labelIndex = label.indexOf("/label/");
      if (labelIndex > 0)
        return label.substring(labelIndex + 7);

      return label;
    };

    that.formatId = function(label, userId, type) {
      if (!label)
        return null;

      if (label == "")
        return null;

      if (!userId)
        userId = "-";

      if (type == null)
        type = "???";

      if (label == "feedly.history")
        return "user/" + userId + "/tag/global.read";

      if (label == "read")
        return "user/" + userId + "/tag/global.read";

      if (label == "like")
        return "user/" + userId + "/tag/feedly.plusone";

      if (label == "#my")
        return "user/" + userId + "/category/global.all";

      if (label == "feedly.all")
        return "user/" + userId + "/category/global.all";

      if (label == "global.uncategorized")
        return "user/" + userId + "/category/global.uncategorized";

      if (label == "global.all")
        return "user/" + userId + "/category/global.all";

      if (label == "global.must")
        return "user/" + userId + "/category/global.must";

      if (label == "global.saved")
        return "user/" + userId + "/tag/global.saved";

      if (label == "starred" || label == "feedly.saved")
        return "user/" + userId + "/tag/global.saved";

      if (label.indexOf("feedly.") == 0)
        return "user/" + userId + "/tag/" + label;

      return "user/" + userId + "/" + type + "/" + label;
    };

    that.extractUserId = function(feedId) {
      if (feedId.indexOf("user/") != 0) {
        return null;
      }
      var a = feedId.split("/");
      return a.length > 1 ? a[1] : null;
    };

    return that;
  }();

  utils.IdUtils = function() {
    var that = {};

    that.formatTitle = function(label) {
      if (label == null)
        return null;

      switch (label) {
        case "global.saved":
          return "Saved for later";

        case "global.all":
          return "All";

        case "global.must":
          return "Must reads";

        default:
          return label;
      }
    };

    that.formatId = function(type, label, userId) {
      if (label == null || label == "")
        return null;

      if (userId == null)
        userId = "-";

      if (label == "starred" || label == "feedly.saved")
        return "user/" + userId + "/tag/global.saved";

      if (label == "#my" || label == "global.all" || label == "feedly.all")
        return "user/" + userId + "/category/global.all";

      return "user/" + userId + "/" + type + "/" + label;
    };

    /**
    Determine the type of feed based on the `feedId`, which can have one
    of the following forms (ignoring spaces):

    - Enterprise Collection: enterprise/:enterpriseName/category/:uuid
    - Enterprise Tag:        enterprise/:enterpriseName/tag     /:tagName
    - User Tag:              user      /:userId        /tag     /:label

    @param {String} feedId
    @return {Object} An object containing the following:
      isCategory:   Whether the `feedId` is a category or not.
      isTag:        Whether the `feedId` is a tag or not.
      isEnterprise: Whether the `feedId` is for an enterprise feed or not.
      isUser:       Whether the `feedId` is for a user feed or not.
    **/
    that.extractType = function(feedId) {
      if (!feedId) {
        return {
          isCategory: false,
          isTag: false,
          isEnterprise: false,
          isUser: false,
          isFeed: false,
        }
      }

      if (feedId.indexOf('feed') == 0) {
        return {
          isCategory: false,
          isTag: false,
          isEnterprise: false,
          isUser: false,
          isFeed: true,
        }
      }

      let [
        enterpriseOrUser, // 'enterprise' or 'user'
        entityIdentifier, // `userId` or `enterpriseName`
        categoryOrTag     // 'category' or 'tag'
      ] = feedId.split('/');

      return {
        isCategory: (categoryOrTag === 'category'),
        isTag: (categoryOrTag === 'tag'),

        isEnterprise: (enterpriseOrUser === 'enterprise'),
        isUser: (enterpriseOrUser === 'user'),

        isFeed: false,
      };
    };

    that.extractUserId = function(feedId) {
      if (feedId.indexOf("user/") != 0)
        return null;

      var a = feedId.split("/");
      return a.length > 1 ? a[1] : null;
    };

    that.extractLabel = function(id) {
      if (id == null)
        return null;

      if (id.indexOf("/") == -1)
        return id;

      var parts = id.split("/");

      return parts[parts.length - 1];
    };

    return that;
  }();


  ////////////////////////////////////////////
  // String Utils                           //
  ////////////////////////////////////////////
  utils.StringUtils = function() {
    var that = {};

    that.substitute = function(aString, aMap) {
      if( aString == null )
        return null;

      var r = new String(aString);

      for (var k in aMap)
        if (aString.indexOf(k) > -1)
          r = r.replace(k, aMap[k]);

      return r;
    };

    var RE_STRIP = /<\/?[^>]+>/gi;

    that.stripTags = function(aString) {
      if (aString == null)
        return null;

      return aString.replace(RE_STRIP, ' ').replace( /(\s+)/gi, ' ');
    };

    that.replaceTagsWithSpace = function(aString) {
      if (aString == null)
        return null;

      return aString.replace(RE_STRIP, ' ');
    };

    that.extractBetween = function(someContent, startPattern, endPattern, cursor) {
      if (cursor == null)
        cursor = 0;

      var i1 = someContent.indexOf(startPattern, cursor);
      if (i1 == -1)
        return null;
      var i2 = someContent.indexOf(endPattern, i1 + startPattern.length);

      // The end pattern is optional. If no end pattern then use the end of the string.
      if (i2 == -1)
        i2 = someContent.length;

      return {
        content: someContent.substring(i1 + startPattern.length, i2),
        end: i2 + endPattern.length
      };
    }

    that.extractAttribute = function(someContent, attributeName, type) {
      var valueMap = devhd.utils.StringUtils.extractBetween(someContent, attributeName + "=\"", "\"")
                     || devhd.utils.StringUtils.extractBetween(someContent, attributeName + "='", "'");

      if( valueMap == null ) {
        return null;
      }

      var value = valueMap.content;

      if( type == "int" ){
        var intValue = parseInt( value );
        return isNaN( intValue ) ? null : intValue;
      }

      return value;
    }


    that.matchesTerm = function(content, searchTerm) {
      if (searchTerm == null)
        return true;

      if (content == null)
        return false;

      var c = new String(content).toLowerCase();

      var t = searchTerm.replace("\"", "", "g");
      var parts = t.split(" ");

      for (var j = 0; j < parts.length; j++) {
        if (c.indexOf(parts[j].toLowerCase()) > -1)
          return true;
      }
      return false;
    }

    that.trim = function(content) {
      if (content == null)
        return null;

      if (typeof content != "string")
        content = content.toString();

      var trimmed = content.replace(/^\s+/, '');
      return trimmed.replace(/\s+$/, '');
    }

    that.ellipcify = function(content, maxLength) {
      if (content == null)
        return null;

      if (maxLength < 4)
        maxLength = 4

      if (content.length > maxLength - 3)
        return content.substring(0, maxLength - 3) + "...";
      else
        return content;
    };

    that.cleanSourceTitle = function(title) {
      if (title == null)
        return title;

      title = title.replace("\u003cdiv style\u003d\"direction:rtl;text-align:right\"\u003e", "")
        .replace("\u003c/div\u003e", "");

      title = that.cleanTitle(title);

      if (title.indexOf("-") > 10)
        title = that.trim(title.slice(0, title.indexOf("-")));

      if (title.indexOf(":") > 10)
        title = that.trim(title.slice(0, title.indexOf(":")));

      if (title.indexOf(">") > 10)
        title = that.trim(title.slice(0, title.indexOf(">")));

      if (title.indexOf("|") > 10)
        title = that.trim(title.slice(0, title.indexOf("|")));

      return title;
    };

    that.isRTL = function(content) {
      if (!content) {
        return false;
      } else {
        return content.indexOf("direction:rtl") > -1
      }
    };

    that.microSourceTitle = function(title) {
      if (title == null)
        return title;

      title = that.cleanTitle(title);

      if (title.indexOf("-") > 4)
        title = that.trim(title.slice(0, title.indexOf("-")));

      if (title.indexOf(":") > 4)
        title = that.trim(title.slice(0, title.indexOf(":")));

      if (title.indexOf(">") > 4)
        title = that.trim(title.slice(0, title.indexOf(">")));

      if (title.indexOf("|") > 4)
        title = that.trim(title.slice(0, title.indexOf("|")));

      return title;
    }

    that.cleanTitle = function(title) {
      if (title == null)
        return title;

      // remove HTML markup from the title
      title = devhd.str.stripTags(title);

      // try to further clean up the title.
      var replaced = devhd.utils.StringUtils.trim(title);

      if (replaced == replaced.toUpperCase() && replaced.length > 10)
        replaced = that.capitalize(replaced.toLowerCase())

      return replaced.length < title.length / 3 || replaced.length < 5 ? devhd.str.stripTags(title) : replaced;
    }

    function replacer(str, p1) {
      //keep only . in p1, drop everything else
      return p1.replace(/[^\.+]/g, " ")
    }

    that.capitalize = function(title) {
      return title.replace(/\w+/g, function(a) {
        return a.charAt(0).toUpperCase() + a.substr(1).toLowerCase();
      });
    };

    that.simplifyTitle = function(title) {
      title = that.cleanTitle(title);
      return title.replace(/(\W+)/g, replacer);
    };

    that.deEntitify = function(content) {
      if (content == null) {
        return content;
      }
      return content.replace(/&quot;/g, "\"");
    };

    that.escapeToUtf16 = function(str) {
      var escaped = '';
      for (var i = 0; i < str.length; ++i) {
        var hex = str.charCodeAt(i).toString(16).toUpperCase();
        escaped += "\\u" + "0000".substr(hex.length) + hex;
      }
      return escaped;
    };

    return that;
  }();


  ////////////////////////////////////////////
  // HTML Utils                              //
  ////////////////////////////////////////////
  utils.HTMLUtils = function() {
    var that = {};

    // Takes a raw HTML representation of a note and highlights
    // Slack @ and # mentions and +email mentions.
    that.highlightMentions = function(html) {
      try {
        if (!html) {
          return html;
        }

        // mention
        html = html.replace(/\B@[a-z0-9][a-z0-9._-]*/gi,
          (match) => {
            return '<span class="mention">' + match + '</span>';
          }
        );

        // channels
        html = html.replace(/\B#[a-z0-9][a-z0-9._-]*/gi,
          (match) => {
            return '<span class="mention">' + match + '</span>';
          }
        );

        // email
        html = html.replace(/\B\+[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/gi,
          (match) => {
            return '<span class="mention">' + match + '</span>';
          }
        );

        return html;
      } catch( e ) {
        $feedly('[nitro] failed to process mentiones.' + e.name + " -- " + e.message);
        return html;
      }
    }

    that.convertLinkMarkup = function(input) {
      if (input == null)
        return null;

      // EK
      // because of potential XSS attacks, we can not include markup
      // in the short bio.
      return input.replace(/\[(.+?)\]\((.+?)\)/g, function(_, linkText, url) {
        return linkText;
      })
    }

    that.removeLinkMarkup = function(input) {
      if (input == null)
        return null;

      //convert markdown stlye links into html
      return input.replace(/\[(.+?)\]\((.+?)\)/g, function(_, linkText, url) {
        return linkText;
      })
    }

    that.cleanNode = function(aNode, options) {
      if (aNode == null)
        return;

      if (aNode.getAttribute("data-clean") == "yes")
        return;

      var mw = adjustMaxWidth(options.maxWidth, aNode);

      if (aNode.removeAttribute != null) {
        var directionAttr, textAlignAttr;

        if (options.rtl == true) {
          directionAttr = aNode.style.direction;
          textAlignAttr = aNode.style.textAlign;
        }

        aNode.removeAttribute("style");
        aNode.removeAttribute("align");

        if (options.rtl == true) {
          aNode.style.direction = directionAttr;
          aNode.style.textAlign = textAlignAttr;
        }
      }

      if (aNode.tagName == "FONT") {
        aNode.removeAttribute("size");
        aNode.removeAttribute("color");
        aNode.removeAttribute("face");
      }

      if (aNode.tagName == "IMG") {
        var w = parseInt(aNode.getAttribute("width"));
        var h = parseInt(aNode.getAttribute("height"));

        if ((w == null || w == 0 || isNaN(w)) && aNode.naturalWidth > 0)
          w = parseInt(aNode.naturalWidth);

        if ((h == null || h == 0) || isNaN(h) && aNode.naturalHeight > 0)
          h = parseInt(aNode.naturalHeight);

        aNode.removeAttribute("hspace");
        aNode.removeAttribute("width");
        aNode.removeAttribute("height");
        aNode.style.maxWidth = mw + "px";

        // prevent ads from being pinable.
        if (aNode.src.indexOf("/ad/") > -1 || aNode.src.indexOf("doubleclick") > -1)
          options.pinImage = false;

        var isImageCleaned = false;

        // If we have the image width and height or if the image is in the cache
        // clean the image right away.
        if (!isNaN(w) && w > 0 && !isNaN(h) && h > 0) {
          cleanImage(aNode, w, h, options);
          isImageCleaned = true;
        }

        // If not, wait for the image to load so that we have the natural width
        // and height information.
        //
        // Edge case. The page might include width and height information but
        // the image service image might be larger. Do we want to reflow? The
        // new width might be larger than mw/3 and change the layout.
        if( !isImageCleaned || (w < mw/3 && !aNode.naturalWidth ) ) {
          aNode.onload = function() {
            cleanImage(aNode, aNode.naturalWidth || aNode.width,
              aNode.naturalHeight || aNode.height, options);
          };
        }
      }

      if (aNode.tagName == "A") {
        try {
          aNode.target = "_blank";
        } catch (ignore) {
          $feedly("[html] clean up failed:" + ignore.name + " -- " + ignore.message);
        }

      }

      if (aNode.tagName == "TABLE" || aNode.tagName == "TR") {
        try {
          var w = parseInt(aNode.getAttribute("width"));
          if (w != null && !isNaN(w) && w > mw)
            aNode.width = mw;
        } catch (ignore) {
          $feedly("[html] clean up failed:" + ignore.name + " -- " + ignore.message);
        }
      }

      if (aNode.tagName == "CENTER") {
        try {
          aNode.style.textAlign = "left";
        } catch (ignore) {
          $feedly("[html] clean up failed:" + ignore.name + " -- " + ignore.message);
        }
      }

      if (aNode.tagName == "IFRAME") {
        try {
          if (aNode.src.indexOf("youtube.com") > -1) {
            cleanYoutubeVideo(aNode, options);
          } else {
            var w = aNode.width;
            var h = aNode.height;

            if (w != null && h != null && h > 0 && w > mw) {
              aNode.width = mw + "px";
              aNode.height = Math.floor(h / w * mw) + "px";
            }
          }
        } catch (ignore) {
          $feedly("[html] clean up failed:" + ignore.name + " -- " + ignore.message);
        }

      }

      if (aNode.hasChildNodes()) {
        var children = aNode.childNodes;

        for (var i = 0; i < children.length; i++) {
          if (children[i].nodeType != 1)
            continue;

          that.cleanNode(children[i], options);
        }
      }
    };

    function cleanYoutubeVideo(anIFrame, options) {
      var w = anIFrame.width;
      var h = anIFrame.height;

      if (w == "" || w == null || isNaN(w) || h == "" || h == null || isNaN(h)) {
        w = 647;
        h = 394;
      }

      var mw = options.maxWidth;
      anIFrame.width = mw + "px";
      anIFrame.height = Math.floor(h * mw / w) + "px";
      anIFrame.style.marginTop = "3rem";
      anIFrame.style.marginBottom = "3rem";
      anIFrame.style.display = "block";
    }

    // PINNABLE
    // <span class="pinContainer">
    //    <div class='pin'></div>
    //    <img class="pinable" src="http://img.gawkerassets.com/img/18kfnm5a0o04rjpg/xlarge.jpg" />
    // </span>

    function makePinable(anImage) {
      var aSpan = anImage.ownerDocument.createElement("span");
      aSpan.className = "pinContainer";

      // PINTEREST COMPONENT
      var aPin = anImage.ownerDocument.createElement("span");
      aPin.className = "pin";
      aPin.setAttribute("data-page-action", "pinImage");
      aPin.setAttribute("data-page-action-input", anImage.src);
      if (anImage.getAttribute("title") != null)
        aPin.setAttribute("data-title", anImage.getAttribute("title"));
      aSpan.appendChild(aPin);

      // EVERNOTE COMPONENT
      var ePin = anImage.ownerDocument.createElement("span");
      ePin.className = "epin";
      ePin.setAttribute("data-page-action", "epinImage");
      ePin.setAttribute("data-page-action-input", anImage.src);
      if (anImage.getAttribute("title") != null)
        ePin.setAttribute("data-title", anImage.getAttribute("title"));
      aSpan.appendChild(ePin);

      // ONENOTE COMPONENT
      var oPin = anImage.ownerDocument.createElement("span");
      oPin.className = "opin";
      oPin.setAttribute("data-page-action", "opinImage");
      oPin.setAttribute("data-page-action-input", anImage.src);
      if (anImage.getAttribute("title") != null)
        oPin.setAttribute("data-title", anImage.getAttribute("title"));
      aSpan.appendChild(oPin);

      anImage.parentNode.replaceChild(aSpan, anImage);

      // anImage.parentNode.remove( anImage );
      anImage.className = "pinable";

      aSpan.appendChild(anImage);
    }

    function cleanImage(anImg, w, h, options) {
      if (!anImg || !anImg.parentNode)
        return;
      try {

        var mw = adjustMaxWidth(options.maxWidth, anImg);

        // So that we can assign a border
        //
        mw = mw - 2;

        if (anImg.naturalWidth != null && anImg.naturalWidth > w) {
          w = anImg.naturalWidth;
          h = anImg.naturalHeight;
        }

        if ((anImg.className == "wp-smiley" && anImg.src.indexOf("emoji") > -1) || (anImg.src.indexOf("core/emoji") > -1)) {

          anImg.setAttribute( "data-image-enhancer", "WordPress smiley");
          anImg.style.width = "1em";
          anImg.style.height = "1em";
          anImg.style.display = "inline-block";
          anImg.style.verticalAlign = "middle";
          anImg.style.borderRadius = "0px";
          anImg.style.boxShadow = "none";
          anImg.className += " emoji";

        } else if (anImg.src.indexOf("latex.php") > -1 || anImg.className == "latext") {

          anImg.setAttribute( "data-image-enhancer", "Latex");
          anImg.style.display = "inline";
          anImg.style.margin = "0px";
          anImg.style.border = "0px";
          anImg.style.borderRadius = "0px";
          anImg.style.boxShadow = "none";
          anImg.style.verticalAlign = "middle";

        } else if (anImg.src.indexOf("rc.img") > -1 && anImg.src.indexOf("feedsportal") > -1) {

          anImg.setAttribute( "data-image-enhancer", "feedsportal ad");
          anImg.style.marginTop = "0rem";
          anImg.style.marginBottom = "0rem";
          anImg.style.display = "block";

        } else if (w == null || h == null || isNaN(w) || isNaN(h)) {

          // GIVEN THAT WE ARE NOT SURE WHAT THE ROOT CAUSE OF THE PROBLEM IS...DO NOT DO ANYTHING
          // ABOUT IT.
          anImg.setAttribute( "data-image-enhancer", "unknown case");

        } else if (w == 0 && h == 0) {

          anImg.setAttribute( "data-image-enhancer", "0 x 0");
          anImg.style.maxWidth = mw;
          anImg.style.display = "block";
          anImg.style.marginTop = "3rem";
          anImg.style.marginBottom = "3rem";
          anImg.style.borderRadius = "3px";
          anImg.style.border = "1px solid #EFEFEF";

        } else if (w < 42 || h < 42) {

          anImg.setAttribute( "data-image-enhancer", "less than 42 pixel");
          anImg.parentNode.removeChild(anImg);

        } else if (w > mw) {

          anImg.setAttribute( "data-image-enhancer", "larger than " + mw);
          anImg.style.width = mw + "px";
          anImg.style.height = Math.floor(h * mw / w);
          anImg.style.marginTop = "3rem";
          anImg.style.marginBottom = "3rem";
          anImg.style.display = "block";
          anImg.style.borderRadius = "3px";
          anImg.style.border = "1px solid #EFEFEF";

          if (options.pinImage == "yes")
            makePinable(anImg);

        } else if (w > (mw / 3)) {

          // block remaining ones
          anImg.setAttribute( "data-image-enhancer", "larger than third of " + mw);
          anImg.style.marginTop = "3rem";
          anImg.style.marginBottom = "3rem";
          anImg.style.marginLeft = "0rem";
          anImg.style.marginBottom = "0rem";
          anImg.style.display = "block";
          anImg.style.borderRadius = "3px";
          anImg.style.border = "1px solid #EFEFEF";
          anImg.style.cssFloat = "none";

          if (options.pinImage == "yes" && w > mw / 2)
            makePinable(anImg);

        } else {

          // float smaller images
          anImg.setAttribute( "data-image-enhancer", "float because smaller: " + w + " versus " + h);
          anImg.style.cssFloat = "right";
          anImg.style.marginLeft = "1rem";
          anImg.style.marginBottom = "1rem";
          anImg.style.marginTop = "0rem";
          anImg.style.marginBottom = "1rem";
          anImg.style.display = "inline";

        }

      } catch (e) {
        $feedly("[html] failed to clean image:" + e.name + " -- " + e.message);
      }
    }

    function adjustMaxWidth(maxWidth, elem) {
      return maxWidth;
    }

    var magicID = Math.floor(Math.random() * 10000000000000000000).toString(36)
    that.clearSelection = function(win) {
      win.getSelection().removeAllRanges()
    }

    that.grabRangeContext = function(win) {
      var s = win.getSelection()
      if (s.rangeCount < 1)
        return null;

      var r = range2context(s.getRangeAt(0))
      if (r == null)
        return null;

      var n = selfOrParent(r.n0, isMarkerContainer)
      if (n == null)
        return null;

      // r = adjustTextOfRangeContext(adjustRangeContext(r))
      r = adjustTextOfRangeContext(r)
      if (r == null)
        return null;

      return r
    }

    var nonWords = " \t\n().,;"

    function isMarkerContainer(n) {
      return n && n.nodeType == 1 && n.hasAttribute("cdf_container")
    }

    function selfOrParent(n, fn) {
      while (n) {
        if (fn(n)) break
        n = n.parentNode
      }
      return n
    }

    function range2context(aRange) {
      /** Empty range on FF */
      if (aRange.startContainer == aRange.endContainer && aRange.startOffset == aRange.endOffset)
        return null

      return {
        n0: aRange.startContainer,
        o0: aRange.startOffset,
        n1: aRange.endContainer,
        o1: aRange.endOffset
      }
    }

    /** Adjust the text boundries on the range context [ which is not the FF range object ] */
    function adjustTextOfRangeContext(ctx, how) {
      if (!ctx || !ctx.n0) return ctx

      var s, i
        // Adjust start node and start of range
      if (ctx.n0.nodeType == 3) {
        i = ctx.o0
        s = ctx.n0.nodeValue
        if (nonWords.indexOf(s.charAt(i)) < 0) {
          // move to the left until space
          while (i >= 0 && nonWords.indexOf(s.charAt(i)) < 0) {
            i -= 1
          }
          ctx.o0 = i + 1
        } else {
          // move to the right until non-space
          while (i < s.length && nonWords.indexOf(s.charAt(i)) >= 0) {
            i += 1
          }
          ctx.o0 = i
        }
      }

      // Adjust end node and end of range
      if (ctx.n1.nodeType == 3) {
        i = ctx.o1 - 1
        s = ctx.n1.nodeValue
        if (nonWords.indexOf(s.charAt(i)) < 0) {
          // extend till end of word
          while (i < s.length && nonWords.indexOf(s.charAt(i)) < 0) {
            i += 1
          }
          ctx.o1 = i
        } else {
          // eat right whitespace
          while (i >= 0 && nonWords.indexOf(s.charAt(i)) >= 0) {
            i -= 1
          }
          ctx.o1 = i + 1
        }
      }

      return ctx
    }


    that.getHtmlSelection = function(doc) {
      var win = doc.defaultView;
      var sel = win.getSelection();

      if (sel.rangeCount >= 1) {
        var html = sel.getRangeAt(0).cloneContents();
        var newNode = doc.createElement("p");
        newNode.appendChild(html);
        return devhd.str.stripTags(newNode.innerHTML);
      } else {
        return "";
      }
    }

    that.getRawSelection = function(doc) {
      var win = doc.defaultView;
      var sel = win.getSelection();

      if (sel.rangeCount >= 1) {
        var html = sel.getRangeAt(0).cloneContents();
        var newNode = doc.createElement("p");
        newNode.appendChild(html);
        return newNode.innerHTML;
      } else {
        return "";
      }
    }


    that.getSelection = function(doc) {
      return devhd.str.stripTags(that.getHtmlSelection(doc));
    }

    that.getClientWidth = function(doc) {
      if (doc == null || doc.defaultView == null)
        return 1024;

      var win = doc.defaultView;

      if (typeof(win.innerWidth) == 'number') {
        return win.innerWidth;
      } else if (doc.documentElement && doc.documentElement.clientWidth) {
        //IE 6+ in 'standards compliant mode'
        return doc.documentElement.clientWidth;
      } else if (doc.body && doc.body.clientWidth) {
        return doc.body.clientWidth;
      }
    };

    that.getClientHeight = function(doc) {
      var win = doc.defaultView;

      if (typeof(win.innerHeight) == 'number') {
        return win.innerHeight;
      } else if (doc.documentElement && doc.documentElement.clientHeight) {
        //IE 6+ in 'standards compliant mode'
        return doc.documentElement.clientHeight;
      } else if (doc.body && doc.body.clientHeight) {
        return doc.body.clientHeight;
      }
    }


    function getDiv(doc) {
      var aDiv = doc.getElementById(magicID);
      if (aDiv) {
        return aDiv;
      }
      aDiv = doc.createElement("div");
      aDiv.setAttribute("id", magicID);
      return aDiv;
    }

    that.append = function(parentNode, htmlFrag) {
      var aDiv = getDiv(parentNode.ownerDocument);
      aDiv.innerHTML = htmlFrag;

      while (aDiv.firstChild)
        parentNode.appendChild(aDiv.firstChild);
    }

    that.prepend = function(aNode, htmlFrag) {
      if (aNode == null)
        return;

      if (aNode.firstChild == null)
        aNode.innerHTML = htmlFrag;
      else
        that.before(aNode.firstChild, htmlFrag);
    }

    that.prependElement = function(aNode, elem) {
      if (aNode == null)
        return;

      if (aNode.firstChild == null)
        aNode.appendChild(elem);
      else
        aNode.insertBefore(elem, aNode.firstChild);
    }

    that.after = function(aNode, htmlFrag) {
      var aDiv = getDiv(aNode.ownerDocument);
      aDiv.innerHTML = htmlFrag;

      while (aDiv.firstChild)
        aNode.parentNode.insertBefore(aDiv.firstChild, aNode.nextSibling);
    }

    that.before = function(aNode, htmlFrag) {
      var aDiv = getDiv(aNode.ownerDocument);
      aDiv.innerHTML = htmlFrag;

      while (aDiv.lastChild)
        aNode.parentNode.insertBefore(aDiv.lastChild, aNode);
    }

    that.remove = function(aNode) {
      aNode.parentNode.removeChild(aNode);
    }

    /**
     * Inject CSS into the document or just prior to the node passed.
     *
     * @param {Object} n - node (an element or a document)
     * @param {Object} cssStyleSnippet - css text
     */

    var injected = {};

    that.injectCSS = function(n, cssStyleSnippet, label) {

      try {
        if (label != null && injected[label] == true)
          that.removeCSS(n, label);

        var doc, head, style;

        if (n == null)
          return false;

        if (n.nodeType == 1) {
          doc = n.ownerDocument;
        } else if (n.nodeType == 9) {
          doc = n;
          head = doc.getElementsByTagName("head")[0];
          if (n == null) {
            return false;
          }
        } else {
          throw "bad arguments to injectCSS"; // non-i18n
        }

        style = doc.createElement("style");
        style.setAttribute("type", "text/css");
        style.setAttribute("data-injected", label || "anonymous");


        if (typeof navigator != "undefined" && navigator.userAgent.indexOf("AppleWebKit") > -1) {
          // WEBKIT
          // style.innerText = cssStyleSnippet; --> Conflict with some chrome extensions.
          style.innerHTML = cssStyleSnippet;
        } else if (style.styleSheet) {
          // IE
          style.styleSheet.cssText = cssStyleSnippet;
        } else {
          // FIREFOX
          style.innerHTML = cssStyleSnippet;
        }

        if (head) {
          head.appendChild(style);
        } else if (n) {
          n.parentNode.insertBefore(style, n);
        }

        if (label != null)
          injected[label] = true;

        return true;
      } catch (e) {
        $feedly("[nitro] failed to inject CSS. " + e.name + " -- " + e.message);
        return false;
      }
    };

    that.removeCSS = function(n, label) {
      try {
        var doc = n.ownerDocument;

        if (n.nodeType == 1) {
          doc = n.ownerDocument;
        } else if (n.nodeType == 9) {
          doc = n;
        }

        var styleElems = doc.getElementsByTagName("style");
        var removedCount = 0;
        for (var i = 0; i < styleElems.length; i++) {
          if (styleElems[i].getAttribute("data-injected") == label) {
            that.remove(styleElems[i]);
            removedCount++;
          }
        }

        delete injected[label];

        return true;
      } catch (e) {
        $feedly("failed to remove CSS for label " + label + " -- " + e.name + " -- " + e.message);
        return false;
      }
    };

    that.findElements = function(node, query) {
      var className = query.className;
      var elems = node.getElementsByClassName(className);

      var results = [];

      for (var i = 0; i < elems.length; i++) {
        var match = true;
        for (var k in query) {
          if (k.indexOf("data-") != 0)
            continue;

          if (elems[i].getAttribute(k) != query[k]) {
            match = false;
            break;
          }
        }

        if (match)
          results.push(elems[i]);
      }

      return results;
    }

    that.findElementsByTagAndAttribute = function(node, tagName, an, av) {
      var fn = an,
        list = [],
        nl, i, n

      if (typeof fn != "function") {
        fn = function(e) {
          if (!an || an == "*") {
            return true
          }
          if (an && e.hasAttribute(an)) {
            if (av) {
              return av == e.getAttribute(an);
            } else {
              return true
            }
          }
          return false
        }
      }

      if (node) {
        nl = node.getElementsByTagName(tagName || "*")
        for (i = 0; i < nl.length; i++) {
          n = nl.item(i)
          if (fn(n)) {
            list.push(n)
          }
        }
      }
      return list
    }

    that.findFirstElementByTagAndAttribute = function(node, tagName, attributeName, attributeValue) {
      var list = that.findElementsByTagAndAttribute(node, tagName, attributeName, attributeValue);
      return list.length > 0 ? list[0] : null
    }

    that.findParentElementByTagAndAttribute = function(node, tagName, attributeName, attributeValue) {
      var val;

      if (node == null) {
        return null
      }
      if (node.nodeType == 1) {
        if (tagName == "*" || tagName == node.tagName) {
          // check for attribtue
          val = node.getAttribute(attributeName)
          if (val && (attributeValue == "*" || attributeValue == val)) {
            return node;
          }
        }
      }
      return that.findParentElementByTagAndAttribute(node.parentNode, tagName, attributeName, attributeValue);
    }

    that.addEventListener = function(node, name, fn, how) {
      if (node == null)
        return;

      if (node.addEventListener) {
        // FIREFOX, CHROME, SAFARI
        node.addEventListener(name, fn, how || false)
      } else if (node.attachEvent) {
        // IE
        node.attachEvent("on" + name, fn);
      }
    }

    that.removeEventListener = function(node, name, fn, how) {
      if (node == null)
        return;

      if (node.removeEventListener) {
        // FIREFOX, CHROME, SAFARI
        node.removeEventListener(name, fn, how || false)
      } else if (node.detachEvent) {
        // IE
        node.detachEvent("on" + name, fn);
      }
    }

    that.empty = function(node) {
      var p
      if (node) {
        p = node
        while (node.firstChild) {
          p.removeChild(node.firstChild)
        }
      }
    }

    that.text = function(node, text) {
      that.empty(node)
      if (node) {
        node.appendChild(node.ownerDocument.createTextNode(text))
      }
    }

    that.html = function(node, html) {
      that.empty(node)
      if (node) {
        node.innerHTML = html
      }
    }

    that.remove = function(node) {
      var p
      if (node) {
        p = node.parentNode
        p.removeChild(node)
      }
    }

    /**
     * Adds a set of classes passed in to the class of the node (css).
     *
     * @param {Object} node the node
     * @param {Object} name ... class names to add
     */

    that.addClass = function(node, name) {
      if (!node || node.nodeType != 1) {
        return
      }
      var i, n, cl = node.className.split(/\s+/),
        pl = cl.length
      for (var i = 1; i < arguments.length; i++) {
        n = arguments[i]
        if (n && cl.indexOf(n) < 0) {
          cl.push(n)
        }
      }
      // if we had added a class, change it
      if (cl.length > pl) {
        node.className = cl.length > 1 ? cl.join(" ") : cl[0]
      }
    }

    that.removeClass = function(node, name) {
      if (!node || node.nodeType != 1) {
        return
      }
      var cl = node.className.split(/\s+/)
      cl = cl.filter(function(m) {
        return m && m.length && name != m
      })

      if (cl.length == 0) {
        node.className = ""
      } else if (cl.length == 1) {
        node.className = cl[0]
      } else {
        node.className = cl.join(" ")
      }
    }

    that.unlink = function(node) {
      var ctx = {
        node: node
      }
      ctx.parent = node.parentNode
      ctx.next = node.nextSibling
      that.remove(node)
      return ctx;
    }

    that.relink = function(ctx) {
      ctx.parent.insertBefore(ctx.node, ctx.next)
    }

    that.outerHTML = function(node) {
      if (node.nodeType != 1) {
        return node.nodeValue
      }
      var html = []
      html.push("<")
      html.push(node.tagName)
      html.push(" ");
      html.push("class=\"");
      html.push(node.className);
      html.push("\"/>")
      html.push(node.innerHTML)
      html.push("</")
      html.push(node.tagName)
      html.push(">")
      return html.join("")
    }

    that.findDataAttribute = function(node, attributeName) {
      if (node == null)
        return null;

      if (node.nodeType == 1 && node.getAttribute(attributeName) != null)
        return node.getAttribute(attributeName);
      else {
        var p = node.parentNode;
        if (p != null)
          return that.findDataAttribute(p, attributeName);
        else
          return null;
      }
    };

    that.listLinks = function(htmlFragment) {
      try {
        if (htmlFragment == null)
          return [];

        var linkList = [];
        var cursor = 0;

        while (cursor > -1) {
          var result = devhd.utils.StringUtils.extractBetween(htmlFragment, "<a", "</a>", cursor);

          if (result == null) {
            cursor = -1;
          } else {
            cursor = result.end;

            var hrefResult = devhd.utils.StringUtils.extractBetween(result.content, "href=\"", "\"");
            if (hrefResult != null && hrefResult.content != null) {
              linkList.push({
                href: decodeAnd(hrefResult.content),
                all: result.content
              });
            }
          }
        }

        return linkList;
      } catch (e) {
        $feedly("[nitro] failed to listLinks:" + e.name + " -- " + e.message);
        return [];
      }
    }

    that.getFirstLink = function(htmlFragment) {
      if (htmlFragment == null)
        return null;

      var hrefResult = devhd.utils.StringUtils.extractBetween(htmlFragment, "href=\"", "\"");

      return hrefResult == null ? null : hrefResult.content;
    }

    that.listLinkTags = function(htmlFragment) {
      try {
        if (htmlFragment == null)
          return [];

        var list = [];
        var cursor = 0;

        while (cursor > -1) {
          var result = devhd.utils.StringUtils.extractBetween(htmlFragment, "<link", ">", cursor);

          if (result == null)
            cursor = -1;
          else {
            cursor = result.end;

            var linkContent = result.content;

            list.push({
              "rel": devhd.utils.RegExUtils.extractAttributeValue(linkContent, "rel"),
              "href": devhd.utils.RegExUtils.extractAttributeValue(linkContent, "href"),
              "title": devhd.utils.RegExUtils.extractAttributeValue(linkContent, "title"),
              "type": devhd.utils.RegExUtils.extractAttributeValue(linkContent, "type")
            });
          }
        }

        return list;
      } catch (e) {
        $feedly("[nitro] failed to list link tags:" + e.name + " -- " + e.message);
        return [];
      }
    }

    // replaces instance of &amp; with & for transition between HTML content and Javascript representation
    function decodeAnd(someURL) {
      if (someURL == null)
        return null;

      return someURL.replace("&amp;", "&", "g");
    }

    function toInt( val ){
      var intVal = parseInt( val );
      if( isNaN( intVal ) )
        return null;
      else {
        return intVal;
      }
    }

    function extractIntValue(betStruct) {
      if (betStruct == null)
        return null;

      var v = parseInt(betStruct.content);
      if (isNaN(v))
        return null;
      else
        return v;
    }

    that.listImages = function(htmlFragment) {
      try {
        if (htmlFragment == null)
          return [];

        var imageList = [];
        var cursor = 0;

        while (cursor > -1) {
          var imgResult = devhd.utils.StringUtils.extractBetween(htmlFragment, "<img", ">", cursor);

          if (imgResult != null && imgResult.content != null) {
            cursor = imgResult.end;

            var inner = imgResult.content;

            var image = {
              src: devhd.utils.StringUtils.extractAttribute( inner, "src", "string" ),
              srcset: devhd.utils.StringUtils.extractAttribute( inner, "srcset", "string" ),
              width: devhd.utils.StringUtils.extractAttribute( inner, "width", "int" ),
              height: devhd.utils.StringUtils.extractAttribute( inner, "height", "int" ),
              featured: inner.indexOf("webfeedsFeaturedVisual") > -1
            }

            let alt = devhd.utils.StringUtils.extractAttribute( inner, "alt", "string" );
            if (alt && alt.length > 0) {
              image.alt = alt;
            }

            let title = devhd.utils.StringUtils.extractAttribute( inner, "title", "string" );
            if (title && title.length > 0) {
              image.title = title;
            }

            // Some feeds use a lazy loading framework for loading images asynchronously
            //
            var lazySrc = devhd.utils.StringUtils.extractAttribute( inner, "data-lazy-src", "string" );
            if(lazySrc != null)
              image.src = lazySrc;

            if( image.srcset != null ) {
              // parse the source set and sort it by width and density.
              var sset = srcset.parse( image.srcset ).sort( (a, b) => ( b.width || 1 ) * ( b.density || 1 ) - ( a.width || 1 ) * ( b.density || 1 ) );
              if (sset && sset.length > 0 && sset[ 0 ].url != null)
              image.url = decodeAnd( sset[ 0 ].url );
            } else {
              image.url = decodeAnd(image.src);
            }

            if (image.url != null) {
              imageList.push(image);
            }

          } else {
            cursor = -1;
          }
        }

        return imageList;
      } catch (e) {
        $feedly("[nitro] listImages failed " + e.name + " -- " + e.message);
        return [];
      }
    }

    that.listEmbeddings = function(htmlFragment, excludePatterns) {
      try {
        if (htmlFragment == null)
          return [];

        if (excludePatterns == null)
          excludePatterns = [];

        var resultList = [];
        var cursor = 0;

        while (cursor > -1) {
          var embedResult = devhd.utils.StringUtils.extractBetween(htmlFragment, "<embed", ">", cursor);

          if (embedResult == null) {
            cursor = -1;
          } else if (embedResult.content != null) {
            cursor = embedResult.end;

            var srcResult = devhd.utils.StringUtils.extractBetween(embedResult.content, "src=\"", "\"");

            if (srcResult != null) {
              var src = srcResult.content;

              var shouldInclude = true;
              for (var i = 0; i < excludePatterns.length; i++) {
                if (src.indexOf(excludePatterns[i]) > -1) {
                  shouldInclude = false;
                  break;
                }
              }

              if (shouldInclude)
                resultList.push(srcResult.content);
            }
          } else {
            cursor = embedResult.end;
          }
        }

        return resultList;
      } catch (e) {
        $feedly("[feedly] failed to list embeddings:" + e.name + " -- " + e.message);
        return [];
      }
    }

    /**
     * Walk the DOM starting at the node provided and follow all the siblings
     * in a in order traversal. For every node call the function fn with 2
     * arguments: the current node and the context passed.
     * The function can return the following values:
     *  0 - means keep on walking
     *  1 - means stop the walk
     *  2 - means skip this node's subtree
     */

    function walk(n, fn, ctx) {
      var r = 0
      while (n != null && r != 1) {
        r = fn.call(fn, n, ctx)
        if (r == 0 && n.nodeType == 1) {
          r = walk(n.firstChild, fn, ctx)
        }
        n = n.nextSibling
      }
      return r
    }

    function findByHilite(n, ctx) {
      if (n.nodeType == 1 && n.getAttribute("hilite.name") == ctx.name) {
        // ignore this sub-tree walk
        ctx.list.push(n)
        return 2
      }
      return 0
    }


    /**
     * Unhilite the next previously hilited.
     *
     * @param {Object} element
     * @param {Object} name
     */

    that.unhighlightText = function(element, name) {
      var ctx = {
        name: name,
        list: []
      }
      walk(element, findByHilite, ctx)

      var i, n, list = ctx.list,
        doc = element.ownerDocument
      for (i = 0; i < list.length; i++) {
        n = list[i]
        var child = null;
        var docfrag = doc.createDocumentFragment();
        var next = n.nextSibling;
        var parent = n.parentNode;

        while ((child = n.firstChild)) {
          docfrag.appendChild(child);
        }
        parent.removeChild(n);
        parent.insertBefore(docfrag, next);
        parent.normalize();
      }
    }

    function innerHighlight(node, name, model, max) {
      if (model == null || model.text == null || node.data == null)
        return;

      var pat = model.text.toUpperCase();

      var skip = 0;
      if (node.nodeType == 3) {
        var pos = node.data.toUpperCase().indexOf(pat);
        if (pos >= 0) {
          var spannode = document.createElement('span');

          if (model.title)
            spannode.setAttribute("title", model.title)

          if (model.style)
            spannode.setAttribute("style", model.style)

          if (model.css)
            spannode.className = model.css;

          if (model.data)
            for (var k in model.data)
              spannode.setAttribute(k, model.data[k])

          var middlebit = node.splitText(pos);
          var endbit = middlebit.splitText(pat.length);
          var middleclone = middlebit.cloneNode(true);
          spannode.appendChild(middleclone);
          middlebit.parentNode.replaceChild(spannode, middlebit);
          skip = 1;
        }
      } else if (node.nodeType == 1 && node.childNodes && !/(script|style|a)/i.test(node.tagName)) {
        for (var i = 0; i < node.childNodes.length; ++i) {
          var s = innerHighlight(node.childNodes[i], name, model, max);

          max = max - s;
          if (max <= 0)
            break;

          i += s;
        }
      }
      return skip;
    }

    /**
     *  Hiliting ... inspired from FireFox code.
     *
     * @param element is the dom element under which we have to hilite.
     * @param name is the name given to this hilite pass (so that it can be later removed)
     * @param model is an array of the following:
     *    { text: "search", style: "",  css: "", data: { data-element1: value1, data-element2: value2}, title: "" }
     *
     */

    that.highlightText = function(element, name, model, max) {
      if (typeof Components == "undefined") {
        for (var i = 0; i < model.length; i++)
          innerHighlight(element, name, model[i], max);
      } else {
        var finder = Components.classes["@mozilla.org/embedcomp/rangefind;1"]
          .createInstance()
          .QueryInterface(Components.interfaces.nsIFind);

        var i, doc = element.ownerDocument,
          retRange, countFound = 0,
          searchRange = doc.createRange(),
          startPoint,
          endPoint = doc.createRange(),
          count = element.childNodes.length,
          next, baseNode, node;

        finder.caseSensitive = false

        searchRange.setStart(element, 0)
        searchRange.setEnd(element, count)

        endPoint.setStart(element, count)
        endPoint.setEnd(element, count)

        var countFound = 0;
        for (i = 0; i < model.length; i++) {
          next = model[i]

          // searching for the next word, so change the startPoint.
          startPoint = doc.createRange()
          startPoint.setStart(element, 0)
          startPoint.setEnd(element, 0);

          var innerCount = 0;
          while ((retRange = finder.Find(next.text, searchRange,
              startPoint, endPoint)) && (max == null || innerCount < max)) {
            // Highlight
            baseNode = doc.createElement("span");
            if (next.title) {
              baseNode.setAttribute("title", next.title)
            }
            if (next.style) {
              baseNode.setAttribute("style", next.style)
            }
            if (next.css) {
              baseNode.setAttribute("class", next.css)
            }
            if (next.data) {
              for (var k in next.data)
                baseNode.setAttribute(k, next.data[k])
            }
            baseNode.setAttribute("hilite.name", name)

            // now hilite and advance.
            node = highlight(retRange, baseNode);

            // re-adjust the startpoint ....
            startPoint = doc.createRange();
            startPoint.setStart(node, node.childNodes.length);
            startPoint.setEnd(node, node.childNodes.length);

            countFound++;

            innerCount++;
          }
        }
      }
    }

    /**
     * Highlights the word in the passed range.
     *
     * @param range the range that contains the word to highlight
     * @param node the node replace the searched word with
     * @return the node that replaced the searched word
     */
    function highlight(range, node) {
      var startContainer = range.startContainer;
      var startOffset = range.startOffset;
      var endOffset = range.endOffset;
      var docfrag = range.extractContents();
      var before = startContainer.splitText(startOffset);
      var parent = before.parentNode;
      node.appendChild(docfrag);
      parent.insertBefore(node, before);
      return node;
    }

    return that;
  }();

  ///////////////////////////////////////////
  // FLOW UTILS    					     //
  ///////////////////////////////////////////
  utils.FlowUtils = function() {
    var that = {};

    // options: { onStart, onProgress, onSuccess, onError, onAfterComplete }
    that.parallelForEach = function(context, list, processor, options) {
      if (options == null)
        options = {};

      if (options.onStart != null)
        options.onStart.call(context);

      var pending = list.length;

      if (pending < 1) {
        if (pending == 0 && options.onSuccess != null)
          options.onSuccess.call(context)
      }

      for (var i = 0; i < list.length; i++) {
        processor.call(context,
          list[i],
          i,
          function() {
            pending = pending - 1;

            if (pending == 0 && options.onSuccess != null)
              options.onSuccess.call(context)
          },
          options.onError,
          options.onProgress
        );
      }
    }

    /**
     * Run the same onPeform function N times in parallel. The onPerform
     * function (or callback hash, cb-hash for short) must notify us back via the
     * passed function (cb-hash) when it is done working in order for the onComplete
     * function (cb-hash) to be successfully called.
     * When all onPerform have asynchronously returned results,
     * then call the onComplete callback.
     *
     * @param {Object} context the context object
     * @param {Object} N
     * @param {Object} onPerform   a function or cb-hash
     * @param {Object} onComplete  a function or cb-hash to call when done
     */
    that.flowN = function(context, N, onPerform, onComplete) {
      var pending = N
        // do the clousure just once
      function on1Done() {
        pending--
        if (pending > 0) {
          return
        }
        devhd.fn.callback(onComplete, context)
      }

      // idiot check
      if (N < 1) {
        on1Done()
        return
      }

      // run them
      for (var i = 0; i < N; i++) {
        devhd.fn.callback(onPerform, context, i, on1Done)
      }
    }


    /**
     *
     * @param {Object} context
     * @param {Object} funcArray
     * @param {Object} options
     */
    that.parallel = function(context, funcArray, options) {
      try {
        var faultMessage = null;
        var earlyCompletion = false;
        var pending = funcArray.length

        // no loop invariants here, so we can define just once
        function on1Done() {
          // already completed
          if (earlyCompletion == true)
            return;

          pending = pending - 1;
          if (pending > 0) {
            if (options.earlyCompletion != null) {
              var ec = options.earlyCompletion.call(context);
              if (ec == true) {
                earlyCompletion = true;
                if (options.onComplete != null)
                  options.onComplete.call(context);
              }
            }
            return;
          }

          if (faultMessage) {
            if (options.onError != null)
              options.onError.call(context, faultMessage)
            else if (options.onComplete != null)
              options.onComplete.call(context);
          } else {
            if (options.onComplete != null) {
              options.onComplete.call(context);
            }
          }
        }

        // onOneError is like onOneDone + it  a fault
        function on1Error(errMsg) {
          faultMessage = errMsg;
          on1Done()
        }
        // -- parallel start running here
        // idiot check
        if (funcArray.length < 1) {
          on1Done()
          return
        }

        // now make the calls
        for (var i = 0; i < funcArray.length; i++) {
          funcArray[i].call(context, on1Done, on1Error)
        }
      } catch (e) {
        $feedly("[flowutils] parallel failed because:" + e.name + " -- " + e.message);
        throw e;
      }
    }

    // options: { onStart, onProgress, onSuccess, onError, onAfterComplete }
    that.sequence = function(context, steps, options) {
      options = options || {};
      try {
        if (options.onStart != null)
          options.onStart.call(context);

        callNextSequenceStep(context,
          steps,
          0,
          function() {
            if (options.onSuccess != null)
              options.onSuccess.call(context);
          },
          options.onError,
          function(status, arg1, arg2, arg3, arg4, arg5) {
            if (options.onProgress != null)
              options.onProgress.call(context, status, arg1, arg2, arg3, arg4, arg5);
          }
        );
      } catch (e) {
        var msg = devhd.utils.ExceptionUtils.formatError("run sequence", e);
        $feedly("[FlowUtils][sequence]" + msg + " -- " + steps[0].toString());
        if (options.onError != null)
          options.onError.call(context, -1, msg);
      }
    }

    function callNextSequenceStep(context, steps, i, onSuccess, onError, onProgress) {
      try {
        if (i >= steps.length) {
          onSuccess.call(context);
          return
        }

        steps[i].call(context, function() {
          callNextSequenceStep(context, steps, i + 1, onSuccess, onError)
        }, onError, onProgress);
      } catch (e) {
        var msg = devhd.utils.ExceptionUtils.formatError("run sequence", e);
        $feedly("[FlowUtils][sequence]" + msg + " -- " + steps[0].toString());
        if (onError != null)
          onError.call(context, -1, msg);
      }
    }

    // options: { onStart, onSuccess, onError, onAfterComplete }
    that.forEach = function(context, list, processor, options) {
      if (options == null)
        options = {};

      try {
        if (options.onStart != null)
          options.onStart.call(context);

        callNextForEachStep(context,
          list,
          0,
          processor,
          function() {
            if (options.onSuccess != null) {
              try {
                options.onSuccess.call(context);
              } catch (e) {
                $feedly("[FlowUtils][forEach] on success failed (1). " + e.name + " -- " + e.message + " -- " + options.onSuccess);
              }
            }
          },
          options.onError,
          function(status, arg1, arg2, arg3, arg4, arg5) {
            if (options.onProgress != null) {
              try {
                options.onProgress.call(context);
              } catch (e) {
                $feedly("[FlowUtils][forEach] on progress failed. " + e.name + " -- " + e.message + " -- " + options.onProgress);
              }
            }
          }
        );
      } catch (e) {
        var msg = devhd.utils.ExceptionUtils.formatError("run forEach", e);
        $feedly("[FlowUtils][forEach]" + msg + " -- " + processor);
        if (options.onError != null) {
          try {
            options.onError.call(context, -1, msg);
          } catch (e) {
            $feedly("[FlowUtils][forEach] onError failed. " + e.name + " -- " + e.message + " -- " + options.onError);
          }
        }
      }
    }

    function callNextForEachStep(context, list, i, processor, onSuccess, onError, onProgress) {
      try {
        if (i >= list.length) {
          try {
            onSuccess.call(context);
          } catch (e) {
            $feedly("[FlowUtils][forEach] on success failed (2). " + e.name + " -- " + e.message + " -- " + onSuccess);
          }
          return
        }

        processor.call(context,
          list[i],
          i,
          function() {
            callNextForEachStep(context, list, i + 1, processor, onSuccess, onError, onProgress)
          },
          onError,
          onProgress
        );
      } catch (e) {
        var msg = devhd.utils.ExceptionUtils.formatError("run forEach", e);
        $feedly("[FlowUtils][forEach]" + msg + " -- " + processor);
        if (onError != null) {
          try {
            onError.call(context, -1, msg);
          } catch (e) {
            $feedly("[FlowUtils][forEach] onError failed. " + e.name + " -- " + e.message + " -- " + onError);
          }
        }
      }
    }

    return that;
  }();

  utils.ArrayUtils = function() {
    var that = {};

    /**
     * Returns an array of the elements of arr1 not in arr2 based on filter
     * @param arr1 The largest array
     * @param arr2 The substracting array
     * @param filter Invoked with arguments (val1, val2). Return true if values are identical, false otherwise. Defaults to (val1, val2) => val1 === val2
     * @returns {Array}
     */
    that.diffArray = function(arr1, arr2, filter=(val1, val2) => val1===val2) {
      return arr1.filter((item1) => !arr2.find((item2) => filter(item1,item2)))
    };

    that.contains = function(anArray, strItem) {
      for (var i = 0; i < anArray.length; i++) {
        if (anArray[i] == strItem)
          return true;
      }
      return false;
    };

    that.forEach = function(list, func) {
      if (list == null || list.length == 0)
        return;

      for (var i = 0; i < list.length; i++)
        func(list[i]);
    };

    that.map = function(list, func, ctx) {
      var i, r, a = []
      if (list == null || list.length == 0) {
        return a
      }

      if (ctx == null) {
        ctx = func
      }

      for (i = 0; i < list.length; i++) {
        r = func.call(ctx, i, list[i])
        if (r) {
          a.push(r)
        }
      }
      return a
    }

    that.insert = function(list, idx, num, args) {
      if (idx > list.length || num < 0) {
        throw "bad args to insert"; // non-i18n
      }
      var j, l = list.length,
        n = l - idx
        // move over to the end the array elements
      for (j = 0; j < n; j++) {
        list[l + num - j - 1] = list[l - j - 1]
      }

      for (j = 0; j < num; j++) {
        list[j + idx] = arguments[j + 3]
      }
      return list
    }

    return that;
  }();

  utils.StorageUtils = function() {
    var that = {};

    that.createCookieStorage = function() {
      return {
        removeItem: function(name) {
          var date = new Date();
          date.setTime(date.getTime() + (-1 * 24 * 60 * 60 * 1000));
          var expires = "; expires=" + date.toGMTString();
          document.cookie = name + "=" + expires + ";path=/";
        },
        setItem: function(name, value) {
          var date = new Date();
          date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
          var expires = "; expires=" + date.toGMTString();
          document.cookie = name + "=" + value + expires + ";path=/";
        },
        getItem: function(name) {
          var nameEQ = name + "=";
          var ca = document.cookie.split(';');
          for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
          }
          return null;
        }
      };
    }

    return that;
  }();

  utils.DateUtils = function() {
    var that = {};

    that.ago = function(date, longFormat, includeAgo) {
      // If we don't have enough data, render nothing
      if (!date || date === 'Invalid Date') {
        return null;
      }

      const labels = longFormat === true ? {
        minutes: ' minutes',
        hour: ' hour',
        hours: ' hours',
        day: ' day',
        days: ' days',
        month: ' month',
        months: ' months',
      } : {
        minutes: 'min',
        hour: 'h',
        hours: 'h',
        day: 'd',
        days: 'd',
        month: 'mo',
        months: 'mo',
      };

      // Calculate number of hours, days, and months since the article was crawled
      const delta = ((new Date().getTime()) - date.getTime()) / 1000;
      const days = Math.floor(delta / (24 * 3600));
      const months = Math.floor(days / 30);
      const hours = Math.floor((delta - days * 24 * 3600) / 3600);
      const mins = Math.floor(delta / 60);
      let text;

      const post = includeAgo === true ? ' ago' : '';

      // Format the date into a number of minutes, hours, days, or months since it
      // was last crawled, whichever is most relevant.
      if (mins < 2) {
        text = 'now';
      } else if (mins < 60) {
        text = mins + labels.minutes + post;
      } else if (days === 0) {
        text = hours + (hours === 1 ? labels.hour :labels.hours) + post;
      } else if (months < 2) {
        text = days + (days === 1 ? labels.day :labels.days) + post;
      } else {
        text = months + (months === 1 ? labels.month :labels.months) + post;
      }

      return text;
    }

    that.isWeekEnd = function() {
      var now = new Date();
      return now.getDay() == 0 || now.getDay() == 6;
    }

    that.getMin = function(dates) {
      if (dates == null || dates.length == 0)
        return null;

      return dates.sort(function(dA, dB) {
        dA.getTime() - dB.getTime()
      })[0];
    }

    that.create = function(time) {
      if (typeof(time) === 'string')
        time = parseInt(time);

      var d = new Date();
      d.setTime(time);
      return d;
    }

    that.readISO8601 = function(string) {
      if (string == null)
        return null;

      var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
      var d = string.match(new RegExp(regexp));

      var offset = 0;
      var date = new Date(d[1], 0, 1);

      if (d[3]) {
        date.setMonth(d[3] - 1);
      }
      if (d[5]) {
        date.setDate(d[5]);
      }
      if (d[7]) {
        date.setHours(d[7]);
      }
      if (d[8]) {
        date.setMinutes(d[8]);
      }
      if (d[10]) {
        date.setSeconds(d[10]);
      }
      if (d[12]) {
        date.setMilliseconds(Number("0." + d[12]) * 1000);
      }
      if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
      }

      offset -= date.getTimezoneOffset();

      var aDate = new Date();
      aDate.setTime(Number((Number(date) + (offset * 60 * 1000))));
      return aDate;
    }

    that.writeISO8601 = function(aDate, format, offset) {
      if (aDate == null)
        return null;
      /* accepted values for the format [1-6]:
       1 Year:
         YYYY (eg 1997)
       2 Year and month:
         YYYY-MM (eg 1997-07)
       3 Complete date:
         YYYY-MM-DD (eg 1997-07-16)
       4 Complete date plus hours and minutes:
         YYYY-MM-DDThh:mmTZD (eg 1997-07-16T19:20+01:00)
       5 Complete date plus hours, minutes and seconds:
         YYYY-MM-DDThh:mm:ssTZD (eg 1997-07-16T19:20:30+01:00)
       6 Complete date plus hours, minutes, seconds and a decimal
         fraction of a second
         YYYY-MM-DDThh:mm:ss.sTZD (eg 1997-07-16T19:20:30.45+01:00)
      */
      if (!format) {
        format = 6;
      }
      if (!offset) {
        var offset = 'Z';
        var date = aDate;
      } else {
        var d = offset.match(/([-+])([0-9]{2}):([0-9]{2})/);
        var offsetnum = (Number(d[2]) * 60) + Number(d[3]);
        offsetnum *= ((d[1] == '-') ? -1 : 1);
        var date = new Date(Number(Number(this) + (offsetnum * 60000)));
      }

      var zeropad = function(num) {
        return ((num < 10) ? '0' : '') + num;
      }

      var str = "";
      str += date.getUTCFullYear();
      if (format > 1) {
        str += "-" + zeropad(date.getUTCMonth() + 1);
      }
      if (format > 2) {
        str += "-" + zeropad(date.getUTCDate());
      }
      if (format > 3) {
        str += "T" + zeropad(date.getUTCHours()) +
          ":" + zeropad(date.getUTCMinutes());
      }
      if (format > 5) {
        var secs = Number(date.getUTCSeconds() + "." +
          ((date.getUTCMilliseconds() < 100) ? '0' : '') +
          zeropad(date.getUTCMilliseconds()));
        str += ":" + zeropad(secs);
      } else if (format > 4) {
        str += ":" + zeropad(date.getUTCSeconds());
      }

      if (format > 3) {
        str += offset;
      }
      return str;
    }


    that.readJSDate = function(str) {
      return new Date(Date.parse(str))
    }


    function startOfToday() {
      var sot = new Date();
      sot.setHours(0);
      sot.setMinutes(0);
      sot.setSeconds(0);
      sot.setMilliseconds(0);
      return sot;
    }

    that.isDateToday = function(aDate) {
      if (aDate == null)
        return false;

      var sod = startOfToday();
      var sot = new Date();
      sot.setTime(sod.getTime() + 1000 * 60 * 60 * 24);

      return aDate.getTime() > sod.getTime() && aDate.getTime() < sot.getTime();
    };

    that.isDateYesterday = function(aDate) {
      var sod = startOfToday();
      var soy = new Date();
      soy.setTime(sod.getTime() - 1000 * 60 * 60 * 24);

      return aDate > soy && aDate < sod;
    }

    that.isDateWithinWeek = function(aDate) {
      if (aDate == null)
        return false;

      var now = new Date();
      var ww = new Date();
      ww.setTime(now.getTime() - 1000 * 60 * 60 * 24 * 7);

      return aDate > ww && aDate < now;
    }

    /**
     * Returns the week number for this date. dowOffset is the day of week the week
     * "starts" on for your locale - it can be from 0 to 6. If dowOffset is 1 (Monday),
     * the week returned is the ISO 8601 week number.
     * @param int dowOffset
     * @return int
     */
    that.getWeek = function(aDate) {
      var dowOffset = 0; //default dowOffset to zero
      var newYear = new Date(aDate.getFullYear(), 0, 1);
      var day = newYear.getDay() - dowOffset; //the day of week the year begins on
      day = (day >= 0 ? day : day + 7);
      var daynum = Math.floor((aDate.getTime() - newYear.getTime() -
        (aDate.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) / 86400000) + 1;
      var weeknum;
      //if the year starts before the middle of a week
      if (day < 4) {
        weeknum = Math.floor((daynum + day - 1) / 7) + 1;
        if (weeknum > 52) {
          nYear = new Date(aDate.getFullYear() + 1, 0, 1);
          nday = nYear.getDay() - dowOffset;
          nday = nday >= 0 ? nday : nday + 7;

          // if the next year starts before the middle of
          // the week, it is week #1 of that year
          weeknum = nday < 4 ? 1 : 53;
        }
      } else {
        weeknum = Math.floor((daynum + day - 1) / 7);
      }
      return weeknum;
    };


    return that;

  }();


  // Copyright (c) 2010 Thomas Peri http://www.tumuski.com/
  utils.Math = function(options) {

    var that = {};

    that.bigInt2str = bigInt2str;
    that.str2bigInt = str2bigInt;
    that.bitSize = bitSize;
    that.sub = sub;

    ////////////////////////////////////////////////////////////////////////////////////////
    // Big Integer Library v. 5.0
    // Created 2000, last modified 2006
    // Leemon Baird
    // www.leemon.com
    //
    // This file is public domain.   You can use it for any purpose without restriction.
    // I do not guarantee that it is correct, so use it at your own risk.  If you use
    // it for something interesting, I'd appreciate hearing about it.  If you find
    // any bugs or make any improvements, I'd appreciate hearing about those too.
    // It would also be nice if my name and address were left in the comments.
    // But none of that is required.
    ////////////////////////////////////////////////////////////////////////////////////////

    //globals
    var bpe = 0; //bits stored per array element
    var mask = 0; //AND this with an array element to chop it down to bpe bits
    var radix = mask + 1; //equals 2^bpe.  A single 1 bit to the left of the last bit of mask.

    //the digits for converting to different bases
    var digitsStr = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_=!@#$%^&*()[]{}|;:,.<>/?`~ \\\'\"+-';

    //initialize the global variables
    for (bpe = 0;
      (1 << (bpe + 1)) > (1 << bpe); bpe++); //bpe=number of bits in the mantissa on this platform
    bpe >>= 1; //bpe=number of bits in one element of the array representing the bigInt
    mask = (1 << bpe) - 1; //AND the mask with an integer to get its bpe least significant bits
    radix = mask + 1; //2^bpe.  a single 1 bit to the left of the first bit of mask
    var one = int2bigInt(1, 1, 1); //constant used in powMod_()

    //the following global variables are scratchpad memory to
    //reduce dynamic memory allocation in the inner loop
    var t = new Array(0);
    var ss = t; //used in mult_()
    var s0 = t; //used in multMod_(), squareMod_()
    var s1 = t; //used in powMod_(), multMod_(), squareMod_()
    var s2 = t; //used in powMod_(), multMod_()
    var s3 = t; //used in powMod_()
    var s4 = t;
    var s5 = t; //used in mod_()
    var s6 = t; //used in bigInt2str()
    var s7 = t; //used in powMod_()
    var T = t; //used in GCD_()
    var sa = t; //used in mont_()
    var mr_x1 = t;
    var mr_r = t;
    var mr_a = t; //used in millerRabin()
    var eg_v = t;
    var eg_u = t;
    var eg_A = t;
    var eg_B = t;
    var eg_C = t;
    var eg_D = t; //used in eGCD_(), inverseMod_()
    var md_q1 = t;
    var md_q2 = t;
    var md_q3 = t;
    var md_r = t;
    var md_r1 = t;
    var md_r2 = t;
    var md_tt = t; //used in mod_()

    var primes = t;
    var pows = t;
    var s_i = t;
    var s_i2 = t;
    var s_R = t;
    var s_rm = t;
    var s_q = t;
    var s_n1 = t;
    var s_a = t;
    var s_r2 = t;
    var s_n = t;
    var s_b = t;
    var s_d = t;
    var s_x1 = t;
    var s_x2 = t;
    var s_aa = t;

    ////////////////////////////////////////////////////////////////////////////////////////

    //returns how many bits long the bigInt is, not counting leading zeros.
    function bitSize(x) {
      var j, z, w;
      for (j = x.length - 1;
        (x[j] == 0) && (j > 0); j--);
      for (z = 0, w = x[j]; w;
        (w >>= 1), z++);
      z += bpe * j;
      return z;
    }

    //return a copy of x with at least n elements, adding leading zeros if needed
    function expand(x, n) {
      var ans = int2bigInt(0, (x.length > n ? x.length : n) * bpe, 0);
      copy_(ans, x);
      return ans;
    }

    //return a new bigInt equal to (x mod n) for bigInts x and n.
    function mod(x, n) {
      var ans = dup(x);
      mod_(ans, n);
      return trim(ans, 1);
    }

    //return (x+n) where x is a bigInt and n is an integer.
    function addInt(x, n) {
      var ans = expand(x, x.length + 1);
      addInt_(ans, n);
      return trim(ans, 1);
    }

    //return x*y for bigInts x and y. This is faster when y<x.
    function mult(x, y) {
      var ans = expand(x, x.length + y.length);
      mult_(ans, y);
      return trim(ans, 1);
    }

    //return (x-y) for bigInts x and y.  Negative answers will be 2s complement
    function sub(x, y) {
      var ans = expand(x, (x.length > y.length ? x.length + 1 : y.length + 1));
      sub_(ans, y);
      return trim(ans, 1);
    }

    //return (x+y) for bigInts x and y.
    function add(x, y) {
      var ans = expand(x, (x.length > y.length ? x.length + 1 : y.length + 1));
      add_(ans, y);
      return trim(ans, 1);
    }

    //return (x**(-1) mod n) for bigInts x and n.  If no inverse exists, it returns null
    function inverseMod(x, n) {
      var ans = expand(x, n.length);
      var s;
      s = inverseMod_(ans, n);
      return s ? trim(ans, 1) : null;
    }

    //return (x*y mod n) for bigInts x,y,n.  For greater speed, let y<x.
    function multMod(x, y, n) {
      var ans = expand(x, n.length);
      multMod_(ans, y, n);
      return trim(ans, 1);
    }

    //is bigInt x negative?
    function negative(x) {
      return ((x[x.length - 1] >> (bpe - 1)) & 1);
    }

    //return x mod n for bigInt x and integer n.
    function modInt(x, n) {
      var i, c = 0;
      for (i = x.length - 1; i >= 0; i--)
        c = (c * radix + x[i]) % n;
      return c;
    }

    //convert the integer t into a bigInt with at least the given number of bits.
    //the returned array stores the bigInt in bpe-bit chunks, little endian (buff[0] is least significant word)
    //Pad the array with leading zeros so that it has at least minSize elements.
    //There will always be at least one leading 0 element.
    function int2bigInt(t, bits, minSize) {
      var i, k;
      k = Math.ceil(bits / bpe) + 1;
      k = minSize > k ? minSize : k;
      var buff = new Array(k);
      copyInt_(buff, t);
      return buff;
    }

    //return the bigInt given a string representation in a given base.
    //Pad the array with leading zeros so that it has at least minSize elements.
    //If base=-1, then it reads in a space-separated list of array elements in decimal.
    //The array will always have at least one leading zero, unless base=-1.
    function str2bigInt(s, base, minSize) {
      var d, i, j, x, y, kk;
      var k = s.length;
      if (base == -1) { //comma-separated list of array elements in decimal
        x = new Array(0);
        for (;;) {
          y = new Array(x.length + 1);
          for (i = 0; i < x.length; i++)
            y[i + 1] = x[i];
          y[0] = parseInt(s, 10);
          x = y;
          d = s.indexOf(',', 0);
          if (d < 1)
            break;
          s = s.substring(d + 1);
          if (s.length == 0)
            break;
        }
        if (x.length < minSize) {
          y = new Array(minSize);
          copy_(y, x);
          return y;
        }
        return x;
      }

      x = int2bigInt(0, base * k, 0);
      for (i = 0; i < k; i++) {
        d = digitsStr.indexOf(s.substring(i, i + 1), 0);
        if (base <= 36 && d >= 36) //convert lowercase to uppercase if base<=36
          d -= 26;
        if (d < base && d >= 0) { //ignore illegal characters
          multInt_(x, base);
          addInt_(x, d);
        }
      }

      for (k = x.length; k > 0 && !x[k - 1]; k--); //strip off leading zeros
      k = minSize > k + 1 ? minSize : k + 1;
      y = new Array(k);
      kk = k < x.length ? k : x.length;
      for (i = 0; i < kk; i++)
        y[i] = x[i];
      for (; i < k; i++)
        y[i] = 0;
      return y;
    }

    //is the bigInt x equal to zero?
    function isZero(x) {
      var i;
      for (i = 0; i < x.length; i++)
        if (x[i])
          return 0;
      return 1;
    }

    //convert a bigInt into a string in a given base, from base 2 up to base 95.
    //Base -1 prints the contents of the array representing the number.
    function bigInt2str(x, base) {
      var i, t, s = "";

      if (s6.length != x.length)
        s6 = dup(x);
      else
        copy_(s6, x);

      if (base == -1) { //return the list of array contents
        for (i = x.length - 1; i > 0; i--)
          s += x[i] + ',';
        s += x[0];
      } else { //return it in the given base
        while (!isZero(s6)) {
          t = divInt_(s6, base); //t=s6 % base; s6=floor(s6/base);
          s = digitsStr.substring(t, t + 1) + s;
        }
      }
      if (s.length == 0)
        s = "0";
      return s;
    }

    //returns a duplicate of bigInt x
    function dup(x) {
      var i;
      var buff = new Array(x.length);
      copy_(buff, x);
      return buff;
    }

    //do x=y on bigInts x and y.  x must be an array at least as big as y (not counting the leading zeros in y).
    function copy_(x, y) {
      var i;
      var k = x.length < y.length ? x.length : y.length;
      for (i = 0; i < k; i++)
        x[i] = y[i];
      for (i = k; i < x.length; i++)
        x[i] = 0;
    }

    //do x=y on bigInt x and integer y.
    function copyInt_(x, n) {
      var i, c;
      for (c = n, i = 0; i < x.length; i++) {
        x[i] = c & mask;
        c >>= bpe;
      }
    }

    //do x=x+n where x is a bigInt and n is an integer.
    //x must be large enough to hold the result.
    function addInt_(x, n) {
      var i, k, c, b;
      x[0] += n;
      k = x.length;
      c = 0;
      for (i = 0; i < k; i++) {
        c += x[i];
        b = 0;
        if (c < 0) {
          b = -(c >> bpe);
          c += b * radix;
        }
        x[i] = c & mask;
        c = (c >> bpe) - b;
        if (!c) return; //stop carrying as soon as the carry_ is zero
      }
    }

    //right shift bigInt x by n bits.  0 <= n < bpe.
    function rightShift_(x, n) {
      var i;
      var k = Math.floor(n / bpe);
      if (k) {
        for (i = 0; i < x.length - k; i++) //right shift x by k elements
          x[i] = x[i + k];
        for (; i < x.length; i++)
          x[i] = 0;
        n %= bpe;
      }
      for (i = 0; i < x.length - 1; i++) {
        x[i] = mask & ((x[i + 1] << (bpe - n)) | (x[i] >> n));
      }
      x[i] >>= n;
    }

    //do x=floor(|x|/2)*sgn(x) for bigInt x in 2's complement
    function halve_(x) {
      var i;
      for (i = 0; i < x.length - 1; i++) {
        x[i] = mask & ((x[i + 1] << (bpe - 1)) | (x[i] >> 1));
      }
      x[i] = (x[i] >> 1) | (x[i] & (radix >> 1)); //most significant bit stays the same
    }

    //left shift bigInt x by n bits.
    function leftShift_(x, n) {
      var i;
      var k = Math.floor(n / bpe);
      if (k) {
        for (i = x.length; i >= k; i--) //left shift x by k elements
          x[i] = x[i - k];
        for (; i >= 0; i--)
          x[i] = 0;
        n %= bpe;
      }
      if (!n)
        return;
      for (i = x.length - 1; i > 0; i--) {
        x[i] = mask & ((x[i] << n) | (x[i - 1] >> (bpe - n)));
      }
      x[i] = mask & (x[i] << n);
    }

    //do x=x*n where x is a bigInt and n is an integer.
    //x must be large enough to hold the result.
    function multInt_(x, n) {
      var i, k, c, b;
      if (!n)
        return;
      k = x.length;
      c = 0;
      for (i = 0; i < k; i++) {
        c += x[i] * n;
        b = 0;
        if (c < 0) {
          b = -(c >> bpe);
          c += b * radix;
        }
        x[i] = c & mask;
        c = (c >> bpe) - b;
      }
    }

    //do x=floor(x/n) for bigInt x and integer n, and return the remainder
    function divInt_(x, n) {
      var i, r = 0,
        s;
      for (i = x.length - 1; i >= 0; i--) {
        s = r * radix + x[i];
        x[i] = Math.floor(s / n);
        r = s % n;
      }
      return r;
    }

    //do the linear combination x=a*x+b*y for bigInts x and y, and integers a and b.
    //x must be large enough to hold the answer.
    function linComb_(x, y, a, b) {
      var i, c, k, kk;
      k = x.length < y.length ? x.length : y.length;
      kk = x.length;
      for (c = 0, i = 0; i < k; i++) {
        c += a * x[i] + b * y[i];
        x[i] = c & mask;
        c >>= bpe;
      }
      for (i = k; i < kk; i++) {
        c += a * x[i];
        x[i] = c & mask;
        c >>= bpe;
      }
    }

    //do the linear combination x=a*x+b*(y<<(ys*bpe)) for bigInts x and y, and integers a, b and ys.
    //x must be large enough to hold the answer.
    function linCombShift_(x, y, b, ys) {
      var i, c, k, kk;
      k = x.length < ys + y.length ? x.length : ys + y.length;
      kk = x.length;
      for (c = 0, i = ys; i < k; i++) {
        c += x[i] + b * y[i - ys];
        x[i] = c & mask;
        c >>= bpe;
      }
      for (i = k; c && i < kk; i++) {
        c += x[i];
        x[i] = c & mask;
        c >>= bpe;
      }
    }


    //do x=x-y for bigInts x and y.
    //x must be large enough to hold the answer.
    //negative answers will be 2s complement
    function sub_(x, y) {
      var i, c, k, kk;
      k = x.length < y.length ? x.length : y.length;
      for (c = 0, i = 0; i < k; i++) {
        c += x[i] - y[i];
        x[i] = c & mask;
        c >>= bpe;
      }
      for (i = k; c && i < x.length; i++) {
        c += x[i];
        x[i] = c & mask;
        c >>= bpe;
      }
    }

    //do x=x+y for bigInts x and y.
    //x must be large enough to hold the answer.
    function add_(x, y) {
      var i, c, k, kk;
      k = x.length < y.length ? x.length : y.length;
      for (c = 0, i = 0; i < k; i++) {
        c += x[i] + y[i];
        x[i] = c & mask;
        c >>= bpe;
      }
      for (i = k; c && i < x.length; i++) {
        c += x[i];
        x[i] = c & mask;
        c >>= bpe;
      }
    }

    //do x=x*y for bigInts x and y.  This is faster when y<x.
    function mult_(x, y) {
      var i;
      if (ss.length != 2 * x.length)
        ss = new Array(2 * x.length);
      copyInt_(ss, 0);
      for (i = 0; i < y.length; i++)
        if (y[i])
          linCombShift_(ss, x, y[i], i); //ss=1*ss+y[i]*(x<<(i*bpe))
      copy_(x, ss);
    }

    //do x=x mod n for bigInts x and n.
    function mod_(x, n) {
      if (s4.length != x.length)
        s4 = dup(x);
      else
        copy_(s4, x);
      if (s5.length != x.length)
        s5 = dup(x);
      divide_(s4, n, s5, x); //x = remainder of s4 / n
    }

    //do x=x*y mod n for bigInts x,y,n.
    //for greater speed, let y<x.
    function multMod_(x, y, n) {
      var i;
      if (s0.length != 2 * x.length)
        s0 = new Array(2 * x.length);
      copyInt_(s0, 0);
      for (i = 0; i < y.length; i++)
        if (y[i])
          linCombShift_(s0, x, y[i], i); //s0=1*s0+y[i]*(x<<(i*bpe))
      mod_(s0, n);
      copy_(x, s0);
    }

    //do x=x*x mod n for bigInts x,n.
    function squareMod_(x, n) {
      var i, j, d, c, kx, kn, k;
      for (kx = x.length; kx > 0 && !x[kx - 1]; kx--); //ignore leading zeros in x
      k = kx > n.length ? 2 * kx : 2 * n.length; //k=# elements in the product, which is twice the elements in the larger of x and n
      if (s0.length != k)
        s0 = new Array(k);
      copyInt_(s0, 0);
      for (i = 0; i < kx; i++) {
        c = s0[2 * i] + x[i] * x[i];
        s0[2 * i] = c & mask;
        c >>= bpe;
        for (j = i + 1; j < kx; j++) {
          c = s0[i + j] + 2 * x[i] * x[j] + c;
          s0[i + j] = (c & mask);
          c >>= bpe;
        }
        s0[i + kx] = c;
      }
      mod_(s0, n);
      copy_(x, s0);
    }

    //return x with exactly k leading zero elements
    function trim(x, k) {
      var i, y;
      for (i = x.length; i > 0 && !x[i - 1]; i--);
      y = new Array(i + k);
      copy_(y, x);
      return y;
    }

    return that;
  }();
})();

;

// From: lib/utils.js
"use strict";

(function() {
  var utils = devhd.pkg("utils");

  utils.Customization = {
    FRANCE24: "FRANCE24",
    VIP: "FEEDLY_MIX"
  };

  utils.WebUtils = function() {
    var that = {};

    that.decodeVariable = function(encodedJSVariable) {
      var json = "{ content: " + encodedJSVariable + "}";
      return devhd.utils.JSONUtils.decode(json).content;
    };

    that.getFavIconURL = function(url) {
      if (url == null)
        return "https://www.google.com/s2/favicons?domain=google.com";

      if (url.indexOf("twitter.com") > -1)
        return "http://twitter.com/favicon.ico"

      return "https://www.google.com/s2/favicons?domain=" + url.split("/").slice(2, 3) + "&alt=feed";
    };

    var RE_IP = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/;

    that.computeDomainKey = function(url) {
      if (url == null)
        return null;

      url = url.toLowerCase();

      if (url.indexOf("http://") != 0)
        return null;

      for (var i = 0; i < UNINTERESTINGS.length; i++)
        if (url.indexOf(UNINTERESTINGS[i]) > -1)
          return null;

      var domain = url.split("/").slice(2, 3).join("/");

      // we are not interested in urls which have a port number
      if (domain.indexOf(":") > -1)
        return null;

      // we are not interested in URLs which have a numeric IP address
      if (domain.match(RE_IP))
        return null;

      return "http://" + domain;
    };

    var UNINTERESTINGS = ["facebook.",
      "twitter.",
      "amazon.",
      "mail",
      "mahalo.",
      "about.",
      "alltop.",
      "twitpic.",
      "youtube.",
      "dailymotion.",
      "yfrog.",
      "ff.im",
      "pix.im",
      "ping.fm",
      "twitgoo.",
      ".wikipedia.",
      "extratorrent.com",
      ".netvibes",
      ".freshwap",
      "/wordoftheday/",
      "feedburner",
      "tumblr",
      "wordpress",
      "instapaper",
      ".google.",
      ".yahoo.",
      ".flickr.",
      "dribbble"
    ];

    that.isUnInteresting = function(aSeed) {
      if (aSeed.website != null) {
        for (var i = 0; i < UNINTERESTINGS.length; i++) {
          if (aSeed.website.indexOf(UNINTERESTINGS[i]) > -1)
            return true;
        }
      }

      if (aSeed.id != null) {
        for (var i = 0; i < UNINTERESTINGS.length; i++) {
          if (aSeed.id.indexOf(UNINTERESTINGS[i]) > -1)
            return true;
        }
      }

      return false;
    };

    return that;
  }();

  utils.BrowserUtils = function() {
    var that = {};

    that.isSafari = function() {
      return typeof navigator != "undefined" && navigator.userAgent.indexOf("Apple") > -1 && navigator.userAgent.indexOf("Chrome") == -1;
    };

    that.isChrome = function() {
      return typeof navigator != "undefined" && navigator.userAgent.indexOf("Chrome") > -1;
    };

    that.isWebKit = function() {
      return typeof navigator != "undefined" && navigator.userAgent.indexOf("AppleWebKit") > -1;
    };

    that.isFirefox = function() {
      return typeof navigator != "undefined" && navigator.userAgent.indexOf("Firefox") > -1;
    };

    that.isIE = function() {
      return typeof navigator != "undefined" && navigator.userAgent.indexOf("MSIE") > -1;
    };

    that.isMac = function() {
      return typeof navigator != "undefined" && navigator.userAgent.indexOf("Mac") > -1;
    };

    that.isWindows = function() {
      return typeof navigator != "undefined" && navigator.userAgent.indexOf("Windows") > -1;
    };

    that.isIOS = function() {
      return (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
    }

    that.isKindle = function() {
      return (navigator.userAgent.match(/(Kindle|Silk)/g) ? true : false);
    }

    that.isAndroid = function() {
      return (navigator.userAgent.match(/Android/g) ? true : false);
    }

    that.isAppAvailable = function() {
      return (that.isIOS() && devhd.utils.HTMLUtils.getClientWidth(document) < 768)
              || that.isAndroid()
              || that.isKindle();
    }

    that.getLocale = function() {
      if (typeof navigator == "undefined") {
        var l = devhd.utils.FirefoxUtils.getGeneralPreference("general.useragent.locale");

        if (l == null || l.indexOf("chrome") > -1 || l.length > 5)
          l = "en-US";

        if (l == "fr-FR")
          l = "fr";

        return l;
      } else {
        return navigator.language ? navigator.language : navigator.userLanguage || "en-US";
      }
    };

    that.getLanguage = function() {
      var locale = that.getLocale();

      if (locale == null)
        return "??";

      if (locale.indexOf("-") > -1)
        return locale.split("-")[0];
      else
        return locale;
    };

    that.getFeedlyPath = function() {
      try {
        var parts = window.location.pathname.split("/").slice(1);

        switch (parts[0]) {
          // Default URL
          case "":
            return "";

            // App URLS
          case "a":
          case "d":
          case "i":
          case "b":
          case "beta":
            return decodeURIComponent(parts.slice(1).join("/")) + window.location.search + window.location.hash;

            // Profile URLS
          default:
            return "library/" + decodeURIComponent(parts.join("/"));
        }
      } catch (e) {
        $feedly("[utils] failed to get hash");
        return null;
      }
    };

    that.getFeedlyPathPrefix = function() {
      try {
        var parts = window.location.pathname.split("/").slice(1);

        switch (parts[0]) {
          // Default URL
          case "":
            return "i";

            // App URLS
          case "d":
            return "d";

          case "a":
            return "a";

          case "i":
            return "i";

          case "b":
            return "b";

          case "beta":
            return "beta";

            // Profile URLS
          default:
            return "i";
        }
      } catch (e) {
        $feedly("[utils] failed to get path prefix:" + e.name + " -- " + e.message);
        return "i";
      }
    };

    that.setFeedlyPath = function(path, title) {
      try {
        var fullURL;

        if (path.indexOf("library/") == 0) {
          var alias = path.slice("library/".length);
          fullURL = window.location.protocol + "//" + window.location.host + "/" + alias;
        } else {
          fullURL = window.location.protocol + "//" + window.location.host + "/" + that.getFeedlyPathPrefix() + "/" + encodePath(path);
        }

        if (fullURL != window.location.href)
          history.pushState({}, "", fullURL);
      } catch (e) {
        $feedly("[utils] failed to push state:" + e.name + " -- " + e.message);
      }
    };

    that.replaceFeedlyPath = function(path, title) {
      try {
        var fullURL;

        if (path.indexOf("library/") == 0) {
          var alias = path.slice("library/".length);
          fullURL = window.location.protocol + "//" + window.location.host + "/" + alias;
        } else {
          fullURL = window.location.protocol + "//" + window.location.host + "/" + that.getFeedlyPathPrefix() + "/" + encodePath(path);
        }

        if (fullURL != window.location.href)
          history.replaceState({}, title || "", fullURL);
      } catch (e) {
        $feedly("[utils] failed to push state:" + e.name + " -- " + e.message);
      }
    };

    function encodePath(uri) {
      return uri.replace("#", "%23", "gi");
    }

    function decodeHash(uri) {
      return uri.replace("%23", "#", "gi");
    }

    return that;
  }();

  utils.RecoUtils = function() {
    var that = {};

    that.bestAge = function() {
      // Apply freshness criteria to scores
      var hh = new Date().getHours()
      if (devhd.utils.DateUtils.isWeekEnd() == true)
      // BEST OF THE DAY
        return devhd.utils.DurationUtils.DAYS(7);
      else if (hh > 6 && hh < 18)
      // EARLY MORNING
        return devhd.utils.DurationUtils.HOURS(12);
      else
      // REST OF THE DAY
        return devhd.utils.DurationUtils.HOURS(36);
    };

    that.bestFavoriteAge = function() {
      // Apply freshness criteria to scores
      var hh = new Date().getHours()
      if (devhd.utils.DateUtils.isWeekEnd() == true)
      // BEST OF THE DAY
        return devhd.utils.DurationUtils.DAYS(7);
      else
        return devhd.utils.DurationUtils.HOURS(60);
    };


    that.bestMixAge = function() {
      // Apply freshness criteria to scores
      var hh = new Date().getHours()
      if (devhd.utils.DateUtils.isWeekEnd() == true)
      // BEST OF THE DAY
        return devhd.utils.DurationUtils.DAYS(7);
      else
      // REST OF THE DAY
        return devhd.utils.DurationUtils.HOURS(48);
    };

    return that;
  }();


  utils.CompareUtils = function() {
    var that = {};

    that.compareTopEntries = function(entryA, entryB) {
      // TODO ONCE ORGANIZED HAS BEEN IMPLEMENTED
    };

    that.compareEntriesByDate = function(eA, eB) {
      return eB.crawledTime - eA.crawledTime;
    };

    that.compareEntriesByQuicklistedAndDate = function(eA, eB) {
      var qA = eA.isQuicklisted();
      var qB = eB.isQuicklisted();

      if (qB && !qA)
        return -1;
      if (qA && !qB)
        return 1;

      return eB.crawledTime - eA.crawledTime;
    };

    that.compareEntriesByPopularity = function(eA, eB) {
      if (eB.popularity != eA.popularity)
        return eB.popularity - eA.popularity;
      else
        return that.compareEntriesByDate(eA, eB);
    };

    that.compareStringProperty = function(propName, objA, objB) {
      return new String(objA[propName] || "").localeCompare(new String(objB[propName] || ""));
    };

    that.compareIds = function(catA, catB) {
      return that.compareStringProperty("id", objA, objB);
    };

    that.compareTitles = function(objA, objB) {
      return that.compareStringProperty("title", objA, objB);
    };

    that.compareLabels = function(objA, objB) {
      return that.compareStringProperty("label", objA, objB);
    };

    return that;
  }();

  utils.FeedIdUtils = function() {
    var that = {};

    that.create = function(strFeedId) {
      var rep = strFeedId.replace('"', "%22", "gi")

      // for http feeds, replace space with %20. not needed for user/label feeds
      if (rep.indexOf("http") > -1)
        rep = rep.replace(' ', "%20", "gi");

      return rep;
    }

    /**
     * @param {String} feedId
     * @return "label" | "recommendation" | "feed"
     */
    that.resolveType = function(feedId) {
      if (feedId.indexOf("user/") == 0 && feedId.indexOf("/category/") > -1)
        return "category";

      if (feedId.indexOf("user/") == 0 && feedId.indexOf("/tag/") > -1)
        return "tag";

      return "feed";
    };

    return that;
  }();


  ////////////////////////////////////////////
  // Clipboard Utils                        //
  ////////////////////////////////////////////
  utils.ClipboardUtils = {};
  utils.ClipboardUtils.setData = function(data, home) {
    try {
      // maak een interface naar het clipboard
      var clip = Components.classes['@mozilla.org/widget/clipboard;1']
        .createInstance(Components.interfaces.nsIClipboard);
      if (!clip) return;

      // maak een transferable
      var trans = Components.classes['@mozilla.org/widget/transferable;1']
        .createInstance(Components.interfaces.nsITransferable);
      trans.init(null);

      // specificeer wat voor soort data we op willen halen; text in dit geval
      trans.addDataFlavor('text/unicode');

      // om de data uit de transferable te halen hebben we 2 nieuwe objecten nodig   om het in op te slaan
      var str = new Object();
      var len = new Object();

      var str = Components.classes["@mozilla.org/supports-string;1"]
        .createInstance(Components.interfaces.nsISupportsString);

      var copytext = data;

      str.data = copytext;

      trans.setTransferData("text/unicode", str, copytext.length * 2);

      var clipid = Components.interfaces.nsIClipboard;

      clip.setData(trans, null, clipid.kGlobalClipboard);

      return true;
    } catch (e) {
      return false;
    }
  }

  ////////////////////////////////////////////
  // Clipboard Utils                        //
  ////////////////////////////////////////////
  utils.PositionUtils = {

    /**
     * From jquery, optimized for FF; may not work on "other" browsers
     */
    offset: function(n) {
      if (!n) {
        return {
          top: 0,
          left: 0
        };
      }
      var box = n.getBoundingClientRect(),
        doc = n.ownerDocument,
        body = doc.body,
        docElem = doc.documentElement,
        clientTop = docElem.clientTop || body.clientTop || 0,
        clientLeft = docElem.clientLeft || body.clientLeft || 0,
        top = box.top + (doc.defaultView.pageYOffset) - clientTop,
        left = box.left + (doc.defaultView.pageXOffset) - clientLeft;
      return {
        top: top,
        left: left
      };
    },

    // set to true if needed, warning: firefox performance problems
    // NOT neeeded for page scrolling, only if draggable contained in
    // scrollable elements
    includeScrollOffsets: false,

    // must be called before calling withinIncludingScrolloffset, every time the
    // page is scrolled
    prepare: function() {
      this.deltaX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
      this.deltaY = window.pageYOffset || window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    },

    realOffset: function(element) {
      var valueT = 0,
        valueL = 0;
      do {
        valueT += element.scrollTop || 0;
        valueL += element.scrollLeft || 0;
        element = element.parentNode;
      } while (element && element.tagName != "HTML");
      return [valueL, valueT];
    },

    cumulativeOffset: function(element) {
      var valueT = 0,
        valueL = 0;
      do {
        valueT += element.offsetTop || 0;
        valueL += element.offsetLeft || 0;
        element = element.offsetParent;
      } while (element && element.tagName != "HTML");
      return [valueL, valueT];
    },

    positionedOffset: function(element) {
      var valueT = 0,
        valueL = 0;
      do {
        valueT += element.offsetTop || 0;
        valueL += element.offsetLeft || 0;
        element = element.offsetParent;
        if (element) {
          if (element.tagName == 'BODY') break;
          var p = element.style.position;
          if (p == 'relative' || p == 'absolute') break;
        }
      } while (element);
      return [valueL, valueT];
    },

    offsetParent: function(element) {
      if (element.offsetParent) return element.offsetParent;
      if (element == document.body) return element;

      while ((element = element.parentNode) && element != document.body)
        if (Element.getStyle(element, 'position') != 'static')
          return element;

      return document.body;
    },

    // caches x/y coordinate pair to use with overlap
    within: function(element, x, y) {
      if (this.includeScrollOffsets)
        return this.withinIncludingScrolloffsets(element, x, y);
      this.xcomp = x;
      this.ycomp = y;
      this.offset = this.cumulativeOffset(element);

      return (y >= this.offset[1] &&
        y < this.offset[1] + element.offsetHeight &&
        x >= this.offset[0] &&
        x < this.offset[0] + element.offsetWidth);
    },

    withinIncludingScrolloffsets: function(element, x, y) {
      var offsetcache = this.realOffset(element);

      this.xcomp = x + offsetcache[0] - this.deltaX;
      this.ycomp = y + offsetcache[1] - this.deltaY;
      this.offset = this.cumulativeOffset(element);

      return (this.ycomp >= this.offset[1] &&
        this.ycomp < this.offset[1] + element.offsetHeight &&
        this.xcomp >= this.offset[0] &&
        this.xcomp < this.offset[0] + element.offsetWidth);
    },

    // within must be called directly before
    overlap: function(mode, element) {
      if (!mode) return 0;
      if (mode == 'vertical')
        return ((this.offset[1] + element.offsetHeight) - this.ycomp) /
          element.offsetHeight;
      if (mode == 'horizontal')
        return ((this.offset[0] + element.offsetWidth) - this.xcomp) /
          element.offsetWidth;
      return 0
    },

    page: function(forElement) {
      var valueT = 0,
        valueL = 0;

      var element = forElement;
      do {
        valueT += element.offsetTop || 0;
        valueL += element.offsetLeft || 0;

        // Safari fix
        if (element.offsetParent == document.body)
          if (Element.getStyle(element, 'position') == 'absolute') break;

      } while (element = element.offsetParent);

      element = forElement;
      do {
        if (true || element.tagName == 'BODY') {
          valueT -= element.scrollTop || 0;
          valueL -= element.scrollLeft || 0;
        }
      } while (element = element.parentNode);

      return [valueL, valueT];
    },

    clone: function(source, target) {
      var options = Object.extend({
        setLeft: true,
        setTop: true,
        setWidth: true,
        setHeight: true,
        offsetTop: 0,
        offsetLeft: 0
      }, arguments[2] || {})

      // find page position of source
      source = $elem(source);
      var p = devhd.utils.PositionUtils.page(source);

      // find coordinate system to use
      target = $elem(target);
      var delta = [0, 0];
      var parent = null;
      // delta [0,0] will do fine with position: fixed elements,
      // position:absolute needs offsetParent deltas
      if (Element.getStyle(target, 'position') == 'absolute') {
        parent = devhd.utils.PositionUtils.offsetParent(target);
        delta = devhd.utils.PositionUtils.page(parent);
      }

      // correct by body offsets (fixes Safari)
      if (parent == document.body) {
        delta[0] -= document.body.offsetLeft;
        delta[1] -= document.body.offsetTop;
      }

      // set position
      if (options.setLeft) target.style.left = (p[0] - delta[0] + options.offsetLeft) + 'px';
      if (options.setTop) target.style.top = (p[1] - delta[1] + options.offsetTop) + 'px';
      if (options.setWidth) target.style.width = source.offsetWidth + 'px';
      if (options.setHeight) target.style.height = source.offsetHeight + 'px';
    },

    absolutize: function(element) {
      element = $elem(element);
      if (element.style.position == 'absolute') return;
      devhd.utils.PositionUtils.prepare();

      var offsets = devhd.utils.PositionUtils.positionedOffset(element);
      var top = offsets[1];
      var left = offsets[0];
      var width = element.clientWidth;
      var height = element.clientHeight;

      element._originalLeft = left - parseFloat(element.style.left || 0);
      element._originalTop = top - parseFloat(element.style.top || 0);
      element._originalWidth = element.style.width;
      element._originalHeight = element.style.height;

      element.style.position = 'absolute';
      element.style.top = top + 'px';
      element.style.left = left + 'px';
      element.style.width = width + 'px';
      element.style.height = height + 'px';
    },

    relativize: function(element) {
      element = $elem(element);
      if (element.style.position == 'relative') return;
      devhd.utils.PositionUtils.prepare();

      element.style.position = 'relative';
      var top = parseFloat(element.style.top || 0) - (element._originalTop || 0);
      var left = parseFloat(element.style.left || 0) - (element._originalLeft || 0);

      element.style.top = top + 'px';
      element.style.left = left + 'px';
      element.style.height = element._originalHeight;
      element.style.width = element._originalWidth;
    }
  }

  ////////////////////////////////////////////
  // CSS Utils                              //
  ////////////////////////////////////////////
  utils.CSSUtils = function() {
    var that = {};

    that.lookupStyleClass = function(doc, className) {
      return that.lookupStyle("." + className)
    }

    that.lookupStyle = function(doc, selector) {
      try {
        for (var s = 0; s < doc.styleSheets.length; s++) {
          var cls = s.rules || s.cssRules;
          if (cls) {
            for (var r = 0; r < cls.length; r++) {
              if (cls[r].selectorText == selector) {
                return cls[r];
              }
            }
          }
        }
      } catch (e) {
        $feedly("[feedly] failed to look up class:" + selector + " because " + e.name + " -- " + e.message);
      }
    };

    that.addStylesheetRules = function(rules) {
      var styleEl = document.createElement('style'),
        styleSheet;

      // Apparently some version of Safari needs the following line? I dunno.
      styleEl.appendChild(document.createTextNode(''));

      // Append style element to head
      document.head.appendChild(styleEl);

      // Grab style sheet
      styleSheet = styleEl.sheet;

      for (var i = 0, rl = rules.length; i < rl; i++) {
        var j = 1,
          rule = rules[i],
          selector = rules[i][0],
          propStr = '';
        // If the second argument of a rule is an array of arrays, correct our variables.
        if (Object.prototype.toString.call(rule[1][0]) === '[object Array]') {
          rule = rule[1];
          j = 0;
        }

        for (var pl = rule.length; j < pl; j++) {
          var prop = rule[j];
          propStr += prop[0] + ':' + prop[1] + (prop[2] ? ' !important' : '') + ';\n';
        }

        // Insert CSS Rule
        styleSheet.insertRule(selector + '{' + propStr + '}', styleSheet.cssRules.length);
      }
    };

    that.computedStyle = function(element, property) {
      try {
        return window.getComputedStyle(element, null).getPropertyValue(property);
      } catch (e) {
        $feedly("[utils] failed to get computed style for " + property);
        return null;
      }
    }

    return that;
  }();


  ////////////////////////////////////////////
  // DOM Utils                              //
  ////////////////////////////////////////////
  utils.DOMUtils = function() {
    var that = {}

    var k, nsMapR = {},
      nsMap = {
        "html": "http://www.w3.org/1999/xhtml",
        "atom": "http://www.w3.org/2005/Atom",
        "gr": "http://www.google.com/schemas/reader/atom/",
        "media": "http://video.yahoo.com/mrss",
        "content": "http://purl.org/rss/1.0/modules/content/",
        "dc": "http://purl.org/dc/elements/1.1/",
        "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        "rss10": "http://purl.org/rss/1.0/",
        "ev": "http://purl.org/rss/1.0/modules/event/",
        "taxo": "http://purl.org/rss/1.0/modules/taxonomy/",
        "syn": "http://purl.org/rss/1.0/modules/syndication/"
      }

    for (k in nsMap) {
      nsMapR[nsMap[k]] = k
    }

    function nsResolver(prefix) {
      return nsMap[prefix]
    }

    function ns2prefix(ns) {
      return nsMapR[ns]
    }

    that.ns2prefix = ns2prefix
    that.prefix2ns = nsResolver

    that.extractNodeValue = function(domElem, xpath, defaultValue) {
      try {
        var subNode = null;
        if (xpath == null)
          subNode = domElem;
        else
          subNode = that.selectSingleNode(domElem, xpath);

        if (subNode == null)
          return defaultValue;
        else
          return subNode.nodeValue;
      } catch (e) {
        return defaultValue;
      }
    };

    that.extractTextValue = function(domElem, xpath, defaultValue) {
      try {
        if (xpath == null)
          xpath = "text()";
        else
          xpath = xpath + "/text()";

        var nodes = that.selectNodes(domElem, xpath);
        if (nodes == null || nodes.length == 0)
          return defaultValue;
        else {
          var text = "";
          for (var i = 0; i < nodes.length; i++) {
            text += nodes[i].nodeValue;
          }
          return text;
        }
      } catch (e) {
        return defaultValue;
      }
    };

    that.selectNodes = function(domElem, xpath) {
      var aItems = domElem.ownerDocument.evaluate(xpath,
        domElem,
        nsResolver,
        7, /* DOM_ORDERED_NODE_SNAPSHOT_TYPE */
        null);

      var aResult = [];
      for (var i = 0; i < aItems.snapshotLength; i++) {
        aResult[i] = aItems.snapshotItem(i);
      }
      return aResult;
    }

    that.selectSingleNode = function(domElem, xpath) {
      return that.selectNodes(domElem, xpath)[0];
    }

    var domParser = null
    that.parseFromString = function(str, mimeType) {
      if (typeof DOMParser == "undefined") {
        if (!domParser)
          domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
          .createInstance(Components.interfaces.nsIDOMParser)

        var dom = domParser.parseFromString(str, mimeType)

        var top = dom.documentElement;

        if (top.tagName == "parserError" || top.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml")
          throw that.extractTextValue(top, null, "parser error"); //non-i18n

        return dom
      } else {
        var parser = new DOMParser();
        var dom = parser.parseFromString(str, "text/xml");
        var top = dom.documentElement;

        if (top.tagName == "parserError")
          throw that.extractTextValue(top, null, "parser error"); // non-i18n

        return dom
      }
    }

    var serializer = null;
    that.toXmlSource = function(node) {
      if (!serializer == null) {
        serializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Components.interfaces.nsIDOMSerializer)
      }
      return serializer.serializeToString(node)
    }


    return that;
  }();

  ////////////////////////////////////////////
  // File Utils                             //
  ////////////////////////////////////////////
  utils.FileUtils = function() {
    var that = {};

    that.getFileContent = function(location) {
      var file = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath(location);

      var fis = Components.classes["@mozilla.org/network/file-input-stream;1"]
        .createInstance(Components.interfaces.nsIFileInputStream);

      fis.init(file, -1, 0, 0);

      var charset = /* Need to find out what the character encoding is. Using UTF-8 for this example: */ "UTF-8";
      var replacementChar = Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER;
      var is = Components.classes["@mozilla.org/intl/converter-input-stream;1"]
        .createInstance(Components.interfaces.nsIConverterInputStream);

      is.init(fis, charset, 1024, replacementChar);

      var data = "";
      var str = {};
      while (is.readString(4096, str) != 0) {
        data += str.value;
      }
      is.close();
      fis.close();

      return data
    }
    return that;
  }();


  utils.OPMLUtils = function() {
    var that = {};

    that.processFile = function(location) {
      var opmlContent = devhd.utils.FileUtils.getFileContent(location);

      if (opmlContent == null || opmlContent.length == 0)
        throw "could not read the content of file: " + location; // non-i18n

      var opmlElem = devhd.utils.DOMUtils.parseFromString(opmlContent, "application/xml")
      if (opmlElem == null)
        throw "could not parse the content of file: " + location; // non-i18n

      return that.processOPML(opmlElem.documentElement);
    }


    /**
     * converts an OPML DOM element into an array of feed information.
     */
    that.processOPML = function(opmlElem) {
      var feeds = [];

      var feedIndex = {};

      // find all rss nodes
      var rssNodes = devhd.utils.DOMUtils.selectNodes(opmlElem, "//outline[@xmlUrl]");

      for (var i = 0; i < rssNodes.length; i++) {
        var outlineElem = rssNodes[i];

        var id, recommendation;

        var feedURL = devhd.utils.DOMUtils.extractNodeValue(outlineElem, "@xmlUrl");
        if (feedURL == null)
          continue;

        if (feedURL.indexOf("http://www.google.com/reader/public/atom/") == 0) {
          recommendation = true;
          id = feedURL.slice("http://www.google.com/reader/public/atom/".length);
        } else {
          recommendation = false;
          id = "feed/" + feedURL;
        }

        var htmlURL = devhd.utils.DOMUtils.extractNodeValue(outlineElem, "@htmlUrl");
        var view = devhd.utils.DOMUtils.extractNodeValue(outlineElem, "@view");
        if (view != null) {
          view = Math.floor(view * 1);
        } else {
          view = 4;
        }

        var title = devhd.utils.DOMUtils.extractNodeValue(outlineElem, "@title");
        if (title == null)
          title = devhd.utils.DOMUtils.extractNodeValue(outlineElem, "@text");

        var favorite = devhd.utils.DOMUtils.extractNodeValue(outlineElem, "@favorite");
        if (favorite == null) {
          favorite = false
        } else {
          favorite = favorite.toLowerCase()
          favorite = (favorite == "true" || favorite == "1" || favorite == "yes")
        }

        var tags = devhd.utils.DOMUtils.extractNodeValue(outlineElem, "@tags");
        if (tags != null) {
          tags = devhd.utils.JSONUtils.decode(tags);
        } else {
          tags = [];
        }

        // is there a parent element with a text attribute?
        var categories = [];
        var category = devhd.utils.DOMUtils.extractNodeValue(outlineElem, "parent::outline/@text");
        if (category != null) {
          categories.push(category);
        }

        // has this feed already been defined?
        if (feedIndex[id] == null) {
          var fi = {
            id: id,
            URL: feedURL,
            website: htmlURL,
            title: title,
            categories: categories,
            tags: tags,
            labels: tags,
            view: view,
            favorite: favorite,
            recommendation: recommendation
          };

          feeds.push(fi);
          feedIndex[id] = fi;
        }
      }

      return feeds;
    }

    return that;
  }();


  utils.GmailUtils = function() {
    var that = {};

    that.extractMyEmail = function(json) {
      var i = json.indexOf("&&&START&&&"),
        i2 = json.lastIndexOf("&&&END&&&")
      var msg, myEmail, result

      if (i < 0 || i2 < 0) {
        return null
      }

      result = devhd.utils.JSONUtils.decode(json.substring(i + "&&&START&&&".length, i2))
      if (!result) {
        return null
      }

      if (!result.Success || !result.Body || result.Body.UserData == null) {
        return null;
      }

      return result.Body.UserData.Email;
    }

    return that;
  }();

  utils.YahooMailUtils = function() {
    var that = {};

    that.extractMyUserId = function(json) {
      var i = json.indexOf("&&&START&&&"),
        i2 = json.lastIndexOf("&&&END&&&")
      var msg, myEmail, result

      if (i < 0 || i2 < 0) {
        return null
      }

      result = devhd.utils.JSONUtils.decode(json.substring(i + "&&&START&&&".length, i2))
      if (!result) {
        return null
      }

      if (!result.Success || !result.Body || result.Body.UserData == null) {
        return null;
      }

      return result.Body.UserData.Email;
    }

    return that;
  }();


  utils.ContextStackUtils = function() {
    var that = {};

    that.find = function(stack, propName) {
      if (stack == null || stack.length == 0)
        return null;

      for (var i = 0; i < stack.length; i++)
        if (stack[i][propName] != null)
          return stack[i][propName];

      return null;
    }

    that.findContext = function(stack, propName) {
      if (stack == null || stack.length == 0)
        return null;

      for (var i = 0; i < stack.length; i++)
        if (stack[i][propName] != null)
          return stack[i];

      return null;
    }

    that.top = function(stack, propName) {
      if (stack == null || stack.length == 0)
        return null;
      else
        return stack[0][propName];
    }

    that.areContextsEqual = function(c1, c2) {
      if (c1 == null && c2 == null)
        return true;
      if ((c1 == null && c2 != null) || (c1 != null && c2 == null))
        return false;

      return c1.uri == c2.uri && c1.pageNumber == c2.pageNumber && c1.searchTerm == c2.searchTerm;
    }

    that.dump = function(stack) {
      if (stack == null || stack.length == 0)
        $feedly("[context stack dump] empty");

      for (var i = 0; i < stack.length; i++) {
        $feedly("[context stack dump]  --------------- <LEVEL " + i + " > -------------");
        for (var propName in stack[i]) {
          $feedly("[context stack dump]" + propName + "=" + (stack[i][propName] == null ? "null" : stack[i][propName]));
        }
        $feedly("[context stack dump]  --------------- </LEVEL " + i + " > -------------");
      }
    }


    return that;
  }();

  utils.ActivityUtils = function() {
    var that = {};

    that.countAnnotations = function(activity, annotationKind) {
      if (activity.annotations == null || activity.annotations.length == 0)
        return 0

      var c = 0;
      for (var i = 0; i < activity.annotations.length; i++)
        if (activity.annotations[i].kind == annotationKind)
          c++

          return c;
    }

    return that;
  }();


  utils.EntryListUtils = function() {
    var that = {};

    that.merge = function(list1, list2) {
      var merged = [];
      var index = {};

      for (var i = 0; i < list1.length; i++) {
        if (index[list1[i].getId()] == null) {
          merged.push(list1[i].getId());
          index[list1[i].getId()] = true;
        }
      }

      for (var i = 0; i < list2.length; i++) {
        if (index[list2[i].getId()] == null) {
          merged.push(list2[i].getId());
          index[list2[i].getId()] = true;
        }
      }

      return merged;
    }

    that.suggestFeeds = function(list) {
      var feedIndex = {};
      var feedList = [];
      for (var i = 0; i < list.length; i++) {
        var anEntry = list[i];

        var feedId = anEntry.getFeedId();

        if (feedIndex[feedId] == null) {
          var aFeedInfo = {
            id: feedId,
            title: anEntry.getSourceTitle(),
            score: 0,
            website: anEntry.getSourceAlternateLink()
          };

          feedIndex[feedId] = aFeedInfo
          feedList.push(aFeedInfo);
        }
        feedIndex[feedId].score++;
      }

      return feedList;
    }

    return that;
  }();


  utils.EntryIdListUtils = function() {
    var that = {};

    that.merge = function(list1, list2) {
      var merged = [];
      var index = {};

      for (var i = 0; i < list1.length; i++) {
        if (index[list1[i]] == null) {
          merged.push(list1[i]);
          index[list1[i]] = true;
        }
      }

      for (var i = 0; i < list2.length; i++) {
        if (index[list2[i]] == null) {
          merged.push(list2[i]);
          index[list2[i]] = true;
        }
      }

      return merged;
    }

    return that;
  }();


  utils.LeakUtils = function() {
    var that = {};

    that.inflate = function(obj, mb) {
      var T12800 = "0123456789aaaaaaaaaa0123456789aaaaaaaaaa0123456789aaaaaaaaaa0123456789aaaaaaaaaa0123456789aaaaaaaaaa"
      for (var i = 0; i < 7; i++)
        T12800 += T12800;

      var a = [];
      for (var i = 0; i < mb * 1024 * 1024 / 12800; i++)
        a.push(T12800);

      obj.big = a.join()

      $feedly("[memory][test][inflate][id:=" + (obj.id != null ? obj.id : "?") + "]" + obj.big.length / 1024 / 1024 + " MB");
    }

    that.mapSize = function(aMap) {
      var count = 0;
      for (var k in aMap)
        if (aMap[k] != null)
          count++

          return count;
    }

    return that;
  }();


  // Simple client cache routines

  utils.Cache = function() {

    var that = {}

    // The LRU cache allows a cache of fixed size where least used keys get pushed out of the
    // cache as it fills out.
    that.LRU = function(size) {
      this.size = size || 16
      this.hash = {}
      this.list = []
    }

    function promote(a, o) {
      var e, idx = a.indexOf(o)
      if (idx >= 0) a.splice(idx, 1)
      a.push(o)
      while (a.length > this.size) {
        delete this.hash[a.pop().key]
      }
    }

    that.LRU.prototype = {
      get: function(key) {
        var obj = this.hash[key]
        if (obj) promote(this.list, obj)
        return obj.value
      },
      put: function(key, value) {
        promote(this.list, (this.hash[key] = {
          key: key,
          value: value
        }))
      },
      clear: function() {
        this.hash = {}
        this.list = []
      }
    }

    // Timed cache expires item on get automatically afer maxTime (in ms) has passed
    // on get() the cost is the overhead of a call to new Date().getTime()
    that.Timed = function(maxTime) {
      this.maxTime = maxTime || 1 * 60 * 1000 // 1 minute default
      this.hash = {}
    }

    that.Timed.prototype = {
      get: function(key) {
        var obj = this.hash[key]
        if (obj) {
          if (obj.deadline < new Date().getTime()) {
            return delete this.hash[key], null
          }
          return obj.value
        }
        return null
      },
      put: function(key, value) {
        this.hash[key] = {
          deadline: new Date().getTime() + this.maxTime,
          value: value
        }
      },
      clear: function() {
        this.hash = {}
      }
    }

    return that
  }()

  utils.MemeUtils = function() {
    var that = {};

    that.determineBonds = function(m1, m2) {
      var entryTable = {};
      populateEntryTable(entryTable, m1);
      populateEntryTable(entryTable, m2);

      var bonds = []
      for (var k in entryTable)
        if (entryTable[k].count == 2)
          bonds.push(entryTable[k]);

      return bonds
    }

    function populateEntryTable(entryTable, meme) {
      for (var i = 0; i < meme.references.length; i++) {
        var entryId = meme.references[i].entryId;
        if (entryTable[entryId] == null)
          entryTable[entryId] = {
            entryId: entryId,
            feedId: meme.references[i].feedId,
            count: 0
          };

        entryTable[entryId].count++;
      }
    }

    that.cloneMeme = function(meme) {
      var c = {};
      for (var k in meme)
        c[k] = meme[k];
      return c;
    }

    that.getOldestHeadlineReference = function(meme) {
      var oldest = null;
      for (var i = 0; i < meme.references.length; i++) {
        if (oldest != null && (meme.references[i].headline == false || oldest.lastModified > meme.references[i].lastModified))
          continue;

        oldest = meme.references[i];
      }
      return oldest;
    }

    that.isMoreRecentThan = function(meme, deltaT) {
      var oldest = devhd.utils.MemeUtils.getOldestHeadlineReference(meme);

      if (oldest == null)
        return false;

      return new Date().getTime() - oldest.lastModified < deltaT;
    }


    return that;
  }();


  utils.FirefoxUtils = function() {
    var that = {};

    // innerHTML + control injection
    that.getPreference = function(prefName) {
      try {
        // Get the "extensions.feedly." branch
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefBranch);

        return prefs.getCharPref("extensions.feedly." + prefName);
      } catch (e) {
        return null;
      }
    }

    that.getGeneralPreference = function(prefName) {
      try {
        // Get the "extensions.feedly." branch
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefBranch);

        return prefs.getCharPref(prefName);
      } catch (e) {
        return null;
      }
    }

    that.getGeneralPreferenceAsBoolean = function(prefName) {
      try {
        // Get the "extensions.feedly." branch
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefBranch);

        return prefs.getBoolPref(prefName);
      } catch (e) {
        return null;
      }
    }


    // innerHTML + control injection
    that.setPreference = function(prefName, prefValue) {
      // Get the "extensions.feedly." branch
      var prefs = Components.classes["@mozilla.org/preferences-service;1"].
      getService(Components.interfaces.nsIPrefBranch);

      return prefs.setCharPref("extensions.feedly." + prefName, prefValue);
    }


    return that;
  }();

  utils.FeedlyUtils = function() {
    var that = {};

    that.homeURL = "//feedly.com/";

    return that;
  }();


  utils.FriendfeedUtils = function() {
    var that = {};

    that.filter = function(conversations, query) {
      var now = new Date().getTime();
      for (var i = 0; i < conversations.length; i++) {
        var aConversation = conversations[i];

        if (query.comments != null && aConversation.comments.length < query.comments)
          continue;

        if (query.likes != null && aConversation.likes.length < query.likes)
          continue;

        var age = now - devhd.utils.DateUtils.readISO8601(aConversation.updated).getTime();
        if (query.maxAge != null && age > query.maxAge)
          continue;

        return conversations[i];
      }

      return null;
    };

    return that;
  }();

  utils.FacebookUtils = function() {
    var that = {};

    that.askShare = function(url) {
      var pWindow = window.open("http://www.facebook.com/sharer.php?src=bm&v=4&i=1235087326&u=" + encodeURIComponent(url),
        "_blank",
        "toolbar=0,status=0,resizable=1,width=626,height=436"
      );
      if (pWindow == null)
        return false;
      else
        return true;
    };

    return that;
  }();

  utils.UTF8Utils = function() {
    var that = {};

    // public method for url encoding
    that.encode = function(s) {
      return unescape(encodeURIComponent(s || ""));
    }
    return that;
  }();

  utils.AdultUtils = function() {
    var that = {};

    that.TAGS = [
      "sex", "porn", "adult", "erotic", "date", "dating", "gay"
    ];

    // public method for url encoding
    that.isAdultMaterial = function(sig) {
      var lsig = sig.toLowerCase();

      for (var i = 0; i < that.TAGS.length; i++)
        if (lsig.indexOf(that.TAGS[i]) != -1)
          return true;

      return false;
    }
    return that;
  }();


  utils.MD5Utils = function() {
    var that = {};

    that.hex_md5 = hex_md5;
    that.b64_md5 = b64_md5;
    that.str_md5 = str_md5;
    that.hex_hmac_md5 = hex_hmac_md5;
    that.b64_hmac_md5 = b64_hmac_md5;
    that.str_hmac_md5 = str_hmac_md5;

    /*
     * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
     * Digest Algorithm, as defined in RFC 1321.
     * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
     * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
     * Distributed under the BSD License
     * See http://pajhome.org.uk/crypt/md5 for more info.
     */

    /*
     * Configurable variables. You may need to tweak these to be compatible with
     * the server-side, but the defaults work in most cases.
     */
    var hexcase = 0; /* hex output format. 0 - lowercase; 1 - uppercase        */
    var b64pad = ""; /* base-64 pad character. "=" for strict RFC compliance   */
    var chrsz = 8; /* bits per input character. 8 - ASCII; 16 - Unicode      */

    /*
     * These are the functions you'll usually want to call
     * They take string arguments and return either hex or base-64 encoded strings
     */
    function hex_md5(s) {
      return binl2hex(core_md5(str2binl(s), s.length * chrsz));
    }

    function b64_md5(s) {
      return binl2b64(core_md5(str2binl(s), s.length * chrsz));
    }

    function str_md5(s) {
      return binl2str(core_md5(str2binl(s), s.length * chrsz));
    }

    function hex_hmac_md5(key, data) {
      return binl2hex(core_hmac_md5(key, data));
    }

    function b64_hmac_md5(key, data) {
      return binl2b64(core_hmac_md5(key, data));
    }

    function str_hmac_md5(key, data) {
      return binl2str(core_hmac_md5(key, data));
    }

    /*
     * Perform a simple self-test to see if the VM is working
     */
    function md5_vm_test() {
      return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72";
    }

    /*
     * Calculate the MD5 of an array of little-endian words, and a bit length
     */
    function core_md5(x, len) {
      /* append padding */
      x[len >> 5] |= 0x80 << ((len) % 32);
      x[(((len + 64) >>> 9) << 4) + 14] = len;

      var a = 1732584193;
      var b = -271733879;
      var c = -1732584194;
      var d = 271733878;

      for (var i = 0; i < x.length; i += 16) {
        var olda = a;
        var oldb = b;
        var oldc = c;
        var oldd = d;

        a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
        d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
        b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

        a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
        a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

        a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
        d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
        c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

        a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
        d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

        a = safe_add(a, olda);
        b = safe_add(b, oldb);
        c = safe_add(c, oldc);
        d = safe_add(d, oldd);
      }
      return Array(a, b, c, d);

    }

    /*
     * These functions implement the four basic operations the algorithm uses.
     */
    function md5_cmn(q, a, b, x, s, t) {
      return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
    }

    function md5_ff(a, b, c, d, x, s, t) {
      return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    function md5_gg(a, b, c, d, x, s, t) {
      return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    function md5_hh(a, b, c, d, x, s, t) {
      return md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }

    function md5_ii(a, b, c, d, x, s, t) {
      return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    /*
     * Calculate the HMAC-MD5, of a key and some data
     */
    function core_hmac_md5(key, data) {
      var bkey = str2binl(key);
      if (bkey.length > 16) bkey = core_md5(bkey, key.length * chrsz);

      var ipad = Array(16),
        opad = Array(16);
      for (var i = 0; i < 16; i++) {
        ipad[i] = bkey[i] ^ 0x36363636;
        opad[i] = bkey[i] ^ 0x5C5C5C5C;
      }

      var hash = core_md5(ipad.concat(str2binl(data)), 512 + data.length * chrsz);
      return core_md5(opad.concat(hash), 512 + 128);
    }

    /*
     * Add integers, wrapping at 2^32. This uses 16-bit operations internally
     * to work around bugs in some JS interpreters.
     */
    function safe_add(x, y) {
      var lsw = (x & 0xFFFF) + (y & 0xFFFF);
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xFFFF);
    }

    /*
     * Bitwise rotate a 32-bit number to the left.
     */
    function bit_rol(num, cnt) {
      return (num << cnt) | (num >>> (32 - cnt));
    }

    /*
     * Convert a string to an array of little-endian words
     * If chrsz is ASCII, characters >255 have their hi-byte silently ignored.
     */
    function str2binl(str) {
      var bin = Array();
      var mask = (1 << chrsz) - 1;
      for (var i = 0; i < str.length * chrsz; i += chrsz)
        bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (i % 32);
      return bin;
    }

    /*
     * Convert an array of little-endian words to a string
     */
    function binl2str(bin) {
      var str = "";
      var mask = (1 << chrsz) - 1;
      for (var i = 0; i < bin.length * 32; i += chrsz)
        str += String.fromCharCode((bin[i >> 5] >>> (i % 32)) & mask);
      return str;
    }

    /*
     * Convert an array of little-endian words to a hex string.
     */
    function binl2hex(binarray) {
      var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
      var str = "";
      for (var i = 0; i < binarray.length * 4; i++) {
        str += hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) +
          hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF);
      }
      return str;
    }

    /*
     * Convert an array of little-endian words to a base-64 string
     */
    function binl2b64(binarray) {
      var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      var str = "";
      for (var i = 0; i < binarray.length * 4; i += 3) {
        var triplet = (((binarray[i >> 2] >> 8 * (i % 4)) & 0xFF) << 16) | (((binarray[i + 1 >> 2] >> 8 * ((i + 1) % 4)) & 0xFF) << 8) | ((binarray[i + 2 >> 2] >> 8 * ((i + 2) % 4)) & 0xFF);
        for (var j = 0; j < 4; j++) {
          if (i * 8 + j * 6 > binarray.length * 32) str += b64pad;
          else str += tab.charAt((triplet >> 6 * (3 - j)) & 0x3F);
        }
      }
      return str;
    }

    return that;
  }()

  utils.SubscriptionUtils = function() {
    var that = {};

    that.toJSON = function(aSub) {
      return {
        __typeInfo: aSub instanceof devhd.cloud.Subscription ? "devhd.cloud.Subscription" : "devhd.model.Subscription",
        id: aSub.id,
        userId: aSub.userId,
        title: aSub.title,
        sortid: aSub.sortid,
        categories: aSub.categories,
        updated: aSub.updated,
        source: aSub.source,
        unreadCount: aSub.unreadCount,
        website: aSub.website,
        htmlUrl: aSub.website,
        navigation: aSub.navigation,
        u: aSub.u,
        maxLikes: aSub.maxLikes,
        mediumLikes: aSub.mediumLikes,
        averageLikes: aSub.averageLikes,
        subscribers: aSub.subscribers,
        velocity: aSub.velocity,
        error: null
      }
    }

    that.fromJSON = function(subInfo) {
      if (subInfo.__typeInfo == "devhd.cloud.Subscription") {
        return new devhd.cloud.Subscription(subInfo);
      } else {
        return new devhd.model.Subscription(subInfo);
      }
    }

    return that;
  }()

  utils.EntryUtils = function() {
    var that = {};

    that.removeUnnecessaryImages = function(aURL, paramName) {
      if (paramName == null)
        return null;
      paramName = paramName.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
      var regexS = "[\\?&]" + paramName + "=([^&#]*)";
      var regex = new RegExp(regexS);
      var results = regex.exec(aURL);
      if (results == null)
        return null;
      else
        return decodeURIComponent(results[1]);
    }

    that.suggestType = function(list) {
      if (list == null || list.length == 0)
        return 4;

      // based on the feedId
      var feedId = list[0].getFeedId();
      if (feedId.indexOf("flickr") > -1 || feedId.indexOf("smugmug") > -1 || feedId.indexOf("etsy.") > -1 || feedId.indexOf("pinterest.") > -1) {
        return 6
      }

      // based on the content of the feed
      if (fitsImageGrid(list) || fitsVideoGrid(list))
        return 6
      else
        return 4
    }

    function fitsVideoGrid(list) {
      for (var i = 0; i < list.length; i++) {
        var entry = list[i];
        if (!entry.embedsVideo())
          return false;
      }
      return true;
    }

    function fitsImageGrid(list) {
      for (var i = 0; i < list.length; i++) {
        var entry = list[i];

        var video = entry.embedsVideo();
        var visual = entry.fits("UC");
        var age = (new Date().getTime() - entry.crawledTime) / 3600 / 1000;
        var brief = (entry.getCleanSafeSummary() || "").length < 300;

        if (!brief || !visual)
          return false;
      }
      return true;
    }

    that.isMarkedAsRead = function(jsonInfo, userId) {
      var categoriesElems = jsonInfo.categories;

      for (var i = 0; i < categoriesElems.length; i++) {
        var categoryTerm = jsonInfo.categories[i];
        if (categoryTerm == "user/" + userId + "/tag/global.read")
          return true;
      }
      return false;
    }

    that.toJSON = function(anEntry) {
      return {
        __typeInfo: anEntry instanceof devhd.cloud.JSONEntry ? "devhd.cloud.JSONEntry" : "devhd.atom.JSONEntry",
        jsonInfo: anEntry.jsonInfo,
        userId: anEntry.userId,
        channel: anEntry.channel,
        metadata: anEntry.metadata,
        feedCategoryLabels: anEntry.feedCategoryLabels
      }
    }

    that.fromJSON = function(json) {
      if (json.__typeInfo == "devhd.cloud.JSONEntry") {
        return new devhd.cloud.JSONEntry(json.jsonInfo, json.userId, json.channel, json.metadata);
      } else {
        return new devhd.atom.JSONEntry(json.jsonInfo, json.userId, json.channel, json.metadata, json.feedCategoryLabels);
      }
    }

    return that;
  }();


  utils.RecommendationsUtils = function() {
    var that = {};


    function copyAndFillPhotoURL(map) {
      var m = {};
      for (var k in map)
        m[k] = map[k];

      if (m.photoURL == null || m.photoURL == "")
        m.photoURL = devhd.s3("images/profile0.jpg");

      return m;
    }

    /**
     * Select the best photo to represent = function picture, annotation, first to annotate
     * @param {Array} network
     */
    that.selectRecommender = function(network) {
      if (network == null || network.length == 0)
        return null;

      // search for first annotator
      for (var i = 0; i < network.length; i++) {
        if (network[i].annotated == true)
          return copyAndFillPhotoURL(network[i]);
      }

      // search for first picture
      for (var i = 0; i < network.length; i++) {
        if (network[i].photoURL != null && network[i].photoURL != "")
          return copyAndFillPhotoURL(network[i]);
      }

      // search for first picture
      return copyAndFillPhotoURL(network[0]);
    }

    that.countRecommenders = function(network) {
      if (network == null)
        return 0;

      var count = 0;
      for (var i = 0; i < network.length; i++) {
        if (network[i].me == true)
          continue;

        if (devhd.utils.StringUtils.trim(network[i].name) == "")
          continue;

        count++
      }
      return count;
    }

    that.join = function(network, prop, sep) {
      if (network == null)
        return null;

      if (prop == null)
        prop = "name";

      if (sep == null)
        sep = ", ";

      var joined = "";
      // search for first annotator
      for (var i = 0; i < network.length; i++) {
        joined += network[i][prop];

        if (i < network.length - 1)
          joined += sep;
      }

      return joined;
    }


    return that;
  }();

})();

;

// From: lib/fn.js
"use strict";

/**
 * @author merlin
 *
 * Simple client cache routines
 */

(function() {

  var _fn = devhd.pkg("fn")

  /**
   * A callback invocation function. The function itself returns true if a callback
   * has been successfully issued and false otherwise. A callback is the object
   * specified by the first argument (o). How the callback happens, depends on
   * what o really is.
   * 1) If o is a function object, then it is called with the arguments passed (a1,..,a8)
   *    and with the "this" pointer unset (just parameters are passed).
   * 2) If o is hash object (not a function) and it has a property $fn and it is a function
   *    then that function is called with arguments (a1,...,a8) as before but also the
   *    hash is set as the "this" pointer for that function invocation.
   * 3) As in (2), but $fn is an array of functions to be called. In that case, each
   *    function is called one by one in the order that they appear in the array
   *    with the "this" pointer being set to the hash object o passed to devhd.fn.callback
   * 4) If there is a $this property in the object "o", then it is used as the "this" pointer
   *
   *
   * @param {Object} o   the object (function or hash, as explained below)
   */

  _fn.callback = function(o, restOfArgs) {
    var args = [],
      i;
    for (i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    return _fn.callbackApply(o, args);
  };

  _fn.callbackApply = function(o, args) {

    // Edwin K. July 30th, 2009. Enhancing the callback pattern to make sure
    // that client exceptions are trapped and do not bubble up in the code
    // of issuing the callback
    try {
      var self = null;
      if (typeof(o) == "function") {
        return o.apply({}, args);
      }
      // make sure not null and $fn
      if (o) {
        self = (o.$this || o);
        if (typeof(o.$fn) == "function") {
          return o.$fn.apply(self, args);
        }
        if (o.$fn.length > 0) {
          for (var i = 0; i < o.$fn.length; i++) {
            o.$fn[i].apply(self, args);
          }
          return true;
        }
      }
      return false;
    } catch (e) {
      try {
        try {
          console.log(e)
          $feedly("[fn] callback failed because " + e.name + " -- " + e.message + " -- " + o.toString());
        } catch (ignore) {

        }

        $feedly(devhd.utils.ExceptionUtils.formatError("callback", e));
      } catch (ignore) {
        console.log(e)
        $feedly("[fn] callback failed because " + e.name + " -- " + e.message);
      }

      return false;
    }
  };

  _fn.isCallack = function(o) {
    if (o) {
      return typeof(o) == "function" || o.$fn;
    }
    return false;
  };

})();

;

// From: lib/forms.js
"use strict";


/**
 * @author merlin
 *
 * Simple client cache routines
 */

(function() {

  var _forms = devhd.pkg("forms")
  var NL = "\r\n"

  _forms.boundary = function() {
    return "---------------------------" + new Date().getTime().toString(36)
  }

  _forms.multiPartForm = function(formData, boundary) {
    var a = []
    for (var k in formData) {
      a.push("--")
      a.push(boundary)
      a.push(NL)
      a.push("Content-Disposition: form-data; name=\"")
      a.push(k)
      a.push("\"")
      a.push(NL)
      a.push(NL)
      a.push(formData[k])
      a.push(NL)
    }
    a.push("--")
    a.push(boundary)
    a.push("--")
    a.push(NL)
    return a.join("")
  }

  _forms.webForm = function(formData) {
    var a = []
    for (var k in formData) {
      a.push(k)
      a.push("=")
      a.push(encodeURIComponent(formData[k]))
      a.push("&")
    }
    a.pop() // last &
    return a.join("")
  }

})();

;

// From: lib/basics.js
"use strict";

/**
 * @author merlin
 *
 * Simple client cache routines
 */

(function() {

  var cache = devhd.pkg("cache")

  var LOG = devhd.log.get("basics");

  // The LRU cache allows a cache of fixed size where least used keys get pushed out of the
  // cache as it fills out.
  cache.LRU = function(size) {
    this.size = size || 16
    this.hash = {}
    this.list = []
  }

  function promote(a, o) {
    var e, idx = a.indexOf(o)
    if (idx >= 0) a.splice(idx, 1)
    a.push(o)
    while (a.length > this.size) {
      delete this.hash[a.pop().key]
    }
  }

  cache.LRU.prototype = {
    get: function(key) {
      var obj = this.hash[key]
      if (obj) {
        promote(this.list, obj)
        return obj.value
      }
      return null
    },
    put: function(key, value) {
      promote(this.list, (this.hash[key] = {
        key: key,
        value: value
      }))
    },
    clear: function() {
      this.hash = {}
      this.list = []
    }
  }

  // Timed cache expires item on get automatically afer maxTime (in ms) has passed
  // on get() the cost is the overhead of a call to new Date().getTime()
  cache.Timed = function(maxTime) {
    this.maxTime = maxTime || 1 * 60 * 1000 // 1 minute default
    this.hash = {}
  }

  cache.Timed.prototype = {
    get: function(key) {
      var obj = this.hash[key]
      if (obj) {
        if (obj.deadline < new Date().getTime()) {
          delete this.hash[key];
          return null;
        }
        return obj.value
      }
      return null
    },
    put: function(key, value) {
      this.hash[key] = {
        deadline: new Date().getTime() + this.maxTime,
        value: value
      }
    },
    remove: function(key) {
      delete this.hash[key];
    },
    clear: function() {
      this.hash = {}
    }
  }

  var key = 0

  function nextKey() {
    return (key++).toString(36)
  }

  // Basic hash with checkin/checkout
  cache.Hash = function() {
    this.hash = {}
  }

  cache.Hash.prototype = {
    get: function(key) {
      var value = this.hash[key]
      return value
    },
    put: function(key, value) {
      this.hash[key] = value
    },
    remove: function(key) {
      return this.co(key)
    },
    ci: function(value) {
      var k = nextKey()
      this.put(k, value)
      return k
    },
    co: function(k) {
      var value = this.hash[k];
      delete this.hash[k];
      return value
    },
    clear: function() {
      this.hash = {}
    },
    size: function() {
      var k, s = 0
      for (k in this.hash) {
        s += 1
      }
      return s
    },
    keys: function() {
      var a = [],
        k
      for (k in this.hash) {
        a.push(k)
      }
      return a
    },
    isEmpty: function() {
      for (var k in this.hash) {
        return false
      }
      return true
    },
    values: function() {
      var a = [],
        k
      for (k in this.hash) {
        a.push(this.hash[k])
      }
      return a
    }
  }


  cache.ROT = new cache.Hash()

  /** Injection related code */
  var _inject = devhd.pkg("inject")

  var _injectBadArgument = "$$$ not set in hash; wrong or currupt argument";

  function _injectMark(ctx, ref, how) {
    var k, id, o = ctx.$$$
    if (how) {
      o = ctx.$$$ = {}
    } else {
      devhd.assert(o, _injectBadArgument)
    }
    for (k in ref) {
      if (k.indexOf("set") == 0 && k.length > 3 && typeof ref[k] == "function") {
        // setFooBar --> fooBar;  3 is uppercased, and we continue from 4
        id = k.charAt(3).toLowerCase() + k.substr(4)
        if (o[id]) {
          delete o[id]
        } else {
          o[id] = id
        }
      }
    }

    return ctx
  }

  /**
   * Mark the beginning of the injection passing a reference to the object
   * that should be introspected. Here we mark the state of the obejct so far.
   *
   * @param {Object} ref
   */
  _inject.start = function(ref) {
    return _injectMark({}, ref, 1)
  }

  /** Mark the end of the injection passing a reference to the object to be studied.
   * Here we compute the actual property set that is injectable from the perspective of the
   * object (only in that objects prototype object).
   *
   * @param {Object} ctx the context object, returned fromt he call above
   * @param {Object} ref the reference to the object to introspect.
   */

  _inject.end = function(ctx, ref) {
    return _injectMark(ctx, ref, 0)
  }

  /**
   * Assert that all properties are set.
   *
   * @param {Object} ctx the context object, which may be the hash holding properties as well.
   * @param {Object} self the actual object to check, omitted if all is stored in ctx above.
   */

  _inject.assert = function(ctx, self) {
    var k, o = ctx.$$$
    devhd.assert(o, _injectBadArgument)
    for (k in o) {
      devhd.assert((self || ctx)[k], "property '" + k + "' not set after injection")
    }
  }

  /**
   * Clear all the references to the properties held. Auto clean up essentially ....
   *
   * @param {Object} ctx the context object itself (which has the name properties)
   * @param {Object} self if not null, self is used as the target object to clean.
   */

  _inject.clear = function(ctx, self) {
    var k, o = ctx.$$$
    devhd.assert(o, _injectBadArgument)
    for (k in o) {
      delete(self || ctx)[o]
    }
  }

  // subscription/feed/http://feeds.feedburner.com/DilbertDailyStrip]
  //   should parse: { uri: "subscription", key: "feed/http://feeds.feedburner.com/DilbertDailyStrip", p: 0 }
  // format is:
  //   uri/key[arg.value&arg2.value2+
  // where values for key, and values of argument may be uri encoded.

  var _uri = devhd.pkg("uri")

  _uri.parseHash = function(s) {
    var opt = {
        p: 0,
        parameters: {},
        key: null,
        type: null,
        uri: null
      };

    if (s == null)
      return opt;

    var parts = s.split("/");

    if (parts.length > 0)
      opt.type = parts[0];

    if (parts.length > 1)
      opt.key = parts.slice(1).join("/");

    opt.uri = s;
    
    return opt;
  };

  var _id = devhd.pkg("id");
  var ids = [];
  _id.next = function(n, f) {
    var id = (ids[n] = (ids[n] || 0) + 1);
    return (f ? n + id : id);
  }

  /** start at mmid */
  var mmid = new Date().getTime()
  var idpfx = Math.floor(Math.random() * 1000000000).toString(36)

  /**
   * Return a monotonically increasing id prefixed by a random
   */
  _id.id = function() {
    return idpfx + (mmid++).toString(36)
  }

  var _random = devhd.pkg("random")
    /**
     * Compute a random interval from low to high.
     * @param {Object} l low in seconds
     * @param {Object} h high in seconds
     */
  _random.timeoutMS = function(l, h) {
    var l0 = Math.min(l, h) * 1000,
      h0 = Math.max(l, h) * 1000
    return l0 + Math.round(Math.random() * (h0 - l0))
  }

  //+ Jonas Raoni Soares Silva
  //@ http://jsfromhell.com/array/shuffle [v1.0]
  _random.shuffle = function(o) {
    for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  }

  var _xml = devhd.pkg("xml")

  function node2json(node, jsObject) {
    var i, j, a, jsObj = jsObject || {}
    if (!node || !node.attributes) {
      return jsObj
    }
    for (i = 0, j = node.attributes.length; i < j; i++) {
      a = node.attributes.item(i)
      jsObj[a.nodeName] = a.nodeValue
    }
    return jsObj
  }
  /**
   * Create a json object from the xml element, which
   * in this case includes just the attributes of the XML element.
   *
   * @param {Object} node
   */
  _xml.node2json = node2json


  function node2text(node) {
    if (node.nodeType == 1) {
      return node.textContent
    }
    return node.nodeValue
  }
  /**
   * Return the node text value
   * @param {Object} n
   */
  _xml.node2text = node2text


  function keyFromElement(n) {
    return n.localName
  }

  /**
   * Create a json object from the element. Ctx is the reference to an
   * appropriate "this". This is a simple driver function which creates a JSON
   * structure with appropriate JS classes based on an map passed.
   *
   * @param {Object} ctx
   * @param {Object} map
   * @param {Object} elm
   * @param {Object} keyfn
   */
  function element2json(ctx, map, elm, keyfn) {
    // attribtues
    ctx.attr = node2json(elm)

    keyfn = keyfn || keyFromElement
      // elements
    var n, info, key, a, prop, val
    for (n = elm.firstChild; n; n = n.nextSibling) {
      if (n.nodeType != 1) {
        continue
      }
      key = keyfn(n)
      info = map[key]
      if (!info) {
        continue
      }
      prop = info.k || key

      // initialize new slot
      if (!ctx[prop]) {
        ctx[prop] = info.a ? [] : null
      }
      // if array, push the new value
      val = info.f ? info.f(n) : new info.c(n)
      val = info.x ? info.x(val) : val
      if (info.a) {
        ctx[prop].push(val)
      } else {
        ctx[prop] = val
      }
    }
  }
  _xml.element2json = element2json


  var _events = devhd.pkg("events")

  _events.cancelEvent = function(e) {
    if (e == null)
      return false;

    e.cancelBubble = true;

    if (e.stopPropagation) {
      e.stopPropagation()
      e.preventDefault()
    }
    return false;
  }

  _events.preventDefault = function(e) {
    if (e == null)
      return false;

    if (e.preventDefault) {
      e.preventDefault()
    }
    return false
  }
})();

;

// From: lib/features.js
"use strict";

/**
 * @author merlin

 * Repeatable code section called "features" that can be easily bound to various objects
 * that want to exhibit the same "feature". These can be bound to "services" (as instance type of properties)
 * or "prototype" type objects.
 *
 * For example, consider "bind", and "unbinAll".
 *
 * This is common in the "control" world, the "page" world, and the "service" world.
 *
 * features do not assume that they are interfaces.
 *
 * They are functions which get re-assigned to the objects using devhd.addFeature(). For example:
 *    devhd.addFeature (aService, dev.features.bind )
 * will add the feature found in devhd.features.bind
 *
 * The advantage is that when features are really well defined, then can only be defined in one place.
 *
 * Why ? Because I hate to write the same code twice.
 *
 *
 */

(function() {

  var proto = devhd.pkg("features")

  var bind = proto.bind = {}

  /**
   * Bind behaviors or events to the element passed. All events or behaviors that were bound
   * are saved and later freed during page destroy.
   *
   * @param {Object} element - can be element or string (will lookup via .element())
   * @param {Object} event   - can be event name (string) or a behavior object.
   * @param {Object} handler - a handler (not needed when binding behaviors).
   */

  bind.bind = function(element, event, handler, capture) {
    var that = this,
      listener;

    if (this.bindings == null)
      this.bindings = [];

    if (typeof element == "string")
      element = this.element(element);

    if (element == null)
      return

    if (typeof event == "string") {
      // create listener
      listener = function(event) {
        return handler.call(that, event);
      };
      this.bindings.push({
        element: element,
        event: event,
        listener: listener
      });
      devhd.utils.HTMLUtils.addEventListener(element, event, listener, capture === true);
    } else {
      devhd.bindml.bind(element, event, this.home);
      this.bindings.push({
        element: element,
        behavior: event
      });
    }

    if (this.home != null)
      this.home.track(element, event);
  };


  bind.unbind = function(element, event) {
    if (element == null)
      return true;

    if (this.bindings == null)
      this.bindings = [];

    var len = this.bindings.length

    for (var i = 0; i < this.bindings.length; i++) {
      var aBinding = this.bindings[i];
      if (aBinding.element != element) {
        continue
      }
      // same element
      if (aBinding.event == event) {
        devhd.utils.HTMLUtils.removeEventListener(aBinding.element, aBinding.event, aBinding.listener, false);
        aBinding.element = null;
        aBinding.listener = null;
        this.bindings.splice(i, 1);

        if (this.home != null)
          this.home.untrack(element, event);

      } else if (aBinding.behavior == event) {
        devhd.bindml.unbind(aBinding.element, aBinding.behavior);
        aBinding.element = null;
        aBinding.listener = null;
        aBinding.behavior = null;
        this.bindings.splice(i, 1);

        if (this.home != null)
          this.home.untrack(element, event);
      }
    }

    if (len == this.bindings.length)
      return false

    return true;
  }


  bind.unbindAll = function() {
    var b;

    if (this.bindings == null)
      return;

    while (this.bindings.length) {
      b = this.bindings.pop();
      if (b.listener) {
        devhd.utils.HTMLUtils.removeEventListener(b.element, b.event, b.listener, false);
        if (this.home != null)
          this.home.untrack(b.element, b.event);
      } else {
        devhd.bindml.unbind(b.element, b.behavior);
        if (this.home != null)
          this.home.untrack(b.element, b.behavior);
      }
      b.behavior = null;
      b.element = null;
      b.listener = null;
    }
  }

  // End "bind" protocol

  // Start "home" protocol
  var _home = proto.home = {}

  _home.element = function(elementId, node) {
    if (this.home == null)
      return null;

    return this.home.element(elementId, node)
  }

  _home.setHome = function(value) {
      this.home = value
    }
    // End "home" protocol


  // Start of "schedule" protocol. Async execution of functions.
  var _schedule = proto.schedule = {}

  function _scheduleInit() {
    if (this.namedTimers == null) {
      this.namedTimers = {}
    }
    if (this.allTimers == null) {
      this.allTimers = []
    }
  }

  _schedule.schedule = function(timeout, callback, a1, a2, a3, a4) {
    _scheduleInit.call(this)

    var w = this.home.getDocument().defaultView
    this.allTimers.push(
      w.setTimeout(
        function() {
          devhd.fn.callback(callback, a1, a2, a3, a4)
        },
        timeout || 1
      )
    )
  }

  _schedule.clearSchedule = function() {
    if (this.allTimers == null) {
      return
    }
    var w = this.home.getDocument().defaultView
    while (this.allTimers.length) {
      w.clearTimeout(this.allTimers.pop())
    }
    this.allTimers = null
    this.namedTimers = null
  }

})();

;

// From: lib/observable-classic.js

// This should go to the top of the page once everything has the package pattern
/** Observable as a prototype object */

(function() {
  var pkg = devhd.pkg("model");

  var Observable = pkg.createClass("Observable");

  Observable.initialize = function(id) {
    this.observers = [];

    this.id = id;
    this.__originalId = id;
  };

  Observable.registerObserver = function(obsObj) {
    if (this.observers.indexOf(obsObj) >= 0) {
      return
    }
    this.observers.push(obsObj);
  };

  Observable.unregisterObserver = function(obsObj) {
    var idx = this.observers.indexOf(obsObj);
    if (idx < 0) {
      return;
    }
    this.observers.splice(idx, 1);
  };

  Observable.removeAllObservers = function() {
    this.observers = [];
  };

  Observable.fire = function(aspect, a1, a2, a3, a4) {
    // Are there any observers?
    if (this.observers.length == 0) {
      return;
    }
    // copy list of observers, so we don't mutate while we loop
    var a = [];
    for (var oI in this.observers) {
      a.push(this.observers[oI]);
    }

    // The observer list may change as it fire notifications. Make sure that
    // we take this into account
    // Iterate through list of observers
    for (var i = 0; i < a.length; i++) {
      try {
        // Notify each observer
        var obs = a[i];

        if (this.observers.indexOf(obs) < 0) {
          // nothing
        } else if (obs[aspect]) {
          // Call this method; here we don't pass aspect
          obs[aspect].call(obs, a1, a2, a3, a4);
        } else if (obs.onEvent != null) {
          // generic aspect: 'onChanged'
          obs.onEvent.call(obs, aspect, a1, a2, a3, a4);
        } else if (typeof(obs) == "function") {
          obs.call(obs, aspect, a1, a2, a3, a4);
        }

      } catch (e) {
        $feedly(devhd.utils.ExceptionUtils.formatError("notify observer", e) +
          ". Hint: " + a[i] + "." + aspect);
      }
    }
    // done
  };


  Observable.destroy = function() {
    this.removeAllObservers();
  };

  Observable.toString = function() {
    var s = "[obj:" + this.$clazz.$name;
    if (this.id) {
      s += "," + this.id;
    }
    return s + "]";
  };

  // ---------------------------------------------------------------------------------------------
  // OBSERVABLE
  // ---------------------------------------------------------------------------------------------
  const ModernObservable = require( './../lib/observable.js' ).Observable;

  pkg.createObservable = function(id) {
    return new ModernObservable(id);
  };
})();

;

// From: lib/atom.js
"use strict";

var srcset = require('srcset');

(function() {
  var cloud = devhd.pkg("cloud");

  cloud.jsonFeedInfo = function(feed, userId) {
    var that = {};

    that.id = feed.id;
    that.title = feed.title;
    that.updated = devhd.utils.DateUtils.create(feed.updated);

    that.website = null;
    if (feed.alternate != null && feed.alternate.length > 0)
      that.website = feed.alternate[0].href;

    if (that.id != null && that.id.indexOf("gdata.youtube.com/feeds/base/videos/-/") > -1) {
      var parts = that.id.split("/");
      var uri = parts[parts.length - 1];
      that.title = decodeURIComponent(uri.split("?")[0]) + " on Youtube";
    }

    return that;
  };

  ///////////////////////////////////////////////////////////////////////////////////////
  // Create an Atom Entry from JSON serialized representation
  ///////////////////////////////////////////////////////////////////////////////////////
  //
  //	{
  //	  "id": "entryId",
  //	  "unread": true,
  //	  "categories": [
  //	    {
  //	      "id": "user/c805fcbf-3acf-4302-a97e-d82f9d7c897f/category/tech",
  //	      "label": "tech"
  //	    }
  //	  ],
  //	  "tags": [
  //	    {
  //	      "id": "user/c805fcbf-3acf-4302-a97e-d82f9d7c897f/tag/global.saved"
  //	    },
  //	    {
  //	      "id": "user/c805fcbf-3acf-4302-a97e-d82f9d7c897f/tag/inspiration",
  //	      "label": "inspiration"
  //	    }
  //	  ],
  //	  "title": "NBC's reviled sci-fi drama 'Heroes' may get a second lease on life as Xbox Live exclusive",
  //	  "keywords": [
  //	    "NBC",
  //	    "sci-fi"
  //	  ],
  //	  "published": 1366233662,
  //	  "updated": 1366233662,
  //	  "crawled": 1366233662,
  //	  "alternate": [
  //	    {
  //	      "href": "http://www.theverge.com/2013/4/17/4236096/nbc-heroes-may-get-a-second-lease-on-life-on-xbox-live",
  //	      "type": "text/html"
  //	    }
  //	  ],
  //	  "content": {
  //	    "direction": "ltr",
  //	    "content": "..."
  //	  },
  //	  "author": "Nathan Ingraham",
  //	  "origin": {
  //	    "streamId": "feed/http://www.theverge.com/rss/full.xml",
  //	    "title": "The Verge -  All Posts",
  //	    "htmlUrl": "http://www.theverge.com/"
  //	  }
  //	}
  ////////////////////////////////////////////////////////////////////////////////////////
  var feedlyEntryUUID = 0;

  var JSONEntry = cloud.createClass("JSONEntry");

  var RE_YOUTUBE1 = /youtube\.com\/embed\/([A-Za-z0-9\-_]+)/i;
  var RE_YOUTUBE2 = /youtube\.com\/v\/([A-Za-z0-9\-_]+)/i;
  var RE_YOUTUBE3 = /ytimg\.com\/vi\/([A-Za-z0-9\-_]+)/i;
  var RE_YOUTUBE4 = /youtube\.com\/watch\?v=([A-Za-z0-9\-_]+)/i;

  JSONEntry.initialize = function(jsonInfo, userId, channel, metadata) {
    if (jsonInfo.categories == null)
      jsonInfo.categories = [];

    metadata = metadata || {};

    this._home = "reader";
    this._format = "json";
    this.jsonInfo = jsonInfo;
    this.id = jsonInfo.id;

    this.feedId = jsonInfo.origin != null ? jsonInfo.origin.streamId : null;

    if (!this.feedId && jsonInfo.canonicalFeed && jsonInfo.canonicalFeed.length > 0 && jsonInfo.canonicalFeed[0].streamId) {
      this.feedId = jsonInfo.canonicalFeed[0].streamId;
    }

    this.userId = userId;
    this.channel = channel; // search or feed or feed.via
    this.fuuid = feedlyEntryUUID++;

    this.cleanSummary = {};

    if (jsonInfo.crawled == null)
      jsonInfo.crawled = new Date().getTime();

    if (jsonInfo.published == null)
      jsonInfo.published = jsonInfo.crawled;

    if (jsonInfo.updated == null)
      jsonInfo.updated = jsonInfo.published;

    // Some time related shortcuts
    var updatedDate = this.getUpdatedDate();
    this.lastModifiedDate = (updatedDate != null) ? updatedDate : this.getPublishedDate();
    this.lastModifiedTime = this.lastModifiedDate.getTime();

    this.crawledDate = devhd.utils.DateUtils.create(this.jsonInfo.crawled);
    this.crawledTime = this.crawledDate.getTime();

    // FIXME dallas: Shortly after an entry is added to a knowledge board, it
    // exists in the results, but doesn't have an `actionTimestamp`, so I set
    // it to the current time until we can get that fixed.
    this.actionDate = this.jsonInfo.actionTimestamp ?
      devhd.utils.DateUtils.create(this.jsonInfo.actionTimestamp) : new Date();

    if (jsonInfo.decorations == null)
      jsonInfo.decorations = {};

    if (jsonInfo.annotations == null)
      jsonInfo.annotations = [];

    this.metadata = {
      subscribed: null
    };

    // Remove invalid tag generated by the server
    if (this.jsonInfo.origin && this.jsonInfo.origin.title)
      this.jsonInfo.origin.title = devhd.utils.StringUtils.stripTags(this.jsonInfo.origin.title.replace( /&lt;/gi, '<'));

    this.webfeeds = jsonInfo.webfeeds || {};

    try {
      // Enrich entry with visual information
      if (this.jsonInfo.visual != null && ESB["nikon.debug"] != true) {
        // The image processing service is sending the cloud { "url" : "none" } if he is not able to find a featured visual
        // for this entry.
        //
        if (this.jsonInfo.visual.url == "none" && ESB["nikon.force"] != true) {
          // the server has processed all the urls and pages associated with this entry
          // and there are no visuals available.
          this.metadata.noVisual = true;
        } else {
          this.jsonInfo.visual.proxy = this.buildProxyUrl(this.jsonInfo.visual.url);
          this.metadata.largestVisual = this.jsonInfo.visual;
          this.enrichVisual(this.jsonInfo.visual.url, this.jsonInfo.visual.width, this.jsonInfo.visual.height);
        }
      }

      // Apply and update metadata
      for (var k in metadata) {
        if (k == "starred")
          this.metadata["shared"] = metadata[k];
        else
          this.metadata[k] = metadata[k];
      }

      this.metadata.synced = this.getEngagement();
      this.metadata.garbage = false;
      this.metadata.feedId = this.getFeedId();
      this.metadata.userId = userId;

      var al = this.getAlternateLink();
      if (al != null) {
        if (al.indexOf("pheedo.com") > -1 || al.indexOf("click.phdo") > -1)
          this.metadata.garbage = true;

        if (al.indexOf("techmeme.com") > -1) {
          this.metadata.defaultNavigation = "visit";
          this.metadata.substitutedAlternateLink = devhd.utils.HTMLUtils.getFirstLink(this.getContentOrSummary());
        }
      }

      if (metadata.imageUrl)
        this.metadata.featuredVisual = {
          url: metadata.imageUrl,
          width: metadata.imageWidth,
          height: metadata.imageHeight
        };

      this.metadata.googleNews = this.getFeedId() != null && this.getFeedId().indexOf("news.google.com/news") > -1;

      this.metadata.tutorial = this.getFeedId() != null && this.getFeedId() === 'feed/https://blog.feedly.com/category/wiki/feed/';
      if(this.metadata.tutorial) {
        this.metadata.customContentClass = "tutorial";
      }

      //////////////////////////////////////////////////////////////
      // Special link substitution
      //////////////////////////////////////////////////////////////
      if (this.metadata.googleNews && this.jsonInfo.origin != null) {
        this.metadata.noiseAware = true;
        this.metadata.defaultNavigation = !this.jsonInfo.fullContent ? "visit" : null;
        this.metadata.channel = this.jsonInfo.origin.title.split("-")[0].split("+")[0];
        if (this.metadata.channel.split("\"").length > 2)
          this.metadata.channel = this.metadata.channel.split("\"")[1];

        let parts = this.getAlternateLink().split("&url=");
        if (parts.length > 1)
          this.metadata.substitutedAlternateLink = decodeURIComponent(parts[1]);

        parts = this.getTitle().split(" - ");
        if (parts.length > 1) {
          this.metadata.substitutedTitle = parts.slice(0, parts.length - 1).join(" - ");
          this.metadata.substitutedSourceTitle = this.metadata.channel + " / " + parts[parts.length - 1];
          this.metadata.publisherTitle = parts[parts.length - 1];
        }

        // try to determine the primary search term so that we can highlight it:
        // "title": "\"CAA\" +Agency - Google News",
        let searchQ = devhd.utils.StringUtils.extractBetween(this.getFeedId(), "&q=", "&");
        if (searchQ.content && searchQ.content.length > 0) {
          let term = decodeURIComponent(searchQ.content);

          // Removing negative terms and special keywords
          let simplified = term.replace(/\b(\S+):/gi, '').replace(/[-]"[^"]+"/gi, '').replace( /[-]\S+/gi, '').replace( /\bAND\b/gi, '').replace( /\bOR\b/gi, '');

          // breaking into individual terms
          let keywords = simplified.match( /(\b[\S]+\b)/gi);
          if (keywords && keywords.length > 0){
            this.metadata.googleNewsTerms = keywords;
          }
        }

      } else if (this.getFeedId() != null && this.getFeedId().indexOf("gdata.youtube.com/feeds/base/videos/-/") > -1) {
        let parts = this.getFeedId().split("/");
        let uri = parts[parts.length - 1];
        this.metadata.substitutedSourceTitle = decodeURIComponent(uri.split("?")[0]) + " on Youtube";
        this.metadata.channel = this.metadata.substitutedSourceTitle;
      }

      // TRY TO DETERMINE IF THIS IS A PARTIAL FEED OR NOT
      //
      this.metadata.summary = this.isSummary() ? "yes" : "no";
      this.metadata.moreable = false;

      var text = this.asText();

      // Use link patters to determine moreable articles.
      var links = this.listContentLinks();
      this.metadata.links = links.length;

      ///$feedly( "moreable:" + this.getTitle() + " -- links:" + links.length + ", text:" + text.length + ", visuals:" + JSON.stringify( this.listContentVisuals() ) + " -- small visuals only: " + this.hasOnlySmallVisuals() );

      if (links.length > 0 && text.length < 1000 && this.listContentVisuals(true).length <= 2) {
        for (var i = 0; i < links.length; i++) {
          var linkContent = links[i]["all"].toLowerCase();
          if (linkContent.indexOf("more") > -1 || linkContent.indexOf("...") > -1 || linkContent.indexOf("…") > -1 || linkContent.indexOf("continue") > -1 || linkContent.indexOf("read") > -1 || linkContent.indexOf("full") > -1) {
            this.metadata.moreable = true;
            break;
          }
        }
      }

      // Example: Mashable
      if (this.metadata.moreable != true) {
        for (var i = 0; i < links.length; i++) {
          var linkContent = links[i]["all"].toLowerCase();
          if (linkContent.indexOf("read more...") > -1) {
            this.metadata.moreable = true;
            break;
          }
        }
      }

      // Use text pattern to determine moreable articles
      // Example: http://www.sweetsugarbelle.com/
      if (this.metadata.moreable != true) {
        if (text.length < 1000 && (text.indexOf("[…]") > -1 || text.indexOf("[...]") > -1))
          this.metadata.moreable = true;
      }

      // Example: Europe 1
      if (text.length < 200 && this.listContentVisuals().length == 0)
        this.metadata.moreable = true;

      if (text.length < 200 && this.listContentVisuals().length <= 1 && text.indexOf("...") > -1)
        this.metadata.moreable = true;

      // Things such as Yahoo.
      //
      if (this.metadata.moreable != true) {
        if (text.length < 350 && this.hasOnlySmallVisuals() == true)
          this.metadata.moreable = true;
      }

      this.metadata.key = this.getId();

      // Ad?
      var t = this.getTitle();
      if (t.indexOf("[Sponsor]") > -1 || t.indexOf("\u2665") > -1) {
        this.metadata.sponsored = true;
        this.metadata.substitutedTitle = t.replace("\u2665 /", "").replace("[Sponsor]", "");
      }

      // Youtube feed?
      if (this.getAlternateLink().indexOf("youtube.com") > -1) {
        var link = this.getAlternateLink();
        this.metadata.youtube = devhd.utils.RegExUtils.select(RE_YOUTUBE1, link) || devhd.utils.RegExUtils.select(RE_YOUTUBE2, link) || devhd.utils.RegExUtils.select(RE_YOUTUBE3, link) || devhd.utils.RegExUtils.select(RE_YOUTUBE4, link);
      }

      // TRY TO DETERMINE PROMOTION INFORMATION
      var cs = this.getContentOrSummary();
      if (cs != null && cs.indexOf("webfeedsMetadata") > -1) {
        this.extractWebfeedsMetadata();
      }

      if (this.webfeeds.promotion) {
        this.webfeeds.footerHtml = this.webfeeds.promotion[Math.floor(Math.random() * this.webfeeds.promotion.length)]
      }

    } catch (e) {
      console.log(e);
      $feedly("[entry] warning metadata enrichment failed:" + e.name + " -- " + e.message);
    }

    /////////////////////////////////////////////////////////////////////////////////////
    // BEHAVIOR
    /////////////////////////////////////////////////////////////////////////////////////
    this.markAsReadable = true;
  };

  JSONEntry.extractWebfeedsMetadata = function() {
    var cs = this.getContentOrSummary();

    try {
      var s = devhd.utils.StringUtils.extractBetween(cs, "<div class=\"webfeedsMetadata\">", "</div>");

      if (s == null || s.content == null)
        return;

      s = devhd.str.trim(s.content);

      var p = s.split(";");

      for (var i = 0; i < p.length; i++) {
        var ks = p[i].split(":");

        var key = devhd.str.trim(ks[0]);
        var value = ks.slice(1).join(":");

        if (key.length == 0)
          continue;

        if (key.indexOf("promoted") == 0)
          this.metadata[key] = value;
        else
          this.webfeeds[key] = value;
      }

      // Sometimes feedly is serving the promoted feeds. In this case,
      // the promotion include the link we want to redirect the user to
      // if he or she clicks on the title of the article.
      //
      if (this.webfeeds.alternateURL != null)
        this.jsonInfo.canonicalUrl = addUTMSignature(this.webfeeds.alternateURL, "promotedStory");

      this.metadata.promoted = (this.metadata.promotedCampaignId != null);

      // Building a promoted visual based on the provided metadata.
      //
      if (this.metadata["promotedVisual"] != null) {
        this.metadata["promotedVisual"] = {
          url: this.metadata["promotedVisual"],
          width: parseInt(this.metadata["promotedVisualWidth"]),
          height: parseInt(this.metadata["promotedVisualHeight"])
        };

        delete this.metadata["promotedVisualWidth"];
        delete this.metadata["promotedVisualHeight"];
      }
    } catch (e) {
      $feedly("[atom entry] failed to extract webfeeds metadata:" + e.name + " -- " + e.message);
    }
  };

  JSONEntry.extractPromotedMetadata = function(cs) {
    var prom = {};
    try {
      var s = devhd.utils.StringUtils.extractBetween(cs, "<div class=\"feedlyPromotedMetadata\">", "</div>");

      if (s == null || s.content == null)
        return null;

      s = devhd.str.trim(s.content);

      var p = s.split(";");
      for (var i = 0; i < p.length; i++) {
        var ks = p[i].split(":");
        prom[devhd.str.trim(ks[0])] = devhd.str.trim(ks.slice(1).join(":"));
      }
    } catch (e) {
      $feedly("[atom entry] failed to extract promotion information:" + e.name + " -- " + e.message);
    }

    return prom;
  };

  JSONEntry.isPrivate = function() {
    return this.jsonInfo.origin != null && this.jsonInfo.origin.enterpriseName != null;
  }

  JSONEntry.getEnterprise = function() {
    return this.jsonInfo.origin.enterpriseDescription || this.jsonInfo.origin.enterpriseName;
  }


  JSONEntry.hasOnlySmallVisuals = function() {
    if (this.jsonInfo.visual != null) {
      if (this.jsonInfo.visual.width > 280 && this.jsonInfo.visual.height > 220)
        return false;
      else
        return true;
    }

    var visuals = this.listContentVisuals();

    // we do not know at this point if we can extract a visual from the webpage.
    if (visuals.length == 0)
      return false;

    for (var i = 0; i < visuals.length; i++) {
      if (visuals[i].width == null || visuals[i].height == null)
        return false;

      if (visuals[i].width > 280 && visuals[i].height > 222)
        return false;
    }

    return true;
  };

  JSONEntry.getDecoration = function(key) {
    return this.jsonInfo.decorations[key];
  };


  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // NOISE REDUCTION
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  JSONEntry.isNoiseAware = function(key, value) {
    return this.metadata.noiseAware === true;
  };

  JSONEntry.isMarkedAsNoise = function(key, value) {
    if (this.jsonInfo.noise != null && (this.jsonInfo.noise.marker == null || this.jsonInfo.noise.marker != "signal")) {
      return true;
    } else {
      return false;
    }
  };

  JSONEntry.hasNoiseMarker = function() {
    return this.jsonInfo.noise != null && this.jsonInfo.noise.marker == "noise";
  }

  JSONEntry.hasSignalMarker = function() {
    return this.jsonInfo.noise != null && this.jsonInfo.noise.marker == "signal";
  }

  JSONEntry.listNoiseKeywords = function() {
    if (this.jsonInfo.noise == null || this.jsonInfo.noise.noiseKeywords != null)
      return this.jsonInfo.noise.noiseKeywords;
    else
      return [];
  }

  JSONEntry.listMissingKeywords = function() {
    if (this.jsonInfo.noise == null || this.jsonInfo.noise.missingKeywords != null)
      return this.jsonInfo.noise.missingKeywords;
    else
      return [];
  }

  JSONEntry.markAsNoise = function() {
    if (this.jsonInfo.noise == null) {
      this.jsonInfo.noise = {};
    }
    this.jsonInfo.noise.marker = "noise";
  };

  JSONEntry.undoMarkAsNoise = function() {
    delete this.jsonInfo.noise;
  };

  JSONEntry.markAsSignal = function() {
    this.jsonInfo.noiseCopy = this.jsonInfo.noise;

    if (this.jsonInfo.noise == null) {
      this.jsonInfo.noise = {};
    }
    this.jsonInfo.noise.marker = "signal";
  };

  JSONEntry.undoMarkAsSignal = function() {
    this.jsonInfo.noise = this.jsonInfo.noiseCopy;
    delete this.jsonInfo.noiseCopy;
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // DECORATIONS
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  JSONEntry.setDecoration = function(key, value) {
    this.jsonInfo.decorations[key] = value;
  };

  JSONEntry.getEngagementRate = function() {
    return this.jsonInfo.engagementRate;
  };

  JSONEntry.getEngagementRateType = function() {
    let type = 0;
    let hot = (this.getEngagement() > 100 && this.getEngagementRate() > 3 ) || (this.getEngagement() > 25 && this.getEngagementRate() > 7);

    if (hot && this.getEngagementRate() > 10) {
      type = 2;
    } else if (hot) {
      type = 1;
    }

    return type;
  };

  JSONEntry.getEngagement = function() {
    return (this.jsonInfo.engagement || 0) + (this.isQuicklisted() ? 1 : 0);
  };

  JSONEntry.setEngagement = function(value) {
    if (value == null || isNaN(value)) {
      $feedly( "[entry] ignoring invalid engagement:" + value);
      return;
    }

    let currentEngagement = this.jsonInfo.engagement || 0;
    if (currentEngagement > value) {
      $feedly( "[entry] ignoring new lower, engagement count:" + currentEngagement + " > " + value);
      return;
    }

    this.jsonInfo.engagement = value;
  };

  JSONEntry.setNavigation = function(value) {
    this.metadata.navigation = value;
  };

  JSONEntry.getNavigation = function() {
    return this.metadata.navigation || this.metadata.defaultNavigation || "inline";
  };

  JSONEntry.getChannel = function() {
    return this.metadata.channel || this.getCleanSourceTitle();
  };

  JSONEntry.hasContentHeader = function() {
    return true;
  };

  JSONEntry.updateComments = function(comments) {
    if (comments == null)
      return;

    this.jsonInfo.comments = comments;

    for (var i = 0; i < this.jsonInfo.comments.length; i++) {
      if (this.jsonInfo.comments[i].userId == this.userId)
        this.jsonInfo.comments[i].me = true;
    }
  };

  JSONEntry.getType = function() {
    return this.metadata.objectType || "regular";
  };

  JSONEntry.getAge = function() {
    return (new Date().getTime() - this.lastModifiedTime) / (3600 * 1000);
  };

  JSONEntry.isFresh = function() {
    if (this.metadata.garbage == true)
      return false;

    return this.getAge() < 3;
  };

  JSONEntry.isGem = function() {
    return this.metadata.mustRead == true;
  };

  JSONEntry.isHot = function() {
    if (this.metadata.garbage == true)
      return false;

    return (this.getEngagement() > 100 && this.getEngagementRate() > 3) || (this.getEngagement() > 25 && this.getEngagementRate() > 7);
  };

  JSONEntry.getPotential = function() {
    var age = this.getAge();
    var p = this.getEngagement();

    if (this.metadata.garbage == true)
      p = p / 1000000;

    if (this.metadata.mustRead == true) {
      if (this.isGem() && this.getAge() < 3) {
        // THESE ARE GEMS.
        p = 100 + 2 * p;
      } else if (this.isGem() && this.getAge() < devhd.utils.DateUtils.isDateToday(this.getLastModifiedDate())) {
        // THESE ARE GEMS.
        p = 50 + 2 * p;
      } else if (this.getAge() < devhd.utils.DateUtils.isDateToday(this.getLastModifiedDate())) {
        // THESE ARE GEMS.
        p = 10 + 2 * p;
      } else {
        p = 5 + 2 * p;
      }
    }

    if (age < 0.5)
      return 1 + 4 * p;
    else if (age < 1)
      return 1 + 2 * p;
    else if (age < 2)
      return 1 + 1.5 * p;
    else
      return 1 + p;
  };

  JSONEntry.getOriginalId = function() {
    return this.originalId;
  };

  JSONEntry.getId = function() {
    return this.id;
  };

  JSONEntry.getIdAsLong = function() {
    if (this.metadata.entryId == null)
      this.metadata.entryId = computeEntryId(this.getId());

    return this.metadata.entryId;
  };

  JSONEntry.getFeedId = function() {
    return this.feedId;
  };

  JSONEntry.getFeedInfo = function() {
    return {
      id: this.feedId,
      title: this.getSourceTitle()
    };
  };

  JSONEntry.getCrawlTime = function() {
    return this.crawledTime;
  };

  JSONEntry.getFingerPrint = function() {
    return this.getSourceTitle() + "/" + this.getTitle();
  };

  JSONEntry.getTitle = function() {
    if (this.metadata.substitutedTitle != null)
      return this.metadata.substitutedTitle;

    // updated by Edwin K. on Sept 4th, 2008. Given that the title is now used for
    // tracking duplicates, changed the [no title] text to include the first 100 characters
    // of the content as a title.
    var title = this.jsonInfo.title;

    if (title == null) {
      var content = devhd.str.stripTags(this.getContentOrSummary()) || "[no title]";
      title = content.slice(0, 120);
      if (content.length > 120)
        title += "...";
    }

    if (this.isTitleRTL()) {
      try {
        if (this.isTitleRTL() == true)
          title = title.replace("\u003cdiv style\u003d\"direction:rtl;text-align:right\"\u003e", "").replace("\u003c/div\u003e", "");
      } catch (ignore) {}
    }

    return title;
  };

  JSONEntry.getCleanTitle = function() {
    if (this.cleanTitle == null) {
      var t = this.getTitle();

      if (t == null && this.computedTitle == null) {
        var content = devhd.str.stripTags(this.getContentOrSummary()) || "[no title]";
        title = content.slice(0, 120);
        if (content.length > 120)
          title += "...";
        this.computedTitle = title;
      }

      if (t == null)
        t = this.computedTitle || "untitled";

      try {
        if (this.isTitleRTL() == true)
          t = t.replace("\u003cdiv style\u003d\"direction:rtl;text-align:right\"\u003e", "").replace("\u003c/div\u003e", "");
      } catch (ignore) {}

      this.cleanTitle = devhd.utils.StringUtils.cleanTitle(t);
    }
    return this.cleanTitle;
  };

  JSONEntry.getHighlightedTitle = function(terms) {
    try {
      if (terms != null) {
        return devhd.utils.AnnotationUtils.highlightTextTerms(this.getCleanTitle(), terms);
      } else if (this.metadata.terms != null) {
        return devhd.utils.AnnotationUtils.highlightTextTerms(this.getCleanTitle(), this.metadata.terms);
      } else {
        return this.getCleanTitle();
      }
    } catch (e) {
      $feedly("[entry] failed to highlight title:" + e.name + " -- " + e.message);
      return this.getCleanTitle();
    }
  };

  JSONEntry.getCleanSourceTitle = function() {
    if (this.cleanSourceTitle == null) {
      var t = this.getSourceTitle();
      try {
        if (this.isTitleRTL() == true && t != null && typeof t.replace != undefined)
          t = t.replace("\u003cdiv style\u003d\"direction:rtl;text-align:right\"\u003e", "").replace("\u003c/div\u003e", "");
      } catch (ignore) {}

      this.cleanSourceTitle = devhd.utils.StringUtils.cleanSourceTitle(t);
    }
    return this.cleanSourceTitle;
  };

  JSONEntry.getMicroSourceTitle = function() {
    if (this.microSourceTitle == null) {
      var t = this.getSourceTitle() || "untitled";

      try {
        if (this.isTitleRTL() == true && t != null && typeof t.replace != undefined)
          t = t.replace("\u003cdiv style\u003d\"direction:rtl;text-align:right\"\u003e", "").replace("\u003c/div\u003e", "");
      } catch (ignore) {

      }

      this.microSourceTitle = devhd.utils.StringUtils.microSourceTitle(t);
    }

    return this.microSourceTitle;
  };

  JSONEntry.getAlternate = function(type) {
    if (this.jsonInfo.alternate == null || this.jsonInfo.alternate.length == 0)
      return null;

    var link = null;

    if (type == null)
      link = this.jsonInfo.alternate[0].href;

    if (link == null) {
      for (var i = 0; i < this.jsonInfo.alternate.length; i++) {
        if (this.jsonInfo.alternate[i].type == type || this.jsonInfo.alternate[i].type == null) {
          link = this.jsonInfo.alternate[i].href;
          break;
        }
      }
    }

    return link;
  };

  JSONEntry.setCanonicalUrl = function(clean) {
    this.jsonInfo.canonicalUrl = clean;

    if (this.getAlternateLink().indexOf("pheedo.com") > -1 || this.getAlternateLink().indexOf("click.phdo") > -1)
      this.metadata.garbage = true;
  };

  function addUTMSignature(url, medium) {
    medium = medium || "webfeeds";

    if (url.indexOf("?") == -1) {
      return url + "?utm_source=feedly&utm_medium=" + medium;
    } else if (url.indexOf("utm_source") > -1) {
      var parts = url.split("?");
      return parts[0] + "?utm_source=feedly&utm_medium=" + medium;
    } else {
      return url + "&utm_source=feedly&utm_medium=" + medium;
    }
  }

  JSONEntry.getAlternateLink = function(kind) {
    if (kind == "feedly")
      return devhd.utils.FeedlyUtils.homeURL + "#entry/" + this.id;

    var u = this.metadata.substitutedAlternateLink || this.getCanonicalUrl() || this.getAlternate("text/html") || "about:blank";

    if (this.webfeeds.analyticsId != null || this.metadata.promotedAnalyticsId != null) {
      return addUTMSignature(u);
    } else if (u.indexOf("utm_source=feedburner") > -1) {
      return u.replace("utm_source=feedburner", "utm_source=feedly");
    } else if (u.indexOf("utm_source=rss") > -1) {
      return u.replace("utm_source=rss", "utm_source=feedly");
    } else if (u.indexOf("utm_source=") > -1 || u.indexOf("?") == -1) {
      return u;
    } else {
      return u;
    }
  };

  JSONEntry.getFastestAlternateLink = function() {
    if (this.metadata.substitutedAlternateLink != null) {
      return this.metadata.substitutedAlternateLink;
    } else if (this.jsonInfo.cdnAmpUrl != null && false) {
      return this.jsonInfo.cdnAmpUrl;
    } else if (this.jsonInfo.ampUrl != null) {
      return this.jsonInfo.ampUrl;
    } else {
      return this.getBestAlternateLink();
    }
  };

  JSONEntry.getBestAlternateLink = function(kind) {
    // Some entries like the google alerts do not seem to have an alternate link.
    if (this.metadata.substitutedAlternateLink != null) {
      return this.metadata.substitutedAlternateLink;
    } else {
      return this.getCanonicalUrl() || this.getAlternate("text/html");
    }
  };

  JSONEntry.getCanonicalUrl = function() {
    // Prioritize the canonical URL we find in the RSS feed over what
    // we get from the readability service because in some cases, the
    // URL from readability is not correct.
    return this.getCanonical("text/html") || this.jsonInfo.canonicalUrl;
  };

  JSONEntry.getCanonical = function(type) {
    if (this.jsonInfo.canonical == null)
      return null;

    var ca = null;
    if (type == null && this.jsonInfo.canonical.length > 0) {
      ca = this.jsonInfo.canonical[0].href;
    } else {
      for (var i = 0; i < this.jsonInfo.canonical.length; i++) {
        if (this.jsonInfo.canonical[i].type == type) {
          ca = this.jsonInfo.canonical[i].href;
          break;
        }
      }
    }

    if (ca != null && ca.indexOf("feedsportal.com") > 0)
      ca = null;

    return ca;
  };

  JSONEntry.hasCanonicalLink = function() {
    return this.getCanonicalUrl() != null;
  };

  JSONEntry.getSourceVisual = function() {
    return null;
  };

  JSONEntry.listKeywords = function() {
    return this.jsonInfo.keywords || [];
  };

  JSONEntry.getSummary = function() {
    if (this.jsonInfo.summary == null)
      return "";

    return this.jsonInfo.summary.content || "";
  };

  JSONEntry.isSummary = function() {
    return this.jsonInfo.summary != null && this.jsonInfo.content == null;
  };

  JSONEntry.getHighlightedContentOrSummary = function(terms) {
    if (terms != null) {
      return devhd.utils.AnnotationUtils.highlightTerms(this.getCleanContentOrSummary(), terms);
    } else if (this.metadata.terms == null) {
      return devhd.utils.AnnotationUtils.highlightTerms(this.getCleanContentOrSummary(), this.metadata.terms);
    } else {
      return this.getCleanContentOrSummary();
    }
  };

  JSONEntry.getCleanContentOrSummary = function() {
    if (this._cleanContentOrSummary == null) {
      try {
        var that = this;
        this._cleanContentOrSummary = this.getContentOrSummary()
          .replace(/(<img.*?src=")([^"]*)("[^>]*>)/gi, function(match, p1, imageURL, p3) {
            // Let's be smart about this: if we know the width of the image and it is less than maxWidth, then we should not rewrite the image.
            var visual = that.lookupVisual(imageURL);

            // Removing small visual
            //
            if (match.indexOf("http") == -1) {
              return "<!-- non http visual -->";
            } else if (that.shouldExcludeVisual(match)) {
              return "<!-- incorrect visual -->";
            } else if (match.indexOf("blogcdn.com") > -1) {
              return match.replace("_thumbnail", "");
            } else if (visual != null && (visual.width != null && visual.width < 10 || visual.height != null && visual.height < 10)) {
              return "<!-- small visual -->";
            } else {
              return match;
            }
          })
          .replace(/<iframe[^>]*><\/iframe>/gi, function(match) {
            // Remove facebook and twitter plug-ins give that the information is already available in feedly.
            //
            if (match.indexOf("facebook.com") > -1 || match.indexOf("twitter.com") > -1)
              return "";
            else if (match.indexOf("slashdot.org") > -1)
              return "";
            else if (window.location.protocol == "https:" && match.indexOf("youtube.com") > -1)
            // Make the youtube URLs protocol agnostic so that we use https youtube urls
            // when the user is using feedly over https.
              return match.replace("http://", "//");
            else
              return match;
          });

        if (this.getFeedId() != null && this.getFeedId().indexOf("feed/http://www.dailymotion.com") == 0) {
          var videoId = devhd.utils.RegExUtils.select(/video\/([^"]*)_/i, this._cleanContentOrSummary);
          if (videoId != null)
            this._cleanContentOrSummary = "<center><iframe frameborder='0' width='480' height='270' src='http://www.dailymotion.com/embed/video/" + videoId + "' style='margin-bottom:34px; margin-top:34px'></iframe></center>";
        }

        // Remove unnecessary iframes from venturebeat page so that the ad is higher on the page.
        //
        if (this.getFeedId() != null && this.getFeedId().indexOf("venturebeat") > -1) {
          var moreInfoIndex = this._cleanContentOrSummary.indexOf("<h6>More information");
          if (moreInfoIndex > 0)
            this._cleanContentOrSummary = this._cleanContentOrSummary.slice(0, moreInfoIndex);
        }

        if (this.getFeedId() != null && this.getFeedId().indexOf("design-milk") > -1) {
          var moreInfoIndex = this._cleanContentOrSummary.indexOf("<br><br><a rel=\"nofollow\" href=\"http://rc.feedsportal");
          if (moreInfoIndex > 0)
            this._cleanContentOrSummary = this._cleanContentOrSummary.slice(0, moreInfoIndex);
        }
      } catch (e) {
        $feedly("[entry] failed to clean content:" + e.name + " -- " + e.message);
        this._cleanContentOrSummary = this.getContentOrSummary();
      }
    }

    return this._cleanContentOrSummary;
  };

  JSONEntry.getExternalImageURL = function (options){

    if (options == null)
      options = {};

    if (devhd.utils.VisualsUtils.disableInjection(this) == true) {
      return null;
    }

    var maxWidth = options.maxWidth || 647;

    var imageEnclosure = this.getEnclosure( "image");

    var imageURL = null;
    if( this.metadata.largestVisual != null && devhd.utils.VisualsUtils.isComic( this ) == false) {
      imageURL = this.metadata.largestVisual.url;
    } else if( this.metadata.greatThumbnail != null ) {
      imageURL = this.metadata.greatThumbnail.url;
    } else if( imageEnclosure != null && imageEnclosure.href != null ) {
      imageURL = imageEnclosure.href;
    }

    if (imageURL!=null && typeof PROXY_IMAGES != "undefined" && PROXY_IMAGES) {
      return this.buildProxyUrl(imageURL);
    } else {
      return imageURL;
    }
  }

  JSONEntry.lookupEdgeCachedUrl = function(url) {
    if( this.metadata.largestVisual != null && this.metadata.largestVisual.url == url)
      return this.metadata.largestVisual.edgeCacheUrl;
    else
      return null;
  }


  JSONEntry.getOptimizedContent = function(options) {

    if (options == null)
      options = {};

    var maxWidth = options.maxWidth || 647;
    var shouldLazyLoadImages = options.shouldLazyLoadImages != null ? options.shouldLazyLoadImages : false;
    var shouldLazyLoadFrames = options.shouldLazyLoadFrames != null ? options.shouldLazyLoadFrames : false;

    var imageId = 0;

    var html = this.getHighlightedContentOrSummary();
    if (html == null)
      return null;

    html = html.replace(/<img([^>]*)>/gi,
      function(match, inner) {

        var image = {
          src: devhd.utils.StringUtils.extractAttribute(inner, "src"),
          srcset: devhd.utils.StringUtils.extractAttribute(inner, "srcset"),
          width: devhd.utils.StringUtils.extractAttribute(inner, "width"),
          height: devhd.utils.StringUtils.extractAttribute(inner, "height"),
        }

        let altValue =  devhd.utils.StringUtils.extractAttribute( inner, "alt");
        if (altValue && altValue.length > 0) {
          image.alt = altValue;
        }

        let titleValue = devhd.utils.StringUtils.extractAttribute(inner, "title");
        if (titleValue && titleValue.length > 0) {
          image.title = titleValue;
        }

        var imageURL = image.src;

        if( image.srcset != null ) {
          // parse the source set and sort it by width and density.
          var sset = srcset.parse( image.srcset ).sort( (a, b) => ( b.width || 1 ) * ( b.density || 1 ) - ( a.width || 1 ) * ( b.density || 1 ) );
          if (sset.length > 0)
            imageURL = sset[ 0 ].url;
        }

        imageId = imageId + 1;

        var sizeInfo = "";
        if( image.width != null )
          sizeInfo += " width=\"" + image.width + "\""

        if( image.height != null )
          sizeInfo += " height=\"" + image.height + "\""

        // In case of Android, we make the first image transparent so that
        // loading that image does not interfer with the slider animation.
        // At the end of the slide animation, we fade that image back in.
        var iid = "image" + imageId;

        // this is a small image.
        var bURL = imageURL;
        if (typeof PROXY_IMAGES != "undefined" && PROXY_IMAGES) {

          // Do we have an EDGE CACHE URL FOR THIS IMAGE?
          var eUrl = this.lookupEdgeCachedUrl(imageURL);
          if (eUrl){
            bURL = devhd.utils.URLUtils.unprotocol(eUrl);
          } else {
            bURL = this.buildProxyUrl(imageURL);
          }
        }

        let altAndTitle = '';
        if (image.title) {
          altAndTitle = ' title=\"' + image.title + '" ';
        }
        if (image.alt) {
          altAndTitle = ' title=\"' + image.alt + '" ';
        }

        if (imageId == 1 || shouldLazyLoadImages == false) {
          return '<img src="' + bURL + '" data-pre-sourced="yes" data-sourced="yes" id="' + iid + '" data-original="' + imageURL + '" data-src="' + imageURL + '" ' + altAndTitle + sizeInfo + '>';
        } else {
          return '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="' + bURL + '" data-original="' + imageURL + '" ' + altAndTitle + sizeInfo + '>';
        }
      }.bind( this )
    );

    if (shouldLazyLoadFrames) {
      html = html.replace(/(<iframe.*?src=")([^"]*)("[^>]*>.*<\/iframe>)/gi,
        (match, p1, frameURL, p3) => {
          var includeFrame = frameURL.indexOf("youtube") > -1 || frameURL.indexOf("vimeo") > -1 || frameURL.indexOf("soundcloud") > -1 || frameURL.indexOf("slideshare") > -1 || frameURL.indexOf("hulu") > -1 || frameURL.indexOf("scribd") > -1 || frameURL.indexOf("kickstarter.com") > -1 || frameURL.indexOf("instagram") > -1 || frameURL.indexOf("vine.co") > -1 || frameURL.indexOf("embedly.com") > -1 || frameURL.indexOf("archive.org") > -1 || frameURL.indexOf(".go.com") > -1 || frameURL.indexOf("theverge.com") > -1 || frameURL.indexOf("dailymotion") > -1 || frameURL.indexOf("theguardian.com") > -1;
          if (includeFrame) {
            return p1 + "about:blank\" data-src=\"" + frameURL + p3;
          } else {
            return "<a class='blockedIframe' data-frame=\"" + encodeURI(match.replace(/"/gi, "'")) + "\" onclick='inlineFrame( this ); return false;' href='" + encodeURI(this.getFastestAlternateLink()) + "'>Tap to load frame</a>";
          }
        }
      );
    }

    return html;
  }

  JSONEntry.buildProxyUrl = function(imageUrl) {
    var sizes = parseInt((647 * window.devicePixelRatio)) + "x*!0.01";
    return "https://visuals.feedly.com/v1/resize"
          + "?url=" + encodeURIComponent(imageUrl)
          + "&sizes=" + encodeURIComponent(sizes)
  }

  JSONEntry.getRawContent = function() {
    if (this.jsonInfo.content == null)
      return "";

    return this.jsonInfo.content.content || "";
  };

  JSONEntry.getContent = function() {

    if (!this._bestContent) {
      var content = this.getRawContent();
      var c = content != "" ? content : this.getSummary();

      try {
        this._bestContent = c;
        this.jsonInfo.usesFullContent = false;

        // For team users. If we have the full content for a feed, we
        // we use that as the content for the story. This is particularly
        // useful for Google News feeds and Google Alert feeds.
        if (this.jsonInfo.fullContent != null) {
          var ct = devhd.str.stripTags(c);
          var cleanFullContent = this.jsonInfo.fullContent.replace(/&#[0-9]+;/g, "").replace(/\s+/g, " ").replace(/^\s|\s$/g, "");
          var fct = devhd.str.stripTags(cleanFullContent).replace(/\s+/g, " ").replace(/\r+/g, " ").replace(/^\s|\s$/g, "");

          // The readability service has trouble extracting some content so
          // we are doing some sanity checks:
          // the full content length > 1.5 content length
          if (fct.length > 1.5 * ct.length)
          {
            this.metadata.autoExpanded = true;
            this.jsonInfo.usesFullContent = true;
            this._bestContent = this.jsonInfo.fullContent;
          }
        }
      } catch (ignore) {
        this._bestContent = c;
        $feedly("[entry] failed to use full content because:" + ignore.name + " -- " + ignore.message);
      }
    }

    return this._bestContent;
  };

  JSONEntry.getContentOrSummary = function() {
    var content = this.getContent();
    return content != "" ? content : this.getSummary();
  };

  JSONEntry.isTitleRTL = function() {
    return this.jsonInfo.title != null ? this.jsonInfo.title.indexOf("direction:rtl") > -1 : false;
  };

  JSONEntry.isContentRTL = function() {
    if (this.jsonInfo.content)
      return this.jsonInfo.content.direction === 'rtl' || this.jsonInfo.content.content.indexOf('dir=\"rtl\"') > -1;

    if (this.jsonInfo.summary)
      return this.jsonInfo.summary.direction === 'rtl' || this.jsonInfo.summary.content.indexOf('dir=\"rtl\"') > -1;

    return false;
  };

  JSONEntry.getCleanSafeSummary = function(clipped, skipRTL) {
    clipped = clipped || 400;

    if (this.cleanSummary[clipped] == null) {
      this.cleanSummary[clipped] = this.asText().slice(0, clipped);

      if (this.isContentRTL() && !skipRTL)
        this.cleanSummary[clipped] = "<div style=\"direction:rtl;text-align:right\">" + this.cleanSummary[clipped] + "</div>";
    }

    return this.cleanSummary[clipped];
  };

  JSONEntry.getExcerpt = function() {
    let text = this.asText();

    if (!text || text.length === 0) {
      return text;
    }

    let sentences = text.match( /[^\.!\?]+[\.!\?]+/g );

    let excerpt = '';
    if (sentences) {
      for (let i = 0; i < sentences.length && excerpt.length < 230; i++) {
        excerpt += sentences[i] + '.';
      }
    } else {
      excerpt = text.slice(0, 230);
    }

    return excerpt;
  };


  JSONEntry.getBestSummary = function(terms, clipSize, skipRTL) {
    try {
      if (clipSize == null)
        clipSize = 400;

      terms = terms || this.listSearchKeywords(term);

      if (!terms || terms.length === 0)
        return this.getCleanSafeSummary(clipSize, skipRTL);

      var text = this.asBestText();
      if (!text|| text.length === 0 || !text.toLowerCase)
        return this.getCleanSafeSummary(clipSize, skipRTL);

      var lText = text.toLowerCase();

      for (var i = 0; i < terms.length; i++) {
        if (terms[i] == null || terms[i].toLowerCase == null)
          continue;

        var term = terms[i].toLowerCase();

        var j = lText.indexOf(term);
        if (j < 0)
          continue;

        var begin = Math.max(j - 100, 0);
        var end = Math.min(j + clipSize, text.length - 1);

        return (begin > 0 ? "..." : "") + text.slice(begin, end);
      }

      return this.getCleanSafeSummary(clipSize, skipRTL);
    } catch (e) {
      $feedly("[JSONEntry] warning failed to get best summary:" + e.name + " -- " + e.message);
      return this.getCleanSafeSummary(clipSize);
    }
  };

  JSONEntry.getHighlightedSummary = function(clipSize) {
    if (this.metadata.terms == null) {
      return this.getCleanSafeSummary(clipSize);
    } else {
      var terms = this.metadata.terms;
      return devhd.utils.AnnotationUtils.highlightTextTerms(this.getBestSummary(terms, clipSize), terms);
    }
  };

  JSONEntry.asText = function() {
    if (this._asText == null)
      this._asText = devhd.str.stripTags(this.getContentOrSummary()) || "";

    return this._asText;
  };

  JSONEntry.asBestText = function() {
    // For some partial articles, we have the full content. We should
    // use that when we are highlighting information in search results.
    if (this.jsonInfo.fullContent == null)
      return this.asText();

    if (this._asBestText == null)
      this._asBestText = devhd.str.stripTags(this.jsonInfo.fullContent);

    if (this._asBestText == null)
      return this.asText();
    else
      return this._asBestText;
  };

  JSONEntry.test = function(keyword) {
    return this.asText().indexOf(keyword) > -1;
  };

  JSONEntry.listAuthors = function() {
    // No authors for promoted stories.
    if (this.metadata.promotedBrand != null)
      return "";

    if (this.jsonInfo.author == null)
      return "";

    if (this.cleanAuthor == null)
      this.cleanAuthor = devhd.str.stripTags(this.jsonInfo.author);

    return this.cleanAuthor;
  };

  JSONEntry.getSourceTitle = function() {
    if (this.metadata.promotedBrand)
      return this.metadata.promotedBrand;

    if (this.metadata.googleNews == true && this.metadata.substitutedSourceTitle)
      return this.metadata.substitutedSourceTitle;

    // If this is a source the user subscribes too, let the manual title
    // take over.
    if (this.metadata.sourceTitle)
      return this.metadata.sourceTitle;

    if (this.metadata.substitutedSourceTitle)
      return this.metadata.substitutedSourceTitle;

    if (!this.jsonInfo.origin)
      return null;

    return this.jsonInfo.origin.title;
  };

  JSONEntry.getSourceAlternateLink = function() {
    if (this.jsonInfo.origin == null)
      return null;

    return this.jsonInfo.origin.htmlUrl;
  };

  JSONEntry.getPublishedDate = function() {
    if (this.publishedDate == null) {
      if (this.jsonInfo.published != null)
        this.publishedDate = devhd.utils.DateUtils.create(this.jsonInfo.published);
      else if (this.jsonInfo.updated != null)
        this.publishedDate = devhd.utils.DateUtils.create(this.jsonInfo.updated);
    }

    return this.publishedDate;
  };

  JSONEntry.getUpdatedDate = function() {
    if (this.updatedDate == null) {
      if (this.jsonInfo.updated != null)
        this.updatedDate = devhd.utils.DateUtils.create(this.jsonInfo.updated);
      else if (this.jsonInfo.published != null)
        this.updatedDate = devhd.utils.DateUtils.create(this.jsonInfo.published);
    }

    return this.updatedDate;
  };

  JSONEntry.getLastModifiedDate = function() {
    return this.lastModifiedDate;
  };

  JSONEntry.getActionDate = function() {
    return this.actionDate;
  };

  JSONEntry.getCrawledDate = function() {
    return this.crawledDate;
  };

  JSONEntry.getAgeInDays = function() {
    let aid = Math.floor((new Date().getTime() - this.lastModifiedDate.getTime()) / devhd.utils.DurationUtils.DAYS(1));
    if (aid < 1) {
      return 1;
    } else if (aid < 7) {
      return 7;
    } else if (aid < 31) {
      return 31;
    } else {
      return 365;
    }
  };

  // ---- VALUE ADDED ---------------------------------------

  JSONEntry.fitsSize = function(aVisual, frameWidth, frameHeight, tol) {
    return devhd.utils.VisualsUtils.fitsSize(aVisual, frameWidth, frameHeight, tol, this.metadata.noVisual == true || this.metadata.largestVisual != null);
  };

  JSONEntry.fitsSizes = function(sizes) {
    if (this.metadata.noVisual == true)
      return 0;

    if (sizes == null || sizes == "none" || sizes.length == 0)
      return true;

    var max = 0;
    if (this.metadata.largestVisual != null) {
      return devhd.utils.VisualsUtils.fitsSizes(this.metadata.largestVisual, sizes, this.metadata.noVisual == true || this.metadata.largestVisual != null);
    } else {
      for (var i = 0; i < sizes.length; i++) {
        var width = sizes[i][0];
        var height = sizes[i][1];
        var tol = sizes[i][2] || 1;

        var visuals = this.listContentVisuals();
        for (var j = 0; j < visuals.length; j++) {
          var f = this.fitsSize(visuals[j], width, height, tol);
          if (f == 2)
            return f;
          else
            max = Math.max(max, f);
        }
      }
    }

    return max;
  };

  function _fits(visual, c, tolerance) {
    tolerance = tolerance || 1;

    if (visual == null || visual.width == null || visual.height == null)
      return false;

    return visual.width >= devhd.utils.PageConstants[c + "_IMAGE_WIDTH"] * tolerance && visual.height >= devhd.utils.PageConstants[c + "_IMAGE_HEIGHT"] * tolerance;
  }

  JSONEntry.fits = function(c, tolerance) {
    if (tolerance == null)
      tolerance = 1;

    if (c == null || devhd.utils.PageConstants[c + "_IMAGE_WIDTH"] == null)
      return false;

    var visuals = this.listContentVisuals();
    for (var i = 0; i < visuals.length; i++) {
      if (_fits(visuals[i], c, tolerance))
        return true;
    }

    return false;
  };

  function _canFit(visual, c) {
    if (visual == null)
      return false;

    if (visual.width == null || visual.height == null)
      return true;

    return visual.width > devhd.utils.PageConstants[c + "_IMAGE_WIDTH"] && visual.height > devhd.utils.PageConstants[c + "_IMAGE_HEIGHT"];
  }

  JSONEntry.canFit = function(c) {
    if (c == null || devhd.utils.PageConstants[c + "_IMAGE_WIDTH"] == null)
      return false;

    var visuals = this.listContentVisuals();
    for (var i = 0; i < visuals.length; i++) {
      if (_canFit(visuals[i], c))
        return true;
    }

    return false;
  };

  JSONEntry.getEtiquette = function() {
    if (this.metadata.type == "ad")
      return "sponsored";

    return null;
  };

  JSONEntry.listExtractedVisuals = function() {
    if (this.visualsExtracted != true)
      this.listContentVisuals();

    return this.extractedVisuals || [];
  };

  JSONEntry.listContentVisuals = function(excludeThumbnails) {
    this._extractAllVisuals();

    if (excludeThumbnails == true) {
      var filtered = [];
      for (var i = 0; i < this.contentVisuals.length; i++) {
        if (this.contentVisuals[i].thumbnail == true)
          continue;

        filtered.push(this.contentVisuals[i]);
      }
      return filtered;
    } else {
      return this.contentVisuals;
    }
  };

  JSONEntry.countInlinedVisuals = function() {
    this._extractAllVisuals();

    if (this.getFeedId() != null && this.getFeedId().indexOf(".flickr.com") > -1)
      return 0;

    var inlined = 0;

    for (var i = 0; i < this.contentVisuals.length; i++) {
      if (this.contentVisuals[i].enclosure == true)
        continue;

      if (this.contentVisuals[i].thumbnail == true)
        continue;

      if (this.contentVisuals[i].external == true)
        continue;

      inlined++;
    }

    return inlined;
  };

  JSONEntry.includesInlinedMedia = function() {
    let c = this.countInlinedVisuals();
    if (c > 0) {
      return true;
    } else {
      return this.getContentOrSummary().indexOf('<iframe') > -1;
    }
  };

  JSONEntry.listAllVisuals = function() {
    this._extractAllVisuals();

    return this.allContentVisuals;
  };

  JSONEntry._extractAllVisuals = function() {
    if (this.visualsExtracted != true) {
      this.allContentVisuals = this._extractVisuals();

      // remove images which are not visual quality
      //
      this.contentVisuals = [];
      this.extractedVisuals = [];
      for (var i = 0; i < this.allContentVisuals.length; i++) {
        var aVisual = this.allContentVisuals[i];

        if (this.isVisualCandidate(aVisual) == false)
          continue;

        if (aVisual.width != null && aVisual.width < 42)
          continue;

        if (aVisual.height != null && aVisual.height < 42)
          continue;

        if (aVisual.featured == true)
          this.webfeeds.featuredVisual = aVisual;

        this.contentVisuals.push(aVisual);
        this.extractedVisuals.push(this.contentVisuals[i]);
      }

      this.metadata.embeddedVisuals = this.contentVisuals.length;

      if (this.contentVisuals.length > 0)
        this.metadata.firstVisual = this.contentVisuals[0];

      this.contentVisuals = this.contentVisuals.sort(function(vA, vB) {
        return vB.surface - vA.surface;
      });

      this.visualsExtracted = true;
    }
  };

  JSONEntry.mapContentVisuals = function() {
    var map = {};
    var list = this.listAllVisuals();
    for (var i = 0; i < list.length; i++) {
      var aVisual = list[i];
      map[aVisual.url] = aVisual;
    }
    return map;
  };

  JSONEntry.suggestVisual = function() {
    if (this.metadata.largestVisual) {
      return this.metadata.largestVisual.url;
    }

    var vs = this.listContentVisuals();
    if (vs != null && vs.length > 0)
      return vs[0].url;
    else
      return null;
  };

  JSONEntry.getDescription = function() {
    var t = this.asText();
    var parts = t.split(".");
    var d = "";

    for (var i = 0; i < parts.length && d.length < 180; i++)
      d += parts[i] + ".";

    if (d.length > 300)
      d = d.slice(0, 200) + "[...]";

    return d;
  };

  JSONEntry.includesEnclosure = function(typeFilter) {
    return this.getEnclosure(typeFilter) != null;
  };

  JSONEntry.getEnclosure = function(typeFilter) {
    if (this.enclosureExtracted != true) {
      this.enclosure = this._extractEnclosure();
      this.enclosureExtracted = true;
    }

    if (this.enclosure != null && this.enclosure.type != null && (typeFilter == null || this.enclosure.type.indexOf(typeFilter) > -1))
      return this.enclosure;
    else
      return null;
  };

  JSONEntry.listContentVideos = function() {
    if (this.videoExtracted != true) {
      // video embedded in the content
      this._extractEmbeds();

      // video as enclosures
      var enc = this.getEnclosure("video");
      if (enc != null)
        this.embeddedVideos.push("<a href='" + enc.href + "'>Attached Video</a>");

      var flashVideo = this.getEnclosure("application/x-shockwave-flash");
      if (flashVideo != null)
        this.embeddedVideos.push("<a href='" + flashVideo.href + "'>Attached Video</a>");

      this.videoExtracted = true;
    }
    return this.embeddedVideos;
  };

  JSONEntry.embedsMedia = function() {
    return this.embedsAudio() || this.embedsVideo();
  };

  JSONEntry.embedsAudio = function() {
    return this.listContentAudios().length > 0;
  };

  JSONEntry.listContentAudios = function() {
    if (this.embeddedAudios == null) {
      this.embeddedAudios = [];
      var audio = this.getEnclosure("audio");
      if (audio != null)
        this.embeddedAudios.push(audio);
    }
    return this.embeddedAudios;
  };

  JSONEntry.embedsVideo = function() {
    try {
      return this.listContentVideos().length > 0 || devhd.utils.VideoUtils.embedsYoutube(this.getContentOrSummary()) || (this.getFeedId() != null && this.getFeedId().indexOf("hulu.com")) > -1

    } catch (e) {
      $feedly("[entry] failed to determine if entry embeds videos:" + e.name + " -- " + e.message);
      return false;
    }
  };

  JSONEntry.listContentLinks = function() {
    if (this.linksExtracted != true) {
      this.embeddedLinks = this._extractEmbeddedLinks();
      this.linksExtracted = true;
      if (this.embeddedLinks == null)
        this.embeddedLinks = [];
    }
    return this.embeddedLinks;
  };

  // READ
  JSONEntry.isRead = function() {
    return this.jsonInfo.unread == false;
  };

  JSONEntry.canKeepUnread = function() {
    return true;
  };

  JSONEntry.wasKeptUnread = function() {
    return this.jsonInfo.keptUnread == true;
  };

  JSONEntry.markAsRead = function() {
    this.jsonInfo.unread = false;
    delete this.jsonInfo.keptUnread;
  };

  JSONEntry.undoMarkAsRead = function() {
    this.jsonInfo.unread = true;
    this.jsonInfo.keptUnread = true;
  };

  // START OLD TAG IMPLEMENTATION
  //
  JSONEntry.hasTag = function(tagLabel) {
    if (this.jsonInfo.tags == null)
      return false;

    var tagId = devhd.utils.IdUtils.formatId("tag", tagLabel, this.userId);

    for (var i = 0; i < this.jsonInfo.tags.length; i++)
      if (this.jsonInfo.tags[i].id == tagId)
        return true;

    return false;
  };

  JSONEntry.tag = function(tagLabel) {
    if (this.hasTag(tagLabel) == true)
      return;

    var tagId = devhd.utils.IdUtils.formatId("tag", tagLabel, this.userId);

    if (this.jsonInfo.tags == null)
      this.jsonInfo.tags = [];

    this.jsonInfo.tags.push({
      id: tagId,
      label: devhd.utils.IdUtils.extractLabel(tagId)
    });
  };

  JSONEntry.untag = function(fName) {
    if (this.jsonInfo.tags == null)
      return false;

    var tagId = devhd.utils.IdUtils.formatId("tag", fName, this.userId);

    for (var i = 0; i < this.jsonInfo.tags.length; i++) {
      if (this.jsonInfo.tags[i].id == tagId) {
        this.jsonInfo.tags.splice(i, 1);
        return true;
      }
    }

    return false;
  };

  //
  // END OLD TAG IMPLEMENTATION


  JSONEntry.isQuicklisted = function() {
    var globalSavedTagId = devhd.utils.IdUtils.formatId("tag", "global.saved", this.userId);
    return this.includesTag({id:globalSavedTagId});
  };

  JSONEntry.setQuicklisted = function(quicklistBool) {
    var globalSavedTagId = devhd.utils.IdUtils.formatId("tag", "global.saved", this.userId);
    if (quicklistBool)
      return this.addTag({id:globalSavedTagId});
    else
      return this.removeTag({id:globalSavedTagId});
  };

  // NEW TAG IMPLEMENTATION
  JSONEntry.addTag = function(tagObject) {
    if (this.includesTag(tagObject) == true)
      return;

    if (this.jsonInfo.tags == null)
      this.jsonInfo.tags = [];

    this.jsonInfo.tags.push(tagObject);
  };

  JSONEntry.removeTag = function(tagObject) {
    if (this.jsonInfo.tags == null)
      return false;

    var tagId = tagObject.id;

    for (var i = 0; i < this.jsonInfo.tags.length; i++) {
      if (this.jsonInfo.tags[i].id == tagId) {
        this.jsonInfo.tags.splice(i, 1);
        return true;
      }
    }

    return false;
  };

  JSONEntry.includesTag = function(tagObject) {
    if (this.jsonInfo.tags == null)
      return false;

    var tagId = tagObject.id;

    for (var i = 0; i < this.jsonInfo.tags.length; i++)
      if (this.jsonInfo.tags[i].id == tagId)
        return true;

    return false;
  };

  JSONEntry.listTagLabels = function() {
    if (this.jsonInfo.tags == null)
      return [];

    var labels = [];
    for (var i = 0; i < this.jsonInfo.tags.length; i++) {
      if (this.jsonInfo.tags[i].label != null && this.jsonInfo.tags[i].label.length > 0 && this.jsonInfo.tags[i].label.indexOf("global.") == -1)
        labels.push(this.jsonInfo.tags[i].label);
    }

    return labels;
  };

  JSONEntry.listTags = function(excludeGlobal) {
    if (this.jsonInfo.tags == null)
      return [];

    if (excludeGlobal !== false) {
      excludeGlobal = true;
    }

    var nonGlobalTags = [];
    for (var i = 0; i < this.jsonInfo.tags.length; i++) {
      if (!excludeGlobal || (this.jsonInfo.tags[i].label != null && this.jsonInfo.tags[i].label.length > 0 && this.jsonInfo.tags[i].label.indexOf("global.") == -1))
        nonGlobalTags.push(this.jsonInfo.tags[i]);
    }

    return nonGlobalTags;
  };

  JSONEntry.listEnterpriseTags = function() {
    if (this.jsonInfo.tags == null)
      return [];

    var enterpriseTags = [];
    for (var i = 0; i < this.jsonInfo.tags.length; i++) {
      if (this.jsonInfo.tags[i].id.indexOf("enterprise")==0)
        enterpriseTags.push(this.jsonInfo.tags[i]);
    }

    return enterpriseTags;
  };

  JSONEntry.findTag = function(tagId) {
    if (this.jsonInfo.tags == null)
      return [];

    return this.jsonInfo.tags.find((tag) => tag.id == tagId);
  };

  JSONEntry.findTagActionTimestamp = function(tagId) {
    let t = this.findTag(tagId);
    return t ? t.actionTimestamp : null;
  }

  JSONEntry.listEnterpriseCollections = function() {
    if (this.jsonInfo.categories == null)
      return [];

    var enterpriseCollections = [];
    for (var i = 0; i < this.jsonInfo.categories.length; i++) {
      if (this.jsonInfo.categories[i].id.indexOf("enterprise")==0)
        enterpriseCollections.push(this.jsonInfo.categories[i]);
    }

    return enterpriseCollections;
  };

  /////////////////////////////////////////////////////////////////////
  // ANNOTATION RELATED HELPER METHODS
  /////////////////////////////////////////////////////////////////////

  JSONEntry.listSearchKeywords = function(term) {

    let keywords = [];

    // If the user is passing in a term or there is a googleNewsTerm for this
    // feed, use those as keywords
    let input = term;
    if (input) {
      keywords = input.match( /\S+/g ) || [];
    }

    // If the user is performing a search and has associated some terms with
    // the entry, use those.
    if (keywords.length === 0 && this.metadata.terms && this.metadata.terms.length > 0) {
      keywords = this.metadata.terms;
    }

    if (keywords.length === 0 && this.metadata.googleNewsTerms) {
      keywords = this.metadata.googleNewsTerms;
    }

    return keywords;
  }

  JSONEntry.listKeywordAlerts = function(term) {

    let keywords = this.listSearchKeywords(term);

    if (keywords.length === 0) {
      return [];
    }

    try {
      let text = this.asText();
      let sentences = text.match( /[^\.!\?]+[\.!\?]+/g ) || [];
      let mentions = [];
      let id = 0;

      sentences.forEach( (sentence) => {
        let snipMax = 240;
        let matches = [];
        let start = -1;

        keywords.forEach( (keyword) => {
          let wordRegex = new RegExp('\\b' + keyword + '\\b', 'gi');
          let match = sentence.search(wordRegex);
          if (match === -1) {
            return;
          }

          if (start === -1) {
            start = match;
          }

          matches.push(keyword);
        });

        if (matches.length === 0) {
          return;
        }

        let snippet = sentence;

        if (sentence.length > snipMax) {
          let begin = 0;
          let beginCropped = false;
          if (start > snipMax / 2) {
            begin = start - snipMax / 2;
            beginCropped = true;
          }

          let end = sentence.length;
          let endCropped = false;
          if (end - start > snipMax / 2) {
            end = start + snipMax / 2;
            endCropped = true;
          }

          snippet = sentence.slice(begin, end);

          if (beginCropped) {
            snippet = '[...]' + snippet;
          }

          if (endCropped) {
            snippet = snippet + '[...]';
          }
        }


        mentions.push({
          id: id++,
          text: snippet,
          keywords: matches,
        });

      });

      return mentions;
    } catch( e ) {
      return [];
    }
  };

  JSONEntry.lookupAnnotation = function(annotationId) {
    return this.jsonInfo.annotations.find((annotation) => annotation.id == annotationId);
  };

  JSONEntry.listAnnotations = function() {
    return this.jsonInfo.annotations || [];
  };

  JSONEntry.listHighlights = function() {
    let annotations = this.listAnnotations();
    let highlights = [];
    annotations.forEach((annotation) => {
      if (!annotation.highlight) {
        return;
      }

      highlights.push(annotation);
    });

    return highlights;
  };

  JSONEntry.listNotes = function() {
    let annotations = this.listAnnotations();
    let notes = [];
    annotations.forEach((annotation) => {
      if (!annotation.comment) {
        return;
      }

      notes.push(annotation);
    });

    return notes;
  };

  JSONEntry.addAnnotation = function(annotation) {
    if (this.jsonInfo.annotations == null) {
      this.jsonInfo.annotations = [];
    }
    this.jsonInfo.annotations.push(annotation);
    return annotation;
  };

  JSONEntry.updateAnnotation = function(annotationId, data) {
    var matchingAnnotation = this.lookupAnnotation(annotationId);
    if (matchingAnnotation == null) {
      throw new Error('Annotation not found');
    }

    // update the existing annotation structure using the new comment and highlight info.
    matchingAnnotation.comment = data.comment;
    matchingAnnotation.highlight = data.highlight;
  };

  JSONEntry.deleteAnnotation = function(annotationId) {
    // Iterate through the list of annotations and remove the one which
    // has the matching annotation id.
    for(let i = 0; i < this.jsonInfo.annotations.length; i++) {
      if (this.jsonInfo.annotations[i].id == annotationId){
        this.jsonInfo.annotations.splice(i, 1);
        return true;
      }
    }
    return false;
  };

  JSONEntry.lookupAnnotationReply = function(annotationId, replyId) {
    var matchingAnnotation = this.lookupAnnotation(annotationId);
    if (matchingAnnotation == null) {
      throw new Error('Annotation not found');
    }

    if (matchingAnnotation.replies == null) {
      throw new Error('Annotation does not have replies');
    }

    return matchingAnnotation.replies.find((reply) => reply.id == replyId);
  };

  JSONEntry.addAnnotationReply = function(annotationId, reply){
    var matchingAnnotation = this.lookupAnnotation(annotationId);
    if (matchingAnnotation == null) {
      throw new Error('Annotation not found');
    }

    if (matchingAnnotation.replies == null) {
      matchingAnnotation.replies = [];
    }

    matchingAnnotation.replies.push(reply);
    return true;
  };

  JSONEntry.updateAnnotationReply = function(annotationId, replyId, data){
    var matchingReply = this.lookupAnnotationReply(annotationId, replyId);
    if (matchingReply == null) {
      throw new Error('Reply not found');
    }

    // Update the comment associated with the reply based on the update data.
    matchingReply.comment = data.comment;

    return true;
  };

  JSONEntry.deleteAnnotationReply = function(annotationId, replyId){
    var matchingAnnotation = this.lookupAnnotation(annotationId);
    if (matchingAnnotation == null) {
      throw new Error('Annotation not found');
    }

    if (matchingAnnotation.replies == null) {
      throw new Error('Reply not found');
    }

    // Iterate through the list of annotations and remove the one which
    // has the matching annotation id.
    for(let i = 0; i < matchingAnnotation.replies.length; i++) {
      if (matchingAnnotation.replies[i].id == replyId){
        matchingAnnotation.replies.splice(i, 1);
        return true;
      }
    }

    return false;
  };


  // PRIVATE METHODS
  JSONEntry._videoExcludePatterns = ["castfire.com"];

  JSONEntry._adExcludePatterns = ["feedsportal.com/r", "feedads.feedblitz.com"];

  JSONEntry._visualExcludePatterns = ["feedproxy",
    "feedburner",
    "feeds.wordpress.com",
    "stats.wordpress.com",
    "googleadservices.com",
    "tweet-this",
    "fmpub",
    "-ads",
    "_ads",
    "pheedo",
    "zemanta",
    "u.npr.org/iserver",
    "openx.org",
    "slashdot-it",
    "smilies",
    "/ico-",
    "commindo-media.de",
    "creatives.commindo-media",
    "doubleclick.net",
    "adview",
    "/feed.gif",
    ".ads.",
    "/avw.php",
    "wp-digg-this",
    "feed-injector",
    "/plugins/",
    "tweetmeme.com",
    "_icon_",
    "/ad-",
    "share-buttons",
    "buysellads",
    "holstee",
    "musictapp",
    "/ad_",
    "/button/",
    "donate.png",
    "/sponsors/",
    "googlesyndication.com",
    "/pagead",
    "/adx",
    "assets/feed-fb",
    "assets/feed-tw",
    "feedburner.com/~ff",
    "gstatic.com",
    "feedsportal.com/social",
    "pi.feedsportal.com",
    "tweetmeme.com",
    "wp-digg-this",
    "advertisement.gif",
    "share-buttons",
    "/plugins/",
    "assets/feed-",
    "feedproxy.google",
    "feeds.feedblitz.com/_",
    "wordpress.com/i/blank.jpg",
    "pixel.wp.com",
    "assets.feedblitz.com/i",
    "ga-beacon.appspot.com",
    "www.google.com/intl/en/logos",
  ];

  JSONEntry._allExcludePatterns = new Array().concat(JSONEntry._visualExcludePatterns, JSONEntry._adExcludePatterns);

  JSONEntry.shouldExcludeVisual = function(url) {
    if (url == null)
      return true;

    for (var i = 0; i < this._visualExcludePatterns.length; i++) {
      if (url.indexOf(this._visualExcludePatterns[i]) > -1)
        return true;
    }

    if (this.metadata.moreable == true || this.asText().length < 400 || this.webfeeds.adPlatform != null) {
      for (var i = 0; i < this._adExcludePatterns.length; i++) {
        if (url.indexOf(this._adExcludePatterns[i]) > -1)
          return true;
      }
    }

    return false;
  };

  JSONEntry.isVisualCandidate = function(aVisual) {
    if (aVisual == null || aVisual.url == null)
      return false;

    if (aVisual.featured == true)
      return true;

    var url = aVisual.url;
    for (var i = 0; i < this._allExcludePatterns.length; i++) {
      if (url.indexOf(this._allExcludePatterns[i]) > -1)
        return false;
    }

    return true;
  };

  JSONEntry.lookupVisual = function(url) {
    var visuals = this.listAllVisuals();
    for (var i = 0; i < visuals.length; i++) {
      if (visuals[i].url == url)
        return visuals[i];
    }

    return null;
  };

  JSONEntry.enrichVisual = function(url, width, height) {
    // make sure that no black listed image can be assigned as a featured visual.
    for (var i = 0; i < this._allExcludePatterns.length; i++) {
      if (url.indexOf(this._allExcludePatterns[i]) > -1)
        return;
    }

    this.metadata.sized = true;

    var found = false;

    var allVisuals = this.listAllVisuals();
    for (var i = 0; i < allVisuals.length; i++) {
      if (allVisuals[i].url == url) {
        allVisuals[i].width = width;
        allVisuals[i].height = height;
        allVisuals[i].sized = true;
        found = true;
      }
    }

    var contentVisuals = this.listContentVisuals();
    for (var i = 0; i < contentVisuals.length; i++) {
      if (contentVisuals[i].url == url) {
        contentVisuals[i].width = width;
        contentVisuals[i].height = height;
        contentVisuals[i].sized = true;
        found = true;
      }
    }

    if (found == false) {
      allVisuals.unshift({
        url: url,
        width: width,
        height: height,
        external: true
      });

      contentVisuals.unshift({
        url: url,
        width: width,
        height: height,
        external: true
      });
      this.metadata.embeddedVisuals = contentVisuals.length;

      this.metadata.externalVisual = {
        url: url,
        width: width,
        height: height
      };
    }
  };

  JSONEntry._extractVisuals = function() {
    var visuals = [];

    // extract images from content or summary - to the best effort to also extract image
    // height and width because this will help use in the selection of the top 3 articles.
    visuals = devhd.utils.HTMLUtils.listImages(this.getContent());

    if (visuals.length == 0)
      visuals = devhd.utils.HTMLUtils.listImages(this.getSummary());

    var index = {};

    for (var i = 0; i < visuals.length; i++)
      index[visuals[i].url] = true;

    // If the feed includes RSS thumbnail metadata, include this in the feed.
    //
    if (this.jsonInfo.thumbnail != null && this.jsonInfo.thumbnail.length > 0) {
      for (var i = 0; i < this.jsonInfo.thumbnail.length; i++) {
        // For techcrunch, we can remove cropping to get the biggest image possible.
        //
        if (this.getFeedId() != null && this.getFeedId().toLowerCase().indexOf("techcrunch") > -1) {
          this.jsonInfo.thumbnail[i].url = this.jsonInfo.thumbnail[i].url.split("?")[0];
          this.metadata.greatThumbnail = {
            url: this.jsonInfo.thumbnail[i].url
          };
          this.jsonInfo.thumbnail[i].great = true;
          this.jsonInfo.thumbnail[i].thumbnail = true;

          if (index[this.jsonInfo.thumbnail[i].url] == null)
            visuals.unshift(this.jsonInfo.thumbnail[i]);
        } else if (this.getFeedId() != null &&this.getFeedId().toLowerCase().indexOf("ommalik") > -1) {
          this.jsonInfo.thumbnail[i].url = this.jsonInfo.thumbnail[i].url.split("?")[0];
          this.metadata.greatThumbnail = {
            url: this.jsonInfo.thumbnail[i].url
          };
          this.jsonInfo.thumbnail[i].great = true;
          this.jsonInfo.thumbnail[i].thumbnail = true;

          if (index[this.jsonInfo.thumbnail[i].url] == null)
            visuals.unshift(this.jsonInfo.thumbnail[i]);
        } else if (this.jsonInfo.thumbnail[i].url.indexOf("blogspot") > -1) {
          // http://1.bp.blogspot.com/-AFFlt7Je390/U7qkgMwdmiI/AAAAAAAAPGw/136pbJBtcIw/s72-c/MARGARITACOOKIES.jpg
          var that = this;
          this.jsonInfo.thumbnail[i].url = this.jsonInfo.thumbnail[i].url.replace(/(.*)\/s[0-9]+(\-c)*.*/gi, function(match, part1) {
            if (match != null && part1 != null) {
              that.metadata.greatThumbnail = {
                url: part1 + "/"
              };
              return part1 + "/";
            } else {
              return that.jsonInfo.thumbnail[i].url;
            }
          });

          this.jsonInfo.thumbnail[i].great = true;
          this.jsonInfo.thumbnail[i].thumbnail = true;
          delete this.jsonInfo.thumbnail[i].width;
          delete this.jsonInfo.thumbnail[i].height;

          if (index[this.jsonInfo.thumbnail[i].url] == null)
            visuals.unshift(this.jsonInfo.thumbnail[i]);
        } else if (this.jsonInfo.thumbnail[i].width != null && parseInt(this.jsonInfo.thumbnail[i].width) > 400 && this.jsonInfo.thumbnail[i].height != null && parseInt(this.jsonInfo.thumbnail[i].height) > 400) {
          // we are only interested in larger visuals
          //
          this.jsonInfo.thumbnail[i].thumbnail = true;
          this.jsonInfo.thumbnail[i].great = true;

          if (index[this.jsonInfo.thumbnail[i].url] == null)
            visuals.unshift(this.jsonInfo.thumbnail[i]);
        }
      }
    }

    // add potential images attached as enclosures
    var enc = this.getEnclosure("image");
    if (enc != null && enc.href != null && index[enc.href] == null) {
      // EK. The flickr enclosures can be very large, so let's have them as the last
      // option because most of the time, the flickr feeds will have a smaller more
      // appropriate visual which we can use.
      if (enc.href.indexOf("flickr.com") == -1)
        visuals.unshift({
          url: enc.href,
          width: enc.width,
          height: enc.height,
          enclosure: true,
          featured: enc.featured
        });
      else
        visuals.push({
          url: enc.href,
          width: enc.width,
          height: enc.height,
          enclosure: true,
          featured: enc.featured
        });
    }

    // add potential video thumbnails
    var ytvisual = devhd.utils.VideoUtils.extractThumbnail(this.getContentOrSummary());
    if (ytvisual != null)
      visuals.push(ytvisual);

    ytvisual = devhd.utils.VideoUtils.extractThumbnail(this.getAlternateLink());
    if (ytvisual != null)
      visuals.push(ytvisual);

    // filter out smaller images
    var filtered = [];
    var duplicates = {};
    for (var i = 0; i < visuals.length; i++) {
      var aVisual = visuals[i];

      if (aVisual.url.indexOf("http://www.yatzer.com/") == 0 && aVisual.url.indexOf("thumb.jpg") > -1) {
        aVisual.width = 640;
        aVisual.height = 396;
      } else if (aVisual.url.indexOf("http://images.veerle.duoh.com") == 0) {
        // in the case of veerle try to see if a bigger image is available.
        filtered.push({
          url: aVisual.url.replace(".jpg", "-big.jpg")
        });
      }
      // special daily motion logic
      else if (aVisual.url.indexOf("jpeg_preview_medium.jpg") > -1) {
        aVisual.url = aVisual.url.replace(new RegExp("jpeg_preview_medium.jpg", "gi"), "jpeg_preview_large.jpg");
        aVisual.width = 424;
        aVisual.height = 240;
      }

      aVisual.surface = (aVisual.height == null || aVisual.width == null) ? (aVisual.great ? 100000 : 0) : (aVisual.height * aVisual.width);

      // avoid duplicates
      if (duplicates[aVisual.url] != null) {
        var existingVisual = duplicates[aVisual.url];

        if (existingVisual.width == null)
          existingVisual.width = aVisual.width;

        if (existingVisual.height == null)
          existingVisual.height = aVisual.height;

        if (aVisual.width != null && existingVisual.width != null)
          existingVisual.width = Math.max(aVisual.width, existingVisual.width);

        if (aVisual.height != null && existingVisual.height != null)
          existingVisual.height = Math.max(aVisual.height, existingVisual.height);
      } else {
        filtered.push(aVisual);
        duplicates[aVisual.url] = aVisual;
      }
    }

    // Enrich visuals with their edge representation
    //
    for(var i = 0; i < filtered.length; i++){
      if( filtered[ i ].url != null ) {
        filtered[i].proxy = this.buildProxyUrl(filtered[ i ].url);
      }
    }

    return filtered;
  };

  JSONEntry.contentEmbedsVideo = function() {
    var urls = devhd.utils.HTMLUtils.listEmbeddings(this.getContent(), []);
    if (urls.length > 0)
      return true;
    else
      return devhd.utils.HTMLUtils.listEmbeddings(this.getSummary(), []).length > 0;

  };

  JSONEntry._extractEmbeds = function() {
    var urls = devhd.utils.HTMLUtils.listEmbeddings(this.getContent(), this._videoExcludePatterns);
    if (urls.length == 0)
      urls = devhd.utils.HTMLUtils.listEmbeddings(this.getSummary(), this._videoExcludePatterns);

    this.embeddedVideos = [];
    this.embeddedSlideShares = [];
    for (var i = 0; i < urls.length; i++) {
      if (urls[i].indexOf("slideshare") > -1)
        this.embeddedSlideShares.push(urls[i]);
      else
        this.embeddedVideos.push(urls[i]);
    }
  };

  JSONEntry.embedsSlideShare = function() {
    if (this.embeddedSlideShares == null)
      this._extractEmbeds();

    return this.embeddedSlideShares.length > 0;
  };

  JSONEntry._extractEnclosure = function() {
    if (this.jsonInfo.enclosure != null) {
      // In case this is a webfeeds enclosure, we know it is an image. Fix until we decide
      // the right way for the server to pass this information.
      if (this.jsonInfo.enclosure[0].type == null && this.jsonInfo.enclosure[0].featured == true)
        this.jsonInfo.enclosure[0].type = "image";

      return this.jsonInfo.enclosure[0];
    } else
      return null;
  };

  JSONEntry._extractEmbeddedLinks = function() {
    return devhd.utils.HTMLUtils.listLinks(this.getContentOrSummary());
  };

  JSONEntry.hasCategory = function(catLabel) {
    return this.hasCategoryId(devhd.utils.IdUtils.formatId("category", catLabel, this.userId));
  };

  JSONEntry.hasCategoryId = function(streamId) {
    for (var i = 0; i < this.jsonInfo.categories.length; i++)
      if (this.jsonInfo.categories[i].id == streamId)
        return true;

    return false;
  };

  JSONEntry.getDefaultTagOrCategory = function() {
    if (this.jsonInfo.tags != null) {
      for (var i = 0; i < this.jsonInfo.tags.length; i++) {
        if (this.jsonInfo.tags[i].label != null && this.jsonInfo.tags[i].label.indexOf("global.") == -1)
          return "#" + this.jsonInfo.tags[i].label.replace(" ", "", "gi").toLowerCase();
      }
    }

    if (this.jsonInfo.categories != null) {
      for (var i = 0; i < this.jsonInfo.categories.length; i++) {
        if (this.jsonInfo.categories[i].label != null && this.jsonInfo.categories[i].label.indexOf("global.") == -1)
          return "#" + this.jsonInfo.categories[i].label.replace(" ", "", "gi").toLowerCase();
      }
    }

    return null;
  };

})();

;

// From: lib/streets-1.0.js
"use strict";

(function() {
  var streets = devhd.pkg("streets");

  streets.create = function() {
    var state = "LOADED"; // LOADED	 : state until the first start call is performed
    // STOPPED  : waiting for the user to log-in
    // OFFLINE  : no access to the internet
    // STARTED  : up and running

    var that = devhd.model.createObservable("streets");

    var configurations = [];
    var full = {};
    var core = null;
    var dispatcher = null;
    var port = null; // chrome only
    var receivers = [];
    var services = {};
    var definitions = {};
    var proxies = {};
    var rot = [];
    var nextObject = 0;
    var offlineReason = null;
    var offlineDate = null;
    var document = null;
    var env = "firefox";
    var context = null;
    var isGadget = false;
    var queue = [];
    var optimized = false;
    var mode = null;
    var plan = "standard";
    var open = false;

    // list of scripts already included
    var scripts = {};
    var uuid = 0;

    that.version = "1.0.0";

    that.setEnvironment = function(e) {
      env = e;
    };

    that.isCore = function() {
      return that.pname == null;
    };

    that.getEnvironment = function() {
      if (env != null)
        return env;
      else if (core != null)
        return core.getEnvironment();
      else
        return env;
    };

    that.getMode = function() {
      return mode;
    };

    that.setMode = function(m) {
      mode = m;
    };

    that.getPlan = function() {
      return plan;
    };

    that.setPlan = function(p) {
      plan = p;
      switch (p) {
        case "pro":
          plan = "pro";
          break;

        case "business":
          plan = "business";
          break;

        default:
          plan = "standard";
      }
    };

    that.isProPlan = function() {
      return plan == "pro" || plan == "business";
    };

    that.isTeamPlan = function() {
      return plan == "business";
    };

    that.isBusinessPlan = function() {
      return that.isTeamPlan();
    };

    that.openStore = function() {
      open = true;
    };

    that.closeStore = function() {
      open = false;
    };

    that.isStoreOpen = function() {
      return open == true;
    };

    that.allowProFeatures = function() {
      return that.isProPlan() || that.isStoreOpen();
    };

    that.getUserId = function() {
      return context != null ? context.userId : null;
    };

    that.getEnterpriseName = function() {
      return (context != null && context.profile) ? (context.profile.enterpriseDescription || context.profile.enterpriseName || context.profile.adHocEnterpriseName) : null;
    }

    that.isEnterpriseUnpaid = function() {
      return (context != null && context.profile && context.profile.enterpriseStatus === 'Unpaid');
    }

    that.hasEnterpriseAccess = function() {
      return that.getEnterpriseName() && !that.isEnterpriseUnpaid();
    }

    that.isUserAdmin = function() {
      return (context != null && context.profile && context.profile.enterpriseRoles != null) ?
        context.profile.enterpriseRoles.includes( "admin")
        :
        false;
    }

    that.getPhotoURL = function() {
      return context != null ? context.photoURL : null;
    };

    that.getEmail = function() {
      return (context != null && context.profile) ? context.profile.email : null;
    };

    that.setOptimized = function(value) {
      optimized = value;
    };

    that.isOptimized = function() {
      return optimized === true;
    };

    that.isEmbedded = function() {
      if (that.isGadget() == true)
        return true;

      if (document == null)
        return null;

      return document.location.href.indexOf("feedly.com/embed") > -1;
    };

    that.markAsGadget = function() {
      isGadget = true;
    };

    that.isGadget = function() {
      if (isGadget == true)
        return true;

      if (document == null)
        return null;

      return document.location.href.indexOf("#gadget") > -1;
    };

    that.getFLID = function() {
      if (that.getEnvironment() == "firefox") {
        return devhd.utils.FirefoxUtils.getPreference("welcome.flid");
      } else {
        return devhd.utils.BrowserUtils.getLocale() + "-" + "0" + "-" + "0" + "-" + devhd.utils.MD5Utils.hex_md5("welcome.flid" + that.getUserId());
      }
    };

    that.attachDocument = function(d) {
      document = d;
    };

    that.attachContext = function(c) {
      context = c;
    };

    that.getDocument = function() {
      return document;
    };

    that.connect = function(c) {
      if (c != null) {
        core = c;
        core.registerObserver(that);
      } else {
        dispatcher = createDispatcher(that.pname);
      }
    };

    that.askLogin = function(request, onComplete) {
      if (onComplete == null)
        onComplete = function() {};

      if (core != null) {
        core.doLogin(request, onComplete);
      } else {
        that.doLogin(request, onComplete);
      }
    };

    that.askLogout = function(onComplete) {
      if (core != null) {
        core.doLogout(onComplete);
      } else {
        that.doLogout(onComplete);
      }
    };

    that.askRefresh = function(){
      for (var i = 0; i < configurations.length; i++) {
        var aConfig = configurations[i];
        for (var aServiceName in aConfig) {
          try {
            if (services[aServiceName].askRefresh != null)
              services[aServiceName].askRefresh();
          } catch (e) {
            var msg = devhd.utils.ExceptionUtils.formatError(aServiceName + ".askRefresh", e);
            throw new Error(msg);
          }
        }
      }
    }

    that.askNetworkStatus = function(onOnline, onOffline) {
      devhd.utils.CloudUtils.askNetworkStatus(onOnline, onOffline);
    };

    that.doLogin = function(request, onComplete) {
      that.service("reader").fire("onBeforeIdentityChanged", "Logging in...");

      devhd.utils.CloudUtils.askLogin(request,
        function(userId) {
          that.askSyncIdentity("Logging in...");
        },
        function(errorCode, errorMessage) {
          devhd.fn.callback(onComplete, {
            code: errorCode,
            message: errorMessage,
          });
        }
      );
    };

    that.doLogout = function(onComplete) {
      that.service("reader").fire("onIdentityChanged", "Logging out...");

      devhd.utils.CloudUtils.askLogout(function() {
        $feedly("[core] Logout complete. Session cleared. Ask sync identity...");

        // Let OAuth trigger the identity sync
        that.askSyncIdentity("Logging out...");
      });
    };

    that.getState = function() {
      return state;
    };

    var bt = [];
    var btCount = 0;

    that.track = function(element, event) {
      var map = {
        element: element,
        event: event
      };
      bt.push(map);
      btCount++;
    };

    that.untrack = function(element, event) {
      for (var i = 0; i < bt.length; i++) {
        var aBinding = bt[i];
        if (aBinding.element == element && aBinding.event == event)
          bt.splice(i, 1);
      }
    };

    that.load = function(aConfig) {
      for (var k in aConfig)
        full[k] = aConfig[k];
    };

    function buildConfigurations() {
      configurations = [];

      // filter the configuration based on the environment
      var filtered = {};

      for (var sInfo in full) {
        if (full[sInfo].length != null) {
          for (var i = 0; i < full[sInfo].length; i++) {
            if ((mode != null && full[sInfo][i].environment == "@" + mode) || env == full[sInfo][i].environment || full[sInfo][i].environment == "others") {
              filtered[sInfo] = full[sInfo][i];
              break;
            }
          }
        } else {
          filtered[sInfo] = full[sInfo];
        }
      }

      configurations.push(filtered);
    }

    function processIdentity() {
      if (that.getUserId() != null)
        attachUser();
      else
        attachNoUser();
    }

    function attachUser() {
      for (var i = 0; i < configurations.length; i++) {
        var aConfig = configurations[i];
        for (var aServiceName in aConfig) {
          try {
            if (services[aServiceName].onUserIdentified != null)
              services[aServiceName].onUserIdentified(context || {});
          } catch (e) {
            var msg = devhd.utils.ExceptionUtils.formatError(aServiceName + ".onUserIdentified", e);
            throw new Error(msg);
          }
        }
      }
    }

    function upgradeUser() {
      for (var i = 0; i < configurations.length; i++) {
        var aConfig = configurations[i];
        for (var aServiceName in aConfig) {
          try {
            if (services[aServiceName].onUserUpgraded != null)
              services[aServiceName].onUserUpgraded(context || {});
          } catch (e) {
            var msg = devhd.utils.ExceptionUtils.formatError(aServiceName + ".onUserUpgraded", e);
            throw new Error(msg);
          }
        }
      }
    }

    function attachNoUser() {
      for (var i = 0; i < configurations.length; i++) {
        var aConfig = configurations[i];
        for (var aServiceName in aConfig) {
          try {
            if (services[aServiceName].onNoUserIdentified != null)
              services[aServiceName].onNoUserIdentified();
          } catch (e) {
            var msg = devhd.utils.ExceptionUtils.formatError(aServiceName + ".onNoUserIdentified", e);
            throw new Error(msg);
          }
        }
      }
    }

    function injectValue(service, property, value) {
      devhd.assert(value, "Property '" + property + "' is null, while trying to inject into service '" + service.id + "'");
      var fnName = "set" + property.charAt(0).toUpperCase() + property.substr(1),
        fn = service[fnName] || service["inject"];
      try {
        fn.call(service, value, property);
      } catch (e) {
        console.log(e)
        var msg = devhd.utils.ExceptionUtils.formatError("inject into:" + service.id + " using setter " + fnName + ".", e);
        throw msg;
      }
    }

    function R4() {
      return Math.floor(Math.random() * 10000);
    }

    // async to allow
    that.askStart = function(onComplete, onStatus) {
      var connected = false;
      that.pname = "page-" + new Date().getTime() + " -- " + R4() + "." + R4();

      // CHROME CONNECTION
      //
      if (that.getEnvironment() == "chrome") {
        // make sure that the core is ready. extract user id and proxy metadata from the
        devhd.utils.FlowUtils.parallelForEach({}, [100, 1000, 2000, 4000, 8000, 16000, 32000, 64000],
          function(delay, i, onSuccess, onError, onProgress) {
            // one of the previous attempts was successful. We can move on.
            if (connected == true) {
              devhd.fn.callback(onSuccess);
              return;
            }

            window.setTimeout(function() {

                if (connected == true)
                  return;

                if (i == 8) {
                  var propagated = false;

                  $feedly("Something is wrong. The core services are not responding.");
                  // we need to have a back up plan in case the core has not started listening
                  // and never responds to the health call.
                  var backupTimer = window.setTimeout(function() {
                      if (propagated == true)
                        return;

                      devhd.fn.callback(onStatus, "fail--core not listening");
                      devhd.fn.callback(onSuccess);

                      propagated = true;

                    },
                    1000
                  );

                  that.sendRequest({
                    type: "system",
                    topic: "health"
                  }, function(health) {

                    if (propagated == true)
                      return;

                    window.clearTimeout(backupTimer);

                    propagated = true;

                    devhd.fn.callback(onStatus, "fail--" + health);
                    devhd.fn.callback(onSuccess);
                  });

                  return;
                } else if (i > 0) {
                  var msg = "";
                  for (var j = 0; j < i; j++)
                    msg += ".";

                  devhd.fn.callback(onStatus, msg);
                }

                $feedly("[feedly][ask start] attempt #" + i);

                that.sendRequest({
                  type: "system",
                  topic: "metadata"
                }, function(response) {

                  if (response == null || response.state == null)
                    return devhd.fn.callback(onSuccess);

                  // make sure that only on of the N invocations can start the page strets
                  if (connected == true)
                    return;

                  switch (response.state) {
                    case "BUSY":
                      return devhd.fn.callback(onSuccess);

                    case "OFFLINE":
                      connected = true;
                      devhd.fn.callback(onStatus, "fail--" + response.reason);
                      devhd.fn.callback(onSuccess);
                      break;
                    case "STARTED":
                    default:
                      connected = true;
                      context = response.metadata.context;
                      definitions = response.metadata.definitions;


                      if (that.getEnvironment() == "chrome") {
                        // connect to core and be ready to receive messages
                        port = chrome.extension.connect({
                          name: that.pname
                        });
                        port.onMessage.addListener(function(msg) {
                          onMessage(msg);
                        });

                        port.onDisconnect.addListener(function(msg) {

                          // receives this event when chrome upgrade the extension
                          // and recycles core services. We need to reload to
                          // reconnect the page to the new core.
                          if (typeof reloadFeedly != "undefined")
                            reloadFeedly("Upgrading...");
                        });
                      }

                      that.start();

                      devhd.fn.callback(onComplete);
                  }
                });
              },
              delay
            );
          }
        );
      }
      // SAFARI
      //
      else if (that.getEnvironment() == "safari") {
        // make sure that the core is ready. extract user id and proxy metadata from the
        safari.self.addEventListener("message", messageDispatcher, false);

        devhd.utils.FlowUtils.parallelForEach({}, [1000, 5000, 25000],
          function(delay, i, onSuccess, onError, onProgress) {
            // one of the previous attempts was successful. We can move on.
            if (connected == true) {
              devhd.fn.callback(onSuccess);
              return;
            }

            window.setTimeout(function() {

                if (connected == true)
                  return;

                if (i == 2) {
                  var propagated = false;

                  $feedly("Something is wrong. The core services are not responding.");
                  // we need to have a back up plan in case the core has not started listening
                  // and never responds to the health call.
                  var backupTimer = window.setTimeout(function() {
                      if (propagated == true)
                        return;

                      devhd.fn.callback(onStatus, "fail--core not listening");
                      devhd.fn.callback(onSuccess);

                      propagated = true;

                    },
                    1000
                  );

                  that.sendRequest({
                    type: "system",
                    topic: "health"
                  }, function(health) {

                    if (propagated == true)
                      return;

                    window.clearTimeout(backupTimer);

                    propagated = true;

                    devhd.fn.callback(onStatus, "fail--" + health);
                    devhd.fn.callback(onSuccess);
                  });

                  return;
                } else if (i > 0) {
                  var msg = "";
                  for (var j = 0; j < i; j++)
                    msg += ".";

                  devhd.fn.callback(onStatus, msg);
                }

                $feedly("[feedly][ask start] attempt #" + i);

                that.sendRequest({
                  type: "system",
                  topic: "metadata"
                }, function(response) {

                  if (response == null || response.state == null)
                    return devhd.fn.callback(onSuccess);

                  // make sure that only on of the N invocations can start the page strets
                  if (connected == true)
                    return;

                  connected = true;

                  switch (response.state) {
                    case "BUSY":
                      break;

                    case "OFFLINE":
                      devhd.fn.callback(onStatus, "fail--" + response.reason);
                      devhd.fn.callback(onSuccess);
                      break;

                    case "STARTED":
                    default:
                      connected = true;
                      context = response.metadata.context;
                      definitions = response.metadata.definitions;

                      that.getDocument().defaultView.onbeforeunload = function() {
                        that.stop();
                      };

                      that.sendRequest({
                        type: "system",
                        topic: "connect.safari",
                        name: that.pname
                      });

                      that.start();

                      devhd.fn.callback(onComplete);
                  }
                });
              },
              delay
            );
          }
        );
      } else if (core != null) {
        /// FIREFOX PATH
        devhd.utils.FlowUtils.parallelForEach({}, [1000, 5000, 25000],
          function(delay, i, onSuccess, onError, onProgress) {
            // one of the previous attempts was successful. We can move on.
            if (connected == true) {
              devhd.fn.callback(onSuccess);
              return;
            }

            window.setTimeout(function() {

                if (connected == true)
                  return;

                if (i == 2) {
                  var health = core.getState() + "--" + core.getOfflineReason();

                  $feedly("Something is wrong. The core services are not responding:" + health);
                  devhd.fn.callback(onStatus, "fail--" + health);
                  devhd.fn.callback(onSuccess);
                  return
                } else if (i > 0) {
                  var msg = "";
                  for (var j = 0; j < i; j++)
                    msg += ".";

                  devhd.fn.callback(onStatus, msg);
                }

                $feedly("[feedly][ask metadata] attempt #" + i);

                core.doProcessRequest({
                  type: "system",
                  topic: "metadata"
                }, function(response) {

                  if (response == null || response.state == null)
                    return devhd.fn.callback(onSuccess);

                  // make sure that only on of the N invocations can start the page strets
                  if (connected == true)
                    return;

                  connected = true;

                  switch (response.state) {
                    case "BUSY":
                      break;

                    case "OFFLINE":
                      devhd.fn.callback(onStatus, "fail--" + response.reason);
                      devhd.fn.callback(onSuccess);
                      break;
                    case "STARTED":
                    default:

                      connected = true;
                      context = response.metadata.context;

                      that.getDocument().defaultView.onbeforeunload = function() {
                        that.stop();
                      };

                      core.doProcessRequest({
                        type: "system",
                        topic: "connect.firefox",
                        name: that.pname
                      });

                      that.start();

                      devhd.fn.callback(onComplete);
                  }
                });
              },
              delay
            );
          }
        );
      } else {
        that.start();
        devhd.fn.callback(onComplete);
      }
    };

    function createFactory(name) {

      if( typeof name === "function" )
        return name;

      var parts = name.split(".");

      // EK. In response to Andrew Williamson's feedly 3.5 request
      // Mozilla would like us to avoid using eval to create the factory. So we are going
      // to require/assume the the factory is of form devhd.x.y
      if (parts.length <= 1 || parts[0] != "devhd")
        return null;

      var r = devhd;

      for (var i = 1; i < parts.length && r != null; i++)
        r = r[parts[i]];

      return r;
    }

    // Make the start async to resolve a bizarre issue were reader was not able to make HTTP request
    // when resurecting from an offline situation.
    that.start = function() {
      if (state == "STARTED")
        return;

      uuid++;

      var phase, hint;

      try {
        buildConfigurations();

        that.lastErrorMessage = null;

        for (var i = 0; i < configurations.length; i++) {
          var aConfig = configurations[i];
          // create services

          phase = "creation";

          for (var aServiceName in aConfig) {
            var config = aConfig[aServiceName];

            phase = "creation." + aServiceName + " using " + config.factory;

            ///D $feedly( "creating service:" +  aServiceName + " -- " + JSON.stringify( config ) );

            config.fn = createFactory(config.factory);
            config.dependencies = config.dependencies || [];
            config.properties = config.properties || {};

            if (typeof config.fn != "function") {
              var msg = "failed to look up factory for :" + aServiceName + ". Hint: no function for " + config.factory;
              throw msg;
            }

            var aService = config.fn(aServiceName);
            if (aService == null) {
              var msg = "failed to look up factory for :" + aServiceName + ". Hint: factory = " + config.factory;
              throw msg;
            }

            services[aServiceName] = aService;


            //////////////////////////////////////////////////////////////////////////////////////////////////////////
            // ENRICH SERVICE COMPONENT
            //////////////////////////////////////////////////////////////////////////////////////////////////////////

            devhd.addFeature(aService, devhd.features.home);
            devhd.addFeature(aService, devhd.features.bind);

            // inject naming and management interface
            aService.setHome(that);

            ///D $feedly( "created service:" +  aServiceName );
          }

          // Inject properties
          phase = "injection";
          for (var aServiceName in aConfig) {
            var aService = services[aServiceName];
            var config = aConfig[aServiceName];

            ///D $feedly( "setting dependencies for:" +  aServiceName );

            for (var j = 0; j < config.dependencies.length; j++) {
              ///D $feedly( "injecting:" + config.dependencies[j] + " into " + aServiceName );
              injectValue(aService, config.dependencies[j], that.service(config.dependencies[j]));
            }

            for (var aPropName in config.properties) {
              var value = config.properties[aPropName];
              injectValue(aService, aPropName, value);
            }
          }

          phase = "loading";
          // initialize services
          for (var aServiceName in aConfig) {
            /// $feedly( "loading service:" +  aServiceName );
            if (services[aServiceName].load != null)
              services[aServiceName].load();

            /// $feedly( "loaded service:" +  aServiceName );
          }

          phase = "initialization";
          // initialize services
          for (var aServiceName in aConfig) {
            phase = "initialization." + aServiceName;

            ///D $feedly( "initializing service:" +  aServiceName );
            if (services[aServiceName].initialize != null)
              services[aServiceName].initialize();

            ///D $feedly( "initialized service:" +  aServiceName );
          }
        }

        phase = "process identity";
        processIdentity();

        state = "STARTED";

        // PROCESS PENDING REQUESTS
        phase = "process queue";
        for (var j = 0; j < queue.length; j++)
          queue[j].call(that);

        queue = [];

        /// $feedly( "start completed" );
      } catch (e) {
        console.log(e)
        var msg = devhd.utils.ExceptionUtils.formatError("load streets", e);
        that.goOffline("[" + phase + "] " + msg);
      }
    };

    that.askRefresh = function (onSuccess, onError){
      let refreshables = [];

      for (var i = 0; i < configurations.length; i++) {
        let aConfig = configurations[i];

        for (var aServiceName in aConfig) {
          let aService = that.service(aServiceName);
          if (aService.askRefresh != null){
            refreshables.push(aService);
          }
        }
      }

      // Ask all the services which have support for refresh to
      // refresh themselves - in parallel to optimize potential
      // async calls (example: reader getting the list of unread counts);
      devhd.utils.FlowUtils.parallelForEach({}, refreshables,
        (aService, i, onLocalSuccess, onLocalError) => {
          aService.askRefresh().then(onLocalSuccess, onLocalError);
        },{
          onSuccess: onSuccess,
          onError: onError
        }
      );
    };

    // OFFLINE MANAGEMENT
    that.getOfflineReason = function() {
      return offlineReason || "";
    };

    that.getOfflineDate = function() {
      return offlineDate;
    };

    /***
    When a user creates a new team, the server creates a new token which allows the
    user to upgrade to a business user and administrator of that team. This method
    allows John to upgrade the existing session and context to the new context.
    newSession is a map with id, refresh_token, access_token, expires_in and plan.
    ****/
    that.askUpgradeUser = function(newSession) {
      // Update the session with this session
      return new Promise( (resolve, reject) => {
        $feedly('[feedly] starting to upgrade identity...');

        newSession.feedlyId = newSession.id;
        newSession.feedlyRefreshToken = newSession.refresh_token;
        newSession.feedlyToken = newSession.access_token;
        newSession.feedlyExpiresIn = newSession.expires_in;
        newSession.feedlyExpirationTime = new Date().getTime() + newSession.expires_in * 1000 - 10000;
        newSession.plan = newSession.plan || "business";

        delete newSession.access_token;
        delete newSession.expires_in;
        delete newSession.id;
        delete newSession.token_type;
        delete newSession.refresh_token;

        devhd.utils.SessionUtils.save(newSession);

        devhd.utils.CloudUtils.askContext(
          {}, // OPTIONS
          function(context) { // ON USER IDENTIFIED
            try {
              if (!context || !context.userId) {
                return reject('Could not get new context');
              } else {
                that.attachContext(context);
                that.setPlan(context.plan);
                upgradeUser();

                resolve(context);

                $feedly('[core] identify upgraded');
              }
            } catch (e) {
              return reject('Could not attach new context:' + e.name + ' -- ' + e.message);
            }
          },
          // ON USER NOT IDENTIFIED
          function(status, msg) {
            return reject('Error getting new context:' + status + ' -- ' + msg);
          }
        );
      });
    };

    that.askSyncIdentity = function(cause) {
      $feedly("[feedly] starting to sync identity because:" + cause);
      that.syncing = true;
      that.syncTime = new Date().getTime();

      var currentId = that.getUserId();
      var currentEnvironment = that.getEnvironment();
      var currentDocument = that.getDocument();

      try {
        if (that.onBeforeIdentitySync != null)
          that.onBeforeIdentitySync.call(that, cause);
      } catch (ignore) {
        $feedly("[core][warning] failed to onBeforeIdentitySync because " + ignore.name + " -- " + ignore.message);
      }

      // Let all the clients now that we are changing our identidy and that they should reload
      try {
        if (state == "STARTED") {
          that.service("reader").fire("onIdentityChanged", cause);
        }
      } catch (e) {
        $feedly("[core][warning] failed to notify clients because:" + e.name + " -- " + e.message);
      }

      try {
        that.stop("identity re-sync"); // non-i18n
      } catch (ignore) {
        $feedly("[core][warning] failed to stop because " + ignore.name + " -- " + ignore.message);
      }

      devhd.utils.CloudUtils.askContext(
        {}, // OPTIONS
        function(context) { // ON USER IDENTIFIED
          that.syncing = false;

          try {
            var futureId = context != null ? context.userId : null;

            var t0 = new Date();
            $feedly("[core] switching identity (path 1) " + (currentId || "none") + " --> " + (futureId || "none") + ". core state:" + that.getState() + " -- plan:" + context.plan);
            that.attachContext(context);

            that.attachDocument(currentDocument);
            that.setEnvironment(currentEnvironment);

            that.setMode("cloud");

            that.setPlan(context.plan);

            that.start();

            try {
              if (that.onAfterIdentitySync != null)
                that.onAfterIdentitySync.call(that, futureId);
            } catch (ignore) {
              $feedly("[warning] failed to onAfterIdentitySync because:" + ignore.name + " -- " + ignore.message);
            }

            $feedly("[core] switched identity in " + (new Date() - t0) + " ms");
          } catch (e) {
            $feedly("[warning] failed to sync identity because:" + e.name + " -- " + e.message);
            console.log(e)
            that.goOffline("ask profile exception:" + e.name + " -- " + e.message);

            try {
              if (that.onAfterIdentitySync != null)
                that.onAfterIdentitySync.call(that, null, true);
            } catch (ignore) {
              $feedly("[warning] failed to onAfterIdentitySync because:" + ignore.name + " -- " + ignore.message);
            }
          }
        },
        // ON USER NOT IDENTIFIED
        function(status, msg, cloud) {
          that.syncing = false;

          // 504 seems to be related to Google Authentication propagation within the Google Infrastructure.
          // Try 2 times before giving up.
          if (status == 0 || parseInt(status) >= 500) {
            try {
              $feedly("[core] identity sync failed " + (currentId || "none") + " --> none. Status:" + status + " -- " + msg);

              that.goOffline("ask profile returned error code:" + status + ". message:" + msg);

              // We need to call this so that the core sets up the right set of listeners and
              // can reply to health and restart commands!
              try {
                if (that.onAfterIdentitySync != null)
                  that.onAfterIdentitySync.call(that, null, true);
              } catch (ignore) {
                $feedly("[warning] failed to onAfterIdentitySync because:" + ignore.name + " -- " + ignore.message);
              }
            } catch (e) {
              $feedly("[warning] failed to go offline because:" + e.name + " -- " + e.message);
            }
          } else {
            try {
              $feedly("[core] switching identity (path 2) " + (currentId || "none") + " --> none. Status:" + status + ". core state:" + that.getState() + ". cloud:" + true);

              that.attachContext(null);

              that.setMode("cloud");
              that.setPlan("standard");
              that.attachDocument(currentDocument);
              that.setEnvironment(currentEnvironment);

              that.start();
              try {
                if (that.onAfterIdentitySync != null)
                  that.onAfterIdentitySync.call(that, null);
              } catch (ignore) {
                $feedly("[warning] failed to onAfterIdentitySync because:" + ignore.name + " -- " + ignore.message);
              }
            } catch (e) {
              $feedly("[warning] failed to switch to no identity because:" + e.name + " -- " + e.message);
            }
          }
        }
      );
    };

    that.goOffline = function(reason) {
      $feedly("ask go offline. reason: " + reason);

      if (state == "OFFLINE")
        return;

      try {
        that.stop("going offline");
      } catch (e) {
        $feedly("[goOffline] trapping stop error: " + e.name + " -- " + e.message);
      }

      state = "OFFLINE";
      offlineReason = reason;
      offlineDate = new Date();

      $feedly("gone offline. reason: " + reason);
    };

    that.stop = function(cause) {
      try {
        if (state == "LOADED")
          return;

        if (state == "STOPPED")
          return;

        if (state == "STARTED") {
          for (var i = 0; i < connections.length; i++) {
            var aConnection = connections[i];
            aConnection.service.unregisterObserver(aConnection.relay);
          }

          ///D $feedly( "stopping streets because:" + cause );
          for (var i = configurations.length - 1; i > -1; i--) {
            var aConfig = configurations[i];

            // 0) unbinding clean up - just in case
            for (var aServiceName in aConfig) {
              if (services[aServiceName].unbindAll != null) {
                ///D $feedly( "unloading:" +  aServiceName );
                services[aServiceName].unbindAll();
              }
            }

            // 1) un-initialize services
            for (var aServiceName in aConfig) {
              if (services[aServiceName].uninitialize != null) {
                try {
                  // BDH: $feedly( "uninitializing:" +  aServiceName );
                  services[aServiceName].uninitialize();
                } catch (ignore) {
                  $feedly("[streets] failed to un-initialize:" + aServiceName + " --> " + ignore.name + " -- " + ignore.message);
                }
              }
            }

            // 3) unloads services
            for (var aServiceName in aConfig) {
              if (services[aServiceName].unload != null) {
                try {
                  ///D $feedly( "unloading:" +  aServiceName );
                  services[aServiceName].unload();
                } catch (ignore) {
                  $feedly("[streets] failed to unload:" + aServiceName + " --> " + ignore.name + " -- " + ignore.message);
                }
              }
            }

            // undo enrichment
            for (var aServiceName in aConfig) {
              delete services[aServiceName].home;
              delete services[aServiceName].element;
              delete services[aServiceName].bind;
              delete services[aServiceName].unbindAll;
            }

            // updating the list of services
            for (var aServiceName in aConfig)
              delete services[aServiceName];
          }
        }

        if (dispatcher != null) {
          if (that.getEnvironment() == "safari") {
            safari.self.removeEventListener("message", messageDispatcher, false);
          }

          if (port != null) {
            port.disconnect();
          } else {
            // notify core that we are going down!
            that.postMessage({
              type: "system",
              topic: that.getEnvironment() == "safari" ? "disconnect.safari" : "disconnect.firefox",
              name: that.pname
            });
          }

          dispatcher.destroy();
          dispatcher = null;
        } else if (core != null) {
          core.doProcessRequest({
            type: "system",
            topic: "disconnect.firefox",
            name: that.pname
          });
        } else {
          that.doProcessRequest({
            type: "system",
            topic: "disconnect.web",
            name: that.pname
          });
        }

        // clean up reference to core
        if (core != null)
          core.unregisterObserver(that);

        core = null;

        // REFERENCE CLEAN UP TO AVOID MEMORY LEAKS
        document = null;

        context = null;

        proxies = {};
        queue = [];

        // clear running object table
        if (rot.length > 0)
          $feedly("[street][running object table] leak of " + rot.length + " objects at cleanup time.");
        rot = [];

        if (bt.length > 0) {
          for (var i = 0; i < bt.length; i++) {
            $feedly("[street][binding] leak of " + bt[i].event + " at cleanup time.");
          }
          $feedly("[streets]" + (btCount - bt.length) + " bindings released correctly. Unrealeased:" + bt.length);
        }

        services = {};

        state = "STOPPED";

        $feedly("stopped streets because:" + cause);
      } catch (e) {
        state = "STOPPED";
        cosnole.log(e)
        $feedly("[streets] failed to stop because " + e.name + " -- " + e.message);
        that.goOffline("failed to stop because " + e.name + " -- " + e.message);
      }
    };

    that.askShutdown = function(onComplete) {
      that.stop("shutdown procedure");
      configurations = [];
      devhd.fn.callback(onComplete);
    };

    ///////////////////////////////////////////////////////
    // NAMING/DIRECTORY CAPABILITIES                     //
    ///////////////////////////////////////////////////////

    that.dumpServices = function() {
      $feedly("start streets dump");
      for (var k in services)
        $feedly("--- service:" + k);

      $feedly("end streets dump");
    };

    that.service = function(serviceName) {
      // is the service defined locally?
      var aService = services[serviceName];
      if (aService != null)
        return aService;

      // is the service defined on the parent street?
      if (core != null) {
        return core.service(serviceName);
      }

      // service not found
      return null;
    };

    // finds and returns the DOM interface of HTML element based on the context of the document
    // attached to the street.
    that.element = function(elementId, ownerDoc) {
      if (document == null && ownerDoc == null) {
        var msg = "[streets][element()] failed because no document attached to streets intance";
        $feedly(msg);
        throw new Error(msg);
      }

      return (ownerDoc || document).getElementById(elementId);
    };

    // RUNNING OBJECT TABLE
    that.object = function(rotId) {
      return rot[rotId];
    }

    that.rot = function(obj) {
      nextObject++;
      var rotId = "rot" + nextObject;

      obj._rotId = rotId;
      rot[rotId] = obj;

      return rotId;
    }

    that.unrot = function(obj) {
      var rotId = obj._rotId;
      if (rotId == null)
        return;

      delete rot[rotId];
      delete obj._rotId;

      return null;
    }

    that.getApplicationVersion = function() {
      return feedlyApplicationVersion;
    }

    function buildMetadata() {
      var defs = {};
      for (var i = 0; i < configurations.length; i++) {
        var aConfig = configurations[i];
        for (var aServiceName in aConfig) {
          var methods = [];

          var aService = services[aServiceName];

          for (var methodName in aService)
            if (methodName.indexOf("ask") == 0 || aServiceName == "io" || methodName.indexOf("test") == 0)
              methods.push(methodName);

          defs[aServiceName] = methods;
        }
      }

      return {
        context: context,
        definitions: defs
      };
    }

    // UTILITIES FOR THE PAGE TO COMMUNICATE WITH THE CORE. USED BY THE DISPATCHER
    var safariCorrelationCount = 0;
    var safariRequestCorrelationTable = {};

    that.sendRequest = function(request, callback) {
      if (that.getEnvironment() == "chrome") {
        chrome.extension.sendRequest(request, callback);
      } else if (that.getEnvironment() == "safari") {
        if (callback != null) {
          var cId = "correlation-" + (safariCorrelationCount++);
          safariRequestCorrelationTable[cId] = callback;
          request.correlationId = cId;
        }

        safari.self.tab.dispatchMessage("request", request);
      }
    };

    that.postMessage = function(message) {
      if (that.getEnvironment() == "chrome" && port != null) {
        port.postMessage(message);
      } else if (that.getEnvironment() == "safari") {
        safari.self.tab.dispatchMessage("post", message);
      }
    };

    // Page Receiving Message from the Core
    function messageDispatcher(event) {
      onMessage(event.message);
    }

    function onMessage(msg) {
      switch (msg.type) {
        case "system.event":
          /*
          document.getElementById( "feedlySystemBar"  ).style.display  = "block";
          document.getElementById( "feedlyMessageBar" ).style.display = "none";
          window.scroll( 0, 0 );
          */
          break;

        case "system.response":
          var cId = msg.correlationId;
          var callback = safariRequestCorrelationTable[cId];
          devhd.fn.callback(callback, msg);

          delete safariRequestCorrelationTable[cId];
          break;

        case "services.callback":
          if (dispatcher == null || that.getState() != "STARTED")
            return
          dispatcher.handleCallback(msg.requestId, msg.functionId, msg.params, msg.created);
          break;

        case "services.event":
          if (dispatcher == null || that.getState() != "STARTED")
            return
          dispatcher.handleEvent(msg.serviceName, msg.eventName, msg.params, msg.created);
          break;

        default:
      }
    }


    ////////////////////////////////////////////////////////////////////////////////////////
    // CHROME CROSS PROCESS UTILITIES
    ////////////////////////////////////////////////////////////////////////////////////////

    /// CORE SIDE
    var connections = [];
    var global_listeners_set = false;
    that.startListening = function() {
      // wire special observer so that we can propagate the event to the  dispatcher
      if (configurations != null) {
        for (var i = 0; i < configurations.length; i++) {
          var aConfig = configurations[i];
          for (var aServiceName in aConfig) {
            var aService = services[aServiceName];

            // starting in fail safe mode.
            if (aService == null)
              continue;

            var aRelay = createRelay(aServiceName);
            aService.registerObserver(aRelay);
            connections.push({
              service: aService,
              relay: aRelay
            });
          }
        }
      }

      // avoid multiple listeners!
      if (global_listeners_set == true)
        return;

      global_listeners_set = true;

      if (that.getEnvironment() == "chrome") {
        chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
          that.doProcessRequest(request, sendResponse);
        });

        chrome.extension.onConnect.addListener(function(port) {

          var rec = that.doProcessRequest({
            type: "system",
            topic: "connect",
            port: port,
            name: port.name
          });

          try {
            that.service("reader").askOnNewClient();
          } catch (e) {}

          var theUUID = uuid;

          port.onMessage.addListener(function(message) {

            switch (message.type) {
              case "system":
                that.doProcessRequest(message);
                break;

              case "services.initiate":
                if (rec == null) {
                  $feedly("[streets] received a services.initiate request but receiver is null.");
                  return;
                }

                rec.onRequest(message);
                break;

              default:
                $feedly("[core][chrome][on-message] unknown message type:" + message.type);
            }
          });

          port.onDisconnect.addListener(function(msg) {

            that.doProcessRequest({
              type: "system",
              topic: "disconnect",
              name: port.name
            });

            if (uuid != theUUID) {
              // core has been recycled. No need to contact it
              $feedly("[core] early abort of disconnect." + theUUID + " != " + uuid);
              return;
            }

            // HACK - WE NEED TO LET THE READER KNOW THAT A CLIENT HAS DISCONNECTED
            try {
              that.service("reader").askOnClientLeft();
            } catch (e) {}

          });
        });
      }

      if (that.getEnvironment() == "safari") {
        safari.application.addEventListener("message", function(event) {

            var message = event.message;

            switch (message.type) {
              case "system":
                // we need to determine if this is a one way of a two way call
                var sendResponse = null;
                if (message.correlationId != null) {
                  sendResponse = function(response) {
                    response.correlationId = message.correlationId;
                    response.type = "system.response";
                    event.target.page.dispatchMessage("response", response);
                  };
                }

                message.page = event.target.page;

                that.doProcessRequest(message, sendResponse);
                break;

              case "services.initiate":
                // determine the receiver for the page sending this message
                var client = message.client;

                var rec = findReceiverById(client, event.target.page);

                if (rec == null) {
                  $feedly("[core] service.initiate error. Receiver not found." + devhd.utils.JSONUtils.encode(message));
                  return;
                }

                // ask the receiver to process the message
                rec.onRequest(message);
                break;

              default:
                $feedly("[core][safari][on-message] unknown message type:" + message.type);
            }
          },
          false
        );
      }
    };

    that.listReceiversInfo = function() {
      var info = [];
      for (var i = 0; i < receivers.length; i++)
        info.push(receivers[i].id);

      return info;
    };

    that.doProcessRequest = function(request, sendResponse) {
      switch (request.topic) {
        case "connect.safari":
          try {
            that.doProcessRequest({
              type: "system",
              topic: "connect",
              name: request.name,
              port: new devhd.model.SafariPort(request.name, request.page)
            });
            try {
              that.service("reader").askOnNewClient();
            } catch (ignore) {
              $feedly("[streets] reader.askOnNewClient failed because " + ignore.name + " -- " + ignore.message);
            }
          } catch (e) {
            $feedly("[streets] doProcessRequest.connect#safari failed because " + e.name + " -- " + e.message);
          }
          break;


        case "connect.firefox":
          that.doProcessRequest({
            type: "system",
            topic: "connect",
            name: request.name
          });
          try {
            that.service("reader").askOnNewClient();
          } catch (e) {}
          break;

        case "connect.web":
          that.doProcessRequest({
            type: "system",
            topic: "connect",
            name: request.name
          });
          try {
            that.service("reader").askOnNewClient();
          } catch (e) {}
          break;

        case "connect":
          $feedly("[feedly][core] connect " + request.name);
          var rec = createReceiver(request.name, request.port);
          receivers.push(rec);
          return rec;

        case "disconnect.safari":
        case "disconnect.firefox":
          that.doProcessRequest({
            type: "system",
            topic: "disconnect",
            name: request.name
          });
          try {
            that.service("reader").askOnClientLeft();
          } catch (e) {}

          break;

        case "disconnect":
          var receiverFound = false;
          var rId = request.name;
          for (var i = 0; i < receivers.length && receiverFound == false; i++) {
            if (receivers[i].id == rId) {
              receivers[i].destroy();
              receivers.splice(i, 1);
              receiverFound = true;
            }
          }

          $feedly("[feedly][core] disconnect " + rId + " -- found:" + receiverFound);
          break;

        case "identity-sync":
          $feedly("[feedly][core] identity sync");
          that.askSyncIdentity("oauth detection");
          break;

        case "login":
          $feedly("[feedly][core] login");
          that.doLogin(request, sendResponse);
          break;

        case "logout":
          $feedly("[feedly][core] logout");
          that.doLogout(sendResponse);
          break;

        case "health":
          var h = state + "--" + (offlineReason || "");
          sendResponse(h);
          break;

        case "metadata":

          $feedly("[feedly][core] receiving metadata request. state:" + state);

          if (state == "OFFLINE" && offlineDate != null && ((new Date().getTime() - offlineDate.getTime()) / 1000 < 120)) {
            $feedly("[feedly][core] no metadata because recently offline. state:" + state + " -- " + that.getOfflineReason());
            sendResponse({
              state: "OFFLINE",
              reason: offlineReason,
              offlined: offlineDate.getTime()
            });
            return;
          }

          if (state == "OFFLINE" || state == "STOPPED") {
            // try to restart and then abort this request. The client will try a few more times before
            // giving up. May be it
            $feedly("[feedly][core] detected offline/stop mode. last offline reason:" + offlineReason);

            sendResponse({
              state: "BUSY",
              from: state
            });

            that.askSyncIdentity("resurect from state " + state);

            return;
          }

          if (state == "STARTED") {
            sendResponse({
              state: "STARTED",
              metadata: buildMetadata()
            });
            return;
          }

          break;

        case "mini":
          if (state == "STARTED") {
            var preferences = that.service("preferences");
            if (preferences != null && preferences.isReady() == true)
              sendResponse({
                enabled: preferences.getPreference("miniOnVersion7") == "yes",
                userId: that.getUserId(),
                tools: preferences.getPreference("favoriteTools"),
                bottom: preferences.getPreference("miniBottom"),
                exclude: preferences.getPreference("miniExcludeList")
              });
            else
              sendResponse({
                enabled: false
              });
          } else {
            sendResponse({
              enabled: false
            });
          }
          break;

        case "io":
          request.xhrOptions.onComplete = function(status, data, version) {
            sendResponse({
              status: status,
              data: data,
              version: version
            });
          };

          IO(request.xhrOptions);
          break;
      }
    };

    function createRelay(serviceName) {
      return function(aspect, a1, a2, a3, a4) {

        for (var i = 0; i < receivers.length; i++) {
          var fired = receivers[i].event(serviceName, aspect, a1, a2, a3, a4);

          if (fired == false)
            $feedly("[core] failed to relay event=" + serviceName + "." + aspect + " . Bad page:" + i + " of " + (receivers.length - 1));
        }
      };
    }

    function findReceiverById(client, page) {
      var rec = null;

      for (var i = 0; i < receivers.length; i++) {
        if (receivers[i].id == client) {
          rec = receivers[i];
          break;
        }
      }

      return rec;
    }

    function createReceiver(id, port) {
      var aReceiver = new devhd.model.Receiver();
      aReceiver.setId(id);
      aReceiver.setPort(port);
      aReceiver.setStreets(that);
      return aReceiver;
    }

    /// PAGE SIDE
    function createDispatcher(name) {
      var disp = new devhd.model.Dispatcher(name);
      disp.setStreets(that);
      return disp;
    }

    function createProxy(serviceName) {
      if (proxies[serviceName] == null) {
        proxies[serviceName] = new devhd.model.Proxy();
        proxies[serviceName].setServiceName(serviceName);
        proxies[serviceName].setDispatcher(dispatcher);

        // assign the right
        var def = definitions[serviceName];

        for (var i = 0; i < def.length; i++)
          proxies[serviceName].assignMethod(def[i]);
      }

      return proxies[serviceName];
    }

    return that;
  };
})();


(function() {
  var model = devhd.pkg("model")

  var generator = 0;

  var REQUEST_PROGRESS_INFO = {
    "reco": {
      "askStreamDigest": 2
    },
    "twitter": {
      "askSuggestUserFeeds": 0
    }
  };

  //////////////////////////////////////////////////////////////////////////////////////
  // CHROME DISPATCHER
  //////////////////////////////////////////////////////////////////////////////////////
  model.Dispatcher = function(name) {
    this.correlation = {};
    this.log = {};
    this.services = {};

    this.id = "dispatcher-" + name;
    this.name = name;
  };

  var Dispatcher = model.Dispatcher.prototype = new devhd.model.Observable();

  Dispatcher.setStreets = function(v) {
    streets = v;
  };

  Dispatcher.sendRequest = function(msg, onComplete) {
    streets.sendRequest(msg, onComplete);
  };

  Dispatcher.request = function(serviceName, methodName, args) {
    var request = {
      client: streets.pname,
      type: "services.initiate",
      id: generator++,
      service: serviceName,
      method: methodName
    };

    var params = [];
    var mapping = {};

    var fId = 0;

    for (var i = 0; i < args.length; i++) {
      var aParam = args[i];

      if (typeof aParam == "function") {
        var fPre = "###function";
        if (REQUEST_PROGRESS_INFO[serviceName] != null && REQUEST_PROGRESS_INFO[serviceName][methodName] == fId) {
          fPre += "-progress-";
        }

        var functionId = fPre + fId;
        params.push(functionId);
        mapping[functionId] = args[i];

        fId++;
      } else {
        params.push(args[i]);
      }
    }

    request.params = params;

    if (devhd.utils.MapUtils.size(mapping) > 0) {
      ///D $feedly( "[dispatcher][request][" + request.id + "]" + serviceName + "." + methodName );
      this.correlation[request.id] = mapping;
      this.log[request.id] = serviceName + "." + methodName;
    }

    ///D $feedly( "[dispatcher][request][" + request.id + "]" + serviceName + "." + methodName );
    if (streets != null)
      streets.postMessage(request);
  };

  Dispatcher.handleCallback = function(requestId, functionId, params, created) {
    try {
      ///D $feedly( "[page][handle-callback]" + requestId + " -- " + functionId );
      if (this.correlation[requestId] == null || this.correlation[requestId][functionId] == null) {
        $feedly("[page][handle-callback][ERROR][no correlation]" + requestId + " -- " + functionId + " aka. " + this.log[requestId] + " -- " + JSON.stringify(params));
        return;
      } else {
        ///D $feedly( "[page][handle-callback]" + requestId + " -- transfer:" + ( t0 - created ) + ", to object cost:" + ( new Date().getTime() - t0 ) + ", size:" + JSON.stringify( params ).length );
      }

      var t0 = new Date().getTime();
      var callbackFunc = this.correlation[requestId][functionId];

      // decode and enrich parameters
      var args = [];

      for (var i = 0; i < params.length; i++) {
        try {
          args.push(toObject(params[i]));
        } catch (e) {
          $feedly("[page][invalid-param]" + JSON.stringify(params[i]));
          throw e;
        }
      }

      // callback function
      callbackFunc.apply({}, args);

      // If the request has been completed, clear the correlation table
      if (functionId.indexOf("-progress-") == -1) {
        delete this.correlation[requestId];
        delete this.log[requestId];
      }
    } catch (e) {
      var callbackFunc = this.correlation[requestId][functionId];
      $feedly("[page][failed-callback]" + callbackFunc + " --> " + e.name + " -- " + e.message);
      throw e;
    }
  };

  Dispatcher.handleEvent = function(serviceName, eventName, params, created) {
    try {
      var aService = streets.service(serviceName);
      var t0 = new Date().getTime();

      // decode and enrich parameters
      var a0 = toObject(params[0]);
      var a1 = toObject(params[1]);
      var a2 = toObject(params[2]);
      var a3 = toObject(params[3]);
      var a4 = toObject(params[4]);

      ///D $feedly( "[page][handle-event]" + serviceName + "." + eventName + " -- transfer:" + ( t0 - created ) + ", to object cost:" + ( new Date().getTime() - t0 ) + ", size:" + JSON.stringify( params ).length );

      aService.fire(eventName, a0, a1, a2, a3, a4);
    } catch (e) {
      $feedly("[page][failed-event]" + serviceName + "." + eventName + " --> " + e.name + " -- " + e.message);
      throw e;
    }
  };

  Dispatcher.destroy = function() {
    delete this.correlation;
    delete this.services;
    delete this.log;

    streets = null;
  };

  //////////////////////////////////////////////////////////////////////////////////////
  // RECEIVER IS AN ENHANCEMENT TO PORT
  //////////////////////////////////////////////////////////////////////////////////////
  model.Receiver = function() {
    this.correlation = {};
  }

  var Receiver = model.Receiver.prototype = new devhd.model.Observable();

  Receiver.setId = function(id) {
    this.id = id;
  }

  Receiver.setPort = function(p) {
    this.port = p;
  }

  Receiver.onRequest = function(request) {
    try {
      if (request == null)
        throw new Error("invalid request");

      // Streets is no longer able to process this request.
      if (streets.getState() != "STARTED") {
        var err = {
          type: "system.event"
        }
        this.postMessage(err);
        return;
      }

      ///D $feedly( "[core][request][" + request.id + "]" + request.service + "." + request.method + " -- " + ( request.params == null ) );

      // marshall parameters
      var args = [];
      for (var i = 0; i < request.params.length; i++) {
        var aParam = request.params[i];
        if (typeof aParam == "string" && aParam.indexOf("###function") == 0) {
          args.push(createCallbackFunction(this, request.id, aParam));
        } else {
          args.push(toObject(aParam));
        }
      }

      // perform invocation
      var s = streets.service(request.service);
      s[request.method].apply(s, args);

      ///D $feedly( "[core][invoked][" + request.id + "]" + request.service + "." + request.method );
    } catch (e) {
      $feedly(devhd.utils.ExceptionUtils.formatError("receiver::" + request.service + "." + request.method, e));
    }
  }

  Receiver.postMessage = function(message) {
    if (this.port != null)
      this.port.postMessage(message);
  }

  Receiver.callback = function(requestId, functionId, args) {
    var params = [];

    var t0 = new Date().getTime();
    for (var i = 0; i < args.length; i++)
      params.push(toStructure(args[i]));

    var callback = {
      type: "services.callback",
      requestId: requestId,
      functionId: functionId,
      params: params,
      created: new Date().getTime()
    }

    ///D $feedly( "[core][callback][" + requestId + "][" +  functionId + "] to structure costed: " + ( new Date().getTime() - t0 ) );
    this.postMessage(callback);
  };

  Receiver.event = function(serviceName, eventName, a1, a2, a3, a4) {
    try {
      var params = [];

      var t0 = new Date().getTime();
      params.push(toStructure(a1));
      params.push(toStructure(a2));
      params.push(toStructure(a3));
      params.push(toStructure(a4));

      var event = {
        type: "services.event",
        serviceName: serviceName,
        eventName: eventName,
        params: params,
        created: new Date().getTime()
      };

      ///D $feedly( "[core][event][" + serviceName + "][" +  eventName + "] to structure costed: " + ( new Date().getTime() - t0 ) );
      this.postMessage(event);

      return true;
    } catch (e) {
      $feedly("[core][event][" + serviceName + "][" + eventName + "] failed because " + e.name + " -- " + e.message);
      return false;
    }
  };

  function isSpecialObject(obj) {
    return (obj instanceof devhd.atom.JSONEntry) || (obj instanceof devhd.model.Subscription) || (obj instanceof devhd.cloud.JSONEntry) || (obj instanceof devhd.cloud.Subscription);
  }

  function toStructure(obj) {
    if (obj == null)
      return null;

    if (typeof obj == "function")
      throw "object can not include function:" + obj;

    if (obj instanceof Date)
      return {
        __typeInfo: "Date",
        time: obj.getTime()
      };

    if (obj instanceof devhd.atom.JSONEntry || obj instanceof devhd.cloud.JSONEntry)
      return devhd.utils.EntryUtils.toJSON(obj);

    if (obj instanceof devhd.model.Subscription || obj instanceof devhd.cloud.Subscription)
      return devhd.utils.SubscriptionUtils.toJSON(obj);

    if (obj instanceof Array) {
      var encoded = [];
      for (var i = 0; i < obj.length; i++)
        encoded.push(toStructure(obj[i]));
      return encoded;
    }

    if (typeof obj == "object") {
      var encoded = {};
      for (var k in obj)
        encoded[k] = toStructure(obj[k]);
      return encoded;
    }

    return obj;
  }

  function isSpecialStructure(struc) {
    return struc.__typeInfo == "devhd.atom.JSONEntry" || struc.__typeInfo == "devhd.cloud.JSONEntry" || struc.__typeInfo == "devhd.model.Subscription" || struc.__typeInfo == "devhd.cloud.Subscription";
  }

  function toObject(struc) {
    if (struc == null)
      return null;

    if (typeof struc == "function")
      throw "structure can not include function " + struc;

    if (typeof struc == "object" && struc != null && struc.__typeInfo == "Date") {
      return devhd.utils.DateUtils.create(struc.time);
    }

    if (typeof struc == "object" && struc != null && struc.__typeInfo == "devhd.atom.JSONEntry") {
      return devhd.utils.EntryUtils.fromJSON(struc);
    }

    if (typeof struc == "object" && struc != null && struc.__typeInfo == "devhd.cloud.JSONEntry") {
      return devhd.utils.EntryUtils.fromJSON(struc);
    }

    if (typeof struc == "object" && struc != null && struc.__typeInfo == "devhd.model.Subscription")
      return devhd.utils.SubscriptionUtils.fromJSON(struc);

    if (typeof struc == "object" && struc != null && struc.__typeInfo == "devhd.cloud.Subscription")
      return devhd.utils.SubscriptionUtils.fromJSON(struc);

    if (struc instanceof Array) {
      var decoded = [];
      for (var i = 0; i < struc.length; i++)
        decoded.push(toObject(struc[i]))
      return decoded;
    }

    if (typeof struc == "object") {
      var decoded = {};
      for (var k in struc)
        decoded[k] = toObject(struc[k])
      return decoded;
    }

    return struc;
  }

  function createCallbackFunction(receiver, requestId, functionId) {
    return function() {
      receiver.callback(requestId, functionId, arguments);
    }
  }

  Receiver.setStreets = function(v) {
    streets = v
  }

  Receiver.destroy = function() {
    delete this.correlation;
    streets = null;
    this.port = null;
  };

  //////////////////////////////////////////////////////////////////////////////////////
  // PORT ABSTRACTION MODEL FOR SAFARI
  //////////////////////////////////////////////////////////////////////////////////////
  model.SafariPort = function(name, page) {
    this.name = name;
    this.page = page;
  }

  var SafariPort = model.SafariPort.prototype = new devhd.model.Observable();

  SafariPort.postMessage = function(message) {
    this.page.dispatchMessage(message.type, message)
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // PROXY IS AN ABSCTRATION TO A REMOTE SERVICE
  //////////////////////////////////////////////////////////////////////////////////////
  model.Proxy = function() {
    this.id = generator++;
  }

  var Proxy = model.Proxy.prototype = new devhd.model.Observable();

  Proxy.setServiceName = function(v) {
    this.serviceName = v;
  }

  Proxy.setDispatcher = function(v) {
    this.dispatcher = v;
  };

  Proxy.assignMethod = function(methodName) {
    // EK - Integrating feedback from Andrew Williamson and replacing new Function
    // by a simple annonymous.
    var that = this;
    this[methodName] = function() {
      that.dispatch(methodName, arguments);
    };
  };

  Proxy.dispatch = function(methodName, args) {
    this.dispatcher.request(this.serviceName, methodName, args);

    // generate and post request
    // {
    // 		conversationId: "XXXX",
    //   	serviceName: "reader",
    //		args:
    //		[
    //			json1,
    //			...
    //			{ type: "function", id: "YYYYY" }
    //		]
    // }
    //
    // expecting a response
    // {
    //		conversationId: "XXXX",
    //      callbackFunction: "YYYYY"
    //      args:
    //		[
    //			json1,
    //			...
    //			jsonN
    //		]
    //      As the json1,...,jsonN are converted into enriched objects (handling the use case for atom entries and subscriptions)
  }
})();

;

// From: lib/version.js
"use strict";

var feedlyMajorVersion = "30.0";
var feedlyApplicationVersion = "30.0.1231";
var feedlyBuildNumber = "135";
var feedlyEnjoyed = "enjoyed.10.x";

;

// From: lib/mini.js
"use strict";

(function() {
  var mini = devhd.pkg("mini");

  mini.FilterUtils = function() {
    var that = {};

    var MINI_BLACK_LIST = [
      "tuenti.com",
      "faqoverflow.com",
      "postrank.com",
      "mail.google.",
      "mail.yahoo.",
      "docs.google.",
      ".facebook.",
      "/adm/",
      "twitter.com",
      "feedly.com",
      "cloud.feedly.com",
      "netvibes.com",
      "feedly.com",
      "acidtests.org"
    ];

    that.ignore = function(url, customExclude) {
      try {
        // WALK THROUGH BLACKLIST
        for (var i = 0; i < MINI_BLACK_LIST.length; i++)
          if (url.indexOf(MINI_BLACK_LIST[i]) != -1)
            return true;

        if (customExclude != null && customExclude.length > 0) {
          var customList = customExclude.replace(" ", "", "gi").split(",");
          for (var i = 0; i < customList.length; i++)
            if (customList[i] != null && customList[i].length > 0 && url.indexOf(customList[i]) > -1)
              return true;
        }
      } catch (e) {
        // skip exception
      }

      return false;
    }

    var RE_SITE_GOOGLE_SEARCH = /\.google\./i;
    var RE_SITE_YAHOO_SEARCH = /\.yahoo[^\/]*\/search/i;
    var RE_SITE_YOUTUBE_SEARCH = /\.youtube[^\/]*\/results/i;
    var RE_SITE_MSN_SEARCH = /\.msn[^\/]*\/results.aspx/i;
    var RE_SITE_AMZN_SEARCH = /\.amazon[^\/]*\/s\//i;
    var RE_SITE_TWT_SEARCH = /twitter.*q=/i;
    var RE_SITE_WIKI_SEARCH = /\.wikipedia[^\/]*\/wiki/i;
    var RE_SITE_EBAY_SEARCH = /\.ebay\.[^\/]*/i;
    var RE_SITE_BING_SEARCH = /\.bing\.[^\/]*/i;

    that.extractSearchContext = function(url) {
      try {
        if (RE_SITE_GOOGLE_SEARCH.test(url) && url.indexOf("q=") > -1) {
          var q = devhd.utils.StringUtils.extractBetween(url, "q=", "&");
          if (q == null || q.content == null)
            return null;

          return decodeURIComponent(q.content).replace("+", " ", "g");
        }

        if (RE_SITE_BING_SEARCH.test(url) && url.indexOf("q=") > -1) {
          var q = devhd.utils.StringUtils.extractBetween(url, "q=", "&");
          if (q == null || q.content == null)
            return null;

          return decodeURIComponent(q.content).replace("+", " ", "g");
        }


        if (RE_SITE_EBAY_SEARCH.test(url)) {
          var q = devhd.utils.StringUtils.extractBetween(url, "_nkw=", "&");
          if (q == null || q.content == null)
            return null;

          return decodeURIComponent(q.content).replace("+", " ", "g");
        }


        if (RE_SITE_WIKI_SEARCH.test(url)) {
          var q = devhd.utils.StringUtils.extractBetween(url, "/wiki/", "&");
          if (q == null || q.content == null)
            return null;

          return decodeURIComponent(q.content).replace("_", " ", "g");
        }


        if (RE_SITE_YAHOO_SEARCH.test(url)) {
          var q = devhd.utils.StringUtils.extractBetween(url, "p=", "&");
          if (q == null || q.content == null)
            return null;

          return decodeURIComponent(q.content).replace("+", " ", "g");
        }

        if (RE_SITE_YOUTUBE_SEARCH.test(url)) {
          var q = devhd.utils.StringUtils.extractBetween(url, "search_query=", "&");
          if (q == null || q.content == null)
            return null;

          return decodeURIComponent(q.content).replace("+", " ", "g");
        }

        if (RE_SITE_MSN_SEARCH.test(url) && url.indexOf("q=") > -1) {
          var q = devhd.utils.StringUtils.extractBetween(url, "q=", "&");
          if (q == null || q.content == null)
            return null;

          return decodeURIComponent(q.content).replace("+", " ", "g");
        }

        // Disabling popup on amazone search pages - Elisa found these very annoying.
        if (RE_SITE_AMZN_SEARCH.test(url) && false) {
          var q = devhd.utils.StringUtils.extractBetween(url, "field-keywords=", "&");
          if (q == null || q.content == null)
            return null;

          return decodeURIComponent(q.content).replace("+", " ", "g");
        }

        if (url.indexOf("q=") > -1) {
          var q = devhd.utils.StringUtils.extractBetween(url, "q=", "&");
          if (q == null || q.content == null)
            return null;

          return decodeURIComponent(q.content).replace("+", " ", "g");
        }
      } catch (ignore) {
        // skip search overlay if we ran into an issue during the parsing.
      }
      return null;
    };


    return that;
  }();

  mini.UIUtils = function() {
    var ICON_24 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKTWlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVN3WJP3Fj7f92UPVkLY8LGXbIEAIiOsCMgQWaIQkgBhhBASQMWFiApWFBURnEhVxILVCkidiOKgKLhnQYqIWotVXDjuH9yntX167+3t+9f7vOec5/zOec8PgBESJpHmomoAOVKFPDrYH49PSMTJvYACFUjgBCAQ5svCZwXFAADwA3l4fnSwP/wBr28AAgBw1S4kEsfh/4O6UCZXACCRAOAiEucLAZBSAMguVMgUAMgYALBTs2QKAJQAAGx5fEIiAKoNAOz0ST4FANipk9wXANiiHKkIAI0BAJkoRyQCQLsAYFWBUiwCwMIAoKxAIi4EwK4BgFm2MkcCgL0FAHaOWJAPQGAAgJlCLMwAIDgCAEMeE80DIEwDoDDSv+CpX3CFuEgBAMDLlc2XS9IzFLiV0Bp38vDg4iHiwmyxQmEXKRBmCeQinJebIxNI5wNMzgwAABr50cH+OD+Q5+bk4eZm52zv9MWi/mvwbyI+IfHf/ryMAgQAEE7P79pf5eXWA3DHAbB1v2upWwDaVgBo3/ldM9sJoFoK0Hr5i3k4/EAenqFQyDwdHAoLC+0lYqG9MOOLPv8z4W/gi372/EAe/tt68ABxmkCZrcCjg/1xYW52rlKO58sEQjFu9+cj/seFf/2OKdHiNLFcLBWK8ViJuFAiTcd5uVKRRCHJleIS6X8y8R+W/QmTdw0ArIZPwE62B7XLbMB+7gECiw5Y0nYAQH7zLYwaC5EAEGc0Mnn3AACTv/mPQCsBAM2XpOMAALzoGFyolBdMxggAAESggSqwQQcMwRSswA6cwR28wBcCYQZEQAwkwDwQQgbkgBwKoRiWQRlUwDrYBLWwAxqgEZrhELTBMTgN5+ASXIHrcBcGYBiewhi8hgkEQcgIE2EhOogRYo7YIs4IF5mOBCJhSDSSgKQg6YgUUSLFyHKkAqlCapFdSCPyLXIUOY1cQPqQ28ggMor8irxHMZSBslED1AJ1QLmoHxqKxqBz0XQ0D12AlqJr0Rq0Hj2AtqKn0UvodXQAfYqOY4DRMQ5mjNlhXIyHRWCJWBomxxZj5Vg1Vo81Yx1YN3YVG8CeYe8IJAKLgBPsCF6EEMJsgpCQR1hMWEOoJewjtBK6CFcJg4Qxwicik6hPtCV6EvnEeGI6sZBYRqwm7iEeIZ4lXicOE1+TSCQOyZLkTgohJZAySQtJa0jbSC2kU6Q+0hBpnEwm65Btyd7kCLKArCCXkbeQD5BPkvvJw+S3FDrFiOJMCaIkUqSUEko1ZT/lBKWfMkKZoKpRzame1AiqiDqfWkltoHZQL1OHqRM0dZolzZsWQ8ukLaPV0JppZ2n3aC/pdLoJ3YMeRZfQl9Jr6Afp5+mD9HcMDYYNg8dIYigZaxl7GacYtxkvmUymBdOXmchUMNcyG5lnmA+Yb1VYKvYqfBWRyhKVOpVWlX6V56pUVXNVP9V5qgtUq1UPq15WfaZGVbNQ46kJ1Bar1akdVbupNq7OUndSj1DPUV+jvl/9gvpjDbKGhUaghkijVGO3xhmNIRbGMmXxWELWclYD6yxrmE1iW7L57Ex2Bfsbdi97TFNDc6pmrGaRZp3mcc0BDsax4PA52ZxKziHODc57LQMtPy2x1mqtZq1+rTfaetq+2mLtcu0W7eva73VwnUCdLJ31Om0693UJuja6UbqFutt1z+o+02PreekJ9cr1Dund0Uf1bfSj9Rfq79bv0R83MDQINpAZbDE4Y/DMkGPoa5hpuNHwhOGoEctoupHEaKPRSaMnuCbuh2fjNXgXPmasbxxirDTeZdxrPGFiaTLbpMSkxeS+Kc2Ua5pmutG003TMzMgs3KzYrMnsjjnVnGueYb7ZvNv8jYWlRZzFSos2i8eW2pZ8ywWWTZb3rJhWPlZ5VvVW16xJ1lzrLOtt1ldsUBtXmwybOpvLtqitm63Edptt3xTiFI8p0in1U27aMez87ArsmuwG7Tn2YfYl9m32zx3MHBId1jt0O3xydHXMdmxwvOuk4TTDqcSpw+lXZxtnoXOd8zUXpkuQyxKXdpcXU22niqdun3rLleUa7rrStdP1o5u7m9yt2W3U3cw9xX2r+00umxvJXcM970H08PdY4nHM452nm6fC85DnL152Xlle+70eT7OcJp7WMG3I28Rb4L3Le2A6Pj1l+s7pAz7GPgKfep+Hvqa+It89viN+1n6Zfgf8nvs7+sv9j/i/4XnyFvFOBWABwQHlAb2BGoGzA2sDHwSZBKUHNQWNBbsGLww+FUIMCQ1ZH3KTb8AX8hv5YzPcZyya0RXKCJ0VWhv6MMwmTB7WEY6GzwjfEH5vpvlM6cy2CIjgR2yIuB9pGZkX+X0UKSoyqi7qUbRTdHF09yzWrORZ+2e9jvGPqYy5O9tqtnJ2Z6xqbFJsY+ybuIC4qriBeIf4RfGXEnQTJAntieTE2MQ9ieNzAudsmjOc5JpUlnRjruXcorkX5unOy553PFk1WZB8OIWYEpeyP+WDIEJQLxhP5aduTR0T8oSbhU9FvqKNolGxt7hKPJLmnVaV9jjdO31D+miGT0Z1xjMJT1IreZEZkrkj801WRNberM/ZcdktOZSclJyjUg1plrQr1zC3KLdPZisrkw3keeZtyhuTh8r35CP5c/PbFWyFTNGjtFKuUA4WTC+oK3hbGFt4uEi9SFrUM99m/ur5IwuCFny9kLBQuLCz2Lh4WfHgIr9FuxYji1MXdy4xXVK6ZHhp8NJ9y2jLspb9UOJYUlXyannc8o5Sg9KlpUMrglc0lamUycturvRauWMVYZVkVe9ql9VbVn8qF5VfrHCsqK74sEa45uJXTl/VfPV5bdra3kq3yu3rSOuk626s91m/r0q9akHV0IbwDa0b8Y3lG19tSt50oXpq9Y7NtM3KzQM1YTXtW8y2rNvyoTaj9nqdf13LVv2tq7e+2Sba1r/dd3vzDoMdFTve75TsvLUreFdrvUV99W7S7oLdjxpiG7q/5n7duEd3T8Wej3ulewf2Re/ranRvbNyvv7+yCW1SNo0eSDpw5ZuAb9qb7Zp3tXBaKg7CQeXBJ9+mfHvjUOihzsPcw83fmX+39QjrSHkr0jq/dawto22gPaG97+iMo50dXh1Hvrf/fu8x42N1xzWPV56gnSg98fnkgpPjp2Snnp1OPz3Umdx590z8mWtdUV29Z0PPnj8XdO5Mt1/3yfPe549d8Lxw9CL3Ytslt0utPa49R35w/eFIr1tv62X3y+1XPK509E3rO9Hv03/6asDVc9f41y5dn3m978bsG7duJt0cuCW69fh29u0XdwruTNxdeo94r/y+2v3qB/oP6n+0/rFlwG3g+GDAYM/DWQ/vDgmHnv6U/9OH4dJHzEfVI0YjjY+dHx8bDRq98mTOk+GnsqcTz8p+Vv9563Or59/94vtLz1j82PAL+YvPv655qfNy76uprzrHI8cfvM55PfGm/K3O233vuO+638e9H5ko/ED+UPPR+mPHp9BP9z7nfP78L/eE8/sl0p8zAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAK7SURBVHja7Jk/TxphHMe/5wGDJuCtoiQsMsuABN9AibHGMndoYxpiTRsYHHShaZvGGqVN/9KBN3CLKyODASOksWlDQUn6Bkxkk7T67cKZErgT7o9Aer/kOxDI83w+xz0Pz/0QSGKUawwjXraALWAL2AK2wP8tAJKqMVCrAH4C+APgB4D7VvCRtERgGwC75NkoCOyowCt5PswCN8EreTGMArs9wit5OTCBLp/Z6xNeyauBCgAQAKTVAN1uN1OpFMfHxw1JWCLQgn+rBubxeHhwcECSzOfznJiY0JLYvu010DO8UrIs33Q7vb4tAQHAOy34QqHQBt9sNhmLxXpZEztWCwgA3mvBF4vFDviVlZV+FvauVQICgA9a8IeHh0bhleyZLSAA+KQ24eTkJI+Ojjrgl5eXqXN7ZWt3E8wQEAB87hd+aWnJCLySN2YIJNQmkCSJpVJJFT4UCvH4+Jhzc3NGJOJGBX6pwZfL5Q74xcVFAuD8/DzPz89JkmdnZwwGg3oFakYFug68tbXVAR+NRgmA4XD4Gl6pXC6nV6BpVOB7t4FdLhf39/dJkhcXF9fwkUikA/709JQzMzN6Bb4ZFYgBuOo2uNPpZDAYpM/nu4ZvNBpt8CcnJ5yentYLfwXgnhnb6FM1CSULCwsd8LVazSj8upk/ZE+0JNLpdBt8tVql1+s1Ar9mxVFiXU3C5XJRlmWSZKVS4dTUFAHQ7/frgY9beZhTlRAEgZIk0eFwEAA3NzdJkslkUje8VcfptZvWxMbGRtstlUgkeoF/pOc0OqajS/ARwOPWxF1rdna27XUgENAcsgX/5VYaW/+8F1f7JkRRZDabZb1eZyaToSiKWld+dWAP9a0rd6Vzt7kE8HAY2ip6JC4BPBimvtBdAF9bvVAt8N8ASgDumNUXEuy/WW0BW8AWsAVsgVGuvwMA8vh2EBI89HgAAAAASUVORK5CYII=";

    var FADED = 0.15;

    var that = {};

    var bottom = 20;

    that.injectCSS = function(doc, cssStyleSnippet) {
      var head, style;

      head = doc.getElementsByTagName("head")[0];

      if (head == null)
        return false;

      style = doc.createElement("style");
      style.setAttribute("type", "text/css");

      if (typeof navigator != "undefined" && navigator.userAgent.indexOf("AppleWebKit") > -1) {
        // WEBKIT
        style.innerText = cssStyleSnippet;
      } else {
        // FIREFOX
        style.innerHTML = cssStyleSnippet;
      }

      head.appendChild(style);

      return true;
    };

    var DEFAULT_SPACE = 20;

    that.insertIcon = function(win, b, onclick) {
      bottom = parseInt(b) || DEFAULT_SPACE;

      var doc = win.document;

      // Only inject feedly mini if we can set the style sheet for it to not appear in print!
      if (!that.injectCSS(doc, "@media print { #feedlyMiniIcon { display: none; } }"))
        return;

      var icon = doc.createElement("img");

      icon.id = "feedlyMiniIcon";
      icon.title = "feedly mini";
      icon.style.position = "fixed";
      icon.style.bottom = bottom + "px";
      icon.style.right = DEFAULT_SPACE + "px";
      icon.style.zIndex = 999999998;
      icon.style.cursor = "pointer";
      icon.style.border = "0px";
      icon.style.webkitTransition = "opacity 0.5s ease";
      icon.style.visibility = "visible";
      icon.style.width = "36px";
      icon.style.height = "36px";
      icon.style.maxHeight = "36px";
      icon.style.maxWidth = "36px";
      icon.style.overflow = "hidden";
      icon.style.display = "block";
      icon.style.padding = "0px";
      icon.style.border = "0px";
      icon.style.opacity = "0.5"

      icon.setAttribute("width", "36");
      icon.setAttribute("height", "36");

      icon.src = ICON_24;

      doc.body.appendChild(icon);

      bindEvent(icon, "click", onclick, false);

      bindEvent(icon, "mouseover", function() {
        icon.style.opacity = 1;
      }, false);

      bindEvent(icon, "mouseout", function() {
        icon.style.opacity = FADED;
      }, false);

      win.setTimeout(function() {
        icon.style.opacity = FADED;
      }, 750);

      var wordpressFollowElem = doc.getElementById("bit");
      if (wordpressFollowElem != null && wordpressFollowElem.className != null && wordpressFollowElem.className.indexOf("follow") > -1)
        wordpressFollowElem.style.display = "none";

      return icon;
    };

    that.insertPanel = function(doc, id) {
      var divElem = doc.createElement("div");

      divElem.id = id;

      divElem.style.position = "fixed";
      divElem.style.bottom = (bottom) + "px";
      divElem.style.right = DEFAULT_SPACE + "px";
      divElem.style.zIndex = 999999999;
      divElem.style.display = "none";
      divElem.setAttribute("border", "0");

      doc.body.appendChild(divElem);

      return divElem;
    };

    return that;
  }();

})();

;

// From: scripts/theme.js
"use strict";

window.feedlyPalette = ["#137ad8", "#8763a1", "#e5564d", "#ee3681", "#ff8900", "#58cded"];


window.feedlyFont = {
  h1: "sans-serif"
};

window.feedlyScrollbarWidth = 0;
window.feedlyListHeight = 29;
window.feedly999Plus = "1K+";

// DEFAULT FEEDLY THEME
window.feedlyTheme = {

  //
  background: "#EFEFEF",
  visual: "#CFCFCF",
  placeholder: "#888888",
  showcased: "#ECECEA",
  on: "#333333",
  links: "#3498DB",
  engagement: "#757575",
  hot: "#FF960B",
  notification: "#3979CC",
  bordered: "#D8D8D8",
  bordered_hi: "#A8A8A8",
  promoted: "#2EA3EA",
  team: "#f3803d",
  attention: "#DE2B2B",

  // text
  primary: "#333333",
  secondary: "#757575",
  tertiary: "#9e9e9e",

  // Inline
  il_back: "#F5F6F6",
  il_border: "#ebefee",

  // Background
  ba_back: "#3e3f43",
  ba_border: "#e3e7e7",
  ba_text: "#A0A0A0",
  ba_accent: "#666",
  ba_meta: "#A0A0A0",
  ba_accent2: "#666",
  ba_hover: "#E6E8E8",

  // Main
  ma_h2: "#9E9E9E",
  ma_back: "#FFFFFF",
  ma_accent: "#2bb24c",
  ma_pro: "#F60",
  ma_links: "#333333",
  ma_visited: "#888888",
  ma_text: "#333333",
  ma_summary: "#9E9E9E",
  ma_meta: "#9E9E9E",
  ma_bold: "#333333",
  ma_primary: "#4C8FFB",
  ma_actionBar: "#333333",
  ma_callforaction: "#107ED5",
  reading_text: "#333333",

  // left nav
  ln_meta: "#888888",

  // Side Area
  sa_back: "#d3dad9",
  sa_accent: "#666",
  sa_text: "#6A6A6A",
  sa_meta: "#A0A0A0",
  sa_links: "#1674c8",
  sa_hi: "#DAEEFE",

  se_color: "#494949",
  se_meta: "#BBBBBB",
  se_bollow: "#696969",
  se_separator: "#D0D0D0",
  se_back: "#ecece9",
  se_header: "#FFFFFF",
  se_block: "#FAFAF8",
  se_border: "#e8e8e6",
  se_website: "#3498db",

  se_opacity: 0.0,

  // Translation
  translated: "#fff3bb",
  tint: "light"
};

function feedlyIsFirefox() {
  return typeof navigator != "undefined" && navigator.userAgent.indexOf("Firefox") > -1;
}

function feedlyIsChrome() {
  return typeof navigator != "undefined" && navigator.userAgent.indexOf("Chrome") > -1;
}

function feedlyIsMac() {
  return typeof navigator != "undefined" && navigator.userAgent.indexOf("Mac") > -1;
}

function feedlyRadialBackground(c1, c2) {
  if (false && (feedlyIsChrome() == false || feedlyIsMac())) {
    return feedlyIsFirefox() ? "-moz-radial-gradient(circle cover, " + c1 + " , " + c2 + "  100%) fixed" : "-webkit-radial-gradient(40% 70%, circle cover, " + c1 + ", " + c2 + " 100%) fixed";
  } else {
    return c2;
  }
}

function feedlyRadialPlusBackground(c1, c2, c3) {
  if (feedlyIsChrome() == false || feedlyIsMac()) {
    return feedlyIsFirefox() ? "-moz-radial-gradient(circle cover, " + c1 + " , " + c2 + "  100%) fixed" : "-webkit-radial-gradient(50% 50%, circle cover, " + c1 + ", " + c2 + " 70%, " + c3 + " 100%) fixed";
  } else {
    return c2;
  }
}

window.feedlyPersonas = {
  gray: {
    background: "#EFEFEF",
    foundation: "#eee",
    tint: "light",
    se_opacity: 0.05,
    ma_accent: "#2bb24c", // #57AD68", // "#41B520", // "#6cc655", // "#3498db", // "#1f83c7",
    label: "Modern Gray"
  },
  classic: {
    background: "#DDDDDD",
    foundation: "#DDDDDD",
    tint: "light",
    se_opacity: 0.05,
    ma_accent: "#2bb24c",
    label: "Classic Gray"
  },
  asbestos: {
    background: "#4d5250",
    foundation: "#4d5250",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#2bb24c",
    label: "Asbestos"
  },
  blackcats: {
    background: "#2A2B2F",
    foundation: "#2A2B2F",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#2bb24c",
    label: "Black Cats"
  },
  lime: {
    background: "#EEEEEE",
    foundation: "#eee",
    tint: "light",
    se_opacity: 0.05,
    ma_accent: "#82BD1A",
    label: "Lime"
  },
  moai: {
    background: feedlyRadialBackground("#FFF", "#ded7be"),
    foundation: "#ded7be",
    tint: "light",
    se_opacity: 0.25,
    ma_accent: "#999999",
    label: "Moai"
  },
  socotra: {
    background: feedlyRadialBackground("#FFF", "#d2e4ad"),
    foundation: "#d2e4ad",
    tint: "light",
    se_opacity: 0.25,
    ma_accent: "#9FA05C",
    label: "Socotra"
  },
  bug: {
    background: feedlyRadialBackground("#FFF", "#bbdcc6"),
    foundation: "#bbdcc6",
    tint: "light",
    se_opacity: 0.2,
    ma_accent: "#f8cd02",
    label: "Bug"
  },
  spring: {
    background: feedlyRadialBackground("#b7ebd5", "#627e72"),
    foundation: "#627e72",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#bdbf85",
    label: "Spring"
  },
  pianist: {
    background: feedlyRadialBackground("#b0d2ed", "#4777b4"),
    foundation: "#4777b4",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#b3df00",
    label: "Pianist"
  },
  purplecats: {
    background: feedlyRadialBackground("#a06daf", "#4f3262"),
    foundation: "#4f3262",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#ffc300",
    label: "Purple Cats"
  },
  quiet: {
    background: feedlyRadialBackground("#A94250", "#641254"),
    foundation: "#641254",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#ffc300",
    label: "Quiet"
  },
  elephants: {
    background: feedlyRadialBackground("#F89738", "#842107"),
    foundation: "#842107",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#f76837",
    label: "Elephants"
  },
  chess: {
    background: feedlyRadialBackground("#988964", "#342C12"),
    foundation: "#342C12",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#D6A300",
    label: "Chess"
  },
  orange: {
    background: "#f39c12",
    foundation: "#f39c12",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#f39c12",
    label: "Orange"
  },
  midnight: {
    background: "#2c3e50",
    foundation: "#2c3e50",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#2BB24C",
    label: "Midnight"
  },
  greansea: {
    background: "#16a085",
    foundation: "#16a085",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#16a085",
    label: "Green Sea"
  },
  belize: {
    background: "#2980b9",
    foundation: "#2980b9",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#2980b9",
    label: "Belize"
  },
  giraffe: {
    background: "#2bb24c",
    foundation: "#2bb24c",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#2bb24c",
    label: "Nephritis"
  },
  pumkin: {
    background: "#d35400",
    foundation: "#d35400",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#d35400",
    label: "Pumkin"
  },
  wisteria: {
    background: "#8e44ad",
    foundation: "#8e44ad",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#8e44ad",
    label: "Wisteria"
  },
  pomgranate: {
    background: "#c0392b",
    foundation: "#c0392b",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#c0392b",
    label: "Pomgranate"
  },
  white: {
    background: feedlyRadialBackground("#FFF", "#FFF"),
    foundation: "#FFF",
    tint: "light",
    se_opacity: 0.2,
    ma_accent: "#3498db",
    label: "White"
  },
  mac: {
    background: "#2A2B2F",
    foundation: "#2A2B2F",
    tint: "dark",
    se_opacity: 0.2,
    ma_accent: "#2bb24c",
    label: "Mac App"
  },
};

//A set of parameters we use to implement the new feedly fx style guide
window.feedlyFX = {
  // COLORS - TODO simplify the number of colors
  colorAccent: "#2BB24C", // feedly green
  colorPro: "#FF6600", // feedly Pro orange
  colorHot: "#FF960B", // highly engaging content
  colorWarning: "orange", // Enterprise dashboard > users who are inactive
  colorDanger: "#E94f5f", // Error messages, deleting tags, accounts (red)
  colorSecure: "#F3803D", // private business feeds
  colorNotification: "#3979CC", // the background of the blue bar at the top

  // TEXT - Leveraging material design best practices
  textColorPrimary: "#212121", // 87%
  textColorSecondary: "#757575", // 54%
  textColorTertiary: "#9E9E9E", // 38%

  textColorPrimaryDark: "#FFFFFF", // 100%
  textColorSecondaryDark: "rgba( 255, 255, 255, 0.7 )",
  textColorTertiaryDark: "rgba( 255, 255, 255, 0.3 )",

  // PLACEHOLDER
  placeholderTextColor: "#CECECE",
  placeholderBackgroundColor: "#F2F2F2", // 5%

  // BORDERS
  borderColor: "rgba( 0, 0, 0, 0.15 )",
  borderColorHover: "rgba( 0, 0, 0, 0.40 )",
  borderColorImage: "rgba( 0, 0, 0, 0.05 )",

  // GRID AND SPACING
  gridPad: 16, // This is still temporary until we find a better way to model the grid.
  gridSpacing: 24, // This is still temporary until we find a better way to model the grid.
  gridButtonHeight: 40,

  grid630Column: 36,
  grid630Gutter: 18,

  grid840Column: 48,
  grid840Gutter: 24
}

;

// From: templates/templates.mini.js
// declare package:templates.mini
templates=templates || {};
templates.mini=templates.mini || {};
(function(){
var _L=devhd.i18n.L,$L=devhd.i18n.$L,$=[],$E="",$P=templates.mini;
function $A(_){var a=arguments,x;for(x=1;x<a.length;x++)_.push(a[x])}


// local function to each template class (short versions that refer to full package names)
var s3, $1, $2, $3, jsesc, x2;

try
{
	s3 = function (a) {return devhd.s3( "images/" + a ); };       // img resolve
	x2 = function (a) {return devhd.x2( "images/" + a ); };       // img resolve
    $1 = devhd.str.toSafeHTML;                                    // called by $( ... )
    $2 = devhd.str.toSafeAttr;                                    // called by $[ ... ]
	$3 = devhd.str.stripTags;                       			  // called by $< ... >
	jsesc = devhd.str.toJsEsc;                                    // jsesc ... needs to be killed
}
catch( ignore )
{
}


$P.layout=function(model, tools, home){var _=[];
$A(_,$[0]);
var title = model.title;
var url = model.url;
if( model.feedId != null ){
    $A(_,$[1]);
     var favIconURL = devhd.utils.WebUtils.getFavIconURL( model.website );
    $A(_,$[2],$2(encodeURIComponent( "subscription/" + model.feedId )),$[3],s3( 'mini-icon-plus@2x.png' ),$[4]);
}
if( home.getUserId() != null ){
    $A(_,$[5],s3( 'mini-icon-save@2x.png' ),$[6]);
}
$A(_,$[7],s3( 'mini-icon-email@2x.png' ),$[8],s3( 'mini-icon-twitter@2x.png' ),$[9],s3( 'mini-icon-facebook@2x.png' ),$[10],encodeURIComponent( document.location ),$[11],s3( 'mini-icon-google@2x.png' ),$[12],s3( 'mini-icon-buffer-white@2x.png' ),$[13]);
return _.join($E);
}
$P.largeNumber=function(ln){var _=[];
if( ln > 1000000 ){
    $A(_,$[14],Math.floor( ln / 1000000 ),$[15]);
}else if( ln > 1000 ){
    $A(_,$[14],Math.floor( ln / 1000 ),$[16]);
}else{
    $A(_,$[14],ln,$[17]);
}
return _.join($E);
}
$P.layout2=function(model, tools, home){var _=[];
if( model.feedInfo != null && model.feedInfo.id != null && model.feedInfo.title != null ){
     var favIconURL = devhd.utils.WebUtils.getFavIconURL( model.feedInfo.website );
    $A(_,$[18],$2(encodeURIComponent( model.feedId )),$[19]);
    if( model.feedInfo.subscribed != true ){
        $A(_,$[20]);
    }
    if( favIconURL != null ){
        $A(_,$[21],favIconURL,$[22]);
    }
    $A(_,$[23],model.feedInfo.title,$[24]);
    if( model.feedInfo.subscribers > 0 ){
        $A(_,$[14],model.feedInfo.subscribers,$[25]);
    }else{
        $A(_,$[26]);
    }
    $A(_,$[27]);
}
$A(_,$P.layoutTools( model, tools, false, home ));
return _.join($E);
}
$=[
"\n<div style=\"text-align:center; font-family: sans-serif; font-size:9px; color:#666666; font-weight:normal; letter-spacing:0px\">\n"," <div style=\"padding-bottom: 11px; margin: -5px; background-color: #41B520; padding-top: 5px; margin-bottom:0px\">\n","\n<a href=\"http://feedly.com/#","\" target=\"_blank\" style=\"text-decoration:none;color:inherit;display:block\" title=\"Preview this source in feedly\">\n<img src=\"","\" width=\"24\" height=\"24\" style=\"border:0px; margin-top: 0px; padding:4px\"/>\n<div id=\"feedlySubscribers\" style=\"font-weight:normal; color:rgba( 255, 255, 255, 0.6 )\">&nbsp;</div>\n</a>\n</div>\n"," <div style=\"margin-top:15px\">\n<img id=\"saveAction\" src=\"","\" width=\"24\" title=\"save for later\" height=\"24\" style=\"border:0px; cursor:pointer; padding:4px\" />\n</div>\n","\n<a href=\"#\" onclick=\"(function(){m='http://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su='+encodeURIComponent(document.title + ' [feedly]')+'&body='+encodeURIComponent(document.location + '\\n\\nvia http://www.feedly.com');w=window.open(m,'addwindow','status=no,toolbar=no,width=575,height=545,resizable=yes');setTimeout(function(){w.focus();},250);})(); return false\" style=\"text-decoration:none;color:inherit;display:block;font-weight:normal\">\n<img src=\"",
"\" title=\"email\" width=\"24\" height=\"24\" align=\"absmiddle\" style=\"margin-top:5px; border:0px; padding:4px\"/>\n</a>\n<a href=\"#\" onclick=\"(function(){ window.twttr={};var DD=550,AA=450,CC=screen.height,BB=screen.width,HH=Math.round((BB/2)-(DD/2)),GG=0;if(CC>AA){GG=Math.round((CC/2)-(AA/2))}; window.twttr.shareWin=window.open('http://twitter.com/share','','left=' + HH + ',top=' + GG + ',width=550,height=450,personalbar=0,toolbar=0,scrollbars=1,resizable=1'); function B(L){var M=[],K=0,J=L.length;for(;K<J;K++){M.push(L[K])}return M}function G(J){return encodeURIComponent(J).replace(/\\+/g,'%2B')}function C(L){var K=[],J;for(J in L){if(L[J]!==null&&typeof L[J]!=='undefined'){K.push(G(J)+'='+G(L[J]))}}return K.sort().join('&')}function H(){var K=document.getElementsByTagName('a'),Q=document.getElementsByTagName('link'),J=/\\bme\\b/,M=/^https?\\:\\/\\/(www\\.)?twitter.com\\/([a-zA-Z0-9_]+)$/,P=B(K).concat(B(Q)),O,S,L,N=0,R;for(;(R=P[N]);N++){S=R.getAttribute('rel');L=R.getAttribute('href');if(S&&L&&S.match(J)&&(O=L.match(M))){return O[2]}}}function F(K){var J;if(K.match(/^https?:\\/\\//)){return K}else{J=location.host;if(location.port.length>0){J+=':'+location.port}return[location.protocol,'//',J,K].join('')}}function I(){var J=document.getElementsByTagName('link');for(var K=0,L;(L=J[K]);K++){if(L.getAttribute('rel')=='canonical'){return F(L.getAttribute('href'))}}return null}var D=(function(){var K={text:decodeURIComponent(document.title),url:(I()||location.href),_:((new Date()).getTime())};var J=H();if(J){K.via=J}return C(K)}());var E=window.twttr.shareWin,A='http://twitter.com/share?hashtags=feedly&related=feedly&'+D;if(null===E){window.location.href=A}else{if(E&&E.open){E.location.href=A;E.focus()}}}());return false\" style=\"text-decoration:none;color:inherit;display:block;font-weight:normal\">\n<img src=\"","\" width=\"24\" title=\"tweet\" height=\"24\" style=\"margin-top:5px; border:0px; cursor:pointer; padding:4px\" />\n</a>\n<a href=\"#\" onclick=\"var d=document,f='http://www.facebook.com/share',l=d.location,e=encodeURIComponent,p='.php?src=bm&v=4&i=1289025326&u='+e(l.href)+'&t='+e(d.title);1;try{if (!/^(.*\\.)?facebook\\.[^.]*$/.test(l.host))throw(0);share_internal_bookmarklet(p)}catch(z) {a=function() {if (!window.open(f+'r'+p,'sharer','toolbar=0,status=0,resizable=1,width=626,height=436'))l.href=f+p};if (/Firefox/.test(navigator.userAgent))setTimeout(a,0);else{a()}}void(0);return false\" style=\"text-decoration:none;color:inherit;display:block;font-weight:normal\">\n<img src=\"","\" width=\"24\" title=\"post to facebook\" height=\"24\" style=\"margin-top:5px; border:0px; cursor:pointer; padding:4px\" />\n</a>\n<a href=\"https://plus.google.com/share?url=","\" onclick=\"javascript:var DD=600,AA=600,CC=screen.height,BB=screen.width,HH=Math.round((BB/2)-(DD/2)),GG=0;if(CC>AA){GG=Math.round((CC/2)-(AA/2))}; window.open( this.href, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,left=' + HH + ',top=' + GG + ', height=600,width=600');return false;\">\n<img src=\"","\" title=\"share on Google+\" width=\"24\" height=\"24\" align=\"absmiddle\" style=\"margin-top:5px; border:0px; padding:4px\"/>\n</a>\n<img id=\"bufferAction\" src=\"","\" width=\"24\" title=\"buffer\" height=\"24\" style=\"margin-top:5px; border:0px; cursor:pointer; padding:4px\" />\n<a href=\"http://feedly.com/#preferences/mini%20toolbar\" target=\"_blank\" style=\"text-decoration:none; display:block; font-weight:normal; color:#AAA; margin-top:12px\">\nPrefs\n</a>\n</div>\n"," ","M\n",
"K\n","\n","\n<div style=\"padding-bottom:6px; border-bottom: 1px solid #555555\">\n<a href=\"http://feedly.com/#subscription/","\" target=\"_blank\" style=\"text-decoration:none;color:inherit;display:block; font-weight:normal\">\n"," <div style=\"float:right; padding-left:10px; padding-right:10px; background-color:#65b114;-webkit-border-radius:3px; border-radius:3px; margin-left:5px\">+add</div>\n"," <img src=\"","\" width=\"16\" height=\"16\" align=\"absmiddle\" style=\"float:left; padding:2px; border:0px\"/>\n"," <div style=\"font-size:13px; margin-left:24px;height:22px; overflow:hidden;\">",
"</div>\n<div style=\"font-size:11px;color:#AAAAAA; margin-left:24px; margin-top: -4px\">\n"," reader\n"," be the first reader!\n"," </div>\n</a>\n</div>\n"]
})();
// strings=28 characters=5294

;

// From: streets-mini.js
// ---------------------------------------------------------------------
// FEEDLY AND ASSOCIATED MODULES
// ---------------------------------------------------------------------
miniStreets =
{
// ---------------------------------------------------------------------
// VARIOUS UI RELATED SERVICES
// ---------------------------------------------------------------------
	mini:
	{
		factory: "devhd.services.createMini",
		dependencies: [ "reader", "tinyURL", "repo" ]
	}
};

;
