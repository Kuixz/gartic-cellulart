import { AsyncEndpoint, BuiltinType } from "./Endpoint";

type DEFINEDCHANNEL = "Socket" | "Xhr" | "Worker";
type CHANNELDEFINITION = {
  enforceWindow: boolean;
  enforceMap: Record<string, BuiltinType>;
};

const CHANNELSCHEMA: Record<DEFINEDCHANNEL, CHANNELDEFINITION> = {
  Socket: {
    enforceWindow: true,
    enforceMap: {},
  },
  Xhr: {
    enforceWindow: true,
    enforceMap: {},
  },
  Worker: {
    enforceWindow: false,
    enforceMap: {
      log: "string",
      image: isGeomRawImage,
      shape: isGeomRawShape,
      keepAlive: "number",
    },
  },
};

const Channel = {
  Async: {
    Directed(direction: "from" | "to", channel: DEFINEDCHANNEL): AsyncEndpoint {
      const flip = direction == "from" ? "to" : "from";
      return new AsyncEndpoint(
        `${direction}${channel}`,
        [`${flip}${channel}`],
        CHANNELSCHEMA[channel].enforceMap,
        CHANNELSCHEMA[channel].enforceWindow,
      );
    },
  },
};

export { AsyncEndpoint, Channel };
