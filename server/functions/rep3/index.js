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

function getContracts() {
    var provider = new ethers.providers.JsonRpcProvider({"url": process.env.API_URL_APOTHEM});
    eas = new ethers.Contract(process.env.EAS_ADDRESS, easJSON.abi, provider);
    nft = new ethers.Contract(process.env.REP3_ADDRESS, rep3JSON.abi, provider);
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
        ratings.push(rating);
    }
    return res.json({"address": req.params.address, "ratings": ratings});
});

module.exports.api = api;
