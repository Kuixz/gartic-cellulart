import { Bitmap, ImageRunner, ShapeTypes } from 'geometrizejs'

const options = {
    shapeTypes: [ShapeTypes.RECTANGLE, ShapeTypes.ELLIPSE],//, ShapeTypes.LINE], //0, 3, and 6 in geometrize, but 6, 7, and (? 1 ?) in gartic
    candidateShapesPerStep: 20,
    shapeMutationsPerStep: 100,
    alpha: 128
}

var runner = undefined

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.function == "set") {
            const data = request.data
            const bitmap = Bitmap.createFromByteArray(data.width, data.height, Object.values(data.data))
            runner = new ImageRunner(bitmap)
            sendResponse({ status:200 });
        } else if (request.function == "step") { 
            const step = runner.step(options)
            const shape = step[0]
            const response = { type: shape.shape.getType(), raw: shape.shape.getRawShapeData(), color: shape.color }
            console.log(shape.color)
            sendResponse(response);
        } else if (request.function === 2) {
            sendResponse(3)
        }
    }
);
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