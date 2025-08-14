
import { createIconHTML } from "../components";
import { 
  RedSettingsBelt, 
  PhaseChangeEvent, AlbumChangeEvent, CellulartEventType, 
  Inwindow, constructElement, 
  GarticStroke, StrokeSender 
} from "../foundation";
import { CellulartModule, ModuleArgs } from "./CellulartModule";

function cloneCanvas(oldCanvas: HTMLCanvasElement) {
  const newCanvas = document.createElement('canvas');
  const context = newCanvas.getContext('2d')!;
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;
  context.drawImage(oldCanvas, 0, 0);
  return newCanvas;
}

type AkashicRecord = { 
  element: HTMLElement, 
  dataURL: string, 
  strokes: GarticStroke[] 
}

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

  private inwindow: Inwindow
  private strokeSender: StrokeSender
  private activeDownloadButtons: HTMLElement[] = []
  private records: AkashicRecord[] = []
  private activeRecord: AkashicRecord | null = null

  constructor(moduleArgs: ModuleArgs) {
    super(moduleArgs, [
        CellulartEventType.PHASE_CHANGE,
        CellulartEventType.ALBUM_CHANGE,
        CellulartEventType.TIMELINE_CHANGE,
    ])

    this.strokeSender = moduleArgs.strokeSender
    this.inwindow = this.constructInwindow()
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
    this.inwindow.setVisibility(this.isOn())

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

  private constructInwindow(): Inwindow {
    const inwindow = new Inwindow("default", {
      height: 300, 
      ratio: 0.5,
      close: false,
      shaded: true,
      maxGrowFactor: 2,
    })
    const body = inwindow.body
    body.classList.add("akasha-layout")
    body.innerHTML = `
      <div class="akasha-album"></div>
      <div class="akasha-tray">
        <span>
          <button class="akasha-button theme-border hover-button">
            ${createIconHTML("cellulart-akasha-upload", { type: "div" })}
          </button>
        </span>
        <span>
          <button class="akasha-button theme-border hover-button">
            ${createIconHTML("cellulart-save", { type: "div" })}
          </button>
        </span>
        <span>
          <button class="akasha-button theme-border hover-button">
            ${createIconHTML("cellulart-upload", { type: "div" })}
          </button>
        </span>
      </div>
    `

    const [ drawBtn, saveBtn, uploadBtn ] = body.querySelectorAll("button")
    drawBtn.addEventListener(
      'click',
      () => {
        if (!this.activeRecord) { 
          return 
        }

        this.strokeSender.createSendingInwindow(
          this.activeRecord.dataURL,
          this.activeRecord.strokes
        )
      }
    )

    return inwindow
  }
  private createDownloadButton(canvas: HTMLCanvasElement, data: GarticStroke[]): HTMLElement {
    const newButton = constructElement({
      type: "div",
      class: "akasha-button-outer hover-button",
      style: `visibility: ${this.isOn() ? "initial" : "hidden"}`,
    })
    newButton.innerHTML = createIconHTML("cellulart-akasha-download", { type: "div" })

    newButton.addEventListener(
      'click', 
      () => {
        this.downloadCanvas(canvas, data)
        // console.log(this.records)
      },
      { once: true }
    )

    this.activeDownloadButtons.push(newButton)

    return newButton
  }

  private downloadCanvas(canvas: HTMLCanvasElement, strokes: GarticStroke[]) {
    const newCanvas = cloneCanvas(canvas)
    newCanvas.classList.add("akasha-entry", "theme-border", "hover-button")

    const newRecord: AkashicRecord = {
      element: newCanvas,
      dataURL: canvas.toDataURL(),
      strokes: strokes
    }

    newCanvas.addEventListener(
      "click",
      () => { this.focusRecord(newRecord) }
    )

    this.records.push(newRecord)
    this.inwindow.body.querySelector(".akasha-album")!.appendChild(newCanvas)
  }
  private focusRecord(record: AkashicRecord) {
    if (this.activeRecord == record) {
      record.element.classList.remove("highlight")
      this.activeRecord = null
      return
    } 
    
    if (this.activeRecord) {
      this.activeRecord.element.classList.remove("highlight")
    } 
    this.activeRecord = record
    record.element.classList.add("highlight")
  }
}

