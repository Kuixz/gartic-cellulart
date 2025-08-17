import {
  Console,
  SettingsBelt,
  Keybind,
  DefaultSettings,
  Socket,
  StrokeSender,
  AlbumChangeEvent,
  BaseGame,
  CellulartEventType,
  EventListening,
  PhaseChangeEvent,
  IShelf,
} from "../foundation";

export class ModuleLike {
  name!: string; // All modules have a name property
  setting!: SettingsBelt; // All modules have a SettingsBelt
  isCheat: boolean = false; // All modules declare if they are unfair

  // This function makes required changes when switching between settings.
  // To be overridden by each (controllable) module.
  protected adjustSettings(): void {}

  // menuStep receive messages from the in-window menu and are almost universally shared between modules.
  public menuStep() {
    const n = this.setting.next();
    this.adjustSettings();
    Console.log(n.internalName, this.name);
    return n;
  }

  // Syntactic getters for the setting. Shared between modules.
  protected isSetTo(internalName: string): boolean {
    return this.setting.isSetTo(internalName);
  }
  protected isOn(): boolean {
    return this.isSetTo(DefaultSettings.on);
  }
  protected isOff(): boolean {
    return this.isSetTo(DefaultSettings.off);
  }
  protected isRed(): boolean {
    return this.isSetTo(DefaultSettings.red);
  }
}

export interface ModuleArgs {
  game: BaseGame;
  socket: Socket;
  strokeSender: StrokeSender;
  shelf: IShelf;
}

/* ----------------------------------------------------------------------
 *                            CellulartModule
 * ---------------------------------------------------------------------- */
/** CellulartModule outlines methods relating to setting changes
 * and phase changes (with a special case for entering or returning
 * to the lobby), amongst other frameworks to make adding new functionalities
 * easy as pie.
 * ---------------------------------------------------------------------- */
export class CellulartModule extends EventListening(ModuleLike) {
  // [F2]
  protected globalGame: BaseGame;
  public keybinds: Keybind[] = []; // Some modules have keybinds

  // Initialization.
  // To be overridden by each module to expose only globalGame.
  constructor(moduleArgs: ModuleArgs, listensFor: CellulartEventType[] = []) {
    super();
    this.globalGame = moduleArgs.game;
    for (const eventType of listensFor) {
      moduleArgs.game.addEventListener(eventType, this);
    }
  }

  // A CellulartModule can respond to eight game events:
  protected onlobbyenter() {}
  protected onroundenter() {}
  protected onphasechange(event: PhaseChangeEvent) {}
  protected onalbumchange(event: AlbumChangeEvent) {}
  protected ontimelinechange() {}
  protected onroundleave() {}
  protected onlobbyleave() {}
  // The calling order is as follows.
  // onlobbyenter, ...(
  //   onroundenter,
  //   ...onphasechange[],
  //   onphasechange (to book),
  //    ...(ontimelinechange, ...onalbumchange[])[], (going back to previous timelines notwithstanding)
  //   onroundleave
  // )[],
  // onlobbyleave

  // This function makes required changes when switching between settings.
  // To be overridden by each (controllable) module.
  protected adjustSettings(): void {}

  // toggleRed handles module extensions.
  public toggleRed(plus: boolean) {
    if (plus) {
      this.setting.extend();
    } else {
      this.setting.retract();
    }
  }
  // An unstated assumption is that the following is always equal to 0 or 1:
  // the number of times toggleRed(true) is called minus the number of times toggleRed(false) is called.
}

export abstract class Metamodule extends ModuleLike {
  constructor(num: CellulartModule[]) {
    super();
  }
}

export type ModuleChamber = (typeof CellulartModule)[];
export type MetaChamber = (typeof Metamodule)[];
