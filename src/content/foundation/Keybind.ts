class Keybind {
  triggeredBy: (e: KeyboardEvent) => boolean;
  response: (e: KeyboardEvent) => any;

  constructor(
    triggeredBy: (e: KeyboardEvent) => boolean,
    response: (e: KeyboardEvent) => any,
  ) {
    this.triggeredBy = triggeredBy;
    this.response = response;
  }
}

const Keybinder = {
  keybinds: [] as Keybind[],

  init(keybinds?: Keybind[]) {
    if (keybinds) {
      this.keybinds = keybinds;
    }

    document.addEventListener("keydown", (e) => {
      // console.log(e.code)
      // console.log(this.keybinds)
      this.keybinds.forEach((bind) => bind.triggeredBy(e) && bind.response(e));
    });
  },
  reset() {
    this.keybinds = [];
  },
  set(keybinds: Keybind[]) {
    this.keybinds = keybinds;
  },
  add(keybinds: Keybind[]) {
    this.keybinds = this.keybinds.concat(keybinds);
  },
};

export { Keybinder, Keybind };
