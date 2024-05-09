 /* ----------------------------------------------------------------------
  *                         Observer XHR Hijack 
  * ---------------------------------------------------------------------- */
/** GSH enhances the functions of Observer by eavesdropping on XHR requests 
  * that transmit information about the game state.                        */
 /* ---------------------------------------------------------------------- */

(function() {
    var xhrOpen = XMLHttpRequest.prototype.open
    
    XMLHttpRequest.prototype.open = function() {
        // console.log(arguments)
        this.addEventListener('loadend', () => Xhr.interceptIncoming(this.responseText))
        return xhrOpen.call(this, ...arguments)
    }
    
    console.log("[Cellulart] XHR proxified")
})()

window.addEventListener('message', (event) => {
    if (event.source !== window || event.data.direction !== 'toXHR') { return; }
    const purp = event.data.purpose
    const data = event.data.data
    if (!Xhr[purp]) { Xhr.post('log', "No such OXH command: " + purp)}
    try   { Xhr[purp](data) } 
    catch (e) { Xhr.post('log', "XHR error executing " + purp + "(" + JSON.stringify(data) + ")" + ":" + e) }
})

const Xhr = {
    interceptIncoming (text) {
        // console.log(text)
        var indexFirstBracket = text.indexOf('[')
        if (indexFirstBracket < 0 || text.indexOf('{') < indexFirstBracket) { return }
        // console.log(text)
        var json = JSON.parse(text.slice(indexFirstBracket))
        // console.log(json)
        var gameDict = json[1]
        if ('configs' in gameDict) {
            Xhr.post('lobbySettings', gameDict/*['configs']*/)
            // console.log('succ')
        }
    },
    post(purpose, data) {
        window.postMessage({
            direction: "fromXHR",
            purpose: purpose,
            data: data
        }, '*');
    }
}


// TODO TODO TODO Intercept the Fetch response to set... everything.
