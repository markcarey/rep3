async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function setFrameURL() {
    const tab = await getCurrentTab();
    const url = tab.url;
    console.log(url);
    const path = url.split('/');
    console.log(path);
    var rep3Url = "";
    if (url.match(/.*\/0x[a-fA-F0-9]{40}\/[0-9]+$/i)) {
        // assume NFT
        rep3Url = `https://rep3.bio/nft/${path[4]}/${path[5]}/${path[6]}`
    } else {
        for (let i = 0; i < path.length; i++) {
            if (path[i].match(/^0x[a-fA-F0-9]{40}$/i)) {
                rep3Url = `https://rep3.bio/profile/${path[i]}`;
                break;
            }
        }
    }
    console.log(rep3Url);
    //document.getElementById('rep3').src = rep3Url;
    var iframe = document.createElement('iframe');
    iframe.src = rep3Url;
    document.body.appendChild(iframe);
}
setFrameURL();