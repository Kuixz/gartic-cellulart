import { Converter, GarticUser, Phase, ETurns, EFlow, EMode, ESpeed, EKeep } from "./Converter";

const svgNS = "http://www.w3.org/2000/svg"
const configChildTrunk = { childList: true };
const DOMLOADINGALLOWANCE = 10
const DOMUNLOADINGALLOWANCE = 200
const INWINDOWHEADERHEIGHT = 40;
const DEFAULTINWINDOWRATIO = 100/178
const DEFAULTINWINDOWSCALABILITY = 5

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

    flowIndex: EFlow.WRITING_DRAWING,
    speedIndex: ESpeed.NORMAL,
    turnsIndex: ETurns.ALL,
    keepIndex: EKeep.NONE,
    roundStart() {
        this.turns = Converter.turnsIndexToFunction(this.turnsIndex)(this.players.length)
    }
}

export { svgNS, configChildTrunk, globalGame, 
    DOMLOADINGALLOWANCE, 
    DOMUNLOADINGALLOWANCE, 
    INWINDOWHEADERHEIGHT, 
    DEFAULTINWINDOWRATIO,
    DEFAULTINWINDOWSCALABILITY
};
