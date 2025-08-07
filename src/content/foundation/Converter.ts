import { Console } from "./Console"

export type Phase = "start" | "lobby" | "draw" | "write" | "memory" | "book" | "first" | "mod" | "waiting"

type GarticStroke = [number, number, [string, number, number], ...[number, number]]
export type GarticUser = {
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
export type GarticXHRData = {
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

export enum EMode {
    NORMAL = 1,
    KNOCKOFF = 8,
    SECRET = 3,
    ANIMATION = 11,
    EXQUISITE_CORPSE = 24,
    ICEBREAKER = 9,
    COMPLEMENT = 15,
    MASTERPIECE = 20,
    STORY = 17,
    MISSING_PIECE = 21,
    COOP = 18,
    SCORE = 10,
    SANDWICH = 5,
    BACKGROUND = 14,
    SOLO = 13
}
export enum ESpeed {
    SLOW = 1,
    NORMAL = 2,
    FAST = 3,
    PROGRESSIVE = 8,
    REGRESSIVE = 5,
    DYNAMIC = 4,
    INFINITE = 6,
    HOST_DECISION = 7,
    FASTER_FIRST = 9,
    SLOWER_FIRST = 10
}
export enum EFlow {
    WRITING_DRAWING = 1,
    DRAWING_WRITING = 2,
    ONLY_DRAWING = 3,
    ONLY_WRITING = 12,
    WRITING_BEGIN_END = 4,
    WRITING_BEGIN = 5,
    WRITING_END = 6,
    SINGLE_SENTENCE = 7,
    SINGLE_DRAWING = 8,
    SOLO_DRAWING = 9,
    WITH_BACKGROUND = 10,
    WITH_BACKGROUND_NO_PREVIEW = 11
}
export enum ETurns {
    FEW = 1,
    MOST = 2,
    ALL = 3,
    ALL_PLUS_1 = 12,
    DOUBLE = 4,
    TRIPLE = 5,
    ONE = 6,
    TWO = 10,
    THREE = 11,
    FOUR = 17,
    FIVE = 7,
    SIX = 13,
    SEVEN = 14,
    EIGHT = 15,
    NINE = 16,
    TEN = 8,
    TWENTY = 9
}
export enum EKeep {
    NONE = 2,
    ALL = 1,
    PREVIOUS = 3,
    BY_TOP = 4
}

export type ModeParameters = {
    speed: ESpeed
    turns: ETurns
    flow:  EFlow
    keep:  EKeep
}
export const modeParameterDefaults: ModeParameters = { speed: ESpeed.NORMAL, turns: ETurns.ALL, flow: EFlow.WRITING_DRAWING, keep: EKeep.NONE }
export type SpeedParameters = {
    write: number
    draw: number
    decayFunction: (n: number) => number
    firstMultiplier: number,
    // fallback?: number
}
export const speedParameterDefaults = { write: 40, draw: 150, decayFunction: () => 0, firstMultiplier: 1.25 }

const modeParametersMap = new Map<EMode, ModeParameters>([
    [EMode.NORMAL,  { speed: ESpeed.NORMAL, turns: ETurns.ALL,  flow: EFlow.WRITING_DRAWING, keep: EKeep.NONE }], // NORMAL
    [EMode.KNOCKOFF,  { speed: ESpeed.REGRESSIVE, turns: ETurns.ALL,  flow: EFlow.ONLY_DRAWING, keep: EKeep.NONE }], // KNOCK-OFF
    [EMode.SECRET,  { speed: ESpeed.FAST, turns: ETurns.ALL,  flow: EFlow.WRITING_DRAWING, keep: EKeep.NONE }], // SECRET
    [EMode.ANIMATION, { speed: ESpeed.NORMAL, turns: ETurns.ALL,  flow: EFlow.ONLY_DRAWING, keep: EKeep.NONE }], // ANIMATION
    [EMode.EXQUISITE_CORPSE, { speed: ESpeed.SLOW, turns: ETurns.THREE, flow: EFlow.ONLY_DRAWING, keep: EKeep.BY_TOP }], // EXQUISITE CORPSE
    [EMode.ICEBREAKER,  { speed: ESpeed.NORMAL, turns: ETurns.ALL_PLUS_1, flow: EFlow.SINGLE_SENTENCE, keep: EKeep.NONE }], // ICEBREAKER
    [EMode.COMPLEMENT, { speed: ESpeed.FASTER_FIRST, turns: ETurns.ALL_PLUS_1, flow: EFlow.WITH_BACKGROUND_NO_PREVIEW, keep: EKeep.NONE }], // COMPLEMENT
    // speedrun is 7 (what? no it isn't???)
    [EMode.MASTERPIECE, { speed: ESpeed.HOST_DECISION, turns: ETurns.ONE,  flow: EFlow.SOLO_DRAWING, keep: EKeep.NONE }],  // MASTERPIECE
    [EMode.STORY, { speed: ESpeed.NORMAL, turns: ETurns.ALL,  flow: EFlow.ONLY_WRITING, keep: EKeep.NONE }], // STORY
    [EMode.MISSING_PIECE, { speed: ESpeed.NORMAL, turns: ETurns.ALL,  flow: EFlow.ONLY_DRAWING, keep: EKeep.PREVIOUS }],  // MISSING PIECE
    [EMode.COOP, { speed: ESpeed.FAST, turns: ETurns.SIX, flow: EFlow.SINGLE_SENTENCE, keep: EKeep.ALL }],  // CO-OP
    [EMode.SCORE, { speed: ESpeed.NORMAL, turns: ETurns.ALL,  flow: EFlow.WRITING_DRAWING, keep: EKeep.NONE }],  // SCORE
    [EMode.SANDWICH,  { speed: ESpeed.NORMAL, turns: ETurns.ALL,  flow: EFlow.WRITING_BEGIN_END, keep: EKeep.NONE }],  // SANDWICH
    [EMode.BACKGROUND, { speed: ESpeed.SLOWER_FIRST, turns: ETurns.DOUBLE, flow: EFlow.WITH_BACKGROUND, keep: EKeep.NONE }], // BACKGROUND
    [EMode.SOLO, { speed: ESpeed.DYNAMIC,  turns: ETurns.FIVE, flow: EFlow.SOLO_DRAWING, keep: EKeep.NONE }]   // SOLO
])
const speedParametersMap = new Map<ESpeed, SpeedParameters>([
    [ESpeed.SLOW,  { write: 80, draw: 300, decayFunction: () => 0,                                    firstMultiplier: 1.25 }],               // SLOW
    [ESpeed.NORMAL,  { write: 40, draw: 150, decayFunction: () => 0,                                    firstMultiplier: 1.25 }],               // NORMAL
    [ESpeed.FAST,  { write: 20, draw: 75,  decayFunction: () => 0,                                    firstMultiplier: 1.25 }],               // FAST
    [ESpeed.PROGRESSIVE,  { write: 8,  draw: 30,  decayFunction: (turns: number) => Math.exp(8 / turns),     firstMultiplier: 1, }],                 // PROGRESSIVE
    [ESpeed.REGRESSIVE,  { write: 90, draw: 300, decayFunction: (turns: number) => 1 / Math.exp(8 / turns), firstMultiplier: 1  }], // REGRESSIVE
    [ESpeed.DYNAMIC,  { write: -1, draw: -1,  decayFunction: () => 0,                                    firstMultiplier: 1  }], // DYNAMIC
    [ESpeed.INFINITE,  { write: -1, draw: -1,  decayFunction: () => 0,                                    firstMultiplier: 1  }], // INFINITE
    [ESpeed.HOST_DECISION,  { write: -1, draw: -1,  decayFunction: () => 0,                                    firstMultiplier: 1  }], // HOST'S DECISION
    [ESpeed.FASTER_FIRST,  { write: 40, draw: 150, decayFunction: () => 0,                                    firstMultiplier: 0.2 }], // FASTER FIRST TURN
    [ESpeed.SLOWER_FIRST, { write: 40, draw: 150, decayFunction: () => 0,                                    firstMultiplier: 2  }], // SLOWER FIRST TURN
])
const flowParametersMap = new Map<EFlow, number>([
    [EFlow.WRITING_DRAWING, 2],   // WRITING, DRAWING
    [EFlow.DRAWING_WRITING, 2],   // DRAWING, WRITING
    [EFlow.ONLY_DRAWING, 1],    // ONLY DRAWING
    [EFlow.ONLY_WRITING, 1],   // ONLY WRITING
    [EFlow.WRITING_BEGIN_END, 1],    // WRITING ONLY AT THE BEGINNING AND END
    [EFlow.WRITING_BEGIN, 1],    // WRITING ONLY AT THE BEGINNING
    [EFlow.WRITING_END, 1],    // WRITING ONLY AT THE END
    [EFlow.SINGLE_SENTENCE, -1],  // SINGLE SENTENCE
    [EFlow.SINGLE_DRAWING, -1],  // SINGLE DRAWING
    [EFlow.WITH_BACKGROUND, -1], // DRAWINGS WITH A BACKGROUND
    [EFlow.WITH_BACKGROUND_NO_PREVIEW, -1], // DRAWINGS WITH A BACKGROUND, NO PREVIEW
])
const turnsParametersMap = new Map<ETurns, (players: number) => number>([
    [ETurns.FEW, (players) => Math.floor(players / 2)],     // FEW [C3]
    [ETurns.MOST, (players) => Math.floor(3 * players / 4)], // MOST [C3]
    [ETurns.ALL, (players) => players],                     // ALL
    [ETurns.ALL_PLUS_1, (players) => players + 1],                // ALL + 1
    [ETurns.DOUBLE, (players) => 2 * players],                 // 200%
    [ETurns.TRIPLE, (players) => 3 * players],                 // 300%
    [ETurns.ONE, () => 1],                                  // SINGLE TURN
    [ETurns.TWO, () => 2],                                 // 2 TURNS
    [ETurns.THREE, () => 3],                                 // 3 TURNS
    [ETurns.FOUR, () => 4],                                 // 4 TURNS
    [ETurns.FIVE, () => 5],                                  // 5 TURNS
    [ETurns.SIX, () => 6],                                 // 6 TURNS
    [ETurns.SEVEN, () => 7],                                 // 7 TURNS
    [ETurns.EIGHT, () => 8],                                 // 8 TURNS
    [ETurns.NINE, () => 9],                                 // 9 TURNS
    [ETurns.TEN, () => 10],                                 // 10 TURNS
    [ETurns.TWENTY, () => 20]                                  // 20 TURNS
])
const continuesParametersMap = new Map<EKeep, boolean>([
    [EKeep.NONE, true],
    [EKeep.ALL, false],
    [EKeep.PREVIOUS, true],
    [EKeep.BY_TOP, true],
])

export const Converter = {
    modeIndexToParameters(index: number): ModeParameters {
        const parameters = modeParametersMap.get(index)
        if (parameters) { return parameters}
        Console.warn(`Unknown mode index ${index}`, "Converter")
        return modeParameterDefaults
    },
    speedIndexToParameters(index: number): SpeedParameters {
        const gotten = speedParametersMap.get(index)
        if (gotten) { return gotten }
        Console.warn(`Couldn't get parameters for speed index ${index}`, "Converter")
        return speedParameterDefaults
    },
    flowIndexToFallback(index: number): number {
        const gotten = flowParametersMap.get(index)
        if (gotten) { return gotten }
        Console.warn(`Couldn't get parameters for speed index ${index}`, "Converter")
        // return speedParameterDefaults
        return 1
    },
    turnsIndexToFunction(index: number): ((players: number) => number) {
        const gotten = turnsParametersMap.get(index)
        if (gotten) { return gotten }
        Console.warn(`Couldn't get parameters for turns index ${index}`, "Converter")
        return () => 0
    },
    continuesIndexToBoolean(index: number): boolean {
        const gotten = continuesParametersMap.get(index)
        if (gotten) { return gotten }
        Console.warn(`Couldn't get parameters for continues index ${index}`, "Converter")
        return true
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
