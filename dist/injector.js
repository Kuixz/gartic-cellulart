/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/branches/injector.js":
/*!**********************************!*\
  !*** ./src/branches/injector.js ***!
  \**********************************/
/***/ (() => {

eval("// var s1 = document.createElement('script');\n// s1.src = chrome.runtime.getURL('src/branches/injected/socket.js');\n// (document.head || document.documentElement).appendChild(s1);\n\n// var s2 = document.createElement('script');\n// s2.src = chrome.runtime.getURL('src/branches/injected/xhr.js');\n// (document.head || document.documentElement).appendChild(s2);\n\nvar ds\nfor (const script of [/*'src/lib/wsHook.js',*//*'src/lib/xhook.min.js',*/'src/branches/injected/socket.js', 'src/branches/injected/xhr.js']) {\n    ds = document.createElement('script');\n    ds.src = chrome.runtime.getURL(script);\n    (document.head || document.documentElement).appendChild(ds);\n}\n\n//# sourceURL=webpack://cellulart/./src/branches/injector.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/branches/injector.js"]();
/******/ 	
/******/ })()
;