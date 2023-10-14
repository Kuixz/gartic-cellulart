 /* ----------------------------------------------------------------------
  *                      Geometrize Socket Hijack 
  * ---------------------------------------------------------------------- */
/** GSH enables the functions of Geometrize by automatically sending 
  *  messages through the active WebSocket.                                */
 /* ----------------------------------------------------------------------
  * currentWS :: WebSocket, the currently active WebSocket.
  * ---------------------------------------------------------------------- */

(function() {
    // var wsSend = window.WebSocket.prototype.send;
    // wsSend = wsSend.apply.bind(wsSend);
    var wsSend = window.WebSocket.prototype.send;
    window.WebSocket.prototype.expressSend = function() {
        return wsSend.call(this, ...arguments); 
    }
    // Possibly bad and stupid convolution, just set expressSend to send, if I can get around the illegal invocation
    // window.WebSocket.prototype.expressSend = wsSend.bind(window.WebSocket.prototype);
    window.WebSocket.prototype.send = function(data) {
        Socket.registerWS(this)

        const modifiedData = Socket.redirect(data)
        // console.log(modifiedData)
        if (!modifiedData) { return }
        const args = arguments
        args[0] = modifiedData

        return wsSend.call(this, ...args);
    }; 

    console.log("[Cellulart] WebSocket proxified")

        /* OrigWebSocket.prototype.send = new Proxy(OrigWebSocket.prototype.send, {
            apply: function(data) {
                if (redirect(data)) {return}
                return Reflect.apply( ...arguments );
            }
        }) */

        /* window.WebSocket.prototype = new Proxy(window.WebSocket.prototype, {
            apply: function(target, thisArg, argumentsList) {
                if (redirect(argumentsList[0])) {return}
                return Reflect.apply( ...arguments );
            }
        }) */
})(); 

// [G3]

window.addEventListener('message', (event) => {
    if (event.source !== window || event.data.direction !== 'messageToSocket') { return; }
    const func = event.data.function
    const data = event.data.data
    if (!Socket[func]) { Socket.post('log', "[Cellulart] No such GSH command: " + func)}
    try   { Socket[func](data) } 
    catch (e) { Socket.post('log', "[Cellulart] Socket error executing " + func + "(" + JSON.stringify(data) + ")" + ":" + e) }
})

const Socket = {
    currentWS: null,
    strokes: [],
    bypassStrokes: 0,

    backToLobby() {
        currentWS = null
        Socket.clearStrokes()
    },
    clearStrokes() {
        Socket.strokes = []
        Socket.bypassStrokes = 0
    },

    setStroke(data) {
        // console.log(data)
        Socket.bypassStrokes = data
    },
    redirect(data) {
        if (data.indexOf('"v":') == -1) { return data }
    
        var pieces = data.split(',')
        if (pieces[3] == '"d":1') { 
            Socket.bypassStrokes += 1 
            const adjustedStroke = pieces[5] + Socket.bypassStrokes
            pieces[5] = adjustedStroke
            Socket.strokes.push(adjustedStroke)
            return pieces.join(',')
        } else if (pieces[3] == '"d":2') {
            if (Socket.strokes.length == 0) { return }
            pieces[4] = '"v":' + Socket.strokes.pop() + '}]'
            return pieces.join(',')
        } else if (pieces[3] == '"d":3') {
            const adjustedStroke = pieces[5] + Socket.bypassStrokes
            pieces[5] = adjustedStroke
            return pieces.join(',')
        } else {
            return data
        }
    },
    registerWS(ws) {
        if (Socket.currentWS) { return }
        Socket.currentWS = ws
        Socket.post("flag", true)
    },
    currentWSOpen() { return Socket.currentWS && Socket.currentWS.readyState === Socket.currentWS.OPEN },
    sendGeomShape(data) {
        if (!data) { return }
        if (!Socket.currentWSOpen(Socket.currentWS)) { Socket.onDisconnect(data); return }
    
        Socket.bypassStrokes += 1
        const toSend = data.fst + Socket.bypassStrokes + data.snd;
        Socket.currentWS.expressSend(toSend);
        Socket.post('log', "Sent: " + toSend);
    },
    onDisconnect(data) {
        Socket.currentWS = null
        Socket.post("flag", false)
    },
    post(purpose, data) {
        window.postMessage({
            direction: "messageFromSocket",
            function: purpose,
            data: data
        }, '*');
    }
}

window.addEventListener('beforeunload', (e) => {
    console.log(Socket.bypassStrokes)
    // e.returnValue = Socket.stroke
    // return Socket.stroke
    Socket.post('strokeCount', Socket.bypassStrokes)
    // alert(Socket.stroke)
})