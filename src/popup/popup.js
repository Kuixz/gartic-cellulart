const main = document.querySelector("div");
const subtitle = document.querySelector("h2");

document.addEventListener('DOMContentLoaded', function () {
    const input = document.querySelector("input")
    const label = document.querySelector("label")
    mail("status", function(response) {
        if (response.open) { 
            closeChannel("Already open!") 
        } else {
            openChannel()
        }
    })
    // closeChannel("Not on Gartic")
    document.querySelector("form").addEventListener("submit", function(e) {
        e.preventDefault()
        mail(input.value, function(response) {
            if (response.open) { closeChannel("Success!"); return }
            label.textContent = "Failure!" 
        })
        // unlock(input, label)
    })
})
async function mail(message, rsvp) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message).then(response => rsvp(response))
    })
}

function openChannel() {
    main.style.display = "initial";
    subtitle.textContent = "";
}
function closeChannel(blurb) {
    main.remove();
    subtitle.textContent = blurb;
}
