
import { AlbumChangeEvent, CellulartEventType, constructElement, GarticStroke, getResource, PhaseChangeEvent, RedSettingsBelt } from "../foundation";
import { CellulartModule, ModuleArgs } from "./CellulartModule";

 /* ----------------------------------------------------------------------
  *                                 Akasha 
  * ----------------------------------------------------------------------
  *                          Suggested by Daniel
  * ----------------------------------------------------------------------  */
/** There will be nothing new under the sun (coming from your client) 
  * if you use Akasha to save and carbon copy incoming drawings back out. 
  * Takes a while to send all its strokes, just like Geom.                  */
export class Akasha extends CellulartModule {
  public name = "Akasha";
  public setting = RedSettingsBelt(this.name)
  public isCheat = true

  private activeDownloadButtons: HTMLElement[] = []
  private records: { dataURL: string, strokes: GarticStroke[] }[] = []

  constructor(moduleArgs: ModuleArgs) {
    super(moduleArgs, [
        CellulartEventType.PHASE_CHANGE,
        CellulartEventType.ALBUM_CHANGE,
        CellulartEventType.TIMELINE_CHANGE,
    ])
  }

  protected onphasechange(event: PhaseChangeEvent): void {
    const { data, newPhase } = event.detail
    if (newPhase != 'memory') {
      return
    }
    if (!(data.previous.data instanceof Array)) {
      return
    }

    const canvas = document.querySelector(".core canvas")!
    const turnCount = document.querySelector(".step")!
    const newButton = this.createDownloadButton(canvas as HTMLCanvasElement, data.previous.data)
    turnCount.appendChild(newButton)
  }

  protected onalbumchange(event: AlbumChangeEvent): void {
    // console.log(event)

    const { data, element } = event.detail
    if (!(data instanceof Array)) {
      return
    }

    const canvas = element.querySelector(".drawBalloon canvas") as HTMLCanvasElement
    const avatar = element.querySelector(".avatar")!
    const newButton = this.createDownloadButton(canvas, data)
    avatar.appendChild(newButton)
  }

  protected ontimelinechange(): void {
    this.activeDownloadButtons = []
  }

  protected adjustSettings(): void {
    if (this.isOn()) {
      for (const elem of this.activeDownloadButtons) {
        elem.style.visibility = "initial"
      }
    } else {
      for (const elem of this.activeDownloadButtons) {
        elem.style.visibility = "hidden"
      }
    }
  }

  private createDownloadButton(canvas: HTMLCanvasElement, data: GarticStroke[]): HTMLElement {
    const newButton = constructElement({
      type: "div",
      class: "akasha-button-outer hover-button",
      style: `visibility: ${this.isOn() ? "initial" : "hidden"}`,
      children: [{
        type: "div",
        class: "akasha-button-inner",
        style: `clip-path: url(#cellulart-akasha-download)`,
      }]
    })

    newButton.addEventListener(
      'click', 
      () => {
        this.records.push({
          dataURL: canvas.toDataURL(),
          strokes: data
        })
        console.log(this.records)
      },
      { once: true }
    )

    this.activeDownloadButtons.push(newButton)

    return newButton
  }
}

