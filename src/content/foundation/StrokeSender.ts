import { BaseGame, EventListening } from "./Global";
import { Socket } from "./Socket";

export interface CellulartStroke { beforeN: string; afterN: string };

export class StrokeSender extends EventListening(EventTarget) {
    constructor(private socket: Socket, private globalGame: BaseGame) {
        super();
    }
}
