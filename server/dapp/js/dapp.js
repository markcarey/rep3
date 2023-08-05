const zeroAddress = "0x0000000000000000000000000000000000000000";

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};

var addr = {};
addr.apothem = {
    "eas": "0xB8fa3922345707Da836aeBa386f39Dc3721d48BF",
    "rep3": "0x3480193C1C48157e7f3bFf6bC5bfaCB0d49261eF",
    "schemaUid": "0x99e185c8fafb926a3cf0f4550f80adc118482f65213be236820fdd43611c7a83",
    "evmChainId": 51,
    "testnet": true,
    "name": "XDC Apothem",
    "rpc": "erpc.apothem.network",
    "wss": "ws.apothem.network/ws",
    "slug": "apothem",
    "folder": "testnet/",
    "native": "TXDC"
};

var chain = "apothem";
var accounts = [];
var provider, ethersSigner;
var eas;
var profileAddress, profileUser;

function setupChain() {
    var rpcURL = addr[chain].rpc;
    const prov = {"url": "https://"+rpcURL};
    provider = new ethers.providers.JsonRpcProvider(prov);
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    }
    var wssProvider = new ethers.providers.WebSocketProvider(
        "wss://" + addr[chain].wss
    );
    eas = new ethers.Contract(
        addr[chain].eas,
        easABI,
        wssProvider
    );
    web3 = AlchemyWeb3.createAlchemyWeb3("wss://" + addr[chain].wss);
}
setupChain();

provider.on("network", async (newNetwork, oldNetwork) => {
    if (oldNetwork) {
        console.log(newNetwork, oldNetwork);
    }
});

function abbrAddress(address){
    if (!address) {
        address = accounts[0];
    }
    return address.slice(0,4) + "..." + address.slice(address.length - 4);
}

async function connect(){
    if (window.ethereum) {
        //console.log("window.ethereum true");
        await provider.send("eth_requestAccounts", []);
        ethersSigner = provider.getSigner();
        accounts[0] = await ethersSigner.getAddress();
        console.log(accounts);
        $(".connected-address").text(abbrAddress());
        $(".connected-avatar").attr("src", `https://web3-images-api.kibalabs.com/v1/accounts/${accounts[0]}/image`);
        $("#review-button").text('Submit');
    } else {
        // The user doesn't have Metamask installed.
        console.log("window.ethereum false");
    } 
}

async function renderProfile(user) {
    $("#profile-title").text(user.address);
    $("#profile-avatar").data("address", user.address).attr("src", user.profile.image);
    $("#profile-address").text(user.address);
    $("#profile-name").text(user.profile.name);
    $("#profile-type").text(user.type);
    $("#profile-average-rating").data("current-rating", user.average).barrating({
        theme: "fontawesome-stars-o",
        showSelectedRating: false,
        initialRating: user.average,
        readonly: true
    });
    $("#top-transactions").attr("href", `https://etherscan.io/address/${user.address}`); // TODO: other chains?
    $("#profile-eth").text(user.profile.eth.toFixed(2)).counterUp({
        delay: 10,
        time: 1000
    });
    $("#profile-usdc").text(user.profile.usdc.toFixed(0)).counterUp({
        delay: 10,
        time: 1000
    });
    if (user.profile.socials.lens) {
        $("#lens").attr("href", `https://www.lensfrens.xyz/${user.profile.socials.lens}`).attr("data-bs-original-title", user.profile.socials.lens).tooltip().parent().show();
    }
    if (user.profile.socials.farcaster) {
        $("#farcaster").attr("href", `https://warpcast.com/${user.profile.socials.farcaster}`).attr("data-bs-original-title", user.profile.socials.farcaster).tooltip().parent().show();
    }
    for (let i = 0; i < user.ratings.length; i++) {
        $("#profile-reviews").prepend( getReviewHTML(user.ratings[i]) );
    }
    if (user.ratings.length > 0) {
        $(".u-rating-fontawesome-o").each(function(){
            var currentRating = $(this).data("current-rating");
            $(this).barrating({
              theme: "fontawesome-stars-o",
              showSelectedRating: false,
              initialRating: currentRating,
              readonly: true
            });
        });
    }
    $("#review-button").data("address", user.address);
    for (let i = 0; i < user.profile.nfts.length; i++) {
        if (user.profile.nfts[i].tokenNfts.contentValue.image) {
            $("#profile-nfts").append( getNftHTML(user.profile.nfts[i]) );
        }
    }
    for (let i = 0; i < user.profile.poaps.length; i++) {
        if (user.profile.poaps[i].poapEvent.contentValue.image) {
            $("#profile-poaps").append( getPoapHTML(user.profile.poaps[i]) );
        }
    }
}

async function getRep(address) {
    const res = await fetch(`https://api.rep3.bio/api/profile/${address}`, { 
        method: 'GET', 
        headers: {
            "Content-Type": "application/json"
        }
    });
    var user = await res.json();
    console.log(user);
    await renderProfile(user);
}
async function getNft(blockchain, address, id) {
    const res = await fetch(`https://api.rep3.bio/api/nft/${blockchain}/${address}/${id}`, { 
        method: 'GET', 
        headers: {
            "Content-Type": "application/json"
        }
    });
    var user = await res.json();
    console.log(user);
    await renderProfile(user);
}

const path = window.location.pathname.split('/');
console.log("path", path);

if ( path[1] == "nft" ) {
    getNft(path[2], path[3], path[4]);
} else if ( path[1] == "profile") {
    getRep(path[2]);
} else {
    // TODO: home page?
}

//getRep('0x09A900eB2ff6e9AcA12d4d1a396DdC9bE0307661'); // TODO: change this
//getRep('0xcB49713A2F0f509F559f3552692642c282db397f'); // Bob TODO: change this


async function review(data) {
    console.log(data);
    const rating = parseInt(data.rating);
    const attData = ethers.utils.defaultAbiCoder.encode(["uint8", "string"], [rating, data.review]);
    const attestationRequestData = {
        "recipient": data.address,
        "expirationTime": 0,
        "revocable": true,
        "refUID": ethers.constants.HashZero,
        "data": attData,
        "value": 0
    };
    const attestationRequest = {
        "schema": addr[chain].schemaUid,
        "data": attestationRequestData
    };
    console.log(attestationRequest);
    await eas.connect(ethersSigner).attest(attestationRequest);
}

function getReviewHTML(data) {
    var html = '';
    data.image = `https://web3-images-api.kibalabs.com/v1/accounts/${data.attester}/image`;
    data.name = abbrAddress(data.attester);
    html = `
        <!-- Review -->
        <div class="your-msg review-block">
        <div class="media"><img class="img-50 img-fluid m-r-20 rounded-circle attester-avatar" alt="" src="${data.image}">
            <div class="media-body"><span class="f-w-600"><a class="attestor" href="/profile/${data.attester}">${data.name}</a> <!--<span>1 Year Ago</span>--> </span>
            <select class="rating u-rating-fontawesome-o" name="rating" data-current-rating="${data.rating}" autocomplete="off">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
            </select>
            <p class="review">${data.review}</p>
            </div>
        </div>
        </div>
    `;
    return html;
}

function getNftHTML(data) {
    const nft = data;
    var html = '';
    var tba = "tbd";
    var explorerUrl = '';
    var explorerImage = '';
    if (nft.blockchain == "polygon") {
        explorerUrl = `https://polygonscan.com/token/${nft.tokenAddress}?a=${nft.tokenId}#inventory`;
        explorerImage = 'polygon.svg';
    }
    if (nft.blockchain == "ethereum") {
        explorerUrl = `https://etherscan.io/nft/${nft.tokenAddress}/${nft.tokenId}`;
        explorerImage = 'etherscan.svg';
    }
    html = `
        <!-- nft block -->
        <figure class="col-xl-3 col-sm-6" itemprop="associatedMedia" itemscope=""><a href="${nft.tokenNfts.contentValue.image.large}" itemprop="contentUrl" data-size="950x950"><img src="${nft.tokenNfts.contentValue.image.small}" itemprop="thumbnail" alt="Image description">
            <div class="caption">
            <h4>${nft.tokenNfts.metaData.name}</h4>
            <p>${nft.tokenNfts.metaData.description}</p>
            </div></a>
            <figcaption itemprop="caption description">
                <h4>${nft.tokenNfts.metaData.name}</h4>
                <p>${nft.tokenNfts.metaData.description}</p>
                <a href="/nft/${nft.blockchain}/${nft.tokenAddress}/${nft.tokenId}" target="_blank"><img src="https://rep3.bio/images/rep3.png" class="nft-icons" /></a>
                <a href="${explorerUrl}" target="_blank"><img src="https://rep3.bio/images/${explorerImage}" class="nft-icons" /></a>
            </figcaption>
        </figure>
    `;
    return html;
}

function getPoapHTML(data) {
    const poap = data;
    var html = '';
    var tba = "tbd";
    html = `
        <!-- nft block -->
        <figure class="col-xl-3 col-sm-6" itemprop="associatedMedia" itemscope=""><a href="${poap.poapEvent.contentValue.image.large}" itemprop="contentUrl" data-size="950x950"><img src="${poap.poapEvent.contentValue.image.small}" itemprop="thumbnail" alt="Image description">
            <div class="caption">
            <h4>${poap.poapEvent.metadata.name}</h4>
            <p>${poap.poapEvent.metadata.description}</p>
            </div></a>
            <figcaption itemprop="caption description">
                <h4>${poap.poapEvent.metadata.name}</h4>
                <p>${poap.poapEvent.metadata.description}</p>
                <a href="/profile/${poap.tokenAddress}/${poap.tokenId}" target="_blank"><img src="https://rep3.bio/images/rep3.png" class="nft-icons" /></a>
            </figcaption>
        </figure>
    `;
    return html;
}

$( document ).ready(function() {

    $(".connect").click(function(){
        connect();
        return false;
    });

    $("#review-button").click(function(e){
        e.preventDefault();
        if ( !accounts[0] ) {
            connect();
            return false;
        }
        $(this).text("Submitting...");
        const rating = $("#profile-rating").val();
        //console.log(rating);
        const data = {
            "rating": rating,
            "review": $("#review").val(),
            "address": $(this).data("address")
        };
        review(data);
        return false;
    });

    $('#search').keypress(function(event){
        console.log("search enter with " + $(this).val());
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            var address = $(this).val();
            // TODO: validate input
            var valid = true;
            if (valid) {
                window.location = `/profile/${address}`;
            }
        }
        return false;
    });

}); // docready





