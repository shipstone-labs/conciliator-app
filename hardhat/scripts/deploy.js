const hre = require('hardhat')
const { Wallet } = require('ethers')

async function main() {
  const wallet = new Wallet(process.env.PRIVATE_KEY)
  console.log(wallet.address)
  const DocumentToken = await hre.ethers.getContractFactory('IPDoc')
  const contract = await DocumentToken.deploy(wallet.address, wallet.address, wallet.address)

  await contract.deployed()
  console.log('DocumentToken deployed to:', contract.address)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
