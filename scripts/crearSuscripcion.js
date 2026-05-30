// scripts/crearSuscripcion.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("📡 Creando suscripción con Bypass Manual...");
  console.log("   Cuenta:", deployer.address);

  // El selector de bytes exacto e internacional para "createSubscription()" es 0x12470505
  const tx = await deployer.sendTransaction({
    to: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    data: "0x12470505",
    gasLimit: 300000
  });

  console.log("   TX enviada de forma cruda:", tx.hash);
  const receipt = await tx.wait();
  console.log("   Confirmada en bloque:", receipt.blockNumber);

  // Extraemos el ID convirtiendo el log de la blockchain
  if (receipt.logs && receipt.logs.length > 0) {
    const id = parseInt(receipt.logs[0].topics[1], 16).toString();
    console.log("\n====================================================");
    console.log(`✅ ¡LO LOGRAMOS POR FUERZA BRUTA! ID creado: ${id}`);
    console.log("====================================================");
    console.log("\n📋 Próximo paso: Pon este número en tu deployConOracle.js:");
    console.log(`   const SUBSCRIPTION_ID = ${id};`);
  } else {
    console.log("\n⚠️ Transacción exitosa, pero no se leyeron logs.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });