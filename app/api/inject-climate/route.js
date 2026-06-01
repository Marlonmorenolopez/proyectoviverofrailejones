import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Dirección oficial de Chainlink para devolver el control al finalizar
const CHAINLINK_OFICIAL = "0xF8344CFd5c43616a4366C34E3EEE75af79a74482";

// El ABI mínimo necesario para que el servidor sepa cómo hablar con el Receptor
const receptorABI = [
  "function actualizarForwarder(address nuevoForwarder) external",
  "function fulfillReport(uint256 semillaId, bytes calldata reporte) external"
];

export async function POST(request) {
  try {
    // 1. Capturar los datos enviados desde el formulario de tu Frontend
    const { semillaId, lat, lon } = await request.json();
    console.log(`🤖 Backend activado de forma autónoma para Semilla ID: ${semillaId} | Coordenadas: ${lat}, ${lon}`);

    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY?.trim();
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const receptorAddress = process.env.NEXT_PUBLIC_ORACLE_ADDRESS_SEPOLIA;

    // 2. Hacer la llamada en vivo al satélite con las coordenadas del formulario
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(weatherUrl);
    const datos = await response.json();

    if (datos.cod !== 200) {
      return NextResponse.json({ error: `Error de OpenWeather: ${datos.message}` }, { status: 400 });
    }

    // 3. Procesar y adaptar los datos al formato numérico de Solidity
    const temperatura = BigInt(Math.round(datos.main.temp * 10));
    const humedad = BigInt(datos.main.humidity);
    const lluvia1h = datos.rain && datos.rain["1h"] ? datos.rain["1h"] : 0;
    const precipitacion = BigInt(Math.round(lluvia1h * 10));
    const horasLuz = BigInt(Math.round((1 - datos.clouds.all / 100) * 12));
    const timestamp = BigInt(Math.floor(Date.now() / 1000));

    // 4. Conectar el servidor oculto a la Blockchain de Sepolia
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const Receptor = new ethers.Contract(receptorAddress, receptorABI, wallet);

    // 5. Empaquetar el reporte climático en formato de bytes de Solidity
    const coder = ethers.AbiCoder.defaultAbiCoder();
    const reporteEncoded = coder.encode(
      ["int256", "uint256", "uint256", "uint256", "uint256"],
      [temperatura, humedad, precipitacion, horasLuz, timestamp]
    );

    // 6. Ejecutar la coreografía de inyección segura en la Blockchain
    console.log("🔑 Abriendo bóveda del contrato receptor...");
    let tx = await Receptor.actualizarForwarder(wallet.address);
    await tx.wait();

    console.log("💉 Inyectando telemetría climática...");
    tx = await Receptor.fulfillReport(semillaId, reporteEncoded);
    await tx.wait();

    console.log("🔒 Cerrando bóveda de seguridad (Devolviendo a Chainlink)...");
    tx = await Receptor.actualizarForwarder(CHAINLINK_OFICIAL);
    await tx.wait();

    return NextResponse.json({ 
      success: true, 
      msg: `Clima inyectado con éxito en la semilla ${semillaId}`,
      info: { temp: Number(temperatura)/10, hum: Number(humedad) }
    });

  } catch (error) {
    console.error("❌ Error interno en el Oráculo Automático:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}