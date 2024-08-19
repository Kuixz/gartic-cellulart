import { Console } from "./Console";

const Xhr = {
    name: 'XHR',
    handlers: [{ filter:'log', handle:(data: string) => { Console.log(data, 'Socket') }}] as {filter:string, handle:(data?:any) => void}[],

    init() {
        window.addEventListener('message', (event) => {
            if (event.source !== window || event.data.direction !== 'fromXHR') { return; }
            const purp = event.data.purpose
            const data = event.data.data
            Console.log(`incoming (${purp}, ${JSON.stringify(data)})`, 'XHR')
            Xhr.handle(purp, data)
            // Xhr.handlers.forEach(handler => { 
            //     if (handler.filter == purp) { handler.handle(data) }
            // })
        })
    },


    
    handle(purp: string, data?: any){
        Xhr.handlers.forEach(handler => { 
            if (handler.filter == purp) { handler.handle(data) }
        })
    },
    // post(purp, data) {
    //     Console.log(`outgoing (${purp}, ${data})`, 'XHR')
        
    //     window.postMessage({
    //         direction: "toXHR",
    //         purpose: purp,
    //         data: data
    //     }, 'https://garticphone.com')
    // },
    addMessageListener(purp:string, handler: (data?:any) => void) {
        Xhr.handlers.push({ filter:purp, handle:handler });
    }
}

export { Xhr }

