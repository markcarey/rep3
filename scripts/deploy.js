const chain = hre.network.name;

const eas = "0xB8fa3922345707Da836aeBa386f39Dc3721d48BF";

async function main() {
    // Grab the contract factory 
    const MyContract = await ethers.getContractFactory("Rep3Rating");
 
    // Start deployment, returning a promise that resolves to a contract object
    const myContract = await MyContract.deploy(eas, { gasLimit: "0x1000000" }); // Instance of the contract 
    console.log("Contract deployed to address:", myContract.address);
 }
 
 main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });