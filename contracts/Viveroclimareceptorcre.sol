// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// ============================================================
//  ViveroClimaReceptorCRE.sol
//  Contrato Receptor para Chainlink Runtime Environment (CRE)
//  CORREGIDO: SPDX + pragma añadidos
// ============================================================

interface IForwarder {
    function getWorkflowMetadata() external view returns (
        address workflowOwner,
        bytes32 workflowName,
        bytes32 workflowId
    );
}

contract ViveroClimaReceptorCRE {

    address public owner;
    address public creForwarder;

    struct ReporteClimatico {
        int256  temperatura;
        uint256 humedadRelativa;
        uint256 precipitacion;
        uint256 horasLuzSolar;
        uint256 timestamp;
    }

    ReporteClimatico public ultimoReporte;
    mapping(uint256 => ReporteClimatico[]) public historialPorSemilla;
    mapping(uint256 => ReporteClimatico)   public reporteActualPorSemilla;
    uint256 public totalReportesRecibidos;

    event ReporteRecibido(
        uint256 indexed semillaId,
        int256  temperatura,
        uint256 humedad,
        uint256 precipitacion,
        uint256 timestamp,
        address forwarder
    );
    event AlertaClimatica(uint256 indexed semillaId, string alerta, int256 valor);
    event ForwarderActualizado(address nuevoForwarder);

    modifier soloDueno() {
        require(msg.sender == owner, "Solo el owner");
        _;
    }

    modifier soloForwarderCRE() {
        require(msg.sender == creForwarder, "Solo el Forwarder de CRE");
        _;
    }

    constructor(address _creForwarder) {
        owner        = msg.sender;
        creForwarder = _creForwarder;
    }

    function fulfillReport(
        uint256 _semillaId,
        bytes calldata _reporteEncoded
    ) external soloForwarderCRE {

        (
            int256  temperatura,
            uint256 humedadRelativa,
            uint256 precipitacion,
            uint256 horasLuzSolar,
            uint256 timestamp
        ) = abi.decode(_reporteEncoded, (int256, uint256, uint256, uint256, uint256));

        ReporteClimatico memory nuevoReporte = ReporteClimatico({
            temperatura:     temperatura,
            humedadRelativa: humedadRelativa,
            precipitacion:   precipitacion,
            horasLuzSolar:   horasLuzSolar,
            timestamp:       timestamp
        });

        ultimoReporte = nuevoReporte;
        historialPorSemilla[_semillaId].push(nuevoReporte);
        reporteActualPorSemilla[_semillaId] = nuevoReporte;
        totalReportesRecibidos++;

        emit ReporteRecibido(_semillaId, temperatura, humedadRelativa, precipitacion, block.timestamp, msg.sender);
        _verificarAlertas(_semillaId, temperatura, humedadRelativa);
    }

    function _verificarAlertas(uint256 semillaId, int256 temperatura, uint256 humedad) internal {
        if (temperatura < -50) emit AlertaClimatica(semillaId, "Temperatura critica bajo -5C", temperatura);
        if (temperatura > 150) emit AlertaClimatica(semillaId, "Temperatura alta para paramo", temperatura);
        if (humedad < 50)      emit AlertaClimatica(semillaId, "Humedad critica para frailejones", int256(humedad));
    }

    function obtenerUltimoReporte() external view returns (ReporteClimatico memory) {
        return ultimoReporte;
    }

    function obtenerReporteSemilla(uint256 _semillaId) external view returns (ReporteClimatico memory) {
        return reporteActualPorSemilla[_semillaId];
    }

    function obtenerHistorialSemilla(uint256 _semillaId) external view returns (ReporteClimatico[] memory) {
        return historialPorSemilla[_semillaId];
    }

    function datosSonRecientes(uint256 _semillaId) external view returns (bool) {
        return (block.timestamp - reporteActualPorSemilla[_semillaId].timestamp) < 1 hours;
    }

    function actualizarForwarder(address _nuevoForwarder) external soloDueno {
        require(_nuevoForwarder != address(0), "Direccion invalida");
        creForwarder = _nuevoForwarder;
        emit ForwarderActualizado(_nuevoForwarder);
    }

    function transferirPropiedad(address _nuevoDueno) external soloDueno {
        require(_nuevoDueno != address(0), "Direccion invalida");
        owner = _nuevoDueno;
    }
}
