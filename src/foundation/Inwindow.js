import { setAttributes } from "./Core"

class InwindowElement {
    element = undefined
    header = undefined
    body = undefined

    constructor(e, h=undefined, b=undefined) {
        this.element = e
        this.header = h ? h : e.querySelector('.wiw-header')
        this.body = b ? b : e.querySelector('.wiw-body')
    }

    setVisibility(v) {
        if (v === false) { 
            this.element.style.visibility = 'hidden'
        } else if (v === true) { 
            this.element.style.visibility = 'visible'
        } else {
            this.element.style.visibility = v
        }
    }
}

const Inwindow = {
    wiwNode: undefined, // HTMLDivElement
    currentZIndex: 20,  // todo reset z index when a threshold is passed

    constructNode(customNode) {
        if (customNode) { Inwindow.wiwNode = customNode; return }
        Inwindow.wiwNode = setAttributes(document.createElement("div"), { style: "visibility: hidden", class: "window-in-window" })
        Inwindow.wiwNode.innerHTML = `
            <div class = "wiw-header">≡<div class = "wiw-close"></div></div>
            <div class = "wiw-body"></div>`
    },
    new(closeable, visible, ratio=(100/178)) {
        const newWIW = Inwindow.wiwNode.cloneNode(true)
        const v = visible ? "visible" : "hidden"
        // const r = ratio ? ratio : (100/178)
        closeable
            ? newWIW.querySelector(".wiw-close").onmousedown = function() { newWIW.remove() }
            : newWIW.querySelector(".wiw-close").remove()
        Inwindow.initDragElement(newWIW)
        Inwindow.initResizeElement(newWIW, ratio)
        setAttributes(newWIW, { 
            style: "visibility:" + v + "; min-height:" + (178 * ratio + 40) + "px; height:" + (178 * ratio + 40) + "px; max-height:" + (536 * ratio + 40) + "px", 
            parent: document.body 
        })
        return new InwindowElement(newWIW)
    },
    // The below code is taken from Janith at https://codepen.io/jkasun/pen/QrLjXP
    // and is used to make the various window-in-windows movable.
    initDragElement(element) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        var elmnt = null;
        var header = getHeader(element);
        
        element.onmousedown = function() {
            this.style.zIndex = String(++Inwindow.currentZIndex);
        }
        if (header) {
            header.parentWindow = element;
            header.onmousedown = dragMouseDown;
        }
        
        function dragMouseDown(e) {
            elmnt = this.parentWindow;

            e = e || window.event;
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            if (!elmnt) {
                return;
            }

            e = e || window.event;
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            elmnt.style.top = elmnt.offsetTop - pos2 + "px";
            elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
        }

        function closeDragElement() {
            /* stop moving when mouse button is released:*/
            document.onmouseup = null;
            document.onmousemove = null;
        }

        function getHeader(element) {
            return element.querySelector(".wiw-header");
        }
    },
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