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
    var provider = new ethers.providers.JsonRpcProvider({"url": process.env.API_URL_APOTHEM});
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

function getName(address, profile) {
  var name = address;
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
    getContracts();
    var start = 52298258 - 1;
    var end = 'latest';
    let rated = nft.filters.Rated(req.params.address);
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
    const profileData = await getProfileData(req.params.address);
    const name = getName(req.params.address, profileData);
    var nfts = [];
    if (profileData.nfts_eth.TokenBalance) {
      nfts = profileData.nfts_eth.TokenBalance;
    }
    if (profileData.nfts_poly.TokenBalance) {
      nfts = nfts.concat(profileData.nfts_poly.TokenBalance);
    }
    const profile = {
      "name": name,
      "usdc": profileData.usdc.TokenBalance ? profileData.usdc.TokenBalance[0].formattedAmount : 0,
      "xmtp": profileData.xmtp.XMTP ? profileData.xmtp.XMTP[0] : {},
      "poaps": profileData.poaps.Poap ? profileData.poaps.Poap : [],
      "nfts": nfts
    }
    return res.json({
      "address": req.params.address, 
      "average": average, 
      "count": ratings.length, 
      "ratings": ratings, 
      "profile": profile
    });
});

module.exports.api = api;
