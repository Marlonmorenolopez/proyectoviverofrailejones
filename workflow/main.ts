// workflow/main.ts
// ============================================================
//  Vivero Frailejones — CRE Workflow v4 FINAL
//  SDK: @chainlink/cre-sdk v1.6.0
//
//  CORRECCIONES APLICADAS:
//  ✅ response.body: Uint8Array → string con TextDecoder
//  ✅ ConsensusAggregationByFields: usa median() (tipo correcto)
//  ✅ txResult.txStatus (no .status)
//  ✅ gasLimit: ConfigHandlerParams solo acepta configParser y configSchema.
//     Se usa configParser para inyectar el default "500000" antes
//     de parsear, así el schema puede ser z.string() puro y el
//     tipo de entrada/salida es string — compatible con StandardSchemaV1.
// ============================================================

import {
  CronCapability,
  HTTPClient,
  EVMClient,
  getNetwork,
  ConsensusAggregationByFields,
  median,
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
// z.string() puro — sin default ni preprocess.
// El default de gasLimit se aplica en configParser (ver main()).
const configSchema = z.object({
  receptorAddress:   z.string(),
  semillaId:         z.string(),
  chainSelectorName: z.string(),
  lat:               z.string(),
  lon:               z.string(),
  gasLimit:          z.string(),
});

type Config = z.infer<typeof configSchema>;

// ─── Tipo de retorno del nodo ──────────────────────────────
type DatosNodo = {
  temperatura:   bigint;
  humedad:       bigint;
  precipitacion: bigint;
  horasLuz:      bigint;
  timestamp:     bigint;
};

// ─────────────────────────────────────────────────────────
//  FUNCIÓN NODE-LEVEL
// ─────────────────────────────────────────────────────────
const fetchClima = (nodeRuntime: NodeRuntime<Config>): DatosNodo => {

  const httpClient = new HTTPClient();
  const lat        = nodeRuntime.config.lat;
  const lon        = nodeRuntime.config.lon;
  const apiKey     = (nodeRuntime.config as any).owmApiKey ?? "";

  const response = httpClient
    .sendRequest(nodeRuntime, {
      url:    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`,
      method: "GET",
    })
    .result();

  if (response.statusCode !== 200) {
    throw new Error(`Error API OpenWeather: ${response.statusCode}`);
  }

  // response.body puede ser Uint8Array — convertir a string antes de JSON.parse
  const bodyStr = typeof response.body === "string"
    ? response.body
    : new TextDecoder().decode(response.body);

  const datos = JSON.parse(bodyStr) as {
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

  const reporte = runtime
    .runInNodeMode(
      fetchClima,
      ConsensusAggregationByFields<DatosNodo>({
        temperatura:   () => median<bigint>(),
        humedad:       () => median<bigint>(),
        precipitacion: () => median<bigint>(),
        horasLuz:      () => median<bigint>(),
        timestamp:     () => median<bigint>(),
      })
    )()
    .result();

  runtime.log(`🌡️ Temperatura: ${Number(reporte.temperatura) / 10}°C`);
  runtime.log(`💧 Humedad: ${reporte.humedad}%`);
  runtime.log(`🌧️ Precipitación: ${Number(reporte.precipitacion) / 10}mm`);
  runtime.log(`☀️ Luz solar: ${reporte.horasLuz}h`);

  // ── Obtener la red ────────────────────────────────────────
  const network = getNetwork({
    chainFamily:       "evm",
    chainSelectorName: runtime.config.chainSelectorName,
  });
  if (!network) throw new Error(`Red no encontrada: ${runtime.config.chainSelectorName}`);

  // ── Codificar datos para Solidity ─────────────────────────
  // ── Codificar datos para Solidity (CORREGIDO PARA ENCAJAR CON EL RECEPTOR) ──
  const reporteEncoded = encodeAbiParameters(
    parseAbiParameters("int256, uint256, uint256, uint256, uint256"), // Sacamos el 6to tipo de dato
    [
      reporte.temperatura,
      reporte.humedad,
      reporte.precipitacion,
      reporte.horasLuz,
      reporte.timestamp,
    ] // Dejamos solo los 5 valores climáticos puros
  );

  // ── Generar el reporte firmado por el DON ─────────────────
  const reportResponse = runtime
    .report({
      encodedPayload: hexToBase64(reporteEncoded),
      encoderName:    "evm",
      signingAlgo:    "ecdsa",
      hashingAlgo:    "keccak256",
    })
    .result();

  // ── Escribir on-chain via Forwarder ───────────────────────
  const evmClient = new EVMClient(network.chainSelector.selector);

  const txResult = evmClient
    .writeReport(runtime, {
      receiver:  runtime.config.receptorAddress,
      report:    reportResponse,
      gasConfig: { gasLimit: runtime.config.gasLimit },
    })
    .result();

  runtime.log(`✅ TX status: ${txResult.txStatus}`);
  runtime.log(`✅ Reporte escrito en ${runtime.config.receptorAddress}`);

  return "OK";
};

// ─── Inicialización ───────────────────────────────────────
const initWorkflow = (config: Config) => {
  const trigger = new CronCapability().trigger({ schedule: "0 0 * * * *" });
  return [handler(trigger, onCronTrigger)];
};

// ─── Entry point ──────────────────────────────────────────
// configParser recibe el Uint8Array de config crudo, lo parsea
// como JSON e inyecta gasLimit: "500000" si no viene definido.
// Luego configSchema valida el objeto ya con el default aplicado.
export async function main() {
  const runner = await Runner.newRunner<Config>({
    configParser: (raw: Uint8Array): Config => {
      const text = new TextDecoder().decode(raw);
      const obj  = JSON.parse(text);
      if (!obj.gasLimit) obj.gasLimit = "500000";
      return obj as Config;
    },
    configSchema,
  });
  await runner.run(initWorkflow);
}

main();