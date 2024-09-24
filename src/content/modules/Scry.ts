import { Console, Phase, SettingsBelt, Keybind, DefaultSettings, SettingsBeltFrom, globalGame, Socket, GarticUser } from "../foundation"
import { CellulartModule } from "./CellulartModule"

/* ----------------------------------------------------------------------
  *                                 Scry 
  * ---------------------------------------------------------------------- */
/** Scry keeps track of who exactly has or hasn't submitted their work
  * so you know who to hurry up.
  * ---------------------------------------------------------------------- */
class Scry extends CellulartModule { // [F2]
    name = "Scry"           // All modules have a name property
    setting = SettingsBeltFrom("Scry", [DefaultSettings.off, "sleek", "windowed"], 1)  // All modules have a SettingsBelt

    // Initialization. 
    // To be overridden by each module.
    constructor() { 
        super() 

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

    // This function is called whenever the game transitions to a new phase.
    // To be overridden by each module.
    mutation(oldPhase: Phase, newPhase: Phase): void {

    }

    // This function sets critical persistent variables when a game starts.
    // To be overridden by each module.
    roundStart(): void {
        console.log(globalGame.players)
    }

    // This function "cleans the slate" when a game ends. 
    // To be overridden by each module.
    roundEnd(oldPhase: Phase): void {}

    // This function makes required changes when switching between settings. 
    // To be overridden by each (controllable) module.
    adjustSettings(previous: string, current: string): void {
        console.log(current)
    }

    updateCompletion(user: GarticUser, done: boolean) {
        console.log(`${user.nick} is ${done ? "done" : "not done"}`)
    }
}

export { Scry }