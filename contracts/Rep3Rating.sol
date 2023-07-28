// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";

/**
 * @title A schema resolver for Rep3 that validates a rating and mints/burns soulbound NFTs
 */
contract Rep3Rating is ERC721, ERC721Burnable, Ownable, SchemaResolver {
    using Address for address;

    event Rated(address indexed recipient, address indexed attester, bytes32 uid, bytes data, bool indexed minted);

    error InvalidRating();
    error NotTransferable();

    constructor(IEAS eas) ERC721("Rep3 Rating", "REP3") SchemaResolver(eas) {}

    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    function onAttest(Attestation calldata attestation, uint256 /*value*/) internal override returns (bool) {
        (uint8 rating, string memory review) = abi.decode(attestation.data, (uint8, string));
        
        // cannot rate yourself
        if (attestation.attester == attestation.recipient) {
            // TODO: detect a "response"?
            revert InvalidRating();
        }

        // rating must be betweet 1 and 5
        if ( rating < 1 || rating > 5) {
            revert InvalidRating();
        }

        // mint an NFT if possible
        uint256 tokenId = uint256(attestation.uid);
        if (_canReceiveERC721(address(0), attestation.recipient, tokenId, "")) {
            _mint(attestation.recipient, tokenId);
            emit Rated(attestation.recipient, attestation.attester, attestation.uid, attestation.data, true);
        } else {
            emit Rated(attestation.recipient, attestation.attester, attestation.uid, attestation.data, false);
        }

        return true;
    }

    function onRevoke(Attestation calldata attestation, uint256 /*value*/) internal override returns (bool) {
        uint256 tokenId = uint256(attestation.uid);
        if (_exists(tokenId)) {
            _burn(tokenId);
        }
        return true;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://api.rep3.bio/meta/";
    }

    function _beforeTokenTransfer(
        address /*from*/,
        address /*to*/,
        uint256 /*tokenId*/,
        uint256 /*batchSize*/
    ) internal virtual override {
        if (_msgSender() != address(_eas)) {
            revert NotTransferable();
        }
    }

    /**
     * @dev Internal function to invoke {IERC721Receiver-onERC721Received} on a target address.
     * The call returns true if the target address is not a contract. Based on 
     * ERC721._checkOnERC721Received() but returns false instead of reverting
     *
     * @param from address representing the previous owner of the given token ID
     * @param to target address that will receive the tokens
     * @param tokenId uint256 ID of the token to be transferred
     * @param data bytes optional data to send along with the call
     * @return bool whether the call correctly returned the expected magic value
     */
    function _canReceiveERC721(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal  returns (bool) {
        if (to.isContract()) {
            try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                return false;
            }
        } else {
            return true;
        }
    }

}
