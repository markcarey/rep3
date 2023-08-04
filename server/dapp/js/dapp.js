const zeroAddress = "0x0000000000000000000000000000000000000000";

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};

var addr = {};
addr.apothem = {
    "eas": "0xB8fa3922345707Da836aeBa386f39Dc3721d48BF",
    "rep3": "0x3480193C1C48157e7f3bFf6bC5bfaCB0d49261eF",
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

function setupChain() {
    var rpcURL = addr[chain].rpc;
    const prov = {"url": "https://"+rpcURL};
    provider = new ethers.providers.JsonRpcProvider(prov);
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    }
    var wssProvider = new ethers.providers.WebSocketProvider(
        "wss://" + rpcURL
    );
    eas = new ethers.Contract(
        addr[chain].easAddress,
        easABI,
        wssProvider
    );
    web3 = AlchemyWeb3.createAlchemyWeb3("wss://"+rpcURL);
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
    } else {
        // The user doesn't have Metamask installed.
        console.log("window.ethereum false");
    } 
}

async function review(data) {
    console.log(data);

}


$( document ).ready(function() {

    $(".connect").click(function(){
        connect();
        return false;
    });

    $("#review-button").click(function(){
        if ( !accounts[0] ) {
            connect();
            return false;
        }
        $(this).text("Submitting...");
        const rating = $("#profile-rating").val();
        console.log(rating);
        const data = {
            "rating": rating,
            "review": $("#review").val(),
            "address": $(this).data("address")
        };
        review(data);
        return false;
    });

}); // docready





