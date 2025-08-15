import { createIconHTML } from "../components";
import { Console } from "./Console";
import { Converter, GarticStroke, OutboundGarticStroke } from "./Converter";
import { BaseGame, CellulartEventType, EventListening, PhaseChangeEvent } from "./Global";
import { Inwindow, InwindowOptions } from "./Inwindow";
import { Socket } from "./Socket";

export class StrokeBuffer extends EventTarget {
    private queue: GarticStroke[] = []

    constructor(private abortController: AbortController) {
        super()
    }

    get length() {
        return this.queue.length
    }
    
    public close() {
        this.dispatchEvent(new Event('close'))
    }

    public enqueueStroke(stroke: GarticStroke) {
        this.queue.push(stroke)
        this.dispatchEvent(new CustomEvent("enqueuestroke", {
            detail: stroke
        }))
    }

    public dequeueStroke(): GarticStroke | undefined {
        const stroke = this.queue.shift() 
        if (stroke) {
            this.dispatchEvent(new CustomEvent("dequeuestroke", {
                detail: stroke
            }))
        }
        return stroke
    }

    public setStrokes(strokes: GarticStroke[]) {
        this.queue = strokes
    }

    public setStrokeGeneration(paused: boolean): void {
        this.dispatchEvent(new CustomEvent("setstrokegeneration", {
            detail: paused
        }))
    }

    public setStrokeSending(paused: boolean): void {
        this.dispatchEvent(new CustomEvent("setstrokesending", {
            detail: paused
        }))
    }

    public addEventListener(type: string, callback: EventListenerOrEventListenerObject | null): void {
        super.addEventListener(type, callback, { signal: this.abortController.signal })
    }
}

export class StrokeSender extends EventListening() {
    // private queues: Set<StrokeBuffer> = new Set()
    private currentQueue: StrokeBuffer | null = null;

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
    }

    protected onroundenter() {
        this.shouldClearStrokesOnMutation = Converter.continuesIndexToBoolean(this.globalGame.keepIndex)
    }

    // 3. Listen for phase changes from event bus
    protected onphasechange(event: PhaseChangeEvent) {
        const { oldPhase, data, newPhase } = event.detail
        if (oldPhase == 'memory') {
            return
        }

        this.phaseReady = newPhase == 'draw'
        this.pause(this.currentQueue)
        
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

    public createSendingInwindow(
        dataURL: string,
        fixedQueue?: GarticStroke[],
        options?: InwindowOptions
    ): {
        inwindow: Inwindow,
        buffer: StrokeBuffer,
    } {
        // Pause
        this.pause(this.currentQueue)
        
        // Create queue buffer
        const abortController = new AbortController()
        const buffer = new StrokeBuffer(abortController)

        // Create Inwindow
        const combinedOptions: InwindowOptions = { 
            close:true, 
            visible:true, 
            shaded:true,
            ratio:1,
            ...options,
        }
        // console.log(combinedOptions)
        const inwindow = new Inwindow("default", combinedOptions);
        const body = inwindow.body

        const iconPause = createIconHTML("cellulart-pause", { type: "div" })
        const iconPlay = createIconHTML("cellulart-play", { type: "div" })
        body.innerHTML = `
            <div class="strokesender-layout">
                <div class="theme-border strokesender-preview canvas-in-square" style="background-image: url(${dataURL})"></div>
                <span class="cellulart-skewer strokesender-label wiw-emphasis">0</span>
                <span class="cellulart-skewer strokesender-label wiw-regular">0</span>
                <button class="theme-border hover-button strokesender-button send">${iconPlay}</button>
                <button class="theme-border hover-button strokesender-button gen">${iconPause}</button>
            </div>
        `

        // Attach event listeners
        const sendLabel = body.querySelector('.strokesender-label.wiw-emphasis') as HTMLElement
        const genLabel = body.querySelector('.strokesender-label.wiw-regular') as HTMLElement
        const sendBtn = body.querySelector('.strokesender-button.send') as HTMLElement
        const genBtn = body.querySelector('.strokesender-button.gen') as HTMLElement
        // const [ _, sendLabel, genLabel, sendBtn, genBtn ] = body.firstElementChild!.children

        const abort = new AbortController()
        let shapesSentCount = 0

        // Close window: Close channel
        inwindow.close!.addEventListener(
            "click", 
            () => { 
                buffer.close()
            }, 
            { signal: abort.signal }
        )
        buffer.addEventListener(
            "close", 
            () => { 
                this.removeQueue(buffer)
                abort.abort() 
                inwindow.element.remove() 
            }
        )

        // Send button 
        sendBtn.addEventListener(
            "click", 
            () => { 
                if (this.globalGame.currentPhase != "draw") {
                    Console.log("Not the right phase - send blocked", "Geom")
                    return 
                }
                if (this.isPaused) {
                    // this.strokeSender.unpause(this.name)
                    this.resumeQueue(buffer)
                } else {
                    this.pause(buffer)
                } 
            },
            { signal: abort.signal }
        );
        buffer.addEventListener(
            "setstrokesending", 
            (event: Event) => {
                const newIsPaused = (event as CustomEvent<boolean>).detail

                Console.log("Send " + (newIsPaused ? "pause" : "play"), 'Geom')
                sendBtn.innerHTML = newIsPaused ? iconPlay : iconPause 
            }
        )

        // Send label
        buffer.addEventListener(
            'dequeuestroke', 
            (_: Event) => {
                // const stroke = (e as CustomEvent<Stroke>).detail
                sendLabel.textContent = (++shapesSentCount).toString()
            }
        )

        if (fixedQueue) {
            buffer.setStrokes(fixedQueue)
            genBtn.remove()
            genLabel.style.gridRow = "span 2"
            genLabel.textContent = fixedQueue.length.toString()
        } else {
            let shapesGeneratedCount = 0
            let shapeGenerationPaused = false

            // Generate button
            genBtn.addEventListener(
                "click", 
                () => { 
                    const newIsPaused = !shapeGenerationPaused
                    shapeGenerationPaused = newIsPaused

                    console.log("Gen " + (newIsPaused ? "pause" : "play"))
                    genBtn.innerHTML = newIsPaused ? iconPlay : iconPause
                    buffer.setStrokeGeneration(newIsPaused)
                },
                { signal: abort.signal }
            )

            // Generate label
            buffer.addEventListener(
                "enqueuestroke", 
                (_: Event) => { 
                    genLabel.textContent = (++shapesGeneratedCount).toString()
                    this.trySend()
                }
            )
        }

        return {
            inwindow,
            buffer,
        }
    }

    // 2. Queue management
    // private enqueueStroke(queueID: string, stroke: Stroke) {
    //     if (!this.queues.has(queueID)) {
    //         this.queues.set(queueID, []);
    //     }
    //     this.queues.get(queueID)!.push(stroke);
    //     this.trySend();
    // }
    // private enqueueStrokes(queueID: string, strokes: Stroke[]) {
    //     this.queues.set(queueID, strokes);
    //     this.trySend();
    // }

    private removeQueue(buffer: StrokeBuffer) {
        if (this.currentQueue == buffer) {
            buffer.setStrokeSending(false)
            this.currentQueue = null
            this.paused = true
            // Possible race condition with trySend. Look carefully later
        }
        // this.queues.delete(buffer)
    }
    // 5. Manual pause/resume control
    private pause(buffer: StrokeBuffer | null) { 
        if (this.paused || buffer == null || this.currentQueue != buffer) { 
            return
        }
        this.paused = true; 
        buffer.setStrokeSending(false)
    }
    private resumeQueue(buffer: StrokeBuffer) {
        if (!this.paused && this.currentQueue == buffer) { 
            return
        }
        if (this.currentQueue != buffer) {
            buffer.setStrokeSending(false)
        }
        this.currentQueue = buffer
        this.paused = false
        buffer.setStrokeSending(true)
        this.trySend()
    }

    // 4. Throttling logic and send
    private trySend() {
        if (
            this.socketReady &&
            this.phaseReady &&
            this.throttleReady &&
            !this.paused
        ) {
            if (!this.currentQueue) {
                return
            } 

            const stroke = this.currentQueue.dequeueStroke()
            if (!stroke) {
                return
            }
            
            this.socket.post('sendStroke', {
                t: this.globalGame.currentTurn - 1,
                d: 1,
                v: stroke
            } as OutboundGarticStroke);
            this.throttleReady = false;

            setTimeout(() => {
                this.throttleReady = true;
                this.trySend()
            }, 125);
        }
    }

    get isPaused() {
        return this.paused
    }
}
