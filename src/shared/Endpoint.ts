// import { Console } from "../content/foundation"

interface CrossCommand extends MessageEvent {
  data: {
    direction: string;
    purpose: string;
    data: any;
  };
}

type BuiltinType =
  | "string"
  | "number"
  | "bigint"
  | "boolean"
  | "symbol"
  | "undefined"
  | "object"
  | "function"
  | Function;

function enforceType(a: any, t: BuiltinType): boolean {
  if (typeof t === "string") {
    return typeof a === t;
  }
  if (typeof t === "function") {
    return a instanceof t;
  }
  return false;
}

class AsyncEndpoint {
  private broadcastTag: string;
  private receivingTags: string[];
  private actionMap: Record<string, (data: any) => any> = {};

  private enforceMap: Record<string, BuiltinType> | undefined;
  private enforceWindow: boolean;

  constructor(
    broadcastTag: string,
    receivingTags: string[] = [],
    enforceMap?: Record<string, BuiltinType>,
    enforceWindow: boolean = true,
  ) {
    this.broadcastTag = broadcastTag;
    this.enforceMap = enforceMap;
    this.enforceWindow = enforceWindow;
    this.receivingTags = receivingTags;

    window.addEventListener("message", (event: CrossCommand) => {
      if (!this.shouldRespondTo(event)) {
        return;
      }
      const purp = event.data.purpose;
      const data = event.data.data;
      if (
        this.enforceMap &&
        purp in this.enforceMap &&
        !enforceType(data, this.enforceMap[purp])
      ) {
        console.warn(
          `Endpoint received data of wrong type (received ${data} of type ${typeof data} expected type ${this.enforceMap[purp]})`,
        );
        return;
      }
      if (!(purp in this.actionMap)) {
        return;
      }
      this.actionMap[purp](data);
    });
  }

  registerAction(purp: string, f: (data: any) => any) {
    this.actionMap[purp] = f;
  }

  registerTag(tag: string) {
    this.receivingTags.push(tag);
  }

  private shouldRespondTo(event: CrossCommand): boolean {
    if (this.enforceWindow && event.source !== window) {
      return false;
    }
    return this.receivingTags.includes(event.data.direction);
  }

  // execute(purp: string, data: any) {
  //     /* Dynamically set. */
  // }

  post(purp: string, data: any) {
    if (
      this.enforceMap &&
      purp in this.enforceMap &&
      !enforceType(data, this.enforceMap[purp])
    ) {
      console.warn(
        `E0X45 HSHFAIL: Endpoint is trying to send data of wrong type (sending ${data} of type ${typeof data} expected type ${this.enforceMap[purp]})`,
      );
      return;
    }
    window.postMessage(
      {
        direction: this.broadcastTag,
        purpose: purp,
        data: data,
      },
      "*",
    );
  }
}

export { AsyncEndpoint };
export type { CrossCommand, BuiltinType };
