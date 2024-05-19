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
        return wsSend.apply(this, arguments); 
    }
    // Possibly bad and stupid convolution, just set expressSend to send, if I can get around the illegal invocation
    // window.WebSocket.prototype.expressSend = wsSend.bind(window.WebSocket.prototype);
    window.WebSocket.prototype.send = function(data) {
        Socket.registerWS(this)

        const modifiedData = Socket.interceptOutgoing(data)
        // console.log(modifiedData)
        if (!modifiedData) { return }
        const args = arguments
        args[0] = modifiedData

        return wsSend.call(this, ...args);
    }; 

    // var wdAEL = window.WebSocket.prototype.addEventListener
    // window.WebSocket.prototype.addEventListener = function(type, func) {
    //     console.log(func)
    //     return wdAEL.call(this, ...arguments)
    // }

    // Object.defineProperty(window.WebSocket.prototype, 'onmessage', {
    //     set: function(f) { 
    //         console.log(f)
    //         this.chamberedCallback = f
    //         this.addEventListener('message', f)
    //     }
    // })

    // console.log("[Cellulart] WebSocket proxified")   TODO: Uncomment this

        /* OrigWebSocket.prototype.send = new Proxy(OrigWebSocket.prototype.send, {
            apply: function(data) {
                if (interceptOutgoing(data)) {return}
                return Reflect.apply( ...arguments );
            }
        }) */

        /* window.WebSocket.prototype = new Proxy(window.WebSocket.prototype, {
            apply: function(target, thisArg, argumentsList) {
                if (interceptOutgoing(argumentsList[0])) {return}
                return Reflect.apply( ...arguments );
            }
        }) */
})(); 

// [G3]

window.addEventListener('message', (event) => {
    if (event.source !== window || event.data.direction !== 'toSocket') { return; }
    const purp = event.data.purpose
    const data = event.data.data
    if (!Socket[purp]) { Socket.post('log', "No such GSH command: " + purp)}
    try   { Socket[purp](data) } 
    catch (e) { Socket.post('log', "Socket error executing " + purp + "(" + JSON.stringify(data) + ")" + ":" + e) }
})

const Socket = {
    currentWS: null,
    strokes: [],
    strokeCount: 0,

    backToLobby() {
        currentWS = null
        Socket.clearStrokes()
    },
    clearStrokes() {
        // Socket.setStrokeStack([])
        Socket.strokes = []
        Socket.strokeCount = 0
    },

    setStrokeStack(data) {
        // if (!(data instanceof Array)) { console.log('[Socket] ERROR: Not a stroke stack'); return }
        Socket.strokes = data.map((strokeArray) => strokeArray[1])
        // if (data != []) { Socket.strokeCount = Socket.strokes.at(-1) }
        Socket.strokeCount = data.length > 0 ? Socket.strokes.at(-1) : 0
    },
    interceptIncoming(data) {
        // if (data.indexOf('42[') == -1) { return }
        // Socket.post('gameEvent', data)
        // console.log(data)
        // console.log(data.slice(0,8))
        // if (data.slice(0,8) != '42[2,11,') { return }
        if (data.slice(0,5) != '42[2,') { return }
        // Socket.post('gameEventScreenTransition', data)
        // if (data.indexOf('"draw":') == -1) { return }

        // if (data.indexOf('"draw":') == -1) { return }
        // console.log('passed')

        var json = JSON.parse(data.slice(2))
        var message = json[2]
        // if (json.screen != 5) { return }  // This saves on redundant clearStrokes, but risks breaking if Gartic changes something on a whim.
        // var json = JSON.parse(data.slice(8, -1))
        // console.log(json)

        Socket.post('update42', json)

        if (json[1] == 11) {
            if ('draw' in message) { 
                console.log(message.draw)
                Socket.setStrokeStack(json.draw)
                // Socket.post('turnNum', json.turnNum)
            } else {
                Socket.clearStrokes()
            }
        }

        if (data == '42[2,26,3]' || data == '42[2,18,{"visible":2}]' ) {
            Socket.currentWS.onmessage( {data:'42[2,18,{"visible":1}]'} )
            // this.currentWS.onmessage( {data:'42[2,5,1]'} )
        }

        // console.log('has draw')
        // console.log(json.draw)
        // Socket.setStrokeStack(json.draw)
        // Socket.post('turnNum', json.turnNum)
    },
    interceptOutgoing(data) {
        // TODO: Bad workaround right here
        if (data.slice(0,8) == '42[2,18,') { Socket.interceptIncoming(data); return data }

        if (data.indexOf('"v":') == -1) { return data }
    
        var pieces = data.split(',')  // TODO: could be a costly operation with big data, consider a different method
        if (pieces[3] == '"d":1') { 
            // if (pieces[3] > Socket.strokeCount) { Socket.strokeCount = pieces[3] }
            Socket.strokeCount += 1 
            const adjustedStroke = Socket.strokeCount
            pieces[5] = adjustedStroke
            Socket.strokes.push(adjustedStroke)
            return pieces.join(',')
        } else if (pieces[3] == '"d":2') {
            if (Socket.strokes.length == 0) { return }
            pieces[4] = '"v":' + Socket.strokes.pop() + '}]'
            return pieces.join(',')
        } else if (pieces[3] == '"d":3') {
            const adjustedStroke = Socket.strokeCount
            // console.log(pieces[5])
            pieces[5] = adjustedStroke
            return pieces.join(',')
        } else {
            return data
        }
    },
    registerWS(ws) {
        if (Socket.currentWSOpen()) { return }
        Socket.currentWS = ws
        ws.addEventListener('message', (event) => { Socket.interceptIncoming(event.data) })
        Socket.post("flag", true)
    },
    currentWSOpen() { return Socket.currentWS && Socket.currentWS.readyState === Socket.currentWS.OPEN },
    sendGeomShape(data) {
        if (!data) { return }
        if (!Socket.currentWSOpen(Socket.currentWS)) { Socket.onDisconnect(data); return }
    
        Socket.strokeCount += 1
        const toSend = data.fst + Socket.strokeCount + data.snd;
        Socket.currentWS.expressSend(toSend);
        Socket.post('log', "Sent: " + toSend);
    },
    onDisconnect(data) {
        Socket.currentWS = null
        Socket.post("flag", false)
    },
    post(purpose, data) {
        window.postMessage({
            direction: "fromSocket",
            purpose: purpose,
            data: data
        }, '*');
    }
}

// window.addEventListener('beforeunload', (e) => {
//     console.log(Socket.strokeCount)
//     // e.returnValue = Socket.stroke
//     // return Socket.stroke
//     Socket.post('strokeCount', Socket.strokeCount)
//     // alert(Socket.stroke)
// })
if (typeof exports !== 'undefined') {
    module.exports = { Socket };
}

// Node.prototype.appendChild = new Proxy( Node.prototype.appendChild, {
//     async apply (target, thisArg, [element]) {
//       if (element.tagName == "SCRIPT") {
//         if (element.src.indexOf('draw') != -1) {
//           let text = await requestText(element.src)
//           text = editScript(text)
//           let blob = new Blob([text])
//           element.src = URL.createObjectURL(blob)
//         }
//       }
//       return Reflect.apply( ...arguments )
//     }
//   })
   
//   /* stroke configuration note */
//   /* [toolID, strokeID, [color, 18, 0.6], [x0, y0]. [x1, y1], ..., [xn, yn]] */
   
//   function editScript (text) {
//     // Find the final draw function
//     // let functionFinalDraw = text.match(/function\s\w{1,}\(\w{0,}\){[^\{]+{[^\}]{0,}return\[\]\.concat\(Object\(\w{0,}\.*\w{0,}\)\(\w{0,}\),\[\w{0,}\]\)[^\}]{0,}}[^\}]{0,}}/g)[0]
//     // find the variable that setData is part of
//     // let setDataVar = functionFinalDraw.match(/\w{1,}(?=\.setData)/g)[0]
//     // Expose setData to the script
//     // text = text.replace(/\(\(function\(\){if\(!\w{1,}\.disabled\)/, `((function(){;window.setData = ${setDataVar}.setData;if(!${setDataVar}.disabled)`)
//     return text.replace('e.hidden','false').replace('f.hidden','false')
//   }