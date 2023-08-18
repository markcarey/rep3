chrome.omnibox.onInputEntered.addListener((text) => {
    // Encode user input for special characters , / ? : @ & = + $ #
    const newURL = 'https://rep3.bio/profile/' + encodeURIComponent(text);
    chrome.tabs.create({ url: newURL });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log(changeInfo);
    if ("status" in changeInfo && changeInfo.status == "complete") {
        setBadge(tab);
    }
});

chrome.tabs.onCreated.addListener(tab => {
    setBadge(tab);
});

async function getRatingForAddress(address) {
    return new Promise(async (resolve, reject) => {
      console.log('get profile for ' + address);
      const res = await fetch(`https://api.rep3.bio/api/profile/${address}`, { 
        method: 'GET', 
        headers: {
            "Content-Type": "application/json"
        }
      });
      var user = await res.json();
      resolve(user);
    });
}

async function getRatingForNFT(blockchain, address, tokenId) {
    return new Promise(async (resolve, reject) => {
        const res = await fetch(`https://api.rep3.bio/api/nft/${blockchain}/${address}/${tokenId}`, { 
        method: 'GET', 
        headers: {
            "Content-Type": "application/json"
        }
        });
        var user = await res.json();
        resolve(user);
    });
}

async function setBadge(tab) {
    console.log(tab);
    if (tab.status != 'complete') {
        return;
    }
    chrome.action.setBadgeText({
        "text": '',
        "tabId": tab.id
    });
    var rep3Url = "";
    const path = tab.url.split('/');
    console.log(path);
    var profile = null;
    if (tab.url.match(/.*\/0x[a-fA-F0-9]{40}\/[0-9]+$/i)) {
        // assume NFT
        //rep3Url = `https://rep3.bio/api/nft/${path[4]}/${path[5]}/${path[6]}`;
        profile = await getRatingForNFT(path[4], path[5], path[6]);
    } else {
        for (let i = 0; i < path.length; i++) {
            if (path[i].match(/^0x[a-fA-F0-9]{40}$/i)) {
                //rep3Url = `https://rep3.bio/api/profile/${path[i]}`;
                profile = await getRatingForAddress(path[i]);
                break;
            }
        }
    }
    if (profile) {
        console.log(profile);
        chrome.action.enable(tab.id);
        const stars = profile.average;
        if ( stars > 0 ) {
            //chrome.browserAction.setBadgeBackgroundColor({ "color": '#F00' }, () => {
            //    chrome.browserAction.setBadgeText({ "text": stars });
            //});
            console.log(stars, profile);
            chrome.action.setBadgeText({
                "text": ''+stars,
                "tabId": tab.id
            });
        }
    } else {
        chrome.action.disable(tab.id);
    }
}



