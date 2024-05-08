 /* ----------------------------------------------------------------------
  *                         Observer XHR Hijack 
  * ---------------------------------------------------------------------- */
/** GSH enhances the functions of Observer by eavesdropping on XHR requests 
  * that transmit information about the game state.                        */
 /* ----------------------------------------------------------------------
  * currentWS :: WebSocket, the currently active WebSocket.
  * ---------------------------------------------------------------------- */

(function() {
    var xhrOpen = XMLHttpRequest.prototype.open
    
    XMLHttpRequest.prototype.open = function() {
        console.log(arguments)
        this.addEventListener('loadend', XHR.eavesdrop)
        return xhrOpen.call(this, ...arguments)
    }
    
    console.log("[Cellulart] XHR proxified")
})()

const XHR = {
    eavesdrop () {
        console.log(this.responseText)
    }
}

// var ty = undefined


// var xhrListen = XMLHttpRequest.prototype.addEventListener
// XMLHttpRequest.prototype.addEventListener = function(type, handler) {
//     ty = type
//     console.log(type)
//     return xhrListen.call(this, ...arguments)
// }


// TODO TODO TODO Intercept the Fetch response to set... everything.