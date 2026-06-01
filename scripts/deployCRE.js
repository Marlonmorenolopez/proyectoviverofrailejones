const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance    = await hre.ethers.provider.getBalance(deployer.address);

  console.log("🚀 Desplegando Arquitectura Chainlink CRE en Sepolia...");
  console.log("   Cuenta Deployer:", deployer.address);
  console.log("   Balance actual:", hre.ethers.formatEther(balance), "ETH\n");

  // 1. Desplegar el Receptor CRE
  console.log("📡 1/3 - Desplegando ViveroClimaReceptorCRE...");
  const ReceptorFactory = await hre.ethers.getContractFactory("ViveroClimaReceptorCRE");
  // Usamos la wallet del deployer como forwarder temporal para pruebas locales del SDK de CRE
const receptorCRE = await ReceptorFactory.deploy("0xF8344CFd5c43616a4366C34E3EEE75af79a74482");  await receptorCRE.waitForDeployment();
  const receptorAddress = await receptorCRE.getAddress();
  console.log("   ✅ ViveroClimaReceptorCRE desplegado en:", receptorAddress);

  // 2. Desplegar ViveroBogota
  console.log("\n🌿 2/3 - Desplegando ViveroBogota (Contrato Principal)...");
  const ViveroFactory = await hre.ethers.getContractFactory("ViveroBogota");
  const vivero = await ViveroFactory.deploy();
  await vivero.waitForDeployment();
  const viveroAddress = await vivero.getAddress();
  console.log("   ✅ ViveroBogota desplegado en:", viveroAddress);

  // 3. Conectar contratos (El puente)
  console.log("\n🔗 3/3 - Configurando puente oraculo interno...");
  const tx = await vivero.configurarClimaReceptor(receptorAddress);
  await tx.wait();
  console.log("   ✅ Ecosistema conectado correctamente.");

  // Resumen final para ti
  console.log("\n====================================================");
  console.log(`¡DESPLIEGUE EXITOSO! Copia esto y pégalo en tu archivo .env:`);
  console.log("====================================================");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA=${viveroAddress}`);
  console.log(`NEXT_PUBLIC_ORACLE_ADDRESS_SEPOLIA=${receptorAddress}`);
  console.log("====================================================");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("❌ Error en el despliegue:", err.message);
  process.exit(1);
});