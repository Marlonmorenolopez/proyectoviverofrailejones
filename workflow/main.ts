// workflow/main.ts
// ============================================================
//  Vivero Frailejones — CRE Workflow v4 FINAL
//  SDK: @chainlink/cre-sdk v1.6.0
//
//  Basado 100% en la documentación oficial de Chainlink CRE
//  Refs:
//  - docs.chain.link/cre/getting-started/part-4-writing-onchain-ts
//  - docs.chain.link/cre/reference/sdk/core-ts
//  - docs.chain.link/cre/reference/sdk/evm-client-ts
//
//  CORRECCIONES FINALES:
//  ✅ getSecret en Runtime (DON level), no NodeRuntime
//  ✅ sendRequest(nodeRuntime, opts) — nodeRuntime SIN secrets
//  ✅ consensusMedianAggregation<bigint>() — tipo simple bigint
//  ✅ writeReport usa { receiver, report, gasConfig }
//  ✅ runtime.report() genera el reporte firmado antes de writeReport
//  ✅ response.body es string, JSON.parse directo
// ============================================================

import {
  CronCapability,
  HTTPClient,
  EVMClient,
  getNetwork,
  consensusMedianAggregation,
  ConsensusAggregationByFields,
  handler,
  Runner,
  hexToBase64,
  type Runtime,
  type NodeRuntime,
} from "@chainlink/cre-sdk";

import {
  encodeAbiParameters,
  parseAbiParameters,
} from "viem";

import { z } from "zod";

// ─── Schema de configuración ──────────────────────────────
const configSchema = z.object({
  receptorAddress:   z.string(),
  semillaId:         z.string(),
  chainSelectorName: z.string(),
  lat:               z.string(),
  lon:               z.string(),
  gasLimit:          z.string().default("500000"),
});

type Config = z.infer<typeof configSchema>;

// ─── Tipo de retorno del nodo — usa bigint ─────────────────
// consensusMedianAggregation solo acepta NumericType (bigint|number)
// Por eso procesamos cada campo por separado
type DatosNodo = {
  temperatura:   bigint;
  humedad:       bigint;
  precipitacion: bigint;
  horasLuz:      bigint;
  timestamp:     bigint;
};

// ─────────────────────────────────────────────────────────
//  FUNCIÓN NODE-LEVEL — corre en cada nodo individualmente
//  IMPORTANTE: NodeRuntime NO tiene getSecret.
//  La URL con apiKey se pasa vía config o se construye sin secret.
//  Para usar secrets en HTTP, se usa el patrón de la doc oficial:
//  el apiKey se inyecta desde la config (no-secret) o
//  se usa sendRequest sin secrets (high-level mode).
// ─────────────────────────────────────────────────────────
const fetchClima = (nodeRuntime: NodeRuntime<Config>): DatosNodo => {

  const httpClient = new HTTPClient();
  const lat        = nodeRuntime.config.lat;
  const lon        = nodeRuntime.config.lon;

  // Nota: para usar API key secreta en HTTP, debes usar
  // el patrón avanzado con ConfidentialHTTPClient o pasar
  // la key en config (sin marcarla como secret).
  // Para este ejemplo la URL usa la key de config directamente.
  const apiKey = (nodeRuntime.config as any).owmApiKey ?? "";

  const response = httpClient
    .sendRequest(nodeRuntime, {
      url:    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`,
      method: "GET",
    })
    .result();

  if (response.statusCode !== 200) {
    throw new Error(`Error API OpenWeather: ${response.statusCode}`);
  }

  const datos = JSON.parse(response.body) as {
    main:   { temp: number; humidity: number };
    rain?:  { "1h"?: number };
    clouds: { all: number };
  };

  return {
    temperatura:   BigInt(Math.round(datos.main.temp     * 10)),
    humedad:       BigInt(datos.main.humidity),
    precipitacion: BigInt(Math.round((datos.rain?.["1h"] ?? 0) * 10)),
    horasLuz:      BigInt(Math.round((1 - datos.clouds.all / 100) * 12)),
    timestamp:     BigInt(Math.floor(Date.now() / 1000)),
  };
};

// ─────────────────────────────────────────────────────────
//  HANDLER PRINCIPAL — nivel DON (Runtime)
// ─────────────────────────────────────────────────────────
const onCronTrigger = (runtime: Runtime<Config>): string => {

  // ── Paso 1: Consenso por campo (objeto con múltiples bigints) ──
  // ConsensusAggregationByFields agrega cada campo del objeto
  // por separado usando la mediana
  const reporte = runtime
    .runInNodeMode(
      fetchClima,
      ConsensusAggregationByFields<DatosNodo>({
        temperatura:   consensusMedianAggregation<bigint>(),
        humedad:       consensusMedianAggregation<bigint>(),
        precipitacion: consensusMedianAggregation<bigint>(),
        horasLuz:      consensusMedianAggregation<bigint>(),
        timestamp:     consensusMedianAggregation<bigint>(),
      })
    )()
    .result();

  runtime.log(`🌡️ Temperatura: ${Number(reporte.temperatura) / 10}°C`);
  runtime.log(`💧 Humedad: ${reporte.humedad}%`);
  runtime.log(`🌧️ Precipitación: ${Number(reporte.precipitacion) / 10}mm`);
  runtime.log(`☀️ Luz solar: ${reporte.horasLuz}h`);

  // ── Paso 2: Obtener la red ────────────────────────────────
  const network = getNetwork({
    chainFamily:       "evm",
    chainSelectorName: runtime.config.chainSelectorName,
  });
  if (!network) throw new Error(`Red no encontrada: ${runtime.config.chainSelectorName}`);

  // ── Paso 3: Codificar datos para Solidity ─────────────────
  // Orden igual al abi.decode del contrato receptor
  const reporteEncoded = encodeAbiParameters(
    parseAbiParameters("int256, uint256, uint256, uint256, uint256, uint256"),
    [
      reporte.temperatura,
      reporte.humedad,
      reporte.precipitacion,
      reporte.horasLuz,
      reporte.timestamp,
      BigInt(runtime.config.semillaId),
    ]
  );

  // ── Paso 4: Generar el reporte firmado por el DON ──────────
  // runtime.report() firma los datos con la clave del DON
  // ESTO es lo que el contrato verifica en onReport()
  const reportResponse = runtime
    .report({
      encodedPayload: hexToBase64(reporteEncoded),
      encoderName:    "evm",
      signingAlgo:    "ecdsa",
      hashingAlgo:    "keccak256",
    })
    .result();

  // ── Paso 5: Escribir on-chain via Forwarder ───────────────
  // writeReport usa { receiver, report, gasConfig }
  const evmClient = new EVMClient(network.chainSelector.selector);

  const txResult = evmClient
    .writeReport(runtime, {
      receiver:  runtime.config.receptorAddress,
      report:    reportResponse,
      gasConfig: { gasLimit: runtime.config.gasLimit },
    })
    .result();

  runtime.log(`✅ TX status: ${txResult.status}`);
  runtime.log(`✅ Reporte escrito en ${runtime.config.receptorAddress}`);

  return "OK";
};

// ─── Inicialización ───────────────────────────────────────
const initWorkflow = (config: Config) => {
  const trigger = new CronCapability().trigger({ schedule: "0 0 * * * *" });
  return [handler(trigger, onCronTrigger)];
};

// ─── Entry point ──────────────────────────────────────────
export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema });
  await runner.run(initWorkflow);
}

main();