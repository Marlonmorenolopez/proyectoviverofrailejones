const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const red = hre.network.name; // Detecta automáticamente si es Sepolia o Local

  console.log("\n🥑🥑🥑 [DEBUG] CONFIGURANDO SCRIPT REAL DE LA FACTORY 🥑🥑🥑\n");
  console.log(`🚀 Desplegando ViveroFactory en la red: ${red}...`);
  console.log("   Cuenta de la Plataforma/Owner (Billetera 1):", deployer.address);

  // ─── PARÁMETROS DEL CONSTRUCTOR (ViveroFactory) ──────────────────────────
  
  // 🏢 1. BILLETERA DE LA ONG: Configurada con tu segunda cuenta real de MetaMask
  const walletONG = "0x1Ae6Ab11E5bE13Fe3af51ABDd8956b9055A7Afab"; 
  
  // 💻 2. BILLETERA DE LA PLATAFORMA: Usa automáticamente la cuenta activa en Hardhat (Billetera 1)
  const walletDesarrollador = deployer.address; 
  
  // 💰 3. PRECIO DE ADOPCIÓN: 0.01 ETH convertido a Wei
  const precioAdopcionWei = hre.ethers.parseEther("0.01"); 

  // Apuntamos al archivo del contrato maestro
  const ViveroFactory = await hre.ethers.getContractFactory(
    "contracts/ViveroFactory.sol:ViveroFactory"
  );

  console.log("⏳ Transmitiendo los bytes del contrato a la blockchain...");
  
  // Desplegamos el contrato inyectando los parámetros requeridos
  const factory = await ViveroFactory.deploy(walletONG, walletDesarrollador, precioAdopcionWei);
  await factory.waitForDeployment();

  const address = await factory.getAddress();

  console.log(`\n✅ ViveroFactory desplegado con éxito en ${red}:`, address);
  console.log("====================================================");
  console.log("📋 Copia la variable correspondiente en tu archivo .env:");

  if (red === "sepolia") {
    console.log("NEXT_PUBLIC_FACTORY_ADDRESS_SEPOLIA=" + address);
    console.log(`\n🔍 Verificador en vivo: https://sepolia.etherscan.io/address/${address}`);
  } else {
    console.log("NEXT_PUBLIC_FACTORY_ADDRESS_LOCAL=" + address);
  }
  console.log("====================================================\n");
}

main()
  .then(() => process.exit(0)) // Forzamos la salida limpia para evitar errores de red en Windows
  .catch((error) => {
    console.error("❌ Error en el despliegue:", error);
    process.exit(1);
  });