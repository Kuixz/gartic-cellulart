import { 
    Console, Phase, WhiteSettingsBelt, 
    globalGame, 
    Socket, 
    GarticUser,
    setParent,
    Inwindow,
    GarticXHRData
} from "../foundation"
import { CellulartModule } from "./CellulartModule"

/* ----------------------------------------------------------------------
  *                                 Scry 
  * ---------------------------------------------------------------------- */
/** Scry keeps track of who exactly has or hasn't submitted their work
  * so you know who to throw peanuts at.
  * ---------------------------------------------------------------------- */
class Scry extends CellulartModule { // [F2]
    name = "Scry"
    setting = WhiteSettingsBelt("Scry")

    scryWIW: Inwindow
    indicatorLabel: HTMLDivElement
    indicatorTray: HTMLDivElement  
    indicators: { [key: number]: HTMLElement } = {}

    constructor() { 
        super() 

        const scryWIW = new Inwindow("default", { close: false, ratio: 0.2, maxGrowFactor: 2 })
        scryWIW.element.style.overflow = "visible";
        scryWIW.body.classList.add("scry-body")
        this.scryWIW = scryWIW
        
        const indicatorLabel = document.createElement("div")
        indicatorLabel.id = "scry-indicator-label"
        this.indicatorLabel = indicatorLabel

        const indicatorTray = document.createElement("div")
        indicatorTray.classList.add("scry-scroll-window")
        setParent(indicatorTray, scryWIW.body)
        this.indicatorTray = indicatorTray

        Socket.addMessageListener("lobbySettings", (data: [number, number, any]) => {
            const messageType = data[1]
            const messageData = data[2]

            if (messageType != 15) { return }
            const player = globalGame.players.find((user) => user.id === messageData.user)
            if (player) {
                this.updateCompletion(player, messageData.ready)
            } else {
                Console.log(`No player matched ${JSON.stringify(messageData)}`)
            }
        })
    }
    mutation(oldPhase: Phase, newPhase: Phase): void {
        if (["book", "start"].includes(newPhase)) { return }
        if (oldPhase == "memory" && newPhase != "memory") { return }
        for (const indicator of Object.values(this.indicators)) {
            indicator.style.backgroundColor = "red"
        }
    }
    roundStart(): void {
        Console.log(`Constructing Scry with ${globalGame.players.length} players`)
        this.indicators = {}
        for (const user of globalGame.players) {
            if (!user.id) { continue }

            const userDiv = document.createElement('div')
            userDiv.classList.add("scry-icon")

            const userIcon = new Image()
            userIcon.src = user.avatar
            userIcon.classList.add("scry-img")
            setParent(userIcon, userDiv)

            userDiv.addEventListener("mouseenter", () => {
                setParent(this.indicatorLabel, userDiv)
                this.indicatorLabel.style.visibility = "visible"
                this.indicatorLabel.textContent = user.nick.toUpperCase()
            })
            userDiv.addEventListener("mouseleave", () => {
                this.indicatorLabel.style.visibility = "hidden"
            })

            setParent(userDiv, this.indicatorTray)

            this.indicators[user.id] = userDiv
        }
        // globalGame.players.forEach((user) => {
        //     user
        // })
    }
    patchReconnect(data: GarticXHRData): void {
        for (const user of data.users) {
            if (!user.id) { continue }
            if (!user.ready) { continue }

            const indicator = this.indicators[user.id]
            indicator.style.backgroundColor = "lime"
        }
    }
    roundEnd(oldPhase: Phase): void {
        this.clearIndicators()
    }
    exitLobby(oldPhase: Phase): void {
        this.clearIndicators()
    }
    adjustSettings(previous: string, current: string): void {
        if (this.isOff()) {
            this.scryWIW.setVisibility(false)
        } else if (this.isOn()) {
            this.scryWIW.setVisibility(true)
        }
    }

    clearIndicators() {
        for (const indicator of Object.values(this.indicators)) {
            indicator.remove()
        }
        this.indicators = {}
    }
    updateCompletion(user: GarticUser, done: boolean) {
        Console.log(`${user.nick} is ${done ? "done" : "not done"}`)

        if (!user.id) { return }
       
        const userDiv = this.indicators[user.id]
        userDiv.style.backgroundColor = done ? "lime" : "red"
    }
}

export { Scry }