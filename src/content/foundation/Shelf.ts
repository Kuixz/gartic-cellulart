interface IShelf {
  set(items: { [key: string]: any }): Promise<void>;
  get(items: string | string[] | any): Promise<{ [key: string]: any }>;
  remove(items: string | string[]): Promise<void>;
  clear(): Promise<void>;
  retrieveOrElse(key: string, defaultValue: any, write?: boolean): Promise<any>;
}
class SandShelf implements IShelf {
  // FAKE SHELF - REMOVE THIS WHEN PUSHING BETA
  dict: { [key: string]: any } = {
    auth: "ad1b033f4885a8bc3ae4f055f591a79c59ce73a6a7380b00c4fcb75ac3eefffb",
    p: "q",
  };

  async set(items: { [key: string]: any }): Promise<void> {
    // Dictionary<String, any>
    for (const key in items) {
      this.dict[key] = items[key];
    }
    return Promise.resolve();
  }
  async get(items: string | string[]): Promise<{ [key: string]: any }> {
    // [String]
    if (typeof items == "string") {
      var t: { [key: string]: any } = {};
      t[items] = this.dict[items];
      return Promise.resolve(t);
    }
    if (Array.isArray(items)) {
      var t: { [key: string]: any } = {};
      Object.entries(items).forEach(([key, value]: [string, any]) => {
        t[key] = value;
      });
      return Promise.resolve(t);
    }
    return Promise.resolve(this.dict);
  }
  async remove(items: string | string[]): Promise<void> {
    // [String]
    if (typeof items == "string") {
      delete this.dict[items];
    }
    if (Array.isArray(items)) {
      for (const key in items) {
        delete this.dict[key];
      }
    }
    return Promise.resolve();
  }
  async clear(): Promise<void> {
    this.dict = {};
    return Promise.resolve();
  }
  async retrieveOrElse(
    key: string,
    defaultValue: any,
    write: boolean = false,
  ): Promise<any> {
    if (key in this.dict) {
      return this.dict[key];
    }
    if (write) {
      this.dict[key] = defaultValue;
    }
    return Promise.resolve(defaultValue);
  }
}
class LiveShelf {
  // init() {
  //     ;["session", "local"].forEach((zone) => {
  //         Box[zone] = { }
  //         ;["set, get"].forEach((func) => {
  //             Box[zone][func] = async function(items) { chrome.storage[zone][func](items) }
  //         })
  //     })
  // },

  async set(items: { [key: string]: any }): Promise<void> {
    // Dictionary<String, any>
    return await chrome.storage.local.set(items);
  }
  async get(items: string | string[]): Promise<{ [key: string]: any }> {
    // [String]
    return await chrome.storage.local.get(items);
  }
  async remove(items: string | string[]): Promise<void> {
    // [String]
    return await chrome.storage.local.remove(items);
  }
  async clear(): Promise<void> {
    return chrome.storage.local.clear();
  }
  async retrieveOrElse(
    key: string,
    defaultValue: any,
    write: boolean = false,
  ): Promise<any> {
    const data = await chrome.storage.local.get(key);
    if (data[key] !== undefined) {
      return data[key];
    }
    if (write) {
      chrome.storage.local.set({ [key]: defaultValue });
    }
    return defaultValue;
  }
}

export { LiveShelf as Shelf };
export type { IShelf };
