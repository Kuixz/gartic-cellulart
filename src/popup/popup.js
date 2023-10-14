document.addEventListener('DOMContentLoaded', function () {
    const input = document.querySelector("input")
    const label = document.querySelector("label")
    mail("status", function(response) {
        if (response.open) { closeChannel("Already open!") }
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

function closeChannel(blurb) {
    subtitle = document.createElement("h2");
    subtitle.textContent = blurb;
    
    main = document.getElementById("main");
    main.insertAdjacentElement("afterEnd", subtitle); 
    main.remove();
}