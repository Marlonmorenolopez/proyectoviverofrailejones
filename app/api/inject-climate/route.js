// app/api/inject-climate/route.js
//
// ============================================================
//  Oráculo Automático de Clima — Backend Seguro Next.js
//  Version: 2.1.0 (Direct Injected Architecture)
//
//  Cambios aplicados:
//  ─────────────────────────────────────────────────────────
//  • Optimización de transacciones: Inyecta directo en un solo
//    paso gracias al esquema de propiedad directa del Servidor.
//  • Mantiene el modo Legacy 100% intacto como fallback.
// ============================================================

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Dirección oficial Chainlink para devolver el control en modo legacy si se requiere
const CHAINLINK_OFICIAL = "0xF8344CFd5c43616a4366C34E3EEE75af79a74482";

// ─── ABIs mínimos necesarios ──────────────────────────────────────────────

// ABI del receptor CRE centralizado (modo legacy / v1)
const receptorABI = [
  "function actualizarForwarder(address nuevoForwarder) external",
  "function fulfillReport(uint256 semillaId, bytes calldata reporte) external"
];

// ABI de la Factory para recuperar la dirección del contrato individual
const factoryABI = [
  "function buscarContratoPorId(uint256) external view returns (address)",
  "function totalSemillasAdoptadas() external view returns (uint256)"
];

// ABI del SemillaIndividual para inyectar el clima directamente (Optimizado)
const semillaIndividualABI = [
  "function inyectarClima(int256 temperatura, uint256 humedadRelativa, uint256 precipitacion, uint256 horasLuzSolar) external",
  "function obtenerResumen() external view returns (uint256,string,string,int256,int256,uint256,uint256,uint256,uint256,uint256)"
];

// ─────────────────────────────────────────────────────────────────────────────
//  Handler POST — Endpoint: /api/inject-climate
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const { semillaId, lat, lon, contratoIndividual, modo = "factory" } = body;

    if (!semillaId || lat === undefined || lon === undefined) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos: semillaId, lat, lon" },
        { status: 400 }
      );
    }

    console.log(`🤖 Oráculo automático activado | Semilla #${semillaId} | Coords: (${lat}, ${lon}) | Modo: ${modo}`);

    // ── Variables de entorno privadas del servidor ──
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY?.trim();    const rpcUrl          = process.env.SEPOLIA_RPC_URL;
    const privateKey      = process.env.PRIVATE_KEY;
    const receptorAddress = process.env.NEXT_PUBLIC_ORACLE_ADDRESS_SEPOLIA; // contrato CRE (legacy)
    const factoryAddress  = process.env.NEXT_PUBLIC_FACTORY_ADDRESS_SEPOLIA; // Factory activa

    if (!apiKey || !rpcUrl || !privateKey) {
      return NextResponse.json(
        { error: "Variables de entorno del servidor incompletas (OPENWEATHER_API_KEY, SEPOLIA_RPC_URL, PRIVATE_KEY)" },
        { status: 500 }
      );
    }

    // ── 1. Consulta en vivo al satélite de OpenWeatherMap ──────────────────
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const weatherRes = await fetch(weatherUrl);
    const datos      = await weatherRes.json();

    if (datos.cod !== 200) {
      return NextResponse.json(
        { error: `Error de OpenWeatherMap: ${datos.message}` },
        { status: 400 }
      );
    }

    // ── 2. Escalar datos al formato numérico de Solidity ───────────────────
    const lluvia1h       = datos.rain?.["1h"] ?? 0;
    const nubosidad      = datos.clouds?.all ?? 0;

    const temperaturaInt = BigInt(Math.round(datos.main.temp * 10));
    const humedad        = BigInt(datos.main.humidity);
    const precipitacion  = BigInt(Math.round(lluvia1h * 10));
    const horasLuz       = BigInt(Math.round((1 - nubosidad / 100) * 12));
    const timestamp      = BigInt(Math.floor(Date.now() / 1000));

    console.log(`🌡️  Clima obtenido: ${Number(temperaturaInt)/10}°C | Humedad: ${humedad}% | Lluvia: ${Number(precipitacion)/10}mm`);

    // ── 3. Conectar al provider y wallet del servidor ──────────────────────
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet   = new ethers.Wallet(privateKey, provider);

    // ─────────────────────────────────────────────────────────────────────
    //  MODO A: FACTORY (v2) — Inyecta directo en SemillaIndividual.sol
    // ─────────────────────────────────────────────────────────────────────
    if (modo === "factory" && factoryAddress) {
      let direccionGemelo = contratoIndividual;

      // Si no viene la dirección directa, la recuperamos de la Factory
      if (!direccionGemelo) {
        const factory = new ethers.Contract(factoryAddress, factoryABI, provider);
        direccionGemelo = await factory.buscarContratoPorId(semillaId);

        if (!direccionGemelo || direccionGemelo === ethers.ZeroAddress) {
          return NextResponse.json(
            { error: `No existe contrato individual para la semilla #${semillaId} en la Factory` },
            { status: 404 }
          );
        }
      }

      console.log(`🔗 Contrato individual recuperado: ${direccionGemelo}`);
      const gemelo = new ethers.Contract(direccionGemelo, semillaIndividualABI, wallet);

      // ⚡ EJECUCIÓN DIRECTA OPTIMIZADA:
      // Como tu wallet del servidor ya es dueña (Owner) de la semilla, ingresamos de un solo tiro
      console.log("💉 Inyectando telemetría climática en el Gemelo Digital en 1 solo paso...");
      const tx = await gemelo.inyectarClima(
        temperaturaInt,
        humedad,
        precipitacion,
        horasLuz
      );
      const receipt = await tx.wait();

      return NextResponse.json({
        success: true,
        modo: "factory",
        semillaId,
        contratoIndividual: direccionGemelo,
        txHash: receipt.hash,
        msg: `✅ Clima inyectado con éxito en Gemelo Digital de semilla #${semillaId}`,
        info: {
          temp:         Number(temperaturaInt) / 10,
          hum:          Number(humedad),
          precipitacion: Number(precipitacion) / 10,
          horasLuz:     Number(horasLuz),
          ciudad:       datos.name || "Desconocida"
        }
      });
    }

    // ─────────────────────────────────────────────────────────────────────
    //  MODO B: LEGACY (v1) — Receptor CRE centralizado
    // ─────────────────────────────────────────────────────────────────────
    if (!receptorAddress) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_ORACLE_ADDRESS_SEPOLIA no configurado para modo legacy" },
        { status: 500 }
      );
    }

    const Receptor = new ethers.Contract(receptorAddress, receptorABI, wallet);

    const coder          = ethers.AbiCoder.defaultAbiCoder();
    const reporteEncoded = coder.encode(
      ["int256", "uint256", "uint256", "uint256", "uint256"],
      [temperaturaInt, humedad, precipitacion, horasLuz, timestamp]
    );

    console.log("🔑 [Legacy] Abriendo bóveda del receptor CRE...");
    let txLegacy = await Receptor.actualizarForwarder(wallet.address);
    await txLegacy.wait();

    console.log("💉 [Legacy] Inyectando reporte climático...");
    txLegacy = await Receptor.fulfillReport(semillaId, reporteEncoded);
    const receiptLegacy = await txLegacy.wait();

    console.log("🔒 [Legacy] Restaurando Chainlink como Forwarder...");
    txLegacy = await Receptor.actualizarForwarder(CHAINLINK_OFICIAL);
    await txLegacy.wait();

    return NextResponse.json({
      success: true,
      modo: "legacy",
      semillaId,
      txHash: receiptLegacy.hash,
      msg: `✅ [Legacy] Clima inyectado con éxito en receptor CRE para semilla #${semillaId}`,
      info: {
        temp:         Number(temperaturaInt) / 10,
        hum:          Number(humedad),
        precipitacion: Number(precipitacion) / 10,
        horasLuz:     Number(horasLuz),
        ciudad:       datos.name || "Desconocida"
      }
    });

  } catch (error) {
    console.error("❌ Error interno del Oráculo Automático:", error);
    return NextResponse.json(
      { error: error.message || "Error desconocido en el servidor" },
      { status: 500 }
    );
  }
}