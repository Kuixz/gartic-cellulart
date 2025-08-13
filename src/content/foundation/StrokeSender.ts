import { Console } from "./Console";
import { Converter } from "./Converter";
import { BaseGame, CellulartEventType, EventListening, PhaseChangeEvent } from "./Global";
import { Inwindow, InwindowOptions } from "./Inwindow";
import { Socket } from "./Socket";
import { getResource } from "./Util";

export interface Stroke { beforeN: string; afterN: string };
export class StrokeBuffer extends EventTarget {
    private queue: Stroke[] = []

    constructor(private abortController: AbortController) {
        super()
    }

    get length() {
        return this.queue.length
    }
    
    public close() {
        this.dispatchEvent(new Event('close'))
    }

    public enqueueStroke(stroke: Stroke) {
        this.queue.push(stroke)
        this.dispatchEvent(new CustomEvent("enqueuestroke", {
            detail: stroke
        }))
    }

    public dequeueStroke(): Stroke | undefined {
        const stroke = this.queue.shift() 
        this.dispatchEvent(new CustomEvent("dequeuestroke", {
            detail: stroke
        }))
        return stroke
    }

    public setStrokes(strokes: Stroke[]) {
        this.queue = strokes
    }

    public setStrokeGeneration(paused: boolean): void {
        this.dispatchEvent(new CustomEvent("setstrokegeneration", {
            detail: paused
        }))
    }

    public addEventListener(type: string, callback: EventListenerOrEventListenerObject | null): void {
        super.addEventListener(type, callback, { signal: this.abortController.signal })
    }
}

export interface QueueStateChangeEvent extends CustomEvent {
    detail: {
        queue: StrokeBuffer,
        paused: boolean
    }
}


export class StrokeSender extends EventListening(EventTarget) {
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
        this.ifActivePause()
        
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
        fixedQueue?: Stroke[],
        options?: InwindowOptions
    ): {
        inwindow: Inwindow,
        buffer: StrokeBuffer,
    } {
        // Pause
        this.ifActivePause()
        
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
        console.log(combinedOptions)
        const inwindow = new Inwindow("default", combinedOptions);
        const body = inwindow.body

        const iconPause = `url(${getResource("assets/module-assets/geom-pause.png")})`
        const iconPlay = `url(${getResource("assets/module-assets/geom-play.png")})`
        body.innerHTML = `
            <div class="strokesender-layout">
                <div class="theme-border strokesender-preview canvas-in-square" style="background-image: url(${dataURL})"></div>
                <span class="cellulart-skewer strokesender-label send">0</span>
                <span class="cellulart-skewer strokesender-label gen">0</span>
                <button class="theme-border hover-button strokesender-button send" style="background-image: ${iconPlay};"></button>
                <button class="theme-border hover-button strokesender-button gen" style="background-image: ${iconPause};"></button>
            </div>
        `

        // Attach event listeners
        const sendLabel = body.querySelector('.strokesender-label.send') as HTMLElement
        const genLabel = body.querySelector('.strokesender-label.gen') as HTMLElement
        const sendBtn = body.querySelector('.strokesender-button.send') as HTMLElement
        const genBtn = body.querySelector('.strokesender-button.gen') as HTMLElement

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
        this.addEventListener(
            "queuestatechange", 
            (event: Event) => {
                const { queue, paused } = (event as QueueStateChangeEvent).detail
                const newIsPaused = queue != buffer || paused === true

                Console.log("Send " + (newIsPaused ? "pause" : "play"), 'Geom')
                sendBtn.style.backgroundImage = newIsPaused ? iconPlay : iconPause 
            },
            { signal: abort.signal }
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
                    genBtn.style.backgroundImage = newIsPaused ? iconPlay : iconPause
                    buffer.setStrokeGeneration(newIsPaused)
                },
                { signal: abort.signal }
            )

            // Generate label
            buffer.addEventListener(
                "enqueuestroke", 
                (_: Event) => { 
                    genLabel.textContent = (++shapesGeneratedCount).toString()
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
            this.stop()
            // Possible race condition with trySend. Look carefully later
        }
        // this.queues.delete(buffer)
        this.dispatchQueueStateChangeEvent()
    }
    // 5. Manual pause/resume control
    private ifActivePause() {
        if (!this.paused) {
            this.paused = true
            this.dispatchQueueStateChangeEvent()
        }
    }
    private pause(buffer: StrokeBuffer) { 
        if (this.currentQueue != buffer) { 
            return
        }
        this.paused = true; 
        this.dispatchQueueStateChangeEvent()
    }
    private resumeQueue(buffer: StrokeBuffer) {
        this.currentQueue = buffer
        this.paused = false
        this.dispatchQueueStateChangeEvent()
        this.trySend()
    }
    private dispatchQueueStateChangeEvent() {
        this.dispatchEvent(new CustomEvent('queuestatechange', {
            detail: {
                queue: this.currentQueue,
                paused: this.paused
            }
        }) as QueueStateChangeEvent)
    }

    private stop() {
        this.currentQueue = null
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
            if (!this.currentQueue || this.currentQueue.length == 0) {
                return
            } 

            // const queue = this.queues.get(this.currentQueue)
            // if (!queue || queue?.length === 0) {
            //     this.stop()
            //     return
            // }

            const stroke = this.currentQueue.dequeueStroke()!
            // if (!stroke) { 
            //     this.stop()
            //     return  
            // }

            this.socket.post('sendStroke', stroke);
            this.throttleReady = false;

            setTimeout(() => {
                this.throttleReady = true;
                if (this.currentQueue && this.currentQueue.length > 0) {
                    this.trySend()
                }
            }, 125);
        }
    }

    get isPaused() {
        return this.paused
    }
}
