import { Console } from "./Console"

type Phase = "start" | "lobby" | "draw" | "write" | "memory" | "book" | "first" | "mod" | "waiting"

type GarticStroke = [number, number, [string, number, number], ...[number, number]]
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

    ready?: boolean
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
    resultConfigs:    {speed: number, type: number} 
    roundNum:         number
    screen:           number
    sentence:         string
    timeStarted:      boolean 
    turnMax:          number
    turnNum:          number
    user:             GarticUser
    users:            GarticUser[]

    invite?:  string
    modCode?: string

    active?:      boolean
    draw?:        GarticStroke[]
    elapsedBase?: number
    elapsedTime?: number
    previous?:    any
}

type ModeParameters = {
    speed: number
    turns: number
    flow:  number
}
const modeParameterDefaults: ModeParameters = { speed: 2, turns: 3, flow: 1 }
type SpeedParameters = {
    write: number
    draw: number
    decayFunction: (n: number) => number
    firstMultiplier: number,
    fallback?: number
}
const speedParameterDefaults = { write: 40, draw: 150, decayFunction: () => 0, firstMultiplier: 1.25 }

const modeParameters = new Map<number, ModeParameters>([
    [1,  { speed: 2, turns: 3,  flow: 1 }], // NORMAL
    [8,  { speed: 5, turns: 3,  flow: 3 }], // KNOCK-OFF
    [3,  { speed: 3, turns: 3,  flow: 1 }], // SECRET
    [11, { speed: 2, turns: 3,  flow: 3 }], // ANIMATION
    [24, { speed: 1, turns: 11, flow: 3 }], // EXQUISITE CORPSE
    [9,  { speed: 2, turns: 12, flow: 7 }], // ICEBREAKER
    [15, { speed: 9, turns: 12, flow: 11 }], // COMPLEMENT
    // speedrun is 7 (what? no it isn't???)
    [20, { speed: 7, turns: 6,  flow: 9 }],  // MASTERPIECE
    [17, { speed: 2, turns: 3,  flow: 12 }], // STORY
    [21, { speed: 2, turns: 3,  flow: 3 }],  // MISSING PIECE
    [18, { speed: 3, turns: 13, flow: 7 }],  // CO-OP
    [10, { speed: 2, turns: 3,  flow: 1 }],  // SCORE
    [5,  { speed: 2, turns: 3,  flow: 4 }],  // SANDWICH
    [14, { speed: 10, turns: 4, flow: 10 }], // BACKGROUND
    [13, { speed: 4,  turns: 7, flow: 9 }]   // SOLO
])
const speedParameters = new Map<number, SpeedParameters>([
    [1,  { write: 80, draw: 300, decayFunction: () => 0,                                    firstMultiplier: 1.25 }],               // SLOW
    [2,  { write: 40, draw: 150, decayFunction: () => 0,                                    firstMultiplier: 1.25 }],               // NORMAL
    [3,  { write: 20, draw: 75,  decayFunction: () => 0,                                    firstMultiplier: 1.25 }],               // FAST
    [8,  { write: 8,  draw: 30,  decayFunction: (turns: number) => Math.exp(8 / turns),     firstMultiplier: 1, }],                 // PROGRESSIVE
    [5,  { write: 90, draw: 300, decayFunction: (turns: number) => 1 / Math.exp(8 / turns), firstMultiplier: 1   , fallback: 1  }], // REGRESSIVE
    [4,  { write: -1, draw: -1,  decayFunction: () => 0,                                    firstMultiplier: 1   , fallback: 1  }], // DYNAMIC
    [6,  { write: -1, draw: -1,  decayFunction: () => 0,                                    firstMultiplier: 1   , fallback: 1  }], // INFINITE
    [7,  { write: -1, draw: -1,  decayFunction: () => 0,                                    firstMultiplier: 1   , fallback: 1  }], // HOST'S DECISION
    [9,  { write: 40, draw: 150, decayFunction: () => 0,                                    firstMultiplier: 0.2 , fallback: -1 }], // FASTER FIRST TURN
    [10, { write: 40, draw: 150, decayFunction: () => 0,                                    firstMultiplier: 2   , fallback: 1  }], // SLOWER FIRST TURN
])

const flowParameters = new Map<number, number>([
    [1, 2],   // WRITING, DRAWING
    [2, 2],   // DRAWING, WRITING
    // [3, 1]    // ONLY DRAWING
    // [12, 1]   // ONLY WRITING
    // [4, 1]    // WRITING ONLY AT THE BEGINNING AND END
    // [5, 1]    // WRITING ONLY AT THE BEGINNING
    // [6, 1]    // WRITING ONLY AT THE END
    [7, -1],  // SINGLE SENTENCE
    [8, -1],  // SINGLE DRAWING
    [10, -1], // DRAWINGS WITH A BACKGROUND
    [11, -1], // DRAWINGS WITH A BACKGROUND, NO PREVIEW
])

const turnsParameters = new Map<number, (players: number) => number>([
    [1, (players) => Math.floor(players / 2)],     // FEW [C3]
    [2, (players) => Math.floor(3 * players / 4)], // MOST [C3]
    [3, (players) => players],                     // ALL
    [12, (players) => players + 1],                // ALL + 1
    [4, (players) => 2 * players],                 // 200%
    [5, (players) => 3 * players],                 // 300%
    [6, () => 1],                                  // SINGLE TURN
    [10, () => 2],                                 // 2 TURNS
    [11, () => 3],                                 // 3 TURNS
    [17, () => 4],                                 // 4 TURNS
    [7, () => 5],                                  // 5 TURNS
    [13, () => 6],                                 // 6 TURNS
    [14, () => 7],                                 // 7 TURNS
    [15, () => 8],                                 // 8 TURNS
    [16, () => 9],                                 // 9 TURNS
    [8, () => 10],                                 // 10 TURNS
    [9, () => 20]                                  // 20 TURNS
])

const Converter = {

    modeStringToIndex(str: string): number {
        const value = [0,'NORMAL',2,'SECRET',4,'SANDWICH',6,'CROWD','KNOCK-OFF','ICEBREAKER','SCORE','ANIMATION',12,'SOLO','BACKGROUND','COMPLEMENT',16,'STORY','CO-OP',19,'MASTERPIECE', 'MISSING PIECE',22,23,'EXQUISITE CORPSE']
        const index = value.indexOf(str)
        if (index <= 0 || typeof index == "number") {  // todo: Consider different error propagation for -1 and 0 results
            Console.warn(`Unmatched mode string ${str}`, "Converter")
            return 0
        }
        return index
    },
    modeIndexToParameters(index: number): ModeParameters {
        const parameters = modeParameters.get(index)
        if (parameters) { return parameters}
        Console.warn(`Unknown mode index ${index}`, "Converter")
        return modeParameterDefaults
    },

    speedStringToIndex(str: string): number {
        const value = [0,"SLOW","NORMAL","FAST","DYNAMIC","REGRESSIVE","INFINITE","HOST'S DECISION","PROGRESSIVE","FASTER FIRST TURN","SLOWER FIRST TURN"]
        const index = value.indexOf(str)
        if (index <= 0 || typeof index == "number") {  // todo: Consider different error propagation for -1 and 0 results
            Console.warn(`Unmatched speed string ${str}`, "Converter")
            return 0
        }
        return index
    },
    speedIndexToParameters(index: number): SpeedParameters {
        const gotten = speedParameters.get(index)
        if (gotten) { return gotten }
        Console.warn(`Couldn't get parameters for speed index ${index}`, "Converter")
        return speedParameterDefaults
    },

    flowStringToIndex(str: string): number {
        const value = [0,"WRITING, DRAWING","DRAWING, WRITING","ONLY DRAWING","WRITING ONLY AT THE BEGINNING AND END","WRITING ONLY AT THE BEGINNING","WRITING ONLY AT THE END","SINGLE SENTENCE",'SINGLE DRAWING','SOLO DRAWING','DRAWINGS WITH A BACKGROUND','DRAWINGS WITH A BACKGROUND, NO PREVIEW',"ONLY WRITING"]
        const index = value.indexOf(str)
        if (index <= 0) {  // todo: Consider different error propagation for -1 and 0 results
            Console.warn(`Unmatched flow string ${str}`, "Converter")
            return 0
        }
        return index
    },
    flowIndexToFallback(index: number): number {
        const gotten = flowParameters.get(index)
        if (gotten) { return gotten }
        // Console.warn(`Couldn't get parameters for speed index ${index}`, "Converter")
        // return speedParameterDefaults
        return 1
    },

    turnsStringToIndex(str: string): number {
        const value = [0,"FEW","MOST","ALL","200%","300%","SINGLE TURN","5 TURNS","10 TURNS","20 TURNS","2 TURNS","3 TURNS","ALL +1","6 TURNS","7 TURNS","8 TURNS","9 TURNS","4 TURNS",]
        const index = value.indexOf(str)
        if (index <= 0 || typeof index == "number") {
            Console.warn(`Unmatched turns string ${str}`, "Converter")
            return 0
        }
        return index
    },
    turnsIndexToFunction(index: number): ((players: number) => number) {
        const gotten = turnsParameters.get(index)
        if (gotten) { return gotten }
        Console.warn(`Couldn't get parameters for turns index ${index}`, "Converter")
        return () => 0
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
