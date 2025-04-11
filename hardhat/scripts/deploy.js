const hre = require('hardhat')

async function main() {
  const DocumentToken = await hre.ethers.getContractFactory('DocumentToken')
  const contract = await DocumentToken.deploy()

  await contract.deployed()
  console.log('DocumentToken deployed to:', contract.address)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
