import { Wallet } from 'ethers'

const wallet = new Wallet(process.env.PRIVATE_KEY)
console.log(wallet.address)
