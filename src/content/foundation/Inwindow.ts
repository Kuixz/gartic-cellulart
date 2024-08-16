
class InwindowElement {
    element: HTMLElement
    header: HTMLElement
    body: HTMLElement

    constructor(e: HTMLElement, h?: HTMLElement, b?: HTMLElement) {
        this.element = e
        this.header = h ?? e.querySelector('.wiw-header') ?? e
        this.body = b ?? e.querySelector('.wiw-body') ?? e
    }

    setVisibility(v: boolean | string) {
        // if (!!v === v) {
        //     this.element.style.visibility = v ? "visible" : "hidden"
        // }
        if (v === false) { 
            this.element.style.visibility = 'hidden'
        } else if (v === true) { 
            this.element.style.visibility = 'visible'
        } else {
            this.element.style.visibility = v
        }
    }
}

class ƎǃInwindow {
    wiwNode: HTMLElement // HTMLDivElement
    currentZIndex: number = 20  // todo reset z index when a threshold is passed

    constructor(customNode?: HTMLElement) {
        if (customNode) { this.wiwNode = customNode; return }
        const wiwNode = document.createElement("div")
                          .setAttributes([["style", "visibility: hidden"], ["class", "window-in-window"]])
        wiwNode.innerHTML = `
            <div class = "wiw-header">≡<div class = "wiw-close"></div></div>
            <div class = "wiw-body"></div>`

        this.wiwNode = wiwNode
    }
    new(closeable?: boolean, visible?: boolean, ratio=(100/178)) {
        const newWIW = this.wiwNode.cloneNode(true) as HTMLElement
        const v = visible ? "visible" : "hidden"
        // const r = ratio ? ratio : (100/178)
        closeable
            ? newWIW.querySelector(".wiw-close").onmousedown = function() { newWIW.remove() }
            : newWIW.querySelector(".wiw-close").remove()
        this.initDragElement(newWIW)
        this.initResizeElement(newWIW, ratio)
        newWIW.setAttribute("style", "visibility:" + v + "; min-height:" + (178 * ratio + 40) + "px; height:" + (178 * ratio + 40) + "px; max-height:" + (536 * ratio + 40) + "px") 
        newWIW.attachTo(document.body)
        return new InwindowElement(newWIW)
    }

    // The below code is adapted from Janith at https://codepen.io/jkasun/pen/QrLjXP
    // and is used to make the various window-in-windows movable.
    initDragElement(element: InwindowElement) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        var dragTarget: HTMLElement = element.header;
        var dragElement: HTMLElement = element.body;
        
        dragElement.onmousedown = () => {
            dragElement.style.zIndex = String(++this.currentZIndex);
        }

        dragTarget.onmousedown = function(e: MouseEvent) {
            e = e || window.event;
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
            document.onmouseup = closeDragElement;
        }

        function elementDrag(e: MouseEvent) {
            e = e || window.event;
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            dragElement.style.top = dragElement.offsetTop - pos2 + "px";
            dragElement.style.left = dragElement.offsetLeft - pos1 + "px";
        }

        function closeDragElement() {
            /* stop moving when mouse button is released:*/
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
    initResizeElement(element, ratio) {
        var elmnt = null;
        var startX, startY, startWidth, startHeight;
        
        var both = document.createElement("div");
        both.classList.add("resizer-both");
        element.appendChild(both);

        both.addEventListener("mousedown", initDrag, false);
        both.parentWindow = element;

        function initDrag(e) {
            elmnt = this.parentWindow;

            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(
                document.defaultView.getComputedStyle(elmnt).width,
                10
            );
            startHeight = parseInt(
                document.defaultView.getComputedStyle(elmnt).height,
                10
            );
            document.documentElement.addEventListener("mousemove", doDrag, false);
            document.documentElement.addEventListener("mouseup", stopDrag, false);
        }

        function doDrag(e) {
            var dist = Math.max(e.clientX - startX, (e.clientY - startY) / ratio)
            elmnt.style.width = startWidth + dist + "px";
            elmnt.style.height = startHeight + ratio * dist + "px";
        }

        function stopDrag() {
            document.documentElement.removeEventListener("mousemove", doDrag, false);
            document.documentElement.removeEventListener("mouseup", stopDrag, false);
        }
    }
}

export { Inwindow, InwindowElement }