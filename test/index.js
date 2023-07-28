const { expect } = require("chai");
const { ethers } = require("hardhat");

const networkName = hre.network.name;

require('dotenv').config();
//var BN = web3.utils.BN;

const easAddress = "0xB8fa3922345707Da836aeBa386f39Dc3721d48BF"; // apothem
const registryAddress = "0x7C31307c71e81A3A8211cF9238bFe72F425eCd42"; // apothem
const ratingAddress = "0x87558DBD63010d532597944DF364Ba8016d8E29D";
const schemaUid = "0x8c3ab7b8a4b8d4497f6ae63846c35b9e388554761957a98af9a17ad5df4f643b";
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

    var attestationUid;
    const rating = 5;
    const review = "I definitely want to attest that Bob is the orginal Bob of Bob and Alice. The only real one!";

    it.skip("should revert attestation due to invalid rating", async function() {
        const data = ethers.utils.defaultAbiCoder.encode(["uint8", "string"], [9, review]);
        const attestationRequestData = {
            "recipient": "0xcB49713A2F0f509F559f3552692642c282db397f", // Bob
            "expirationTime": 0,
            "revocable": true,
            "refUID": ethers.constants.HashZero,
            "data": data,
            "value": 0
        };
        const attestationRequest = {
            "schema": schemaUid,
            "data": attestationRequestData
        };
        await expect(eas.attest(attestationRequest))
            .to.be.reverted;
    });

    it("should make a rating attestation", async function() {
        const data = ethers.utils.defaultAbiCoder.encode(["uint8", "string"], [rating, review]);
        const attestationRequestData = {
            "recipient": "0xcB49713A2F0f509F559f3552692642c282db397f", // Bob
            "expirationTime": 0,
            "revocable": true,
            "refUID": ethers.constants.HashZero,
            "data": data,
            "value": 0
        };
        const attestationRequest = {
            "schema": schemaUid,
            "data": attestationRequestData
        };
        const txn = await eas.attest(attestationRequest);
        const { events } = await txn.wait();
        const attestedEvent = events.find(x => x.event === "Attested");
        attestationUid = attestedEvent.args[2];
        console.log(attestationUid);
        //await expect(eas.attest(attestationRequest))
        //    .to.emit(eas, 'Attested');
        expect(attestationUid).to.not.be.null;
    });

    it("Should get an attestation and parse data", async function () {
        const uid = "0x66e5a4d5ebc6e381acf02e6bba09cbfdbf3b64b34b63fb77fbf3058d8709d444";
        const attestation = await eas.getAttestation(attestationUid);
        console.log(attestation);
        const [ attRating, attReview ] = ethers.utils.defaultAbiCoder.decode(["uint8", "string"], attestation.data);
        console.log(attRating, attReview);
        expect(attReview).to.equal(review);
    });

});


