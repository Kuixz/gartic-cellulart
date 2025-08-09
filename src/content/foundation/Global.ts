import { 
    Phase, Converter, 
    EFlow, EKeep, ESpeed, ETurns, 
    GarticXHRData,
    TransitionData
} from "./Converter"
import { GarticUser } from "./Converter"

export type CellulartEventType = 'lobbyenter' | 'roundenter' | 'phasechange' | 'reconnect' | 'albumchange' | 'roundleave' | 'lobbyleave'

export interface PhaseChangeData {
    oldPhase: Phase,
    data: TransitionData,
    newPhase: Phase,
}
export interface AlbumChangeData {
    
} 
export interface PhaseChangeEvent extends CustomEvent {
    detail: PhaseChangeData
}
export interface ReconnectEvent extends CustomEvent {
    detail: GarticXHRData
}
export interface AlbumChangeEvent extends CustomEvent {
    detail: AlbumChangeData
}

export class BaseGame extends EventTarget {
    // Lobby (players and settings tracking)
    public host: string = "unknown host"
    public user: GarticUser = {
        nick: "unknown user",
        avatar: "none"
    }
    public players: GarticUser[] = []
    public flowIndex: EFlow = EFlow.WRITING_DRAWING
    public speedIndex: ESpeed = ESpeed.NORMAL
    public turnsIndex: ETurns = ETurns.ALL
    public keepIndex: EKeep = EKeep.NONE

    // Round (turn and phase tracking)
    public turnCount: number = 0
    public currentTurn: number = 0
    public currentPhase: Phase = "start"

    // Events
    constructor() {
        super()
        this.addEventListener('roundenter', () => {
            this.turnCount = Converter.turnsIndexToFunction(this.turnsIndex)(this.players.length)
        })
    }
}

class None {}

// type EventListenable = EventTarget | EventEmitter;

export function EventListening<TBase extends new (...args: any[]) => {}>(
  BaseClass: TBase = None as TBase
) {
  return class extends BaseClass {
    handleEvent(event: Event): void {
      const fnName = "on" + event.type;
      if (fnName in this) {
        (this as unknown as Record<string, (event: Event) => void>)[fnName](
          event
        );
      } else {
        console.warn(`EventBinder has no method on${event.type}`);
      }
    }
  };
}
