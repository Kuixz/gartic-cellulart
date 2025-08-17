import {
  Bitmap,
  ImageRunner as CoreRunner,
  ImageRunnerOptions,
  ShapeTypes,
} from "geometrizejs";
// import { Channel, Endpoint } from '../shared/Channel'

// import some sort of standardized messaging class

const DEFAULT_RUNNER_OPTIONS: ImageRunnerOptions = {
  shapeTypes: [ShapeTypes.RECTANGLE, ShapeTypes.ELLIPSE], //, ShapeTypes.LINE], //0, 3, and 6 in geometrize, but 6, 7, and (? 1 ?) in gartic
  candidateShapesPerStep: 20,
  shapeMutationsPerStep: 100,
  alpha: 128,
};

// var runner: ImageRunner|undefined = undefined
var runner: CoreRunner | undefined;

// class ImageRunner {
//     channel: Endpoint
//     runner: CoreRunner | undefined
//     steps: number = 0

//     constructor() {
//         const channel = Channel.Directed("from", "Worker")
//         channel.registerAction("setImage", this.setImage)
//         channel.registerAction("step", this.step)
//         channel.registerAction("keepAlive", this.keepAlive)
//         this.channel = channel
//     }

//     setImage(bitmap: Bitmap) {
//         this.runner = new CoreRunner(bitmap)
//         this.steps = 0
//     }

//     async step(/* options?: ImageRunnerOptions */) {
//         if (!this.runner) {
//             this.channel.post("log", "Image is missing or expired")
//             return
//         }
//         const step = this.runner.step(/* options ??*/ DEFAULT_RUNNER_OPTIONS)
//         const shape = step[0]
//         const response: GeomRawShape = { type: shape.shape.getType(), raw: shape.shape.getRawShapeData(), svg: shape.shape.getSvgShapeData(), color: shape.color }
//         this.steps += 1
//         this.channel.post("shape", response)
//     }

//     keepAlive (){
//         this.channel.post("keepAlive", 3)
//     }
// }

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.function == "set") {
    const data = request.data;
    const bitmap = Bitmap.createFromByteArray(
      data.width,
      data.height,
      Object.values(data.data),
    );
    runner = new CoreRunner(bitmap);
    sendResponse({ status: 200 });
  } else if (request.function == "step") {
    if (!runner) {
      sendResponse("Image is missing or expired");
      return;
    }
    const step = runner.step(DEFAULT_RUNNER_OPTIONS);
    const shape = step[0];
    const response = {
      type: shape.shape.getType(),
      raw: shape.shape.getRawShapeData(),
      svg: shape.shape.getSvgShapeData(),
      color: shape.color,
    };
    console.log(shape.color);
    sendResponse(response);
  } else if (request.function === 2) {
    sendResponse(3);
  }
});
// onmessage = (e) => {
//     const data = e.data
//     const bitmap = Bitmap.createFromByteArray(data.width, data.height, data.data)
//     runner = new ImageRunner(bitmap)
//     postMessage(200)
// };

// chrome.webRequest.onBeforeRequest.addListener((details) => {
//     console.log(details)
// })
// chrome.webRequest.onBeforeRequest.addListener(
//     (details) => { console.log(details) },
//     { urls:["https://garticphone.com/"] }
// )
