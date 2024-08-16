const dogSrc: string = 'https://media.tenor.com/fej4_qoxdHYAAAAM/cute-puppy.gif'
import { GeomOn } from "./modules"

window.addEventListener('load', function() {
    const dogImg: HTMLImageElement = document.createElement('img')
    dogImg.src = dogSrc
    document.body.appendChild(dogImg)

    const localImg: HTMLImageElement = document.createElement('img')
    localImg.src = GeomOn
    document.body.appendChild(localImg)
}) 