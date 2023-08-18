var firebase = require('firebase-admin');
if (!firebase.apps.length) {
    firebase.initializeApp();
}

const express = require("express");
const api = express();

const { ethers } = require("ethers");
const tokenbound = require("@tokenbound/sdk-ethers");

const rep3JSON = require(__base + 'rep3/Rep3Rating.json');
const easJSON = require(__base + 'rep3/EAS.json');

const fetch = require('node-fetch');

var eas, nft;
const airstackAPI = `https://api.airstack.xyz/gql`;

function getContracts() {
    const provider = new ethers.providers.JsonRpcProvider({"url": process.env.API_URL_APOTHEM});
    eas = new ethers.Contract(process.env.EAS_ADDRESS, easJSON.abi, provider);
    nft = new ethers.Contract(process.env.REP3_ADDRESS, rep3JSON.abi, provider);
}

function airstackQuery() {
  return `
  query Rep3($address: Identity!) {
    poaps: Poaps(input: {filter: {owner: {_eq: $address}}, blockchain: ALL}) {
      Poap {
        dappName
        tokenAddress
        tokenId
        blockchain
        chainId
        poapEvent {
          description
          eventName
          city
          metadata
          contentValue {
            image {
              extraSmall
              small
              medium
              large
              original
            }
          }
        }
      }
    }
    socials: Socials(
      input: {filter: {identity: {_eq: $address}}, blockchain: ethereum}
    ) {
      Social {
        dappName
        profileName
        profileTokenUri
        userHomeURL
        identity
      }
    }
    ens: Domains(
      input: {filter: {isPrimary: {_eq: true}, owner: {_eq: $address}}, blockchain: ethereum}
    ) {
      Domain {
        name
      }
    }
    nfts_eth: TokenBalances(
      input: {filter: {owner: {_eq: $address}, tokenType: {_eq: ERC721}}, blockchain: ethereum, order: {lastUpdatedTimestamp: DESC}}
    ) {
      TokenBalance {
        blockchain
        chainId
        tokenId
        tokenAddress
        tokenNfts {
          address
          id
          metaData {
            name
            image
            description
          }
          contentValue {
            image {
              extraSmall
              small
              medium
              large
              original
            }
          }
        }
      }
    }
    nfts_poly: TokenBalances(
      input: {filter: {owner: {_eq: $address}, tokenType: {_eq: ERC721}}, blockchain: polygon, order: {lastUpdatedTimestamp: DESC}}
    ) {
      TokenBalance {
        blockchain
        chainId
        tokenId
        tokenAddress
        tokenNfts {
          address
          id
          metaData {
            name
            image
            description
          }
          contentValue {
            image {
              extraSmall
              small
              medium
              large
              original
            }
          }
        }
      }
    }
    usdc: TokenBalances(
      input: {filter: {owner: {_eq: $address}, tokenAddress: {_eq: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"}, tokenType: {_eq: ERC20}}, blockchain: ethereum, order: {lastUpdatedTimestamp: DESC}}
    ) {
      TokenBalance {
        amount,
        formattedAmount,
        tokenAddress,
        token {
          symbol,
          name
        }
      }
    },
    xmtp: XMTPs(input: {blockchain: ALL, filter: {owner: {_eq: $address}}}) {
      XMTP {
        isXMTPEnabled
        id
        blockchain
      }
    }
  }
  `;
}

function airstackNftImage(blockchain, address, id) {
  return `query NFTImage {
    TokenNft(
      input: {tokenId: "${id}", blockchain: ${blockchain}, address: "${address}"}
    ) {
      contentValue {
        image {
          small
        }
      }
    }
  }`;
}

async function getProfileData(address) {
  return new Promise(async (resolve, reject) => {
      const headers = {
          'Content-Type': 'application/json',
          'Authorization': process.env.AIRSTACK_API_KEY
      };
      var res = await fetch(airstackAPI, { 
          method: 'POST', 
          headers: headers,
          body: JSON.stringify({
              "query": airstackQuery(),
              "variables": {
                "address": address
              }
          })
      });
      var profileResult = await res.json();        
      resolve(profileResult.data);
  });
}

async function getNftImage(blockchain, address, id) {
  return new Promise(async (resolve, reject) => {
      const headers = {
          'Content-Type': 'application/json',
          'Authorization': process.env.AIRSTACK_API_KEY
      };
      var res = await fetch(airstackAPI, { 
          method: 'POST', 
          headers: headers,
          body: JSON.stringify({
              "query": airstackNftImage(blockchain, address, id)
          })
      });
      var result = await res.json();        
      var image = result.data.TokenNft.contentValue.image ? result.data.TokenNft.contentValue.image.small : "";
      resolve(image);
  });
}

function abbrAddress(address){
  return address.slice(0,4) + "..." + address.slice(address.length - 4);
}

function ipfsToHttp(ipfs) {
  var http = "";
  var cid = ipfs.replace("ipfs://", "");
  //http = "https://" + cid + ".ipfs.dweb.link";
  //http = "https://ipfs.io/ipfs/" + cid;
  http = "https://nftstorage.link/ipfs/" + cid;
  return http;
}

function getName(address, profile) {
  var name = abbrAddress(address);
  if ("ens" in profile ) {
    if ("Domain" in profile.ens) {
      if (profile.ens.Domain && profile.ens.Domain.length > 0) {
        name = profile.ens.Domain[0].name;
        return name;
      }
    }
  }
  if ("socials" in profile) {
    if ("Social" in profile.socials) {
      if (profile.socials.Social && profile.socials.Social.length > 0) {
        name = profile.socials.Social[0].profileName;
        return name;
      }
    }
  }
  return name;
}

function getSocials(socialData) {
  var lens = null;
  var farcaster = null;
  if (socialData) {
    for (let i = 0; i < socialData.length; i++) {
      if (socialData[i].dappName == "lens") {
        lens = socialData[i].profileName;
      }
      if (socialData[i].dappName == "farcaster") {
        farcaster = socialData[i].profileName;
      }
    }
  }
  var socials = {
    "lens": lens,
    "farcaster": farcaster
  }
  return socials;
}

function getParams(req, res, next) {
    var params;
    if (req.method === 'POST') {
      params = req.body;
    } else {
      params = req.query;
    }
    req.q = params;
    next();
}

function cors(req, res, next) {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
      // Send response to OPTIONS requests
      res.set('Access-Control-Allow-Methods', 'GET, POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '3600');
      return res.status(204).send('');
    } else {
      // Set CORS headers for the main request
      res.set('Access-Control-Allow-Origin', '*');
    }
    next();
}

api.use(cors);
api.use(getParams);

api.get("/api", async function (req, res) {
    return res.json({"what": "rep3 api", "why": "tba"});
});

api.get("/api/connect/:address", async function (req, res) {
  const provider = new ethers.providers.JsonRpcProvider({"url": process.env.API_URL_APOTHEM});
  var address = req.params.address;
  const gas = await provider.getBalance(address);
  if (parseFloat(gas) == 0) {
    const signer = new ethers.Wallet(process.env.REP3_PRIVATE, provider);
    const tx = await signer.sendTransaction({
      to: address,
      value: ethers.utils.parseEther("1")
    });
    await tx.wait();
  }
  return res.json({"result": "ok"});
});

api.get("/api/latest", async function (req, res) {
  getContracts();
  var start = 52298258 - 1;
  var end = 'latest';
  let rated = nft.filters.Rated();
  let ratedLogs = await nft.queryFilter(rated, start, end);
  console.log(JSON.stringify(ratedLogs));
  var ratings = [];
  var total = 0;
  for (let i = 0; i < ratedLogs.length; i++) {
      console.log(ratedLogs[i].args);
      const [ attRating, attReview ] = ethers.utils.defaultAbiCoder.decode(["uint8", "string"], ratedLogs[i].args[3]);
      const rating = {
          "recipient": ratedLogs[i].args[0],
          "attester": ratedLogs[i].args[1],
          "uid": ratedLogs[i].args[2],
          "rating": attRating,
          "review": attReview,
          "minted": ratedLogs[i].args[4]
      };
      total += attRating;
      ratings.push(rating);
  }
  return res.json({"ratings": ratings});
});

api.get(["/api/profile/:address", "/api/nft/:blockchain/:address/:id"], async function (req, res) {
    const provider = new ethers.providers.JsonRpcProvider({"url": process.env.API_URL_ETHEREUM});
    var address = req.params.address;  
    var type = "Address";  // 6551, contract
    var image;
    const blockchain = req.params.blockchain;
    if (blockchain) {
      // this is an NFT
      if (blockchain == "ethereum") {
        address = await tokenbound.getAccount(req.params.address, req.params.id, provider);
        type = "6551 Account";
      } else if (blockchain == "polygon") {
        var providerPolygon = new ethers.providers.JsonRpcProvider({"url": process.env.API_URL_POLYGON});
        address = await tokenbound.getAccount(req.params.address, req.params.id, providerPolygon);
        type = "6551 Account";
      }
      image = await getNftImage(blockchain, req.params.address, req.params.id);
    } else {
      const code = await provider.getCode(address);
      if (code !== '0x') {
        type = "Contract";
      }
    }
    
    getContracts();
    var start = 52298258 - 1;
    var end = 'latest';
    let rated = nft.filters.Rated(address);
    let ratedLogs = await nft.queryFilter(rated, start, end);
    console.log(JSON.stringify(ratedLogs));
    var ratings = [];
    var total = 0;
    for (let i = 0; i < ratedLogs.length; i++) {
        console.log(ratedLogs[i].args);
        const [ attRating, attReview ] = ethers.utils.defaultAbiCoder.decode(["uint8", "string"], ratedLogs[i].args[3]);
        const rating = {
            "recipient": req.params.address,
            "attester": ratedLogs[i].args[1],
            "uid": ratedLogs[i].args[2],
            "rating": attRating,
            "review": attReview,
            "minted": ratedLogs[i].args[4]
        };
        total += attRating;
        ratings.push(rating);
    }
    const average = total ? (total / ratings.length) : 0;
    const profileData = await getProfileData(address);
    const name = getName(address, profileData);
    var nfts = [];
    if (profileData.nfts_eth.TokenBalance) {
      nfts = profileData.nfts_eth.TokenBalance;
    }
    if (profileData.nfts_poly.TokenBalance) {
      nfts = nfts.concat(profileData.nfts_poly.TokenBalance);
    }
    const socials = getSocials(profileData.socials.Social);
    const ethBalanceWei = await provider.getBalance(address);
    const ethBalance = parseFloat(ethers.utils.formatEther(ethBalanceWei));
    if (!image) {
      image = `https://web3-images-api.kibalabs.com/v1/accounts/${address}/image`;
      if (nfts.length > 0) {
        image = nfts[0].tokenNfts.contentValue.image ? nfts[0].tokenNfts.contentValue.image.small : image; // TODO: update to check for NFTs missing metadata and/or images?
        if ( image.startsWith('ipfs://') ) {
          image = ipfsToHttp(image);
        }
      } // if nfts.length
    } // if !image
    const profile = {
      "name": name,
      "image": image,
      "eth": ethBalance,
      "usdc": profileData.usdc.TokenBalance ? profileData.usdc.TokenBalance[0].formattedAmount : 0,
      "socials": socials,
      "xmtp": profileData.xmtp.XMTP ? profileData.xmtp.XMTP[0] : {},
      "poaps": profileData.poaps.Poap ? profileData.poaps.Poap : [],
      "nfts": nfts
    }
    return res.json({
      "address": address, 
      "type": type,
      "average": average, 
      "count": ratings.length, 
      "ratings": ratings, 
      "profile": profile
    });
});

api.get('/meta/:id', async function (req, res) {
  console.log("start /meta/ with path", req.path);
  const tokenId = req.params.id;
  console.log('tokenId', tokenId);
  var cache = 'public, max-age=3600, s-maxage=86400';
  cache = 'public, max-age=1, s-maxage=2'; // TODO: remove this later
  var meta = {};

  const id = ethers.BigNumber.from(tokenId);
  const uid = ethers.utils.hexZeroPad(id.toHexString(), 32);
  console.log("uid",uid);
  //meta.uid = uid;

  // get assestation
  getContracts();
  const attestation = await eas.getAttestation(uid);
  //meta.attestation = attestation;

  const [ rating, review ] = ethers.utils.defaultAbiCoder.decode(["uint8", "string"], attestation.data);
  meta.name = `Rep3 Rating: ${rating}`;
  meta.description = review;
  meta.external_url = `https://rep3.bio/profile/${attestation.recipient}`;
  meta.image = `https://rep3.bio/images/${rating}.png`;
  meta.attributes = [
    {
        "trait_type": "Attester", 
        "value": attestation.attester
    }, 
    {
      "trait_type": "Recipient", 
      "value": attestation.recipient
    },
    {
      "trait_type": "Rating", 
      "value": parseInt(rating),
      "max_value": 5
    },
    {
      "trait_type": "Date",
      "value": parseInt(attestation.time),
      "display_type": "date"
    },
    {
      "trait_type": "Attestation Uid",
      "value": uid
    },
    {
      "trait_type": "Attestation Schema",
      "value": attestation.schema
    }
  ];

  console.log("meta", JSON.stringify(meta));

  


  if (!meta) {
      return res.json({"error": "not found"});
  }
  res.set('Cache-Control', cache);
  return res.json(meta); 
}); // meta

module.exports.api = api;
