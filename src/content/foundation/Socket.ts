import { Console } from "./Console";
import { BaseGame, CellulartEventType, EventListening } from "./Global";

class Socket extends EventListening(EventTarget) {
    constructor(globalGame: BaseGame) {
        super()

        globalGame.addEventListener(CellulartEventType.LEAVE_ROUND, this)
        globalGame.addEventListener(CellulartEventType.LEAVE_LOBBY, this)

        window.addEventListener('message', (event) => {
            if (event.source !== window || event.data.direction !== 'fromSocket') { return; }
            const purp = event.data.purpose
            const data = event.data.data
            Console.log(`incoming (${purp}, ${JSON.stringify(data)})`, 'Socket')
            this.dispatchEvent(new CustomEvent(purp, { detail: data }))
        })
    }
    protected onroundleave() {
        this.post("roundEnd")
    }
    protected onlobbyleave(){
        this.post("exitLobby")
    }
    public post(purp: string, data?: any) {
        Console.log(`outgoing (${purp}, ${data})`, 'Socket')
        
        window.postMessage({
            direction: "toSocket",
            purpose: purp,
            data: data
        }, 'https://garticphone.com')
    }
}

export { Socket }
