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
        // console.log(arguments)
        this.addEventListener('loadend', () => XHR.eavesdrop(this.responseText))
        return xhrOpen.call(this, ...arguments)
    }
    
    console.log("[Cellulart] XHR proxified")
})()

const XHR = {
    eavesdrop (text) {
        // console.log(text)
        var indexFirstBracket = text.indexOf('[')
        if (indexFirstBracket < 0 || text.indexOf('{') < indexFirstBracket) { return }
        // console.log(text)
        var json = JSON.parse(text.slice(indexFirstBracket))
        // console.log(json)

    },
    post(purpose, data) {
        window.postMessage({
            direction: "fromXHR",
            function: purpose,
            data: data
        }, '*');
    }
}

window.addEventListener('beforeunload', (e) => {
    console.log(Socket.strokeCount)
    // e.returnValue = Socket.stroke
    // return Socket.stroke
    Socket.post('strokeCount', Socket.strokeCount)
    // alert(Socket.stroke)
})
// var ty = undefined


// var xhrListen = XMLHttpRequest.prototype.addEventListener
// XMLHttpRequest.prototype.addEventListener = function(type, handler) {
//     ty = type
//     console.log(type)
//     return xhrListen.call(this, ...arguments)
// }


// TODO TODO TODO Intercept the Fetch response to set... everything.