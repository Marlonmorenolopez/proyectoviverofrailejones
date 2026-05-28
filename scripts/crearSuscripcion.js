// scripts/crearSuscripcion.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // ABI completo oficial de Chainlink Functions Router v1
  const routerABI = [
    {
      "inputs": [],
      "name": "createSubscription",
      "outputs": [{"internalType": "uint64", "name": "subscriptionId", "type": "uint64"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "uint64", "name": "subscriptionId", "type": "uint64"},
        {"indexed": false, "internalType": "address", "name": "owner", "type": "address"}
      ],
      "name": "SubscriptionCreated",
      "type": "event"
    }
  ];

  const routerAddress = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0";
  const router = new hre.ethers.Contract(routerAddress, routerABI, deployer);

  console.log("📡 Creando suscripción...");
  console.log("   Cuenta:", deployer.address);

  const tx = await router.createSubscription({ gasLimit: 300000 });
  console.log("   TX enviada:", tx.hash);
  const receipt = await tx.wait();
  console.log("   Confirmada en bloque:", receipt.blockNumber);

  // Leer el ID del evento
  const iface = new hre.ethers.Interface(routerABI);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === "SubscriptionCreated") {
        const id = parsed.args.subscriptionId.toString();
        console.log("\n✅ Suscripción creada con ID:", id);
        console.log("\n📋 Actualiza deployConOracle.js:");
        console.log(`   const SUBSCRIPTION_ID = ${id};`);
        return;
      }
    } catch {}
  }

  // Si no encontró el evento, muestra todos los logs
  console.log("\n⚠️ No se encontró el evento. Logs raw:");
  console.log(receipt.logs);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });