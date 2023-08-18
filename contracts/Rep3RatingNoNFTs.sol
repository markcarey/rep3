// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";

/**
 * @title A schema resolver for Rep3 that validates a rating and mints/burns soulbound NFTs
 */
contract Rep3RatingNoNFTs is Ownable, SchemaResolver {

    event Rated(address indexed recipient, address indexed attester, bytes32 uid, bytes data, bool indexed minted);

    error InvalidRating();
    error NotTransferable();

    struct Rep3Summary {
        uint128 count;
        uint128 total;
    }

    mapping(address => mapping(address => bool)) public rated;
    mapping(address => Rep3Summary) public summary;

    constructor(IEAS eas) SchemaResolver(eas) {}

    function onAttest(Attestation calldata attestation, uint256 /*value*/) internal override returns (bool) {
        (uint8 rating, ) = abi.decode(attestation.data, (uint8, string));
        
        // cannot rate yourself
        if (attestation.attester == attestation.recipient) {
            revert InvalidRating();
        }

        // can only rate a recipient once
        if (rated[attestation.attester][attestation.recipient]) {
            revert InvalidRating();
        }

        // rating must be betweet 1 and 5
        if ( rating < 1 || rating > 5) {
            revert InvalidRating();
        }

        emit Rated(attestation.recipient, attestation.attester, attestation.uid, attestation.data, false);

        rated[attestation.attester][attestation.recipient] = true;
        summary[attestation.recipient].count++;
        summary[attestation.recipient].total += uint128(rating);
        return true;
    }

    function onRevoke(Attestation calldata attestation, uint256 /*value*/) internal override returns (bool) {
        (uint8 rating, ) = abi.decode(attestation.data, (uint8, string));
        rated[attestation.attester][attestation.recipient] = false;
        summary[attestation.recipient].count--;
        summary[attestation.recipient].total -= uint128(rating);
        return true;
    }

}
