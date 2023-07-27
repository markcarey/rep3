const { expect } = require("chai");
const { ethers } = require("hardhat");

const networkName = hre.network.name;

require('dotenv').config();
//var BN = web3.utils.BN;

const easAddress = "0xB8fa3922345707Da836aeBa386f39Dc3721d48BF"; // apothem
const schemaUid = "0x508eff52b9c53889a065e0451dfa8fee281ee767e37053a823bb7e731921a8be";
const easJSON = require("./abis/EAS.json");

const signer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
const eas = new ethers.Contract(easAddress, easJSON.abi, signer);

describe("Rep3 Rating Attestation", function () {

    it("Should get an attestation", async function () {
        const uid = "0xe803edc6ebff4a7bf20f35377b2e06eccf19098e50354d9f86bbcc15f08c4e38";
        const attestation = await eas.getAttestation(uid);
        console.log(attestation);
        expect(attestation.uid).to.equal(uid);
    });

});


