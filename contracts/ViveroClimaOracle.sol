// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// ============================================================
//  Interfaz del Oráculo Climático
//  Usada por ViveroBogota.sol para consumir datos verificados
// ============================================================

interface IViveroClimaOracle {
    struct DatosClimaVerificados {
        int256  temperatura;
        uint256 humedadRelativa;
        uint256 precipitacion;
        uint256 horasLuzSolar;
        uint256 timestamp;
        bool    disponible;
    }
    function obtenerDatosVerificados(uint256 semillaId) external view returns (DatosClimaVerificados memory);
    function datosSonRecientes(uint256 semillaId) external view returns (bool);
}