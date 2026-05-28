// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const red = hre.network.name; // detecta la red automáticamente

  console.log(`🚀 Desplegando ViveroBogota en ${red}...`);
  console.log("   Cuenta:", deployer.address);

  const ViveroBogota = await hre.ethers.getContractFactory(
    "contracts/ViveroBogota.sol:ViveroBogota"
  );

  const viveroBogota = await ViveroBogota.deploy();
  await viveroBogota.waitForDeployment();

  const address = await viveroBogota.getAddress();

  console.log(`✅ ViveroBogota desplegado en ${red}:`, address);
  console.log("\n📋 Copia esto en tu .env:");

  // Muestra la variable correcta según la red
  if (red === "sepolia") {
    console.log("VIVERO_ADDRESS_SEPOLIA=" + address);
    console.log("NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA=" + address);
    console.log("\n🔍 https://sepolia.etherscan.io/address/" + address);
  } else if (red === "ganache") {
    console.log("NEXT_PUBLIC_CONTRACT_ADDRESS_GANACHE=" + address);
  } else {
    console.log(`VIVERO_ADDRESS_${red.toUpperCase()}=` + address);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });