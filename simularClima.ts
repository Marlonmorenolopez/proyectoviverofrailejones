import { ethers } from 'ethers';

// 1. Configuración del entorno
const PROVIDER_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const CONTRATO_RECEPTOR = "0x45fE98D4Cf835f1f12977A75024d3e73870f2af5".toLowerCase();
const SEMILLA_ID = 4;
const LATITUD = "4.7154";
const LONGITUD = "-74.12337";

// Tu clave privada de MetaMask (Sepolia) para firmar la simulación del oráculo
// NOTA: Asegúrate de tener guardada tu clave en una variable de entorno en producción.
const PRIVATE_KEY = "8c87d95e560d2309af064ba7d0746d01186df1e2b0e0c40163ddc3a04839913c"; 

// ABI mínima de tu contrato receptor para llamar a la función de actualización
const RECEPTOR_ABI = [
  "function fulfillReport(uint256 _semillaId, bytes calldata _reporteEncoded) external"
];

async function obtenerClimaReal() {
  console.log(`📡 Consultando clima en tiempo real para Bogotá (${LATITUD}, ${LONGITUD})...`);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUD}&longitude=${LONGITUD}&current=temperature_2m,relative_humidity_2m,precipitation`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return {
    temperatura: Math.round(data.current.temperature_2m),
    humedad: Math.round(data.current.relative_humidity_2m),
    precipitacion: Math.round(data.current.precipitation),
    horasLuz: 8, // Valor estimado para la región
    timestamp: Math.round(Date.now() / 1000)
  };
}

async function main() {
  try {
    // A. Obtener telemetría real del Páramo
    const clima = await obtenerClimaReal();
    console.log(`✅ Clima Recibido de la API:\n - Temp: ${clima.temperatura}°C\n - Humedad: ${clima.humedad}%\n - Precipitación: ${clima.precipitacion}mm`);

    // B. Conectarse a la Blockchain de Sepolia
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contrato = new ethers.Contract(CONTRATO_RECEPTOR, RECEPTOR_ABI, wallet);

    // C. Codificar los datos climáticos exactamente como lo espera abi.decode en Solidity
    console.log("📦 Codificando reporte en formato Bytes para Solidity...");
    const abiCoder = new ethers.AbiCoder();
    const reporteEncoded = abiCoder.encode(
      ["int256", "uint256", "uint256", "uint256", "uint256"],
      [clima.temperatura, clima.humedad, clima.precipitacion, clima.horasLuz, clima.timestamp]
    );

    // D. Transmitir el reporte simulando la entrega del Forwarder de Chainlink
    console.log(`🚀 Transmitiendo clima real a tu contrato receptor en Sepolia para Semilla ID #${SEMILLA_ID}...`);
    const tx = await contrato.fulfillReport(SEMILLA_ID, reporteEncoded);
    console.log(`⏳ Esperando confirmación de la transacción...`);
    await tx.wait();
    
    console.log(`🎉 ¡ÉXITO TOTAL! Los datos reales del clima de Bogotá han sido inyectados de forma inmutable.`);
    console.log(`🔗 Hash de Transmisión: ${tx.hash}`);

  } catch (error) {
    console.error("❌ Error en la ejecución del flujo:", error);
  }
}

main();