import { Console } from "./Console";
import { BaseGame, CellulartEventType, EventListening } from "./Global";

class Socket extends EventListening() {
    private handlers: {filter:string, handle:(data?:any) => void}[] =
    [
        { filter:'log', handle:(data: string) => { Console.log(data, 'Socket') }}
    ]

    constructor(globalGame: BaseGame) {
        super()

        globalGame.addEventListener(CellulartEventType.LEAVE_ROUND, this)
        globalGame.addEventListener(CellulartEventType.LEAVE_LOBBY, this)

        window.addEventListener('message', (event) => {
            if (event.source !== window || event.data.direction !== 'fromSocket') { return; }
            const purp = event.data.purpose
            const data = event.data.data
            Console.log(`incoming (${purp}, ${JSON.stringify(data)})`, 'Socket')
            this.handle(purp, data)
        })
    }
    protected onroundleave() {
        this.post("roundEnd")
    }
    protected onlobbyleave(){
        this.post("exitLobby")
    }
    public handle(purp: string, data?: any){
        this.handlers.forEach(handler => { 
            if (handler.filter == purp) { handler.handle(data) }
        })
    }
    public post(purp: string, data?: any) {
        Console.log(`outgoing (${purp}, ${data})`, 'Socket')
        
        window.postMessage({
            direction: "toSocket",
            purpose: purp,
            data: data
        }, 'https://garticphone.com')
    }
    public addMessageListener(purp:string, handler: (data?:any) => void) {
        this.handlers.push({ filter:purp, handle:handler });
    }
}

export { Socket }
