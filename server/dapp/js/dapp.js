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
        $("#review-button").text('Submit');
    } else {
        // The user doesn't have Metamask installed.
        console.log("window.ethereum false");
    } 
}

async function renderProfile(user) {
    $("#profile-avatar").data("address", user.address).attr("src", user.image);
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
getRep('0x09A900eB2ff6e9AcA12d4d1a396DdC9bE0307661'); // TODO: change this



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





