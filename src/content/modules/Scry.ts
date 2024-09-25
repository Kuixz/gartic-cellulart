import { 
    Console, Phase, 
    DefaultSettings, WhiteSettingsBelt, 
    globalGame, 
    Socket, 
    GarticUser,
    setParent,
    Inwindow
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
    stepCounter: HTMLDivElement | undefined
    angle: Generator<number> = (function* () {
        while (true) {
            yield 180 * Math.random() - 90
        }
    })()

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
            console.log(player)
            if (player) {
                this.updateCompletion(player, messageData.ready)
            } else {
                console.log(messageData)
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
        console.log(globalGame.players)
        this.indicators = {}
        for (const user of globalGame.players) {
            if (!user.id) { return }

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
                // console.log("entr " + user.nick)
            })
            userDiv.addEventListener("mouseleave", () => {
                // setParent(this.indicatorLabel, document.body)
                this.indicatorLabel.style.visibility = "hidden"
                // console.log("exit " + user.nick)
            })

            setParent(userDiv, this.indicatorTray)

            this.indicators[user.id] = userDiv
        }
        // globalGame.players.forEach((user) => {
        //     user
        // })
    }
    roundEnd(oldPhase: Phase): void {
        this.clearIndicators()
    }
    exitLobby(oldPhase: Phase): void {
        this.clearIndicators()
    }
    adjustSettings(previous: string, current: string): void {
        console.log(current)
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
        // console.log(`${user.nick} is ${done ? "done" : "not done"}`)

        if (!user.id) { return }
        // console.log(this.angle.next())

        // if (!this.stepCounter) {
        //     const stepCandidates = document.getElementsByClassName("step")
        //     if (stepCandidates.length == 0) { return }
        //     this.stepCounter = stepCandidates[0] as HTMLDivElement
        // }
        const userDiv = this.indicators[user.id]

        // document.body.appendChild(userDiv)
        userDiv.style.backgroundColor = done ? "lime" : "red"
        // userDiv.animate([
        //     { transform: "scale(0)" },
        //     { transform: "scale(0.7)" },
        //     { transform: "scale(0.95)" },
        //     { transform: "scale(1)" }
        // ], {
        //     duration: 2000
        // })
    }
}

export { Scry }