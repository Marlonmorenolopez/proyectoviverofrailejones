const hre = require("hardhat");

async function main() {
  const viveroAddress = "0xB6E4015961416814C9a0228F8Cdc5129CbaD70AB";
  
  // Conectamos directo al contrato ViveroBogota
  const Vivero = await hre.ethers.getContractFactory("ViveroBogota");
  const vivero = Vivero.attach(viveroAddress);

  console.log("🔍 Escaneando la blockchain en busca de la semilla ID: 1...");
  
  try {
    const semilla = await vivero.obtenerSemilla(1);
    console.log("\n📦 DATOS REALES EN EL CONTRATO PRINCIPAL:");
    console.log(semilla);
  } catch (error) {
    console.log("Intentando método alternativo...");
    const semilla = await vivero.semillas(1);
    console.log("\n📦 DATOS REALES EN EL CONTRATO PRINCIPAL:");
    console.log(semilla);
  }
}

main().catch(console.error);