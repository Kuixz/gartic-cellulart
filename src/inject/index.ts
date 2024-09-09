import { CrossCommand } from "../shared/Endpoint";

/* ----------------------------------------------------------------------
  *                      Geometrize Socket Hijack 
  * ---------------------------------------------------------------------- */
/** GSH enables the functions of Geometrize by automatically sending 
  *  messages through the active WebSocket.                                */
 /* ----------------------------------------------------------------------
  * currentWS :: WebSocket, the currently active WebSocket.
  * ---------------------------------------------------------------------- */

// move this out
type Sendable = string|ArrayBufferLike|Blob|ArrayBufferView

declare global {
    interface WebSocket {
        expressSend(data: Sendable): void;
    }
} 

abstract class Interceptor {
    abstract name: string

    abstract proxy(): void
    constructor() { this.proxy() }
    abstract roundEnd(): void 
    abstract interceptIncoming(str: string): string|void
    abstract interceptOutgoing(str: string): string|void

    post(purpose: string, data?: any) {
        window.postMessage({
            direction: `from${this.name}`,
            purpose: purpose,
            data: data
        }, '*');
    }
}

class SocketInterceptor extends Interceptor {
    name = "Socket"

    currentWS: WebSocket | null = null
    strokes: number[] = []
    strokeCount: number = 0

    proxy() {
        const registerWS = this.registerWS.bind(this)
        const interceptOutgoing = this.interceptOutgoing.bind(this)
        const wsSend = window.WebSocket.prototype.send;

        window.WebSocket.prototype.expressSend = function() {
            return wsSend.apply(this, arguments as any); 
        }
        window.WebSocket.prototype.send = function(data) {
            registerWS(this)

            const modifiedData = interceptOutgoing(data.toString())
            if (!modifiedData) { 
                console.log("short circuit")
                return
            }

            const args = arguments
            args[0] = modifiedData
    
            return wsSend.apply(this, args as any);
        }; 
    
        console.log("[Cellulart] WebSocket proxified")
    }
    constructor() {
        super()
        
        const commandMap: { [key:string]:Function } = {
            "roundEnd": this.roundEnd,
            "clearStrokes": this.clearStrokes,
            "setStrokeStack": this.setStrokeStack,
            "sendGeomShape": this.sendGeomShape
        }

        window.addEventListener('message', (event: CrossCommand) => {
            if (event.source !== window || event.data.direction !== 'toSocket') { return; }
            const purp = event.data.purpose
            const data = event.data.data
            if (!(purp in commandMap)) { this.post('log', "No such GSH command: " + purp)}
            try { (commandMap[purp].bind(this))(data) } 
            catch (e) { this.post('log', "Socket error executing " + purp + "(" + JSON.stringify(data) + ")" + ":" + e) }
        })
    }
    roundEnd() {
        this.currentWS = null
        this.clearStrokes()
    }
    interceptIncoming(data: string) {
        console.log(data)

        if (data.slice(0,5) != '42[2,') { return }

        var json = JSON.parse(data.slice(2))
        this.post("data", json)

        // if (json[1] == 11) {
        //     if ('draw' in message) { 
        //         console.log(message.draw)
        //         Socket.setStrokeStack(message.draw)
        //         // Socket.post('turnNum', json.turnNum)
        //     } else {
        //         Socket.clearStrokes()
        //     }
        // }
    }
    interceptOutgoing(data: string) {
        // TODO: Bad workaround right here
        if (data.slice(0,8) == '42[2,18,') { this.interceptIncoming(data); return data }

        if (data.indexOf('"v":') == -1) { return data }
    
        var pieces = data.split(',')  // TODO: could be a costly operation with big data, consider a different method
        if (pieces[3] == '"d":1') { 
            // if (pieces[3] > Socket.strokeCount) { Socket.strokeCount = pieces[3] }
            this.strokeCount += 1 
            const adjustedStroke = this.strokeCount
            pieces[5] = adjustedStroke.toString()
            this.strokes.push(adjustedStroke)
            return pieces.join(',')
        } else if (pieces[3] == '"d":2') {
            if (this.strokes.length == 0) { return }
            pieces[4] = '"v":' + this.strokes.pop() + '}]'
            return pieces.join(',')
        } else if (pieces[3] == '"d":3') {
            const adjustedStroke = this.strokeCount
            // console.log(pieces[5])
            pieces[5] = adjustedStroke.toString()
            return pieces.join(',')
        } else {
            return data
        }
    }



    clearStrokes() {
        this.strokes = []
        this.strokeCount = 0
    }
    setStrokeStack(data: [any[]]) {
        const strokes = data.map((strokeArray) => strokeArray[1])
        this.strokes = strokes
        this.strokeCount = strokes.length > 0 ? strokes.at(-1) : 0
    }
    registerWS(ws: WebSocket) {
        // console.log(this)
        if (this.currentWSOpen()) { return }
        this.currentWS = ws
        ws.addEventListener('message', (event) => { this.interceptIncoming(event.data) })
        this.post("flag", true)
    }
    currentWSOpen() { return this.currentWS && this.currentWS.readyState === this.currentWS.OPEN }
    sendGeomShape(data: GeomSerializedShape) {
        if (!data) { return }
        if (!this.currentWSOpen()) { this.onDisconnect(data); return }
    
        this.strokeCount += 1
        const toSend = data.fst + this.strokeCount + data.snd;
        this.currentWS!.expressSend(toSend);
        this.post('log', "Sent: " + toSend);
    }
    onDisconnect(data: any) {  // Type alert suppressed
        this.currentWS = null
        this.post("flag", false)
    }
}

const Socket = new SocketInterceptor()

// [G3]


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
    
    // console.log("[Cellulart] XHR proxified")
// })()
/* */

// Secret bleh
// This is some REALLY heavy machinery I'm busting out for a REALLY niche purpose. Is it worth it?
// Probably not.
// ;(function() {
//     // create XMLHttpRequest proxy object
//     var oldXMLHttpRequest = XMLHttpRequest;
    
//     // define constructor for my proxy object
//     // eslint-disable-next-line no-global-assign
//     XMLHttpRequest = function() {
//         var actual = new oldXMLHttpRequest();
//         var self = this;
        
//         function modResponse(actualResponse) {
//             // modify the response here and return it
//             // console.log("actual response: " + actualResponse);
//             // const modifiedResponse = actualResponse && actualResponse.replace('"visible":1', '"visible":2');
//             const modifiedResponse = Xhr.interceptIncoming(actualResponse) ?? actualResponse
//             // console.log("modified response: " + modifiedResponse);
//             return modifiedResponse;
//         }
        
//         // generic function for modifying the response that can be used by
//         // multiple event handlers
//         function handleResponse(prop) {
//             return function() {
//                 if (this.responseText && self[prop]) {
//                     self.responseText = modResponse(this.responseText);
//                 }
//                 // call callback that was assigned on our object
//                 if (self[prop]) {
//                     return self[prop].apply(self, arguments);
//                 }
//             }
//         }
        
//         function handleLoadEvent(fn, capture) {
//             return actual.addEventListener("load", function(e) {
//                if (this.responseText) {
//                     self.responseText = modResponse(this.responseText);
//                 }
//                 return fn.apply(self, arguments);
//             }, capture);
//         }
        
//         // properties we don't proxy because we override their behavior
//         this.onreadystatechange = null;
//         this.responseText = null;
//         this.onload = null;
//         if (actual.addEventListener) {
//             this.addEventListener = function(event, fn, capture) {
//                 if (event === "load") {
//                     return handleLoadEvent(fn, capture);
//                 } else {
//                     return actual.addEventListener.apply(actual, arguments);
//                 }
//             }
//         }
        
//         // this is the actual handler on the real XMLHttpRequest object
//         actual.onreadystatechange = handleResponse("onreadystatechange");        
//         actual.onload = handleResponse("onload");
        
//         // iterate all properties in actual to proxy them according to their type
//         // For functions, we call actual and return the result
//         // For non-functions, we make getters/setters
//         // If the property already exists on self, then don't proxy it
//         for (var prop in actual) {
//             // skip properties we already have - this will skip both the above defined properties
//             // that we don't want to proxy and skip properties on the prototype belonging to Object
//             if (!(prop in self)) {
//                 // create closure to capture value of prop
//                 (function(prop) {
//                     if (typeof actual[prop] === "function") {
//                     // define our own property that calls the same method on the actual
//                         Object.defineProperty(self, prop, {
//                             value: function() {return actual[prop].apply(actual, arguments);}
//                         });
//                     } else {
//                         // define our own property that just gets or sets the same prop on the actual
//                         Object.defineProperty(self, prop, {
//                             get: function() {return actual[prop];},
//                             set: function(val) {actual[prop] = val;}
//                         });
//                     }
//                 })(prop);
//             }
//         }
//     }
// })();

// window.addEventListener('message', (event) => {
//     if (event.source !== window || event.data.direction !== 'toXHR') { return; }
//     const purp = event.data.purpose
//     const data = event.data.data
//     if (!Xhr[purp]) { Xhr.post('log', "No such OXH command: " + purp)}
//     try   { Xhr[purp](data) } 
//     catch (e) { Xhr.post('log', "XHR error executing " + purp + "(" + JSON.stringify(data) + ")" + ":" + e) }
// })

// const Xhr = {
//     interceptIncoming (text) {
//         // console.log(text)

//         var indexFirstBracket = text.indexOf('[')
//         if (indexFirstBracket < 0 || text.indexOf('{') < indexFirstBracket) { return text }
//         // console.log(text)
//         var json = JSON.parse(text.slice(indexFirstBracket))
//         // console.log(json)
//         var gameDict = json[1]
//         if ('configs' in gameDict) {
//             Xhr.post('lobbySettings', gameDict/*['configs']*/)
//             // console.log('succ')
//         }
//         // TODO TODO TODO: Blatant overreach!
//         if ('draw' in gameDict) {
//             Socket.setStrokeStack(gameDict.draw)
//             // console.log('succ')
//         }

//         return text
//         // return text.replace('"visible":1', '"visible":2')
//         // const modifiedText = text && text.replace('"visible":1', '"visible":2');
//         // // const modifiedText = text // && text.replace('"visible":1', '"visible":2');
//         // return modifiedText
//     },
//     post(purpose, data) {
//         window.postMessage({
//             direction: "fromXHR",
//             purpose: purpose,
//             data: data
//         }, '*');
//     }
// }


// TODO TODO TODO Intercept the Fetch response to set... everything.
