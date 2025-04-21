import { CrossCommand } from "../shared/Endpoint";

abstract class Interceptor {
    abstract name: string
    commandMap: { [key: string]: Function } = {}

    abstract proxy(): void

    constructor() { 
        this.proxy()
        
        window.addEventListener('message', (event: CrossCommand) => {
            if (event.source !== window || event.data.direction !== `to${this.name}`) { return; }
            const purp = event.data.purpose
            const data = event.data.data
            if (!(purp in this.commandMap)) { this.post('log', `No such ${this.name} command: ${purp}`)}
            try { (this.commandMap[purp].bind(this))(data) } 
            catch (e) { this.post('log', `Socket error executing ${purp}(${JSON.stringify(data)}): ${e}`) }
        }) 
    }
    interceptIncoming(str: string): Maybe<string> { return undefined }
    interceptOutgoing(str: string): Maybe<string> { return undefined }
    readIncoming(str: string): void {}
    readOutgoing(str: string): void {}

    post(purpose: string, data?: any) {
        window.postMessage({
            direction: `from${this.name}`,
            purpose: purpose,
            data: data
        }, '*');
    }
}

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

class SocketInterceptor extends Interceptor {
    name = "Socket"
    commandMap: { [key:string]:Function } = {
        "roundEnd": this.roundEnd,
        "clearStrokes": this.clearStrokes,
        "setStrokeStack": this.setStrokeStack,
        "sendGeomShape": this.sendGeomShape
    }

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
    roundEnd() {
        this.currentWS = null
        this.clearStrokes()
    }
    readIncoming(data: string): void {
        // console.log(data)

        if (data.slice(0,5) != '42[2,') { return }

        var json = JSON.parse(data.slice(2))
        this.post("lobbySettings", json)

        return
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
    interceptOutgoing(data: string): Maybe<string> {
        // TODO: Bad workaround right here
        if (data.slice(0,8) == '42[2,18,') { this.readIncoming(data); return data }

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
    setStrokeStack(data: GarticStroke[]) {
        const strokes = data.map((strokeArray) => strokeArray[1])
        this.strokes = strokes
        this.strokeCount = strokes.length > 0 ? strokes.at(-1)! : 0
    }
    registerWS(ws: WebSocket) {
        // console.log(this)
        if (this.currentWSOpen()) { return }
        this.currentWS = ws
        ws.addEventListener('message', (event) => { this.readIncoming(event.data) })
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


type GarticStroke = [number, number, [string, number, number], ...[number, number]]

declare global {
    interface XMLHttpRequest {
        chamberedCallback: () => void
    }
} 

 /* ----------------------------------------------------------------------
  *                         Observer XHR Hijack 
  * ---------------------------------------------------------------------- */
/** OXH enhances the functions of Observer by eavesdropping on XHR requests 
  * that transmit information about the game state.                        */
 /* ---------------------------------------------------------------------- */
 class XHRInterceptor extends Interceptor {
    name = "XHR"

    currentWS: WebSocket | null = null
    strokes: number[] = []
    strokeCount: number = 0

    proxy() {
        const interceptIncoming = this.interceptIncoming
        const originalGet = Object.getOwnPropertyDescriptor(
            XMLHttpRequest.prototype, 'responseText'
        )!.get! as () => string;
          
        Object.defineProperty(
            XMLHttpRequest.prototype, "responseText", {
            get: function() { 
                const originalText = originalGet.apply(this, arguments as any)
                const modifiedText = interceptIncoming(originalText)
                return modifiedText ?? originalText
            }}
        );
    
        console.log("[Cellulart] XHR proxified")
    }
    interceptIncoming(data: string): Maybe<string> {
        // console.log(data)
        // return data
        //         // console.log(text)
        
        var indexFirstBracket = data.indexOf('[')
        if (indexFirstBracket < 0 || data.indexOf('{') < indexFirstBracket) { return data }
        //         // console.log(text)
        var json = JSON.parse(data.slice(indexFirstBracket)) as [number, object, ...any]
        //         // console.log(json)
        var gameDict = json[1]
        if ('configs' in gameDict) {
            Xhr.post('lobbySettings', gameDict/*['configs']*/)
            // console.log('succ')
        }
        // TODO TODO TODO: Blatant overreach!
        if ('draw' in gameDict) {
            Socket.setStrokeStack(gameDict.draw as GarticStroke[])
            // console.log('succ')
        }
        
        return data
        //         // return text.replace('"visible":1', '"visible":2')
        //         // const modifiedText = text && text.replace('"visible":1', '"visible":2');
        //         // // const modifiedText = text // && text.replace('"visible":1', '"visible":2');
        //         // return modifiedText
    }
}

const Xhr = new XHRInterceptor()


