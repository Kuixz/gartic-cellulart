import { getResource } from "./Assets";
import { Console, ElementDefinition } from "../foundation"

export function createIconHTML(svgName: string, def: ElementDefinition): string {
    return `<${def.type} class="cellulart-icon-contain ${def.class ?? ""}" style="clip-path: url(#${svgName}); ${def.style ?? ""}">${def.textContent ?? ""}</${def.type}>`
}

fetch(getResource("assets/module-assets.html")).then(r => r.text()).then(html => {
    document.body.insertAdjacentHTML('beforeend', html);
    Console.log("Module assets", "Controller")
});
