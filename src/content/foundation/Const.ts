import { Converter, GarticUser, Phase } from "./Converter";

const svgNS = "http://www.w3.org/2000/svg"
const configChildTrunk = { childList: true };
const DOMLOADINGALLOWANCE = 10
const DOMUNLOADINGALLOWANCE = 200
const DEFAULTINWINDOWRATIO = 100/178

const globalGame = {
    host: "Kirsten Wright",
    user: { 
        // name: "Joyce Moore", // used by Spotlight
        // avatar: "."
    } as GarticUser,
    players: [] as GarticUser[],
    turns: 0,

    currentTurn: 0,
    currentPhase: "start" as Phase,

    flowString: 'WRITING, DRAWING',
    speedString: 'NORMAL',
    turnsString: 'ALL',
    roundStart() {
        this.turns = Converter.turnsStringToFunction(this.turnsString)(this.players.length)
    }
}

export { svgNS, configChildTrunk, globalGame, DOMLOADINGALLOWANCE, DOMUNLOADINGALLOWANCE, DEFAULTINWINDOWRATIO };
