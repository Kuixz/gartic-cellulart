
// const Worker = {
//     name: "Worker",

//     keepAliveCallback: null,

//     setKeepAlive(alive = true) {
//         if (alive) {
//             Worker.keepAliveCallback = setInterval(() => Worker.messageToWorker(2), 250)
//         } else {
//             if (Worker.keepAliveCallback) { clearInterval(Worker.keepAliveCallback); Worker.keepAliveCallback = null }
//         }
//     },
//     async messageToWorker(purpose, data=undefined) {
//         const message = (data === undefined) ? { function: purpose } : { function: purpose, data: data } 
//         const response = await chrome.runtime.sendMessage(message);
//         Console.log(response, 'Worker') 
//         return response
//     },
// }