import {
  Console,
  WhiteSettingsBelt,
  CellulartEventType,
  PhaseChangeEvent,
  GarticUser,
  Inwindow,
  EMessagePurpose,
} from "../foundation";
import { ModuleArgs, CellulartModule } from "./CellulartModule";

/* ----------------------------------------------------------------------
 *                                 Scry
 * ---------------------------------------------------------------------- */
/** Scry keeps track of who exactly has or hasn't submitted their work
 * so you know who to throw peanuts at.                                   */
export class Scry extends CellulartModule {
  // [F2]
  name = "Scry";
  setting = WhiteSettingsBelt("Scry");

  scryWIW: Inwindow;
  indicatorLabel: HTMLDivElement;
  // indicatorTray: HTMLDivElement;
  indicators: Record<number, HTMLElement> = {};

  constructor(moduleArgs: ModuleArgs) {
    super(moduleArgs, [
      CellulartEventType.ENTER_ROUND,
      CellulartEventType.PHASE_CHANGE,
      CellulartEventType.LEAVE_ROUND,
    ]);

    const scryWIW = new Inwindow("default", {
      close: false,
      ratio: 5,
      maxGrowFactor: 2,
    });
    scryWIW.element.style.overflow = "visible";
    scryWIW.body.classList.add("scry-body");
    this.scryWIW = scryWIW;

    const indicatorLabel = document.createElement("div");
    indicatorLabel.id = "scry-indicator-label";
    this.indicatorLabel = indicatorLabel;

    scryWIW.body.innerHTML = `
      <div class="scry-scroll-window"></div>
    `;

    moduleArgs.socket.addEventListener("socketIncoming", (event: Event) => {
      const {
        detail: [_, messageType, messageData],
      } = event as CustomEvent;

      if (messageType != EMessagePurpose.DECLARE_DONE) {
        return;
      }
      const player = this.globalGame.players.find(
        (user) => user.id === messageData.user
      );
      if (player) {
        this.updateCompletion(player, messageData.ready);
      } else {
        Console.log(`No player matched ${JSON.stringify(messageData)}`, "Scry");
      }
    });
  }
  protected onroundenter(): void {
    this.constructIndicators();
    // globalGame.players.forEach((user) => {
    //     user
    // })
  }
  protected onphasechange(event: PhaseChangeEvent): void {
    const { isReconnection, oldPhase, data, newPhase } = event.detail;

    if (["book", "start"].includes(newPhase)) {
      return;
    }
    if (oldPhase == "memory" && newPhase != "memory") {
      return;
    }

    if (isReconnection) {
      for (const user of data.users) {
        if (!user.ready) {
          continue;
        }
        this.updateCompletion(user, true);
      }
    } else {
      this.resetIndicators();
    }
  }
  protected onroundleave(): void {
    this.clearIndicators();
  }

  public adjustSettings(): void {
    if (this.isOff()) {
      this.scryWIW.setVisibility(false);
    } else if (this.isOn()) {
      this.scryWIW.setVisibility(true);
    }
  }

  private constructIndicators() {
    Console.log(
      `Constructing Scry with ${this.globalGame.players.length} players`,
      "Scry"
    );
    this.indicators = {};
    for (const user of this.globalGame.players) {
      if (!user.id) {
        continue;
      }
      if (user.viewer === true) {
        continue;
      }

      const userDiv = document.createElement("div");
      userDiv.classList.add("scry-icon");
      userDiv.innerHTML = `
        <img class="scry-img" src="${user.avatar}">
      `;

      userDiv.addEventListener("mouseenter", () => {
        userDiv.appendChild(this.indicatorLabel);
        this.indicatorLabel.style.visibility = "visible";
        this.indicatorLabel.textContent = user.nick.toUpperCase();
      });
      userDiv.addEventListener("mouseleave", () => {
        this.indicatorLabel.style.visibility = "hidden";
      });

      this.scryWIW.body.firstElementChild?.appendChild(userDiv);

      this.indicators[user.id] = userDiv;
    }
  }
  private resetIndicators() {
    for (const indicator of Object.values(this.indicators)) {
      indicator.style.backgroundColor = "red";
    }
  }
  private clearIndicators() {
    for (const indicator of Object.values(this.indicators)) {
      indicator.remove();
    }
    this.indicators = {};
  }
  private updateCompletion(user: GarticUser, done: boolean) {
    Console.log(`${user.nick} is ${done ? "done" : "not done"}`, "Scry");

    if (!user.id) {
      return;
    }
    if (user.viewer === true) {
      return;
    }

    const userIndicator = this.indicators[user.id];
    if (!userIndicator) {
      return;
    }
    userIndicator.style.backgroundColor = done ? "lime" : "red";
  }
}
