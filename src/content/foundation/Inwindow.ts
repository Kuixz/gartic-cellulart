import { Console } from "./Console"
import { DEFAULTINWINDOWRATIO } from "./Const"
import { setAttributes, setParent } from "./Util"

const headerHeight = 40
const defaultWidth = document.body.clientWidth / 8
const defaultHeight = defaultWidth * DEFAULTINWINDOWRATIO

const defaultInwindowNode = document.createElement("div")
setAttributes(defaultInwindowNode, { style: "visibility: hidden", class: "window-in-window" })
defaultInwindowNode.innerHTML = `
<div class = "wiw-header">≡<div class = "wiw-close"></div></div>
<div class = "wiw-body"></div>`


var currentZIndex: number = 20 

class InwindowElement {
    element: HTMLElement
    header: HTMLElement
    body: HTMLElement
    close: HTMLElement | null

    constructor(
        element: HTMLElement | "default" = "default", 
        options?: {
            header?: HTMLElement, 
            body?: HTMLElement, 
            close?: HTMLElement | boolean,
            visible?: boolean,

            width?: number,
            height?: number,
            ratio?: number,
            maxGrowFactor?: number
        }) {
        const e = element == "default" ? defaultInwindowNode.cloneNode(true) as HTMLElement : element
        this.element = e
        this.header = options?.header ?? e.querySelector('.wiw-header') ?? e
        this.body = options?.body ?? e.querySelector('.wiw-body') ?? e
        this.close = options?.close !== undefined ? (() => {
            if(typeof options.close == "boolean") {
                return e.querySelector('.wiw-close')
            } else { return options.close }
        })() : e.querySelector('.wiw-close')
        // this.close = options?.close !== undefined ? (options.close == true ? element.querySelector('.wiw-close') : options.close == false ? null : options.close) : null
        // this.close = typeof options?.close != "boolean" ? options?.close ?? element.querySelector('.wiw-close') : options.close ? element.querySelector('.wiw-close') : null
        const resizeRatio = options?.ratio
        const closeable = options?.close !== false

        const v = options?.visible ? "visible" : "hidden"
        this.element.style.visibility = v

        initDragElement(this)
        initSizeElement(this, options)
        initResizeElement(this, resizeRatio)
        initRemoveElement(this, closeable)
    
        setParent(this.element, document.body)
    }

    setVisibility(v: boolean | string) {
        // if (!!v === v) {
        //     this.element.style.visibility = v ? "visible" : "hidden"
        // }

        if (v === false) { 
            this.element.style.visibility = 'hidden'
        } else if (v === true) { 
            this.element.style.visibility = 'visible'
            giveZPriority(this)
        } else {
            this.element.style.visibility = v
            // 
        }
    }
}

// The below code is adapted from Janith at https://codepen.io/jkasun/pen/QrLjXP
// and is used to make the various window-in-windows movable.
function initDragElement(inwindow: InwindowElement) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    var dragTarget: HTMLElement = inwindow.header;
    var dragElement: HTMLElement = inwindow.element;
    
    dragElement.onmousedown = () => {
        giveZPriority(inwindow)
    }

    dragTarget.onmousedown = function(e: MouseEvent) {
        e = e || window.event;
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        // call a function whenever the cursor moves:
        document.addEventListener("mousemove", elementDrag);
        document.addEventListener("mouseup", closeDragElement)
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
        document.removeEventListener("mousemove", elementDrag);
        document.removeEventListener("mouseup", closeDragElement);
    }
}
function initResizeElement(inwindow: InwindowElement, ratio?: number) {
    const elmnt = inwindow.element
    var startX = 0, startY = 0, startWidth = 0, startHeight = 0;
    
    var both = document.createElement("div");
    both.classList.add("resizer-both");
    elmnt.appendChild(both);

    both.addEventListener("mousedown", initDrag, false);

    function initDrag(e: MouseEvent) {
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(
            document.defaultView?.getComputedStyle(elmnt).width ?? elmnt.style.width ?? 100,
            10
        );
        startHeight = parseInt(
            document.defaultView?.getComputedStyle(elmnt).height ?? elmnt.style.height ?? 100,
            10
        );
        document.documentElement.addEventListener("mousemove", doDrag, false);
        document.documentElement.addEventListener("mouseup", stopDrag, false);
    }

    function doDrag(e: MouseEvent) {
        if (ratio) {
            var dist = Math.max(e.clientX - startX, (e.clientY - startY) / ratio)
            elmnt.style.width = startWidth + dist + "px";
            elmnt.style.height = startHeight + ratio * dist + "px";
        } else {
            elmnt.style.width = startWidth + (e.clientX - startX) + "px";
            elmnt.style.height = startHeight + (e.clientY - startY) + "px";
        }
    }

    function stopDrag() {
        document.documentElement.removeEventListener("mousemove", doDrag, false);
        document.documentElement.removeEventListener("mouseup", stopDrag, false);
    }
}

function initSizeElement(inwindow: InwindowElement, options: undefined | {
    width?: number,
    height?: number,
    ratio?: number,
    maxGrowFactor?: number
}) {
    var computedWidth = defaultWidth
    var computedHeight = defaultHeight
    if (options) {
        if (options.width && options.height && options.ratio) {
            if (options.width * options.ratio != options.height) {
                Console.warn("Inconsistent dimensions supplied to Inwindow constructor")
            }
            computedWidth = options.width
            computedHeight = options.height
        }
        else if (!options.width && !options.height && options.ratio) {
            computedHeight = defaultWidth * options.ratio
        } else {
            if (options.width) {
                computedWidth = options.width
                if (options.ratio) {
                    computedHeight = options.width * options.ratio
                }
            }
            if (options.height) {
                computedHeight = options.height
                if (options.ratio) {
                    computedWidth = options.height / options.ratio
                }
            }
        }
    }
    const growFactor = options?.maxGrowFactor ?? 3

    inwindow.element.style.minWidth = `${computedWidth}px`
    inwindow.element.style.width    = `${computedWidth}px`
    inwindow.element.style.maxWidth = `${computedWidth * growFactor}px`

    inwindow.element.style.minHeight = `${computedHeight + headerHeight}px`
    inwindow.element.style.height    = `${computedHeight + headerHeight}px`
    inwindow.element.style.maxHeight = `${computedHeight * growFactor + headerHeight}px`
}
function initRemoveElement(inwindow: InwindowElement, closeable: boolean = true) {
    if (!inwindow.close){ return }
    if (closeable) {
        inwindow.close.onmousedown = function() { inwindow.element.remove() }
    } else {
        inwindow.close.remove()
    }
}

function giveZPriority(inwindow: InwindowElement) {
    inwindow.element.style.zIndex = String(++currentZIndex);
}

export { InwindowElement as Inwindow }
