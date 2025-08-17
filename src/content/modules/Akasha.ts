
import { createIconHTML, getModuleAsset } from "../components";
import { 
  Console,
  RedSettingsBelt, 
  PhaseChangeEvent, AlbumChangeEvent, CellulartEventType, 
  Inwindow, constructElement, 
  GarticStroke, StrokeSender,
  formatTime,
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
function akashaEntryFromImageSrc(src: string): HTMLImageElement{
  const img = new Image()
  img.src = src
  img.classList.add("akasha-entry", "theme-border", "hover-button")
  return img
}

type AkashicRecord = { 
  element: HTMLElement, 
  dataURL: string, 
  strokes: GarticStroke[] 
}

const versionToInterpreterMap: Map<string, (match1: string, match2: string) => AkashicRecord> = new Map([
  ["1.1.0", (match1, match2) => {
    const strokes = Object.values(JSON.parse(match2)) as GarticStroke[]
    for (const stroke of strokes) {
      if (stroke[0] == 8) {
        stroke.push(0)
      }
    }

    return {
      element: akashaEntryFromImageSrc(match1),
      dataURL: match1,
      strokes: strokes
    }
  }],
  ["1.5.2", (match1, match2) => {
    const compressedStrokes: any[][] = JSON.parse(match2.replaceAll("•", "],["))
    const strokes: GarticStroke[] = []
    let currentColor: [string, number, string | 1] | null = null;
    let currentStroke: number = 0
    for (const stroke of compressedStrokes) {
      if (typeof stroke[0] == "string") {
        currentColor = stroke as [string, number, string | 1]
        continue
      }
      if (stroke[0] == 2 || stroke[0] == 8) {
        strokes.push(stroke.toSpliced(1, 0, ++currentStroke) as GarticStroke)
      } else {
        strokes.push(stroke.toSpliced(1, 0, ++currentStroke, structuredClone(currentColor)) as GarticStroke)
      }
    }

    return {
      element: akashaEntryFromImageSrc(match1),
      dataURL: match1,
      strokes: strokes
    }
  }]
])
async function parseRecords(fileList: FileList | null): Promise<AkashicRecord[]> {
  if (!fileList || fileList.length === 0) {
    // console.log("No files provided.");
    return [];
  }

  // Iterate through each file in the FileList
  const newRecords = Array.from(fileList).map((file) => {
    return new Promise((resolve: (value: null | AkashicRecord) => void) => {
      const reader = new FileReader();

      // When the file is successfully read
      reader.onload = (event) => {
        const fileContent = event.target?.result;
        if (typeof fileContent !== 'string') { 
          resolve(null)
          return
        }

        const matchVersion = fileContent.match(/\|version\|:(.*?)\:\|version\|/);
        if (!matchVersion) {
          Console.warn(`File: ${file.name} - No match found for |1|.`, "Akasha");
          resolve(null)
          return
        }
        Console.log(`File: ${file.name} using encoding version ${matchVersion[1]}`, "Akasha")

        // Find portion between "|1|:" and ":|1|"
        const match1 = fileContent.match(/\|1\|:(.*?)\:\|1\|/);
        if (!match1) {
          Console.warn(`File: ${file.name} - No match found for |1|.`, "Akasha");
          resolve(null)
          return
        }

        // Find portion between "|2|:" and ":|2|"
        const match2 = fileContent.match(/\|2\|:(.*?)\:\|2\|/);
        if (!match2) {
          Console.warn(`File: ${file.name} - No match found for |2|.`, "Akasha");
          resolve(null)
          return
        }

        let versionInterpreter = versionToInterpreterMap.get(matchVersion[1])
        if (!versionInterpreter) {
          Console.warn("Saved record version doesn't match any interpreter. Defaulting to 1.1.0")
          versionInterpreter = versionToInterpreterMap.get("1.1.0")!
        }
        resolve(versionInterpreter(match1[1], match2[1]))
      };

      // Handle file reading errors
      reader.onerror = () => {
        Console.warn(`Error reading file: ${file.name}`, "Akasha");
        resolve(null)
      };

      // Read the file as text
      reader.readAsText(file);
    });
  });

  return Promise.all(newRecords).then((arr) => arr.filter((x) => x !== null))
}
function exportRecord(record: AkashicRecord) {
  const version = "1.5.2"

  const compressedStrokes: any[] = [];
  let currentColor: [string, number, string | 1] | null = null;
  for (const stroke of record.strokes) {
    if (stroke[0] == 2 || stroke[0] == 8) {
      compressedStrokes.push(stroke.toSpliced(1, 1))
      continue
    } else if (
      currentColor == null
      || stroke[2][0] != currentColor[0]
      || stroke[2][1] != currentColor[1]
      || stroke[2][2] != currentColor[2]
    ) {
      compressedStrokes.push(stroke[2]);
      currentColor = stroke[2] as [string, number, 1]
    } 
    compressedStrokes.push(stroke.toSpliced(1, 2))
  }
  const strokes = JSON.stringify(compressedStrokes).replaceAll("],[","•")
  const textToSave: string = `Packaged Gartic drawing generated by Gartic Cellulart\n\n|version|:${version}:|version||1|:${record.dataURL}:|1||2|:${strokes}:|2|`
  const dataURI = `data:text/plain;charset=utf-8,${encodeURIComponent(textToSave)}`

  const anchor = document.createElement("a");  // Memory leak?
  anchor.href = dataURI;
  anchor.download = "drawing.gartic";
  anchor.click();
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
  private records: Set<AkashicRecord> = new Set()
  private underlaidRecords: Set<AkashicRecord> = new Set()
  private activeRecord: AkashicRecord | null = null
  private eta!: HTMLElement

  constructor(moduleArgs: ModuleArgs) {
    super(moduleArgs, [
      CellulartEventType.PHASE_CHANGE,
      CellulartEventType.ALBUM_CHANGE,
      CellulartEventType.TIMELINE_CHANGE,
    ])

    this.strokeSender = moduleArgs.strokeSender
    this.inwindow = this.constructInwindow()

    document.documentElement.style.setProperty("--akasha-loading-url", `url(${getModuleAsset('akasha-loading.svg')})`)
  }

  protected onphasechange(event: PhaseChangeEvent): void {
    this.underlaidRecords.clear()

    const { data, newPhase } = event.detail
    if (newPhase != 'memory') {
      return
    }
    if (!(data.previous) || !(data.previous.data instanceof Array)) {
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

  protected adjustSettings(): void {
    this.inwindow.setVisibility(this.isOn())

    document.documentElement.style.setProperty(
      "--akasha-button-visibility", 
      this.isOn() ? "initial" : "hidden"
    )
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
        <span class="square">
          <button class="akasha-tray-button theme-border hover-button">
            ${createIconHTML("cellulart-akasha-upload", { type: "div" })}
          </button>
        </span>
        <span class="cellulart-skewer wiw-regular" style="grid-column: span 2; text-wrap-mode: nowrap;"></span>
        <span class="square">
          <button class="akasha-tray-button theme-border hover-button">
            ${createIconHTML("cellulart-save", { type: "div" })}
          </button>
        </span>
        <span class="square">
          <button class="akasha-tray-button theme-border hover-button">
            ${createIconHTML("cellulart-upload", { type: "div" })}
          </button>
          <input type="file" hidden>
        </span>
        <span class="square">
          <button class="akasha-tray-button theme-border hover-button">
            ${createIconHTML("cellulart-delete", { type: "div" })}
          </button>
        </span>
      </div>
    `

    const [ drawBtn, saveBtn, uploadBtn, deleteBtn ] = body.querySelectorAll("button")
    const uploadInput = body.querySelector('input')!

    drawBtn.addEventListener(
      'click',
      () => { 
        this.uploadActiveRecord() 
      }
    )
    saveBtn.addEventListener(
      'click',
      () => {
        this.saveActiveRecord()
      }
    )
    uploadBtn.addEventListener(
      'click',
      () => {
        uploadInput.click()
      }
    )
    uploadInput.addEventListener(
      'change',
      () => {
        this.parseRecords(uploadInput.files)
      }
    )
    deleteBtn.addEventListener(
      'click',
      () => { 
        this.deleteActiveRecord()
      }
    )

    this.eta = body.querySelector(".cellulart-skewer")!

    return inwindow
  }
  private createDownloadButton(canvas: HTMLCanvasElement, data: GarticStroke[]): HTMLElement {
    const newButton = constructElement({
      type: "div",
      class: "akasha-button-outer hover-button",
    })
    newButton.innerHTML = createIconHTML("cellulart-akasha-download", { type: "div" })

    newButton.addEventListener(
      'click', 
      () => {
        this.downloadCanvas(canvas, data)
        // console.log(this.records)
      }
    )

    return newButton
  }
  private downloadCanvas(canvas: HTMLCanvasElement, strokes: GarticStroke[]) {
    const newCanvas = cloneCanvas(canvas)
    newCanvas.classList.add("akasha-entry", "theme-border", "hover-button")

    this.addRecord({
      element: newCanvas,
      dataURL: canvas.toDataURL(),
      strokes: strokes
    })
  }
  private addRecord(newRecord: AkashicRecord) {
    newRecord.element.addEventListener(
      "click",
      () => { this.focusRecord(newRecord) }
    )

    this.records.add(newRecord)
    this.inwindow.body.querySelector(".akasha-album")!.appendChild(newRecord.element)
  }

  private focusRecord(record: AkashicRecord) {
    if (this.activeRecord == record) {
      record.element.classList.remove("highlight")
      this.activeRecord = null
      this.eta.textContent = ""
      return
    } 
    
    if (this.activeRecord) {
      this.activeRecord.element.classList.remove("highlight")
    } 

    this.activeRecord = record
    this.eta.textContent = `⏲ ${formatTime(Math.ceil(record.strokes.length / 8))}`
    record.element.classList.add("highlight")
  }
  private saveActiveRecord() {
    if (!this.activeRecord) { 
      return 
    }

    exportRecord(this.activeRecord)
  }
  private deleteActiveRecord() {
    if (!this.activeRecord) { 
      return 
    }

    this.records.delete(this.activeRecord)
    this.activeRecord.element.remove()
    this.eta.textContent = ""
  }
  private async parseRecords(files: FileList | null) {
    for (const record of await parseRecords(files)) {
      this.addRecord(record)
    }
  }
  private uploadActiveRecord() {
    if (!this.activeRecord) { 
      return 
    }
    
    const record = this.activeRecord
    const { buffer } = this.strokeSender.createSendingInwindow(
      record.dataURL,
      structuredClone(record.strokes) // Deep copy
    )

    buffer.addEventListener(
      "setstrokesending", 
      (event: Event) => {
        this.showUploadingRecordPreview(record)
      }
    )
  }
  private showUploadingRecordPreview(record: AkashicRecord) {
    if (this.underlaidRecords.has(record)) { 
      return
    }

    const drawContainer = document.body.querySelector(".drawingContainer") as HTMLElement
    if (!drawContainer) {
      Console.log("Couldn't preview drawing: couldn't find container", "Akasha")
      return
    }

    const img = new Image()
    img.classList.add('underlaid-img')
    img.src = record.dataURL
    drawContainer.insertAdjacentElement("beforebegin", img)

    this.underlaidRecords.add(record)
  }
}
