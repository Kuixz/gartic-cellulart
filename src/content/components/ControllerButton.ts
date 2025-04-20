import { Console, DefaultSettings, getResource, setAttributes, Setting } from "../foundation"
import { ModuleLike } from "../modules"

function updateButtonTexture(button: HTMLElement, setting: Setting) {
    // console.log(setting.internalName)
    // console.log(DefaultSettings)
    switch (setting.internalName) {
        case DefaultSettings.off: 
            // console.log("mathed off")
            button.classList.add("disabled")
            button.classList.remove("red")
            button.classList.remove("asset-override")
            break
        case DefaultSettings.on: 
            // console.log("mathed on")
            button.classList.remove("disabled")
            button.classList.remove("red")
            button.classList.remove("asset-override")
            break
        case DefaultSettings.red: 
            // console.log("mathed red")
            button.classList.remove("disabled")
            button.classList.add("red")
            button.classList.remove("asset-override")
            break
        default: 
            // console.log("mathed nun")
            // if (!setting.overrideAssetPath) {
            //     Console.warn(`Setting ${setting.internalName} is nonstandard but no overrideAssetPath was given"`, "Controller")
            //     return
            // }
            button.classList.remove("disabled")
            button.classList.remove("red")
            if (setting.overrideAssetPath) {
                // console.log(setting.overrideAssetPath)
                button.classList.add ("asset-override")
                button.style.backgroundImage = `url(${setting.overrideAssetPath}`
            } else {
                // Just turn it back into an on texture I suppose
                Console.log(`Setting ${setting.internalName} is nonstandard but no overrideAssetPath was given"`, "Controller")
                button.classList.remove("asset-override")
            }
            break
    }
}
function createModuleButton (mod: ModuleLike): HTMLElement {
    const newButton = createButton(
        mod.name.toLowerCase(),
        // mod.setting.current,
        function() { return mod.menuStep() },
        // mod.isCheat && green
    )
    updateButtonTexture(newButton, mod.setting.current)
    return newButton
}
function createButton (svgID: string, onclick: () => Setting | undefined): HTMLElement {
    const item = document.createElement("div")
    setAttributes(item, { class: "controller-button-outer" })
    item.innerHTML = `
        <div class="controller-button-inner" style="clip-path: url(#cellulart-${svgID}-svg)"></div>
    `

    item.addEventListener("click", function() { 
        const newSetting = onclick()
        if (newSetting) { updateButtonTexture(item, newSetting) }
    })
    // if (hidden) { hiddenButtons.push(item); item.style.display = "none" } 
    return item
}

console.log(getResource("assets/module-svgs.html"))
fetch(getResource("assets/module-svgs.html")).then(r => r.text()).then(html => {
    document.body.insertAdjacentHTML('beforeend', html);
    Console.log("SVGs added", "Controller")
});

export { createButton, createModuleButton }
