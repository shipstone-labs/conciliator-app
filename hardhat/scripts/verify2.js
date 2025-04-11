const { StarboardVerify, generateMetadata } = require('@starboardventures/hardhat-verify/dist/src/utils')

async function verify() {
  const verify = new StarboardVerify({
    network: 'Calibration',
    contractName: 'IPDoc',
    url: 'https://fvm-calibration-api.starboard.ventures', 
    contractAddress: '0x1e16614d65C5A801863E69A9aa794B4dF14d2A33',
  })
  await generateMetadata('IPDoc') // optional
  await verify.verify()
}
verify();