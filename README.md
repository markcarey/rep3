# Rep3: A reputation system for EVM addresses and NFTs

Rep3 enables attestations about EVM addresses and NFTs by assigning a 1-5 star rating and a text-based review. Rep3 uses Ethereum Attestation Service (EAS) as the base layer. Attestions are made on the low (but not zero) cost XDC network. In addition to ratings and reviews, Rep3 provides additonal context about addresses such ENS names, token balances, NFTs, and POAPs (powered by Airstack).

Try it now: https://rep.bio (_Tip: when you "connect" you will automatically be airdropped some `TXDC` gas token on the XDC Apothem Testnet_)

![Rep3 Chrome Extension](https://rep3.bio/images/eas.png)

## Ratings and Reviews

Rep3 facilitates making onchain attestation of 5-star ratings and text reviews of any EVM addresss, whether EOA, contract, ERC 6551 tokenbound account. It also enables rating of individual NFT tokens themselves (attestation are made with respect to the ERC 6551 account for the NFT). The ratings can be made using the https://rep3.bio front-end or any other front-end that enables EAS attestations.

### Extracting value from Rep3 attestations

Rep3, like the EAS base layer, is permissionless. Anyone can make an attestation about any address. Only a few restrictions are enforced: you cannot rate yourself, each address can only make _one_ attestation about another, and ratings must be within 1-5 stars. Considering the permissionless nature of the ratings data, considering only the number of ratings and the average rating alone is unlikely to provide useful for assessing trust. The https://rep3.bio front-end, as an example, provides additional context by pulling in other data about the address.

Other consumers of Rep3 data may strive to create weighted averages by assign higher weights to raters with substantial ratings themselves, and/or highlight or amplify raters that have been attested as trusted or "friends" of the consumer. There are amny potential approaches here, depending on the particular goals of the consumer of Rep3 data. Exploring these in detail is outside the scope of this project.

## Rep3 Chrome Extension

In the interest of bringing Rep3 data to the places where users need them most, a Chrome extension was developed, which does the following:
- displays a Rep3 icon with current average star rating in the browser toolbar, for pages with an EVM address in the URL
- displays star count on Etherscan block explorers (injected into the actual pages)
- displays star count directly on Opensea pages for individual NFTs
- displays star count directly on ERC-6551 tokenbound accounts shown on tokenbound.org 
- when toolbar icon is clicked, displays rating + profile information for the address

![Opnesea](https://rep3.bio/images/opensea.png)

## Why XDC Network?

To encourage participation, adding ratings+reviews must be low cost. Reputation data doesn't need to reside on the same chain as the activity of the target addresses being reviewed. XDC Network provides extremely low gas costs to users, encouraging users to leave ratings, helpful to build reputation profiles.

## How it was built

Rep3 onchain ratings+reviews are powered by EAS attestations. An EAS _Schema Resolver_ contract enforces the restrictions mentioned above.

As an example on one way to consume Rep3 data, a [server-side API](/server/functions/rep3/index.js#L285) was created that combines Rep3 data with addition contextual data from the Airstack API. Another potential approach is using The Graph to build an API for Rep3 data.

### Contracts

In order to deploy Rep3 to the _XDC Apothem Testnet_, I first deployed the EAS protocol to Apothem:

- [EAS](https://explorer.apothem.network/address/0xB8fa3922345707Da836aeBa386f39Dc3721d48BF#transactions) (`0xB8fa3922345707Da836aeBa386f39Dc3721d48BF`)
- [Registry](https://explorer.apothem.network/address/xdc7c31307c71e81a3a8211cf9238bfe72f425ecd42#transactions) (`0x7C31307c71e81A3A8211cF9238bFe72F425eCd42`)

EAS Schema Resolvers:

- [Rep3Rating](https://explorer.apothem.network/address/0x3480193C1C48157e7f3bFf6bC5bfaCB0d49261eF#transactions) (`0x3480193C1C48157e7f3bFf6bC5bfaCB0d49261eF`) ([source code](/contracts/Rep3Rating.sol))
- [Rep3RatingNoNFTs](/contracts/Rep3RatingNoNFTs.sol) ([source code](/contracts/Rep3RatingNoNFTs.sol))

#### To NFT or not to NFT?

Intially Rep3 was built to mint a soulbound token to the attestation recipient for each rating received, featuring an image representing the rating given. After receiving some feedback on the idea, and pondering further, the NFT component may not be necessaRY in order to achieve the desired goals of the project. As such, 2 version of the Schema Resolver can be found in the repo, one with NFTs and one without. Feedback on this question is greatly appreciated.

### API

The server-based API was built on Google Firebase Functions using ethersJS and Airstack API to combine all the profile data into a single JSON endpoint.

