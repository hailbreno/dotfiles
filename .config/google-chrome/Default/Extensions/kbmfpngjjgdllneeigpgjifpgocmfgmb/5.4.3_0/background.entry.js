/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _listeners = __webpack_require__(1);
	
	var _messaging = __webpack_require__(3);
	
	var _cssOff = __webpack_require__(4);
	
	var _cssOff2 = _interopRequireDefault(_cssOff);
	
	var _cssOffSmall = __webpack_require__(5);
	
	var _cssOffSmall2 = _interopRequireDefault(_cssOffSmall);
	
	var _cssOn = __webpack_require__(6);
	
	var _cssOn2 = _interopRequireDefault(_cssOn);
	
	var _cssOnSmall = __webpack_require__(7);
	
	var _cssOnSmall2 = _interopRequireDefault(_cssOnSmall);
	
	var _helpers = __webpack_require__(8);
	
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	
	function _asyncToGenerator(fn) {
		return function () {
			var gen = fn.apply(this, arguments);return new Promise(function (resolve, reject) {
				function step(key, arg) {
					try {
						var info = gen[key](arg);var value = info.value;
					} catch (error) {
						reject(error);return;
					}if (info.done) {
						resolve(value);
					} else {
						return Promise.resolve(value).then(function (value) {
							step("next", value);
						}, function (err) {
							step("throw", err);
						});
					}
				}return step("next");
			});
		};
	}
	
	function _objectWithoutProperties(obj, keys) {
		var target = {};for (var i in obj) {
			if (keys.indexOf(i) >= 0) continue;if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;target[i] = obj[i];
		}return target;
	} /*
	  
	  	RES is released under the GPL. However, I do ask a favor (obviously I don't/can't require it, I ask out of courtesy):
	  
	  	Because RES auto updates and is hosted from a central server, I humbly request that if you intend to distribute your own
	  	modified Reddit Enhancement Suite, you name it something else and make it very clear to your users that it's your own
	  	branch and isn't related to mine.
	  
	  	RES is updated very frequently, and I get lots of tech support questions/requests from people on outdated versions. If
	  	you're distributing RES via your own means, those recipients won't always be on the latest and greatest, which makes
	  	it harder for me to debug things and understand (at least with browsers that auto-update) whether or not people are on
	  	a current version of RES.
	  
	  	I can't legally hold you to any of this - I'm just asking out of courtesy.
	  
	  	Thanks, I appreciate your consideration.  Without further ado, the all-important GPL Statement:
	  
	  	This program is free software: you can redistribute it and/or modify
	  	it under the terms of the GNU General Public License as published by
	  	the Free Software Foundation, either version 3 of the License, or
	  	(at your option) any later version.
	  
	  	This program is distributed in the hope that it will be useful,
	  	but WITHOUT ANY WARRANTY; without even the implied warranty of
	  	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	  	GNU General Public License for more details.
	  
	  	You should have received a copy of the GNU General Public License
	  	along with this program.  If not, see <http://www.gnu.org/licenses/>.
	  
	  */
	
	/* eslint-env webextensions */
	
	const _sendMessage = (0, _helpers.apiToPromise)(chrome.tabs.sendMessage);
	
	var _createMessageHandler = (0, _messaging.createMessageHandler)(function (type, _ref7, { sendResponse, tabId }) {
		let transaction = _ref7.transaction,
		    isResponse = _ref7.isResponse,
		    obj = _objectWithoutProperties(_ref7, ['transaction', 'isResponse']);
	
		if (isResponse) {
			sendResponse(obj);
		} else {
			_sendMessage(tabId, Object.assign({}, obj, { type })).then(function (obj) {
				_handleMessage(type, Object.assign({}, obj, { transaction, isResponse: true }));
			});
		}
	});
	
	const _handleMessage = _createMessageHandler._handleMessage,
	      sendMessage = _createMessageHandler.sendMessage,
	      addListener = _createMessageHandler.addListener;
	
	chrome.runtime.onMessage.addListener(function (_ref, sender, sendResponse) {
		let type = _ref.type,
		    obj = _objectWithoutProperties(_ref, ['type']);
	
		return _handleMessage(type, obj, Object.assign({}, sender.tab, { sendResponse }));
	});
	
	// Listeners
	
	(0, _listeners.addCommonBackgroundListeners)(addListener);
	
	addListener('ajax', function () {
		var _ref2 = _asyncToGenerator(function* ({ method, url, headers, data, credentials }) {
			const request = new XMLHttpRequest();
	
			const load = Promise.race([new Promise(function (resolve) {
				return request.onload = resolve;
			}), new Promise(function (resolve) {
				return request.onerror = resolve;
			}).then(function () {
				throw new Error(`XHR error - url: ${url}`);
			})]);
	
			request.open(method, url, true);
	
			for (const name in headers) {
				request.setRequestHeader(name, headers[name]);
			}
	
			if (credentials) {
				request.withCredentials = true;
			}
	
			request.send(data);
	
			yield load;
	
			// Only store `status`, `responseText` and `responseURL` fields
			return {
				status: request.status,
				responseText: request.responseText,
				responseURL: request.responseURL
			};
		});
	
		return function (_x) {
			return _ref2.apply(this, arguments);
		};
	}());
	
	addListener('permissions', function ({ operation, permissions, origins }) {
		switch (operation) {
			case 'contains':
				return (0, _helpers.apiToPromise)(chrome.permissions.contains)({ permissions, origins });
			case 'request':
				return (0, _helpers.apiToPromise)(chrome.permissions.request)({ permissions, origins });
			case 'remove':
				return (0, _helpers.apiToPromise)(chrome.permissions.remove)({ permissions, origins });
			default:
				throw new Error(`Invalid permissions operation: ${operation}`);
		}
	});
	
	_asyncToGenerator(function* () {
		const _set = (0, _helpers.apiToPromise)(function (items, callback) {
			return chrome.storage.local.set(items, callback);
		});
		const set = function (key, value) {
			return _set({ [key]: value });
		};
	
		const MIGRATED_TO_CHROME_STORAGE = 'MIGRATED_TO_CHROME_STORAGE';
	
		if (localStorage.getItem(MIGRATED_TO_CHROME_STORAGE) !== MIGRATED_TO_CHROME_STORAGE) {
			yield Promise.all(Object.keys(localStorage).map(function () {
				var _ref4 = _asyncToGenerator(function* (key) {
					try {
						yield set(key, JSON.parse(localStorage.getItem(key)));
						console.log(key);
					} catch (e) {
						yield set(key, localStorage.getItem(key));
						console.warn(key);
					}
				});
	
				return function (_x2) {
					return _ref4.apply(this, arguments);
				};
			}()));
			localStorage.setItem(MIGRATED_TO_CHROME_STORAGE, MIGRATED_TO_CHROME_STORAGE);
		}
	})();
	
	addListener('deleteCookies', function (cookies) {
		return cookies.forEach(function ({ url, name }) {
			return chrome.cookies.remove({ url, name });
		});
	});
	
	addListener('openNewTabs', function ({ urls, focusIndex }, { id: tabId, index: currentIndex }) {
		urls.forEach(function (url, i) {
			return chrome.tabs.create({
				url,
				selected: i === focusIndex,
				index: ++currentIndex,
				openerTabId: tabId
			});
		});
	});
	
	addListener('addURLToHistory', function (url) {
		chrome.history.addUrl({ url });
	});
	
	addListener('isURLVisited', function () {
		var _ref5 = _asyncToGenerator(function* (url) {
			return (yield (0, _helpers.apiToPromise)(chrome.history.getVisits)({ url })).length > 0;
		});
	
		return function (_x3) {
			return _ref5.apply(this, arguments);
		};
	}());
	
	chrome.pageAction.onClicked.addListener(function ({ id: tabId }) {
		return sendMessage('pageActionClick', undefined, { tabId });
	});
	
	addListener('pageAction', function ({ operation, state }, { id: tabId }) {
		switch (operation) {
			case 'show':
				chrome.pageAction.show(tabId);
				chrome.pageAction.setIcon({
					tabId,
					path: {
						19: state ? _cssOnSmall2.default : _cssOffSmall2.default,
						38: state ? _cssOn2.default : _cssOff2.default
					}
				});
				break;
			case 'hide':
			case 'destroy':
				chrome.pageAction.hide(tabId);
				break;
			default:
				throw new Error(`Invalid pageAction operation: ${operation}`);
		}
	});
	
	addListener('multicast', function () {
		var _ref6 = _asyncToGenerator(function* (request, { id: tabId, incognito }) {
			return Promise.all((yield (0, _helpers.apiToPromise)(chrome.tabs.query)({ url: '*://*.reddit.com/*', status: 'complete' })).filter(function (tab) {
				return tab.id !== tabId && tab.incognito === incognito;
			}).map(function ({ id: tabId }) {
				return sendMessage('multicast', request, { tabId });
			}));
		});
	
		return function (_x4, _x5) {
			return _ref6.apply(this, arguments);
		};
	}());

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.addCommonBackgroundListeners = addCommonBackgroundListeners;
	
	var _Cache = __webpack_require__(2);
	
	var _Cache2 = _interopRequireDefault(_Cache);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function addCommonBackgroundListeners(addListener) {
		const session = new Map();
	
		addListener('session', function ([operation, key, value]) {
			switch (operation) {
				case 'get':
					return session.get(key);
				case 'set':
					session.set(key, value);
					break;
				case 'delete':
					return session.delete(key);
				case 'has':
					return session.has(key);
				case 'clear':
					return session.clear();
				default:
					throw new Error(`Invalid session operation: ${operation}`);
			}
		});
	
		const cache = new _Cache2.default();
	
		addListener('XHRCache', function ([operation, key, value]) {
			switch (operation) {
				case 'set':
					return cache.set(key, value);
				case 'check':
					return cache.get(key, value);
				case 'delete':
					return cache.delete(key);
				case 'clear':
					return cache.clear();
				default:
					throw new Error(`Invalid XHRCache operation: ${operation}`);
			}
		});
	
		const waiting = new Map();
	
		addListener('authFlow', function ({ operation, id, token }) {
			switch (operation) {
				case 'start':
					if (waiting.has(id)) {
						throw new Error(`Auth handler for id: ${id} already exists.`);
					}
					return new Promise(function (resolve, reject) {
						return waiting.set(id, { resolve, reject });
					});
				case 'complete':
					{
						const handler = waiting.get(id);
						if (!handler) {
							console.error(`No auth handler for id: ${id} (sent token: ${token}).`);
							return false;
						}
						waiting.delete(id);
						handler.resolve(token);
						return true;
					}
				case 'cancel':
					{
						const handler = waiting.get(id);
						if (!handler) {
							console.error(`No auth handler for id: ${id} (attempted cancellation).`);
							return false;
						}
						waiting.delete(id);
						handler.reject(new Error('Auth flow cancelled.'));
						return true;
					}
				default:
					throw new Error(`Invalid authFlow operation: ${operation}`);
			}
		});
	}

/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	class Cache extends Map {
	
		constructor(capacity = 500) {
			super();
			this.capacity = capacity;
		}
	
		get(key, maxAge = Infinity) {
			const now = Date.now();
			const entry = super.get(key);
			if (entry && now - entry.createTime < maxAge) {
				entry.hitTime = now;
				return entry.value;
			}
		}
	
		set(key, value) {
			var _this = this;
	
			const now = Date.now();
			super.set(key, { value, createTime: now, hitTime: now });
	
			if (this.size > this.capacity) {
				// evict least-recently used (hit)
				Array.from(this.entries()).sort(function ([, a], [, b]) {
					return b.hitTime - a.hitTime;
				}).slice(this.capacity / 2 | 0).forEach(function ([key]) {
					return _this.delete(key);
				});
			}
		}
	}
	exports.default = Cache;

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.createMessageHandler = createMessageHandler;
	function isPromise(maybePromise) {
		return maybePromise && typeof maybePromise === 'object' && typeof maybePromise.then === 'function';
	}
	
	function createMessageHandler(_sendMessage, _onListenerError = function (e) {
		return console.error(e);
	}) {
		const listeners = new Map();
		const interceptors = new Map();
		const waiting = new Map();
		let transaction = 0;
	
		function addListener(type, callback) {
			if (listeners.has(type)) {
				throw new Error(`Listener for "${type}" already exists.`);
			}
			listeners.set(type, callback);
		}
	
		function addInterceptor(type, callback) {
			if (interceptors.has(type)) {
				throw new Error(`Interceptor for "${type}" already exists.`);
			}
			interceptors.set(type, callback);
		}
	
		function sendMessage(type, data, context) {
			const interceptor = interceptors.get(type);
			if (interceptor) {
				try {
					const response = interceptor(data, context);
					if (isPromise(response) /*:: && response instanceof Promise */) {
							return response.catch(function (e) {
								return Promise.reject(new Error(`Error in "${type}" interceptor: ${e.message || e}`));
							});
						}
					return Promise.resolve(response);
				} catch (e) {
					return Promise.reject(new Error(`Error in "${type}" interceptor: ${e.message || e}`));
				}
			}
	
			++transaction;
	
			_sendMessage(type, { data, transaction }, context);
	
			return new Promise(function (resolve, reject) {
				return waiting.set(transaction, { resolve, reject });
			});
		}
	
		function sendSynchronous(type, data, context) {
			const interceptor = interceptors.get(type);
			if (!interceptor) {
				throw new Error(`Unrecognised interceptor type: ${type}`);
			}
	
			try {
				return interceptor(data, context);
			} catch (e) {
				throw new Error(`Error in "${type}" interceptor: ${e.message || e}`);
			}
		}
	
		function _handleMessage(type, { data, transaction, error, isResponse }, context) {
			if (isResponse) {
				const handler = waiting.get(transaction);
				if (!handler) {
					throw new Error(`No "${type}" response handler (transaction ${transaction}) - this should never happen.`);
				}
				waiting.delete(transaction);
	
				if (error) {
					handler.reject(new Error(`Error in target's "${type}" handler: ${error}`));
				} else {
					handler.resolve(data);
				}
	
				return false;
			}
	
			function sendResponse({ data, error }) {
				_sendMessage(type, { data, transaction, error, isResponse: true }, context);
			}
	
			const listener = listeners.get(type);
			if (!listener) {
				sendResponse({ error: `Unrecognised message type: ${type}` });
				return false;
			}
	
			let response;
	
			try {
				response = listener(data, context);
			} catch (e) {
				sendResponse({ error: e.message || e });
				_onListenerError(e);
				return false;
			}
	
			if (isPromise(response) /*:: && response instanceof Promise */) {
					response.then(function (data) {
						return sendResponse({ data });
					}, function (e) {
						sendResponse({ error: e.message || e });
						_onListenerError(e);
					});
					// true = response will be handled asynchronously (needed for Chrome)
					return true;
				}
	
			sendResponse({ data: response });
	
			return false;
		}
	
		return {
			_handleMessage,
			sendMessage,
			sendSynchronous,
			addListener,
			addInterceptor
		};
	}

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "css-off.png";

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "css-off-small.png";

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "css-on.png";

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "css-on-small.png";

/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.apiToPromise = apiToPromise;
	/* eslint-env webextensions */
	
	function apiToPromise(func) {
		return function (...args) {
			return new Promise(function (resolve, reject) {
				return func(...args, function (...results) {
					if (chrome.runtime.lastError) {
						reject(new Error(chrome.runtime.lastError.message));
					} else {
						resolve(results.length > 1 ? results : results[0]);
					}
				});
			});
		};
	}

/***/ }
/******/ ]);
//# sourceMappingURL=background.entry.js.map