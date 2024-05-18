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
(function() {
    // create XMLHttpRequest proxy object
    var oldXMLHttpRequest = XMLHttpRequest;
    
    // define constructor for my proxy object
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

        const modifiedText = text && text.replace('"visible":1', '"visible":2');
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
    module.exports = { Xhr };
}