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
        Socket.currentWS = null
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

        // if (data == '42[2,26,3]' || data == '42[2,18,{"visible":2}]' ) {
        //     Socket.currentWS.onmessage( {data:'42[2,18,{"visible":1}]'} )
        //     // this.currentWS.onmessage( {data:'42[2,5,1]'} )
        // }
        // 42[2,18,{"speed":3, "first":1, "turns":3, "keep":2, "score":2, "visible":1, "animate":2, "mod":2}]

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

// console.log(chrome.storage.local.get())




 /* ----------------------------------------------------------------------
  *                         Observer XHR Hijack 
  * ---------------------------------------------------------------------- */
/** GSH enhances the functions of Observer by eavesdropping on XHR requests 
  * that transmit information about the game state.                        */
 /* ---------------------------------------------------------------------- */

// (function() {
//     var xhrOpen = XMLHttpRequest.prototype.open

//     // Object.defineProperty(XMLHttpRequest, 'onload',{
//     //     set: function(x) { console.log(x); this.addEventListener('load', x) }
//     // })
//     // Object.defineProperty(XMLHttpRequest, 'onloadend',{
//     //     set: function(x) { console.log(x); this.addEventListener('loadend', x) }
//     // })
//     // Object.defineProperty(XMLHttpRequest, 'onreadystatechange',{
//     //     set: function(x) { console.log(x); this.addEventListener('readystatechange', x) }
//     // })
    
//     XMLHttpRequest.prototype.open = function() {
        
//         // Not certain which one Gartic is using, so I'll write all three and comment out the ones I don't need.

//         // Object.defineProperty(this, 'onload',{
//         //     set: function(x) { console.log(x); this.addEventListener('load', x) }
//         // })
//         // Object.defineProperty(this, 'onloadend',{
//         //     set: function(x) { console.log(x); this.addEventListener('loadend', x) }
//         // })
//         this.originalResponse = undefined
//         this.chamberedCallback = () => {}

//         this.onreadystatechange = () => { this.chamberedCallback() }
//         // Object.defineProperty(this, 'response', {
//         //     get: {
                
//         //     }
//         // });

//         Object.defineProperty(this, 'onreadystatechange', {
//             set: function(f) { 
//                 // console.log(f); 
//                 // console.log(this.response)
//                 // var originalResponse = this.response
//                 // console.log(originalResponse)
//                 // Object.defineProperty(this, 'response', {
//                 //     writable: true
//                 // });
//                 // this.response = originalResponse
//                 // console.log(this.response)
//                 // console.log(originalResponse)
//                 // this.response = this.originalResponse
//                 // console.log(this.response)
//                 // var wrapped = new(Function.prototype.bind.apply(XMLHttpRequest, arguments));
//                 // const
//                 // Object.defineProperty(this, 'responseText', {
//                 //     writable: true
//                 // });
//                 // if (this.readyState == 4) {
//                 //     console.log(Object.getOwnPropertyDescriptor(this, 'response'))
//                 //     console.log(Object.getOwnPropertyDescriptor(this, 'responseText'))
//                 // }
//                 // this.addEventListener('readystatechange', x) 
//                 this.chamberedCallback = f
//             }
//         })
        
//         // this.addEventListener('loadend', () => Xhr.interceptIncoming(this.responseText))
//         this.addEventListener('loadend', () => {
//             console.log(this.response)
//             // console.log(Object.getOwnPropertyDescriptor(this, 'response'))
//             // console.log(Object.getOwnPropertyDescriptor(this.prototype, 'response'))
//         })
//         return xhrOpen.call(this, ...arguments)
//     }

//     // let property = Object.getOwnPropertyDescriptor(MessageEvent.prototype, "data");
    
//     // const data = property.get;
  
//     // // wrapper that replaces getter
//     // function lookAtMessage() {
  
//     //   let socket = this.currentTarget instanceof WebSocket;
  
//     //   if (!socket) {
//     //     return data.call(this);
//     //   }
  
//     //   let msg = data.call(this);
  
//     //   Object.defineProperty(this, "data", { value: msg } ); //anti-loop
//     //   fn({ data: msg, socket:this.currentTarget, event:this });
//     //   return msg;
//     // }
    
//     // property.get = lookAtMessage;
    
//     // Object.defineProperty(MessageEvent.prototype, "data", property);

//     //cannot use apply directly since we want a 'new' version
//     // var wrapped = new(Function.prototype.bind.apply(XMLHttpRequest, arguments));

//     // Object.defineProperty(wrapped, 'responseText', {
//     //     writable: true
//     // });

//     // return wrapped;
//     // xhook.after = (function (request, response) {
//     //     // if (request.url.match(/example\.txt$/)) {
//     //         response.text = response.text.replace('"visible":1', '"visible":2');
//     //     // }
//     // });
    
//     console.log("[Cellulart] XHR proxified")
// })()
/* */

// Secret bleh
// This is some REALLY heavy machinery I'm busting out for a REALLY niche purpose. Is it worth it?
// Probably not.
;(function() {
    // create XMLHttpRequest proxy object
    var oldXMLHttpRequest = XMLHttpRequest;
    
    // define constructor for my proxy object
    // eslint-disable-next-line no-global-assign
    XMLHttpRequest = function() {
        var actual = new oldXMLHttpRequest();
        var self = this;
        
        function modResponse(actualResponse) {
            // modify the response here and return it
            // console.log("actual response: " + actualResponse);
            // const modifiedResponse = actualResponse && actualResponse.replace('"visible":1', '"visible":2');
            const modifiedResponse = Xhr.interceptIncoming(actualResponse) ?? actualResponse
            // console.log("modified response: " + modifiedResponse);
            return modifiedResponse;
        }
        
        // generic function for modifying the response that can be used by
        // multiple event handlers
        function handleResponse(prop) {
            return function() {
                if (this.responseText && self[prop]) {
                    self.responseText = modResponse(this.responseText);
                }
                // call callback that was assigned on our object
                if (self[prop]) {
                    return self[prop].apply(self, arguments);
                }
            }
        }
        
        function handleLoadEvent(fn, capture) {
            return actual.addEventListener("load", function(e) {
               if (this.responseText) {
                    self.responseText = modResponse(this.responseText);
                }
                return fn.apply(self, arguments);
            }, capture);
        }
        
        // properties we don't proxy because we override their behavior
        this.onreadystatechange = null;
        this.responseText = null;
        this.onload = null;
        if (actual.addEventListener) {
            this.addEventListener = function(event, fn, capture) {
                if (event === "load") {
                    return handleLoadEvent(fn, capture);
                } else {
                    return actual.addEventListener.apply(actual, arguments);
                }
            }
        }
        
        // this is the actual handler on the real XMLHttpRequest object
        actual.onreadystatechange = handleResponse("onreadystatechange");        
        actual.onload = handleResponse("onload");
        
        // iterate all properties in actual to proxy them according to their type
        // For functions, we call actual and return the result
        // For non-functions, we make getters/setters
        // If the property already exists on self, then don't proxy it
        for (var prop in actual) {
            // skip properties we already have - this will skip both the above defined properties
            // that we don't want to proxy and skip properties on the prototype belonging to Object
            if (!(prop in self)) {
                // create closure to capture value of prop
                (function(prop) {
                    if (typeof actual[prop] === "function") {
                    // define our own property that calls the same method on the actual
                        Object.defineProperty(self, prop, {
                            value: function() {return actual[prop].apply(actual, arguments);}
                        });
                    } else {
                        // define our own property that just gets or sets the same prop on the actual
                        Object.defineProperty(self, prop, {
                            get: function() {return actual[prop];},
                            set: function(val) {actual[prop] = val;}
                        });
                    }
                })(prop);
            }
        }
    }
})();

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
        if (indexFirstBracket < 0 || text.indexOf('{') < indexFirstBracket) { return text }
        // console.log(text)
        var json = JSON.parse(text.slice(indexFirstBracket))
        // console.log(json)
        var gameDict = json[1]
        if ('configs' in gameDict) {
            Xhr.post('lobbySettings', gameDict/*['configs']*/)
            // console.log('succ')
        }
        // TODO TODO TODO: Blatant overreach!
        if ('draw' in gameDict) {
            Socket.setStrokeStack(gameDict.draw)
            // console.log('succ')
        }

        const modifiedText = text // && text.replace('"visible":1', '"visible":2');
        return modifiedText
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

if (typeof exports !== 'undefined') {
    module.exports = { Socket, Xhr };
}