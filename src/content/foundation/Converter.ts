import { Console } from "./Console"

type Phase = "start" | "lobby" | "draw" | "write" | "memory" | "book" | "first" | "mod" | "waiting"

type GarticUser = {
    nick:   string
    avatar: string

    access?: string
    alert?:  boolean
    authId?: string
    change?: number
    id?:     number
    mirror?: string
    owner?:  boolean
    points?: number
    uid?:    string
    viewer?: boolean
}
type GarticXHRData = {
    animationConfigs: {speed: number, loop: number} 
    bookAutomatic:    boolean 
    bookNum:          number
    bookOrder:        boolean 
    bookVoice:        boolean 
    code:             string
    configs:          {animate:number, first:number, keep:number, maxUsers:number, mod:number, mode:number, score:number, speed:number, tab:number, turns:number, visible:number} 
    countDown:        boolean 
    invite:           string
    modCode:          string
    resultConfigs:    {speed: number, type: number} 
    roundNum:         number
    screen:           number
    sentence:         string
    timeStarted:      boolean 
    turnMax:          number
    turnNum:          number
    user:             GarticUser
    users:            GarticUser[]
}

type ModeParameters = {
    speed: string
    turns: string
    flow:  string
}
const modeParameterDefaults = { speed: 'NORMAL', turns: 'ALL', flow: 'WRITING, DRAWING' }
type SpeedParameters = {
    write: number
    draw: number
    decayFunction: (n: number) => number
    firstMultiplier: number,
    fallback?: number
}
const speedParameterDefaults = { write: 40, draw: 150, decayFunction: () => 0, firstMultiplier: 1.25 }

const modeParameters = new Map<String, ModeParameters>([
    ["NORMAL",           { speed: 'NORMAL', turns: 'ALL', flow: 'WRITING, DRAWING'  }], // 1 -> 1
    ["KNOCK-OFF",        { speed: 'REGRESSIVE', turns: 'ALL', flow: 'ONLY DRAWINGS'  }], // 2 -> 8
    ["SECRET",           { speed: 'FAST', turns: 'ALL', flow: 'WRITING, DRAWING' }], // 3 -> 3
    ["ANIMATION",        { speed: 'NORMAL', turns: 'ALL', flow: 'ONLY DRAWINGS' }], // 4 -> 11
    ["ICEBREAKER",       { speed: 'NORMAL', turns: 'ALL +1', flow: 'SINGLE SENTENCE'  }], // 5 -> 9
    ["COMPLEMENT",       { speed: 'FASTER FIRST TURN', turns: 'ALL +1', flow: 'DRAWINGS WITH A BACKGROUND, NO PREVIEW' }], // 6 -> 15
    // speedrun is 7 (what? no it isn't???)
    ["MASTERPIECE",      { speed: "HOST'S DECISION", turns: 'SINGLE TURN', flow: 'SOLO DRAWING' }], // 15 -> 20
    ["STORY",            { speed: 'NORMAL', turns: 'ALL', flow: 'ONLY WRITING' }],       // 17
    ["MISSING PIECE",    { speed: 'NORMAL', turns: 'ALL', flow: 'ONLY DRAWINGS' }],       // 21 
    ["CO-OP",            { speed: 'FAST', turns: '6 TURNS', flow: 'SINGLE SENTENCE' }],       // 18
    ["SCORE",            { speed: 'NORMAL', turns: 'ALL', flow: 'WRITING, DRAWING' }],       // 10
    ["SANDWICH",         { speed: 'NORMAL', turns: 'ALL', flow: 'WRITING ONLY AT THE BEGINNING AND THE END' }],      // 12 -> 5
    // "CROWD":            { write: 20, draw: 75,  decayFunction: () => 0,                            firstMultiplier: 1.25, fallback: 2  }, // 13 -> 7
    ["BACKGROUND",       { speed: 'SLOWER FIRST TURN', turns: '200%', flow: 'DRAWINGS WITH A BACKGROUND' }], // 14 -> 14
    ["SOLO",             { speed: 'DYNAMIC', turns: '5 TURNS', flow: 'SOLO DRAWING' }], // 15 -> 13
    ["EXQUISITE CORPSE", { speed: 'SLOW', turns: '3 TURNS', flow: 'ONLY DRAWINGS'}]
])
const speedParameters = new Map<String, SpeedParameters>([
    ["SLOW",              { write: 80, draw: 300, decayFunction: () => 0,                            firstMultiplier: 1.25 }],
    ["NORMAL",            { write: 40, draw: 150, decayFunction: () => 0,                            firstMultiplier: 1.25 }], // 1 -> 1
    ["FAST",              { write: 20, draw: 75,  decayFunction: () => 0,                            firstMultiplier: 1.25 }], // 3 -> 3
    ["PROGRESSIVE",       { write: 8,  draw: 30,  decayFunction: (turns: number) => Math.exp(8 / turns),     firstMultiplier: 1, }],
    ["REGRESSIVE",        { write: 90, draw: 300, decayFunction: (turns: number) => 1 / Math.exp(8 / turns), firstMultiplier: 1   , fallback: 1  }], // 2 -> 8
    ["DYNAMIC",           { write: -1, draw: -1,  decayFunction: () => 0,                            firstMultiplier: 1   , fallback: 1  }], // 15 -> 13
    ["INFINITE",          { write: -1, draw: -1,  decayFunction: () => 0,                            firstMultiplier: 1   , fallback: 1  }], // 15 -> 13
    ["HOST'S DECISION",   { write: -1, draw: -1,  decayFunction: () => 0,                            firstMultiplier: 1   , fallback: 1  }], // 15 -> 13
    ["FASTER FIRST TURN", { write: 40, draw: 150, decayFunction: () => 0,                            firstMultiplier: 0.2 , fallback: -1 }], // 6 -> 15
    ["SLOWER FIRST TURN", { write: 40, draw: 150, decayFunction: () => 0,                            firstMultiplier: 2   , fallback: 1  }], // 14 -> 14
])

const Converter = {

    modeStringToParameters(str: string): ModeParameters {
        const gotten = modeParameters.get(str)
        if (gotten) { return gotten }
        Console.warn(`Couldn't get parameters for mode ${str}`, "Converter")
        return modeParameterDefaults
    },
    modeIndexToString(index: number): string {
        const value = [0,'NORMAL',2,'SECRET',4,'SANDWICH',6,'CROWD','KNOCK-OFF','ICEBREAKER','SCORE','ANIMATION',12,'SOLO','BACKGROUND','COMPLEMENT',16,'STORY','CO-OP',19,'MASTERPIECE', 'MISSING PIECE',22,23,'EXQUISITE CORPSE'][index]
        if (typeof value == "string") { return value }
        Console.warn(`Unknown mode index ${index}`, "Converter")
        return ""
    },

    speedIndexToString(index: number): string {
        const value = [0,"SLOW","NORMAL","FAST","DYNAMIC","REGRESSIVE","INFINITE","HOST'S DECISION","PROGRESSIVE","FASTER FIRST TURN","SLOWER FIRST TURN"][index]
        if (typeof value == "string") { return value }
        Console.warn(`Unknown speed index ${index}`, "Converter")
        return ""
    },
    speedStringToParameters(str: string): SpeedParameters {
        const gotten = speedParameters.get(str)
        if (gotten) { return gotten }
        Console.warn(`Couldn't get parameters for speed ${str}`, "Converter")
        return speedParameterDefaults
    },

    flowIndexToString(index: number): string {
        const value = [0,"WRITING, DRAWING","DRAWING, WRITING","ONLY DRAWING","WRITING ONLY AT THE BEGINNING AND END","WRITING ONLY AT THE BEGINNING","WRITING ONLY AT THE END","SINGLE SENTENCE",'SINGLE DRAWING','SOLO DRAWING','DRAWINGS WITH A BACKGROUND','DRAWINGS WITH A BACKGROUND, NO PREVIEW',"ONLY WRITING"][index]
        if (typeof value == "string") { return value }
        Console.warn(`Unknown flow index ${index}`, "Converter")
        return ""
    },
    flowStringToFallback(str: string): number {
        switch (str) { 
            case "WRITING, DRAWING":                       return 2;
            case "DRAWING, WRITING":                       return 2;
            case "SINGLE SENTENCE":                        return -1;
            case "SINGLE DRAWING":                         return -1;
            case "DRAWINGS WITH A BACKGROUND":             return -1;
            case "DRAWINGS WITH A BACKGROUND, NO PREVIEW": return -1;
            default:                                       return 1;
        }
    },

    turnsIndexToString(index: number) {
        const value = [0,"FEW","MOST","ALL","200%","300%","SINGLE TURN","5 TURNS","10 TURNS","20 TURNS","2 TURNS","3 TURNS","ALL +1","6 TURNS","7 TURNS","8 TURNS","9 TURNS","4 TURNS",][index]
        if (typeof value == "string") { return value }
        Console.warn(`Unknown turns index ${index}`, "Converter")
        return ""
    },
    turnsStringToFunction(str: string): ((num: number) => number) {
        switch (str) {
            case "FEW":         return (players) => Math.floor(players / 2);     // [C3]
            case "MOST":        return (players) => Math.floor(3 * players / 4); // [C3]
            case "ALL":         return (players) => players; 
            case "ALL +1":      return (players) => players + 1;
            case "200%":        return (players) => 2 * players;
            case "300%":        return (players) => 3 * players;
            case "SINGLE TURN": return () => 1;
            case "2 TURNS":     return () => 2;
            case "3 TURNS":     return () => 3;
            case "4 TURNS":     return () => 4;
            case "5 TURNS":     return () => 5;
            case "6 TURNS":     return () => 6;
            case "7 TURNS":     return () => 7;
            case "8 TURNS":     return () => 8;
            case "9 TURNS":     return () => 9;
            case "10 TURNS":    return () => 10;
            case "20 TURNS":    return () => 20;
            default: 
                Console.warn("Could not identify the turn setting being used", 'Converter');
                return () => 0
        }
    },

    tryToUser(elem: HTMLElement): GarticUser|undefined {
        if (elem.classList.contains("empty")) { return }

        const contentElems = elem.getElementsByTagName("span")
        if (contentElems.length < 2) { return }

        var avatar = getComputedStyle(contentElems[0]).backgroundImage
        if (avatar.slice(0,5) == 'url("') { 
            avatar = avatar.slice(5, -2)
        }

        const nick = contentElems[1].textContent
        if (!nick) { return }

        const isOwner = elem.getElementsByClassName("owner").length > 0

        return {
            nick:   nick,
            avatar: avatar,
            owner:  isOwner
        }
    }
}

export { Converter, modeParameterDefaults, speedParameterDefaults }
export type { Phase, ModeParameters, SpeedParameters, GarticUser, GarticXHRData }
