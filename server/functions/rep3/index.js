var firebase = require('firebase-admin');
if (!firebase.apps.length) {
    firebase.initializeApp();
}

const express = require("express");
const api = express();

const { ethers } = require("ethers");

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
        poapEvent {
          description
          eventName
          city
          metadata
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
        }
      }
    }
    nfts_poly: TokenBalances(
      input: {filter: {owner: {_eq: $address}, tokenType: {_eq: ERC721}}, blockchain: polygon, order: {lastUpdatedTimestamp: DESC}}
    ) {
      TokenBalance {
        blockchain
        tokenId
        tokenNfts {
          metaData {
            name
            image
            description
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

function abbrAddress(address){
  return address.slice(0,4) + "..." + address.slice(address.length - 4);
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

api.get("/api/profile/:address", async function (req, res) {
    const address = req.params.address;
    var type = "Address";  // TODO: 6551, contract
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
    const provider = new ethers.providers.JsonRpcProvider({"url": process.env.API_URL_ETHEREUM});
    const ethBalanceWei = await provider.getBalance(address);
    const ethBalance = parseFloat(ethers.utils.formatEther(ethBalanceWei));
    var image = `https://web3-images-api.kibalabs.com/v1/accounts/${address}/image`;
    if (nfts.length > 0) {
      image = nfts[0].tokenNfts.metaData.image; // TODO: update to check for NFTs missing metadata and/or images?
    }
    const profile = {
      "name": name,
      "image": image,
      "eth": ethBalance,
      "usdc": profileData.usdc.TokenBalance ? profileData.usdc.TokenBalance[0].formattedAmount : 0,
      "socials": profileData.socials,
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
