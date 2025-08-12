import { Console } from "./Console";
import { Converter } from "./Converter";
import { BaseGame, CellulartEventType, EventListening, PhaseChangeEvent } from "./Global";
import { Socket } from "./Socket";

export interface CellulartStroke { beforeN: string; afterN: string };

export interface StrokeSendEvent extends CustomEvent {
    detail: {
        queue: string,
        stroke: CellulartStroke
    }
}
export interface QueueStateChangeEvent extends CustomEvent {
    detail: {
        queue: string,
        paused: boolean
    }
}


export class StrokeSender extends EventListening(EventTarget) {
    private queues: Map<string, CellulartStroke[]> = new Map();
    private currentTool: string | null = null;

    private socketReady = false;
    private phaseReady = false;
    private throttleReady = true;
    private paused = true;
    private shouldClearStrokesOnMutation: boolean = true

    constructor(private socket: Socket, private globalGame: BaseGame) {
        super();
        
        globalGame.addEventListener(CellulartEventType.ENTER_ROUND, this)
        globalGame.addEventListener(CellulartEventType.PHASE_CHANGE, this)

        // 1. Listen for socket flag from SocketTranslator
        socket.addEventListener('flag', (event: Event) => {
            this.socketReady = (event as CustomEvent<boolean>).detail;
            this.trySend();
        });

        // 5. Listen for user pause/resume (optional: could also be a method)
        // this.addEventListener('pause', () => {
        //     this.paused = true;
        // });
        // this.addEventListener('resume', () => {
        //     this.paused = false;
        //     this.trySend();
        // });
    }

    protected onroundenter() {
        this.shouldClearStrokesOnMutation = Converter.continuesIndexToBoolean(this.globalGame.keepIndex)
    }

    // 3. Listen for phase changes from event bus
    protected onphasechange(event: PhaseChangeEvent) {
        const { data, newPhase } = event.detail
        this.phaseReady = newPhase == 'draw'
        // broadcast the pause event
        
        if (this.shouldClearStrokesOnMutation) {
            this.socket.post('clearStrokes')
        } else {
            if (data.previous.data === undefined) {
                Console.warn("Strokes need to be preserved but no strokes were patched", "StrokeSender")
            } else {
                if (data.previous.data instanceof Array) {
                    this.socket.post('setStrokeStack', data.previous.data)
                } else {
                    // Console.log("What kind of Frankenstein round settings are you playing with?")
                }
            }
        }
    }

    // 2. Queue management
    public enqueueStroke(toolName: string, stroke: CellulartStroke) {
        if (!this.queues.has(toolName)) {
            this.queues.set(toolName, []);
        }
        this.queues.get(toolName)!.push(stroke);
        this.trySend();
    }

    public clearQueue(toolName: string) {
        if (this.currentTool == toolName) {
            this.stop()
            // Possible race condition with trySend. Look carefully later
        }
        this.queues.delete(toolName)
        this.dispatchQueueStateChangeEvent()
    }
    public resumeQueue(toolName: string) {
        this.currentTool = toolName
        this.paused = false
        this.dispatchQueueStateChangeEvent()
        this.trySend()
    }
    private dispatchQueueStateChangeEvent() {
        this.dispatchEvent(new CustomEvent('queuestatechange', {
            detail: {
                queue: this.currentTool,
                paused: this.paused
            }
        }) as QueueStateChangeEvent)
    }

    private stop() {
        this.currentTool = null
        this.paused = true
    }

    // 4. Throttling logic and send
    private trySend() {
        // ... all flag checks as before ...
        if (
            this.socketReady &&
            this.phaseReady &&
            this.throttleReady &&
            !this.paused
        ) {
            if (!this.currentTool) {
                return
            } 

            const queue = this.queues.get(this.currentTool)
            if (!queue || queue?.length === 0) {
                this.stop()
                return
            }

            this.sendStroke(queue.shift()!);
            this.throttleReady = false;

            setTimeout(() => {
                this.throttleReady = true;
                if (queue.length > 0) {
                    this.trySend()
                }
            }, 125);
        }
    }

    private sendStroke(stroke: CellulartStroke) {
        this.socket.post('sendStroke', stroke);
        this.dispatchEvent(new CustomEvent('strokesend', {
            detail: {
                queue: this.currentTool,
                stroke: stroke
            }
        }) as StrokeSendEvent)
        // Optionally dispatch a "strokeSent" event, etc.
    }

    // 5. Manual pause/resume control
    public pause(toolName: string) { 
        if (this.currentTool != toolName) { 
            return
        }
        this.paused = true; 
        this.dispatchQueueStateChangeEvent()
    }
    // toggle(toolName: string) {
    //     if (this.currentTool != toolName) { 
    //         return false
    //     }
    //     this.paused = !this.paused; 
    //     return true
    // }
    public unpause(toolName: string) { 
        if (this.currentTool != toolName) { 
            return
        }
        this.paused = false; 
        this.trySend(); 
        this.dispatchQueueStateChangeEvent()
    }

    get isPaused() {
        return this.paused
    }


    // ... rest of the code (flags, pause/resume, etc.) ...
}
