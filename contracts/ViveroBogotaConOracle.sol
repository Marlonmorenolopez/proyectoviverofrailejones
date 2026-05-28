// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// ============================================================
//  Vivero Frailejones — Oráculo Climático con Chainlink Functions
//  Autor: Proyecto Vivero Bogotá
//  Red recomendada: Ethereum Sepolia (testnet)
// ============================================================
//
//  ¿Cómo funciona?
//  ─────────────────────────────────────────────────────────────
//  1. Este contrato PIDE datos climáticos reales a OpenWeatherMap
//     a través de la red descentralizada de Chainlink Functions.
//
//  2. Chainlink DON (Decentralized Oracle Network) ejecuta el
//     JavaScript que definimos, llama a la API de clima, y
//     entrega la respuesta on-chain de forma verificable.
//
//  3. ViveroBogota.sol consume los datos verificados de aquí,
//     en lugar de confiar en lo que el usuario escribe a mano.
//
//  Flujo:
//  Frontend → solicitarDatosClimaticos() → Chainlink DON
//  → OpenWeatherMap API → fulfillRequest() → ViveroBogota
// ============================================================

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

contract ViveroClimaOracle is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // ─────────────────────────────────────────────────────────
    //  CONFIGURACIÓN CHAINLINK FUNCTIONS — SEPOLIA TESTNET
    //  Referencia: https://docs.chain.link/chainlink-functions/supported-networks
    // ─────────────────────────────────────────────────────────

    // Dirección del router de Chainlink Functions en Sepolia
    address constant FUNCTIONS_ROUTER = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;

    // DON ID para Sepolia (fun-ethereum-sepolia-1)
    bytes32 constant DON_ID = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;

    // Gas límite para el callback (ajustable según complejidad del JS)
    uint32 constant GAS_LIMIT_CALLBACK = 300_000;

    // ─────────────────────────────────────────────────────────
    //  ESTADO DEL CONTRATO
    // ─────────────────────────────────────────────────────────

    // ID de suscripción en Chainlink Functions (creada en functions.chain.link)
    uint64 public subscriptionId;

    // Dirección del contrato ViveroBogota (quien consume los datos)
    address public viveroContrato;

    // Última request pendiente
    bytes32 public ultimaRequestId;

    // Última semilla para la que se pidió clima
    uint256 public ultimaSemillaId;

    // ─────────────────────────────────────────────────────────
    //  DATOS CLIMÁTICOS VERIFICADOS
    //  Almacenamos el último resultado por semilla
    // ─────────────────────────────────────────────────────────

    struct DatosClimaVerificados {
        int256  temperatura;       // °C × 10 (ej: 85 = 8.5°C)
        uint256 humedadRelativa;   // % (0-100)
        uint256 precipitacion;     // mm × 10
        uint256 horasLuzSolar;     // horas (estimadas por cobertura nubes)
        uint256 timestamp;         // cuándo se obtuvieron
        bool    disponible;        // si ya llegó la respuesta
    }

    mapping(uint256 => DatosClimaVerificados) public datosPorSemilla;
    mapping(bytes32 => uint256) private requestIdASemillaId;

    // ─────────────────────────────────────────────────────────
    //  EVENTOS
    // ─────────────────────────────────────────────────────────

    event SolicitudClimaEnviada(bytes32 indexed requestId, uint256 indexed semillaId);
    event DatosClimaRecibidos(
        bytes32 indexed requestId,
        uint256 indexed semillaId,
        int256  temperatura,
        uint256 humedad,
        uint256 precipitacion
    );
    event ErrorOracle(bytes32 indexed requestId, bytes err);
    event AlertaClimatica(uint256 indexed semillaId, string alerta, int256 valor);

    // ─────────────────────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────────────────────

    constructor(uint64 _subscriptionId, address _viveroContrato)
        FunctionsClient(FUNCTIONS_ROUTER)
        ConfirmedOwner(msg.sender)
    {
        subscriptionId  = _subscriptionId;
        viveroContrato  = _viveroContrato;
    }

    // ─────────────────────────────────────────────────────────
    //  CÓDIGO JAVASCRIPT QUE CHAINLINK EJECUTA
    //  Este JS corre en cada nodo del DON de forma descentralizada.
    //  Llama a OpenWeatherMap con las coordenadas de la semilla
    //  y devuelve temperatura + humedad + precipitación codificados.
    // ─────────────────────────────────────────────────────────

    // NOTA: En producción guardá el source en IPFS (más barato en gas).
    // args[0] = latitud,  args[1] = longitud,  args[2] = API key
    string private constant WEATHER_JS_SOURCE =
        "const lat  = args[0];"
        "const lon  = args[1];"
        "const key  = args[2];"
        "const url  = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;"
        "const resp = await Functions.makeHttpRequest({ url });"
        "if (resp.error) throw Error('Error HTTP: ' + resp.message);"
        "const d    = resp.data;"
        "const temp = Math.round(d.main.temp * 10);"   // °C × 10
        "const hum  = d.main.humidity;"                // %
        "const rain = d.rain ? Math.round((d.rain['1h'] || 0) * 10) : 0;" // mm × 10
        "const clouds = d.clouds.all;"                 // % cobertura
        "const luz  = Math.round((1 - clouds / 100) * 12);" // horas luz estimadas
        // Empaquetamos 4 valores en bytes: temp(int16) hum(uint8) rain(uint16) luz(uint8)
        "const buf  = new Uint8Array(6);"
        "const tempSigned = temp < 0 ? temp + 65536 : temp;"
        "buf[0] = (tempSigned >> 8) & 0xFF;"
        "buf[1] = tempSigned & 0xFF;"
        "buf[2] = hum & 0xFF;"
        "buf[3] = (rain >> 8) & 0xFF;"
        "buf[4] = rain & 0xFF;"
        "buf[5] = luz & 0xFF;"
        "return buf;";

    // ─────────────────────────────────────────────────────────
    //  SOLICITAR DATOS CLIMÁTICOS
    //  Llama a Chainlink con las coordenadas de la semilla
    //
    //  Parámetros:
    //    _semillaId  → ID de la semilla en ViveroBogota
    //    _latitud    → Latitud × 1_000_000 (ej: 4721000 = 4.721°N)
    //    _longitud   → Longitud × 1_000_000 (ej: -74072900 = -74.0729°W)
    //    _apiKey     → Tu API key de OpenWeatherMap (guardala en secrets de Chainlink)
    // ─────────────────────────────────────────────────────────

    function solicitarDatosClimaticos(
        uint256 _semillaId,
        int256  _latitud,
        int256  _longitud,
        string calldata _apiKey
    ) external onlyOwner returns (bytes32 requestId) {
        // Convertir coordenadas a string (dividir por 1_000_000)
        string memory latStr = _int256ToString(_latitud / 1_000_000);
        string memory lonStr = _int256ToString(_longitud / 1_000_000);

        // Construir la request de Chainlink Functions
        FunctionsRequest.Request memory req;
        req.initializeRequest(
        FunctionsRequest.Location.Inline,
        FunctionsRequest.CodeLanguage.JavaScript,
        WEATHER_JS_SOURCE
        );

        // Argumentos que recibirá el JS
        string[] memory args = new string[](3);
        args[0] = latStr;
        args[1] = lonStr;
        args[2] = _apiKey;
        req.setArgs(args);

        // Enviar al DON
        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            GAS_LIMIT_CALLBACK,
            DON_ID
        );

        ultimaRequestId  = requestId;
        ultimaSemillaId  = _semillaId;
        requestIdASemillaId[requestId] = _semillaId;

        emit SolicitudClimaEnviada(requestId, _semillaId);
    }

    // ─────────────────────────────────────────────────────────
    //  CALLBACK DE CHAINLINK
    //  Chainlink llama a esta función cuando tiene la respuesta.
    //  Decodificamos los bytes y guardamos los datos verificados.
    // ─────────────────────────────────────────────────────────

    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        uint256 semillaId = requestIdASemillaId[requestId];

        // Si hubo error en el DON
        if (err.length > 0) {
            emit ErrorOracle(requestId, err);
            return;
        }

        // Decodificar los 6 bytes empaquetados
        require(response.length == 6, "Respuesta invalida del oraculo");

        // Temperatura (int16 en los primeros 2 bytes)
        int256 rawTemp = int256(uint256(uint8(response[0])) * 256 + uint256(uint8(response[1])));
        if (rawTemp > 32767) rawTemp -= 65536; // complemento a 2 para negativo
        int256 temperatura = rawTemp; // valor × 10

        uint256 humedad      = uint256(uint8(response[2]));
        uint256 precipitacion = uint256(uint8(response[3])) * 256 + uint256(uint8(response[4]));
        uint256 horasLuz      = uint256(uint8(response[5]));

        // Guardar datos verificados
        datosPorSemilla[semillaId] = DatosClimaVerificados({
            temperatura:     temperatura,
            humedadRelativa: humedad,
            precipitacion:   precipitacion,
            horasLuzSolar:   horasLuz,
            timestamp:       block.timestamp,
            disponible:      true
        });

        emit DatosClimaRecibidos(requestId, semillaId, temperatura, humedad, precipitacion);

        // Verificar alertas climáticas automáticas
        _verificarAlertas(semillaId, temperatura, humedad);
    }

    // ─────────────────────────────────────────────────────────
    //  ALERTAS AUTOMÁTICAS
    //  Se disparan cuando los datos del oráculo están fuera de rango
    //  para plantas de páramo (Frailejones, etc.)
    // ─────────────────────────────────────────────────────────

    function _verificarAlertas(uint256 semillaId, int256 temperatura, uint256 humedad) internal {
        // Temperatura demasiado baja (< -5°C → temp × 10 < -50)
        if (temperatura < -50) {
            emit AlertaClimatica(semillaId, "ALERTA: Temperatura critica bajo cero", temperatura);
        }
        // Temperatura demasiado alta para páramo (> 15°C → temp × 10 > 150)
        if (temperatura > 150) {
            emit AlertaClimatica(semillaId, "ALERTA: Temperatura demasiado alta para paramo", temperatura);
        }
        // Humedad muy baja (< 50%)
        if (humedad < 50) {
            emit AlertaClimatica(semillaId, "ALERTA: Humedad critica baja para frailejones", int256(humedad));
        }
    }

    // ─────────────────────────────────────────────────────────
    //  FUNCIONES DE CONSULTA
    // ─────────────────────────────────────────────────────────

    /// Retorna los datos climáticos verificados para una semilla
    function obtenerDatosVerificados(uint256 _semillaId)
        external view
        returns (DatosClimaVerificados memory)
    {
        require(datosPorSemilla[_semillaId].disponible, "Sin datos del oraculo para esta semilla");
        return datosPorSemilla[_semillaId];
    }

    /// ¿Los datos del oráculo son recientes? (menos de 1 hora)
    function datosSonRecientes(uint256 _semillaId) external view returns (bool) {
        return (block.timestamp - datosPorSemilla[_semillaId].timestamp) < 1 hours;
    }

    // ─────────────────────────────────────────────────────────
    //  ADMINISTRACIÓN
    // ─────────────────────────────────────────────────────────

    function actualizarSubscriptionId(uint64 _nuevoId) external onlyOwner {
        subscriptionId = _nuevoId;
    }

    function actualizarViveroContrato(address _nuevoDireccion) external onlyOwner {
        viveroContrato = _nuevoDireccion;
    }

    // ─────────────────────────────────────────────────────────
    //  UTILIDADES INTERNAS
    // ─────────────────────────────────────────────────────────

    function _int256ToString(int256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        bool negative = value < 0;
        uint256 absValue = negative ? uint256(-value) : uint256(value);
        bytes memory buffer = new bytes(20);
        uint256 i = 20;
        while (absValue != 0) {
            i--;
            buffer[i] = bytes1(uint8(48 + absValue % 10));
            absValue /= 10;
        }
        if (negative) {
            i--;
            buffer[i] = "-";
        }
        bytes memory result = new bytes(20 - i);
        for (uint256 j = 0; j < result.length; j++) {
            result[j] = buffer[i + j];
        }
        return string(result);
    }
}
