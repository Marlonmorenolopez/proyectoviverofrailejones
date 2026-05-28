// scripts/deployConOracle.js
// ============================================================
//  Despliegue en SEPOLIA con oráculo Chainlink
//
//  CORRECCIONES:
//  ✅ Nombre calificado "contracts/ViveroClimaOracle.sol:ViveroClimaOracle"
//  ✅ Nombre calificado "contracts/ViveroBogotaConOracle.sol:ViveroBogotaConOracle"
//
//  Antes de ejecutar:
//  1. Crea suscripción en https://functions.chain.link
//  2. Fóndela con 2+ LINK (https://faucets.chain.link/sepolia)
//  3. Pon tu Subscription ID abajo
//  Ejecutar: npx hardhat run scripts/deployConOracle.js --network sepolia
// ============================================================

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance    = await hre.ethers.provider.getBalance(deployer.address);

  console.log("🚀 Desplegando en Sepolia Testnet...");
  console.log("   Cuenta:", deployer.address);
  console.log("   Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // ⚠️ REEMPLAZA con tu Subscription ID de functions.chain.link
  const SUBSCRIPTION_ID = 6566;

  // ── Paso 1: Desplegar el Oráculo ─────────────────────────
  console.log("📡 Desplegando ViveroClimaOracle...");

  // ✅ CORREGIDO: nombre completamente calificado
  const OracleFactory = await hre.ethers.getContractFactory(
    "contracts/ViveroBogotaConOracle.sol:ViveroClimaOracle"
  );
  const oracle = await OracleFactory.deploy(SUBSCRIPTION_ID, hre.ethers.ZeroAddress);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("✅ ViveroClimaOracle en:", oracleAddress);

  // ── Paso 2: Desplegar ViveroBogota con oráculo ───────────
  console.log("\n🌿 Desplegando ViveroBogotaConOracle...");

  // ✅ CORREGIDO: nombre completamente calificado
  const ViveroFactory = await hre.ethers.getContractFactory(
    "contracts/ViveroBogota.sol:ViveroBogota"
  );
  const vivero = await ViveroFactory.deploy();
  await vivero.waitForDeployment();
  const viveroAddress = await vivero.getAddress();
  console.log("✅ ViveroBogotaConOracle en:", viveroAddress);

  // ── Paso 3: Conectar contratos ───────────────────────────
  console.log("\n🔗 Conectando contratos...");
  const tx = await oracle.actualizarViveroContrato(viveroAddress);
  await tx.wait();
  console.log("✅ Contratos conectados");

  // ── Resumen ──────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("📋 Copia esto en tu .env:");
  console.log("=".repeat(60));
  console.log("NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA=" + viveroAddress);
  console.log("NEXT_PUBLIC_ORACLE_ADDRESS_SEPOLIA="   + oracleAddress);
  console.log("=".repeat(60));
  console.log("\n📌 PRÓXIMO PASO:");
  console.log("   Agrega", oracleAddress, "como Consumer en functions.chain.link");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(0);
  });