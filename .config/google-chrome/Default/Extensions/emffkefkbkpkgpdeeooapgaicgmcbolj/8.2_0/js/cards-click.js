var lang = 'en';
var lastX, lastY;
//var stopwords=["I","a","about","an","are","as","at","be","by","com","for","from","how","in","is","it","of","on","or","that","the","this","to","was","what","when","where","who","will","with","the","www"];
//
//var stopDict = {};
//stopwords.forEach(function(word) {
//	stopDict[word] = true;
//});

var cardOptions={};
var syncSettings=function() {
	chrome.storage.sync.get({
		ocdShowInWikiwand: true,
		ocdShowInWebsites: true
	}, function(options) {
		cardOptions = options;
		//console.log('options', options);
	});
};
syncSettings();

var results = [];
$(document).ready(function() {
	$('body').on('click', function(event) {
		setTimeout(function() {
			$('#ww_hovercard').remove();
		}, 100);
		var nodeName = $(event.originalEvent.target).prop('nodeName').toLowerCase();
		//console.log('node name', nodeName);
		//if (nodeName == 'a' && !event.shiftKey) {return true;}
		if (!event.shiftKey && $(event.originalEvent.target).closest('a').length > 0) {
			console.log('detected link');
			return;
		}
		if (!event.shiftKey && window.location.hostname == 'mail.google.com'
			&& $(event.originalEvent.target).closest('tr').length > 0
			&& $(event.originalEvent.target).closest('table').children('colgroup').length >= 1) {
			// Element is inside a table that has <colgroup> as a direct child? This is a single mail row. skip.
			console.log('detected mail row in gmail');
			return;
		}
		if ($(event.originalEvent.target).prop('id')=='ww_hovercard') {
			console.log('click on hovercard');
			return true;
		}
		//console.log('event', event);
		if (window.location.hostname.indexOf('wikiwand')>-1 && !cardOptions.ocdShowInWikiwand) {
			return true;
		}
		if (window.location.hostname.indexOf('wikiwand')==-1 && !cardOptions.ocdShowInWebsites) {
			console.log('do not show on websites');
			return true;
		}
		if ((event.screenX == 0 && event.screenY == 0) || !event.originalEvent || event.isTrigger) {
			console.log('non-human click detected, skipping'); // Often triggered by Gmailius
			return true;
		}
		if (event.ctrlKey) {
			event.stopPropagation();
			console.log('ctrl click', event);
			lastX = event.clientX;
			lastY = event.clientY;
			var progressUrl = chrome.extension.getURL('images/cards/progress.gif');
			var b = getFullWord(event);
			if (b && b.length > 0) {
				$('#ww_progress').remove();
				var $newdiv1 = $("<div id='ww_progress'/>");
				$("body").append($newdiv1);
				$('#ww_progress').css({
					left: lastX + 20,
					top: lastY - 20,
					backgroundImage: 'url(' + progressUrl + ')'
				});
				chrome.extension.sendMessage({command: 'analytics-user'});
			}
			return false;
		}


	});
});
var getEditDistance = function(a, b) {
	if (a.length == 0) return b.length;
	if (b.length == 0) return a.length;

	var matrix = [];

	// increment along the first column of each row
	var i;
	for (i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}

	// increment each column in the first row
	var j;
	for (j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	// Fill in the rest of the matrix
	for (i = 1; i <= b.length; i++) {
		for (j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) == a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
					Math.min(matrix[i][j - 1] + 1, // insertion
						matrix[i - 1][j] + 1)); // deletion
			}
		}
	}

	return matrix[b.length][a.length];
};

var stringTest = function(item, str2) {
	var test1 = item.t.replace(/[-']/g, ' ').replace(/\W\s/g, '').toLowerCase();
	var test2 = str2.replace(/[-']/g, ' ').replace(/\W\s/g, '').toLowerCase();
	var dist = getEditDistance(test1, test2);
	var dist2 = 1000;
	if (item.re) {
		var test1 = item.re.trim().replace(/\W\s/g, '').toLowerCase();
		dist2 = getEditDistance(test1, test2);
	}
	return Math.min(dist, dist2);

};

var buildQuery = function(prev, word, next) {
	var query = '';
	if (prev.length > 0) {query += prev + ' '}
	if (word.length > 0) {query += word}
	if (next.length > 0) {query += ' ' + next}
	return query;
};
// Get the full word the cursor is over regardless of span breaks
function getFullWord(event) {
	console.log('get full word');
	var i, begin, end, range, textNode, offset;
	if (document.caretRangeFromPoint) {
		range = document.caretRangeFromPoint(event.clientX, event.clientY);
		textNode = range.startContainer;
		console.log('textNode',textNode);
		offset = range.startOffset;
	} else {
		return "";
	}

	// Only act on text nodes
	if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
		return "";
	}
	var data = textNode.textContent;
	//remove leading spaces
	//while ([10, 13].indexOf(data.charCodeAt(0)) > -1) {
	//	//if (data.charCodeAt(0) == 32) {
	//	//	offset = offset - 1;
	//	//}
	//	if (data.charCodeAt(0) == 10) {
	//		offset = offset - 3;
	//	}
	//	if (data.charCodeAt(0) == 13) {
	//		offset = offset - 3;
	//	}
	//	data = data.substring(1);
	//}
	console.log('data before ['+data+']');
	data = data.replace(/'s/g,' ');
	console.log('data after ['+data+']');
	console.log('offset',offset);
	console.log('offset word',data.substr(offset,8));
	console.log('offset character',data[offset]);
	while (data[offset]==' ') {
		console.log('clicked no space');
		offset++;
	}
	if (data.length < 2) {
		console.log('data is too short');
		return "";
	}
	if (offset >= data.length) {
		offset = data.length - 1;
	}
	// Scan behind the current character until whitespace is found, or beginning
	i = begin = end = offset;
	while (i > 0 && !isW(data[i - 1])) {
		i--;
	}
	begin = i;

	i = offset;
	while (i < data.length - 1 && !isW(data[i + 1])) {
		i++;
	}
	end = i;
	// This is our temporary word
	var word = data.substring(begin, end + 1).replace(/\W/g, '');
	console.log('word', word);
	if (word.length==0){return "";}
	var wordend = end;
	var wordbegin = begin;

	var prev = '';
	var prev2 = '';
	var next = '';
	var next2 = '';
	var prevbegin = 0;
	try {//prev
		i = Math.max(0, wordbegin - 1);
		while (i > 0 && !isW(data[i - 1])) {i--;}
		prev = data.substring(i, wordbegin - 1).trim().replace(/\W/g, '');
		prevbegin = i;
	}
	catch (ex) {}
	try {//prev2
		i = Math.max(0, prevbegin - 1);
		while (i > 0 && !isW(data[i - 1])) {i--;}
		prev2 = data.substring(i, prevbegin - 1).trim().replace(/\W/g, '');
	}
	catch (ex) {}


	try {
		i = wordend + 1;
		while (i < data.length - 1 && !isW(data[i + 1])) {
			i++;
		}
		next = data.substring(wordend + 1, i + 1).trim().replace(/\W/g, '');
	}
	catch (ex) {
		//console.log('error determining next word', ex);
	}
	console.log('prev',prev);
	console.log('next',next);

	near_results = [];
	var match = null;
	var dist;
	//if (stopDict[prev]) {
	//	prev = '';
	//	//console.log('prev in stopwords')
	//}
	//if (stopDict[next]) {
	//	next = '';
	//	//console.log('next in stopwords')
	//}
	var query = buildQuery(prev, word, next);
	wikipediaSearch(query, function(err, data) {
		if (err) {return;}
		if (data.length > 0) {
			data.every(function(item) {
				var testQuery = buildQuery(prev, word, next);
				dist = stringTest(item, testQuery);
				near_results.push({"query": testQuery, "dist": dist, "item": item});
				if (dist <=1) {
					match = item;
					return false;//this is stronger, break;
				}
				var testQuery = buildQuery(prev, word, '');
				dist = stringTest(item, testQuery);
				near_results.push({"query": testQuery, "dist": dist, "item": item});
				if (dist <=1) {
					match = item;
				}
			});
			if (match) {
				//alert('stage 2 '+match.t);
				loadHoverCardForItem(match.t, lang);

			}
		}
		if (!match) {
			//console.log('sending query stage 3 [' + '{' + word + '}-' + next + ']');
			query = buildQuery('', word, next);
			wikipediaSearch(query, function(err, data) {
				if (err) {return;}
				var match = null;
				data.every(function(item) {
					var testQuery = buildQuery('', word, next);
					dist = stringTest(item, testQuery);
					near_results.push({"query": testQuery, "dist": dist, "item": item});
					if (dist<=1) {
						match = item;
						return false;//this is stronger, break;
					}
					var testQuery = buildQuery('', word, '');
					dist = stringTest(item, testQuery);
					near_results.push({"query": testQuery, "dist": dist, "item": item});
					if (dist <=1) {
						match = item;
					}
					return true;
				});
				if (match) {
					loadHoverCardForItem(match.t, lang);
				} else {
					wikipediaSearch(word, function(err, data) {
						if (err) {return;}
						//console.log('data 3 ', data.d);
						var match = null;
						data.every(function(item) {
							//console.log('item stage 4', item);
							dist = stringTest(item, word);
							near_results.push({"query": word, "dist": dist, "item": item});
							if (dist <=1) {
								match = item;
								return false;//this is stronger, break;
							}
							return true;
						});
						if (match) {
							loadHoverCardForItem(match.t, lang);
						} else {
							//	console.log('no exact matches');
							console.log('near matches ', near_results);
							var neareset_value = 1000;
							var nearestObject = null;
							near_results.forEach(function(result) {
								if (result.dist < neareset_value) {
									neareset_value = result.dist;
									nearestObject = result.item;
								}
							});
							if (nearestObject && neareset_value < 10) {
								console.log('nearest object is ', nearestObject);
								loadHoverCardForItem(nearestObject.t, lang);
							} else {
								var $newdiv1 = $("<div id='ww_nomatches'/>");
								$("body").append($newdiv1);
								$('#ww_progress').remove();
								$('#ww_nomatches').html("no matches");
								$('#ww_nomatches').css({
									left: lastX + 20,
									top: lastY - 20,
									opacity: 1,
									display: 'block'
								});
								setTimeout(function(){
									$('#ww_nomatches').fadeOut(300)
								},1200);
							}
						}
					});
				}
			});
		}
	});
	return word;
}


function loadHoverCardForItem(title, lang) {
	getHoverCardFromTitle(title, 'en');
}

// Helper functions

function isW(s) {
	return /[ \f\n\r\t\v\u00A0\u2028\u2029]/.test(s);
}
function isBarrierNode(node) {
	return node ? /^(BR|DIV|P|PRE|TD|TR|TABLE)$/i.test(node.nodeName) : true;
}
function getNextNode(node) {
	var n = null;
	if (node.nextSibling) {
		n = node.nextSibling;
	} else if (node.parentNode && node.parentNode.nextSibling) {
		n = node.parentNode.nextSibling;
	}
	return isBarrierNode(n) ? null : n;
}

// Try to find the prev adjacent node
function getPrevNode(node) {
	var n = null;
	if (node.previousSibling) {
		n = node.previousSibling;
	} else if (node.parentNode && node.parentNode.previousSibling) {
		n = node.parentNode.previousSibling;
	}
	return isBarrierNode(n) ? null : n;
}
function getChildIndex(node) {
	var i = 0;
	while ((node = node.previousSibling)) {
		i++;
	}
	return i;
}
function getTextRangeBoundaryPosition(textRange, isStart) {
	var workingRange = textRange.duplicate();
	workingRange.collapse(isStart);
	var containerElement = workingRange.parentElement();
	var workingNode = document.createElement("span");
	var comparison, workingComparisonType = isStart ?
		"StartToStart" : "StartToEnd";
	var boundaryPosition, boundaryNode;
	do {
		containerElement.insertBefore(workingNode, workingNode.previousSibling);
		workingRange.moveToElementText(workingNode);
	} while ((comparison = workingRange.compareEndPoints(
		workingComparisonType, textRange)) > 0 && workingNode.previousSibling);
	boundaryNode = workingNode.nextSibling;
	if (comparison == -1 && boundaryNode) {
		workingRange.setEndPoint(isStart ? "EndToStart" : "EndToEnd", textRange);

		boundaryPosition = {
			node: boundaryNode,
			offset: workingRange.text.length
		};
	} else {
		boundaryPosition = {
			node: containerElement,
			offset: getChildIndex(workingNode)
		};
	}
	workingNode.parentNode.removeChild(workingNode);
	return boundaryPosition;
}


function wikipediaSearch(query, callback) {

	query = query;
	//console.log("issueing search with query ", query, " lang ", lang);
	finalQuery = query.trim();
	var url = 'https://' + lang + '.wikipedia.org/w/api.php?action=query&list=search&srnamespace=0' +
		'&srlimit=20&srprop=size|snippet|titlesnippet|redirecttitle&formatversion=2&format=json' +
		'&srsearch=' + finalQuery;
	url = url.split(' ').join('%20');
	console.log('url', url);
	$.getJSON(url)
		.done(function(result) {
			console.log("JSON Data: ", result);
			if (result == null || !result.query || !result.query.search) {
				return callback("noresults-wikipedia", null);
			}
			results = [];
			_ref2 = result.query.search;
			for (k in _ref2) {
				v = _ref2[k];
				if (v.title) {
					result = {
						t: v.title,
						s: 0
					};
					if (v.snippet) {
						var regex = /(<([^>]+)>)/ig;
						temp = v.snippet.replace(regex, "");
						result.d = temp;
					}
					if (v.watchers) {
						result.s += v.wordcount;
					}
					if (v.redirecttitle) {
						result.re = v.redirecttitle;
					}
					results.push(result);
				}
			}
			return callback(null, results);
		})
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			return callback(error, null);
		});

}

chrome.runtime.onMessage.addListener (function (message, sender,sendResponse) {
	//messaging system between content scripts and background.
	if (message.command === 'settings-changed') {
		syncSettings();
	}
});