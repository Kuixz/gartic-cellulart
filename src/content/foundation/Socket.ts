import { Console } from "./Console";

const Socket = {
    name: 'Socket',
    handlers: [{ filter:'log', handle:(data: string) => { Console.log(data, 'Socket') }}] as {filter:string, handle:(data?:any) => void}[],

    init() {
        window.addEventListener('message', (event) => {
            if (event.source !== window || event.data.direction !== 'fromSocket') { return; }
            const purp = event.data.purpose
            const data = event.data.data
            Console.log(`incoming (${purp}, ${JSON.stringify(data)})`, 'Socket')
            Socket.handle(purp, data)
            // Socket.handlers.forEach(handler => { 
            //     if (handler.filter == purp) { handler.handle(data) }
            // })
        })
    },
    roundEnd() {
        Socket.post("backToLobby")
    },
    handle(purp: string, data?: any){
        Socket.handlers.forEach(handler => { 
            if (handler.filter == purp) { handler.handle(data) }
        })
    },
    post(purp: string, data?: any) {
        Console.log(`outgoing (${purp}, ${data})`, 'Socket')
        
        window.postMessage({
            direction: "toSocket",
            purpose: purp,
            data: data
        }, 'https://garticphone.com')
    },
    addMessageListener(purp:string, handler: (data?:any) => void) {
        Socket.handlers.push({ filter:purp, handle:handler });
    }
}

export { Socket }
