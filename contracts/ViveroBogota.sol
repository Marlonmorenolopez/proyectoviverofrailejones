// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// ============================================================
//  ViveroBogota.sol
//  Contrato principal del Vivero Frailejones
// ============================================================

contract ViveroBogota {
    address public owner;
    uint256 public totalSemillasRegistradas;
    uint256 public totalPlantasRegistradas;
    bool public paused = false;

    event AccesoNoAutorizado(address indexed _direccion, string _accion);
    event ModificacionPorOtroUsuario(address indexed _direccion, string _accion);
    event AlertaClimatica(uint256 indexed semillaId, string mensaje);

    struct UbicacionGPS {
        int256 latitud;
        int256 longitud;
    }

    struct Timestamp {
        uint256 timestamp;
    }

    struct Semilla {
        uint256 id;
        string tipo;
        UbicacionGPS ubicacionInicial;
        string responsable;
        CondicionesClimaticas condicionesClimaticas;
        string comentariosDeCuidado;
        Timestamp fechaRegistro;
    }

    struct Planta {
        uint256 id;
        uint256 idSemilla;
        string estado;
        UbicacionGPS ubicacionEnParamo;
        string responsableTraslado;
        string comentariosDeCuidado;
        Timestamp fechaTraslado;
    }

    struct HistorialCrecimiento {
        uint256 plantaId;
        string estado;
        Timestamp fechaActualizacion;
    }

    struct CondicionesClimaticas {
        int256 temperatura;
        uint256 humedadRelativa;
        uint256 precipitacion;
        uint256 horasLuzSolar;
        uint256 altitud;
        Timestamp fechaRegistro;
    }

    struct EspecieNativa {
        uint256 id;
        string nombre;
        string descripcion;
        uint256 poblacionEstimada;
        Timestamp fechaRegistro;
    }

    struct EventoClimatico {
        uint256 id;
        string tipo;
        int256 temperatura;
        uint256 precipitacion;
        Timestamp fechaRegistro;
    }

    mapping(uint256 => Semilla) public semillas;
    mapping(uint256 => Planta) public plantas;
    mapping(uint256 => HistorialCrecimiento[]) public historialCrecimiento;
    mapping(address => bool) public administradores;
    mapping(uint256 => EspecieNativa) public especiesNativas;
    mapping(uint256 => EventoClimatico) public eventosClimaticos;

    uint256 public totalEspeciesNativas;
    uint256 public totalEventosClimaticos;

    event EspecieNativaRegistrada(uint256 id, string nombre, Timestamp fechaRegistro);
    event EventoClimaticoRegistrado(uint256 id, string tipo, Timestamp fechaRegistro);

    modifier soloDueno() {
        if (msg.sender != owner) {
            emit AccesoNoAutorizado(msg.sender, "Intento de modificacion");
            revert("No tienes permisos para realizar esta accion");
        }
        _;
    }

    modifier soloAdministrador() {
        require(administradores[msg.sender], "No tienes permisos de administrador");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "El contrato esta pausado");
        _;
    }

    modifier validarSemilla(string memory _tipo) {
        require(
            keccak256(bytes(_tipo)) == keccak256(bytes("Frailejon")) ||
            keccak256(bytes(_tipo)) == keccak256(bytes("Cardones"))  ||
            keccak256(bytes(_tipo)) == keccak256(bytes("Macolla"))   ||
            keccak256(bytes(_tipo)) == keccak256(bytes("Bambues")),
            "El tipo de semilla no es valido"
        );
        _;
    }

    modifier validarCantidad(uint256 _cantidad) {
        require(_cantidad == 1, "La cantidad de semillas debe ser 1");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferirPropiedad(address nuevoDueno) public soloDueno {
        require(nuevoDueno != address(0), "Nueva direccion no puede ser cero");
        owner = nuevoDueno;
    }

    function registrarSemilla(
        string memory _tipo,
        UbicacionGPS memory _ubicacionInicial,
        string memory _responsable,
        int256 _temperatura,
        uint256 _humedadRelativa,
        uint256 _precipitacion,
        uint256 _horasLuzSolar,
        uint256 _altitud,
        string memory _comentariosDeCuidado
    ) public validarSemilla(_tipo) validarCantidad(1) whenNotPaused {
        require(_ubicacionInicial.latitud >= -90000000 && _ubicacionInicial.latitud <= 90000000, "Latitud fuera de rango");
        require(_ubicacionInicial.longitud >= -180000000 && _ubicacionInicial.longitud <= 180000000, "Longitud fuera de rango");
        require(_temperatura >= -10 && _temperatura <= 15, "Temperatura fuera del rango permitido (-10 a 15 grados)");
        require(_humedadRelativa >= 50 && _humedadRelativa <= 100, "Humedad relativa fuera del rango permitido (50% a 100%)");
        require(_altitud >= 2800 && _altitud <= 4200, "Altitud fuera del rango permitido (2800m a 4200m)");
        require(totalSemillasRegistradas < 50, "Se ha alcanzado el limite de 50 semillas registradas");

        if (msg.sender != owner) {
            emit ModificacionPorOtroUsuario(msg.sender, "Registro de semilla");
        }

        totalSemillasRegistradas++;
        Timestamp memory fechaActual = Timestamp(block.timestamp);

        semillas[totalSemillasRegistradas] = Semilla({
            id: totalSemillasRegistradas,
            tipo: _tipo,
            ubicacionInicial: _ubicacionInicial,
            responsable: _responsable,
            condicionesClimaticas: CondicionesClimaticas({
                temperatura: _temperatura,
                humedadRelativa: _humedadRelativa,
                precipitacion: _precipitacion,
                horasLuzSolar: _horasLuzSolar,
                altitud: _altitud,
                fechaRegistro: fechaActual
            }),
            comentariosDeCuidado: _comentariosDeCuidado,
            fechaRegistro: fechaActual
        });
    }

    function registroTrasladoPlanta(
        uint256 _idSemilla,
        UbicacionGPS memory _ubicacionEnParamo,
        string memory _responsableTraslado,
        string memory _comentariosDeCuidado
    ) public whenNotPaused {
        require(_idSemilla > 0 && _idSemilla <= totalSemillasRegistradas, "ID de semilla invalido");

        if (msg.sender != owner) {
            emit ModificacionPorOtroUsuario(msg.sender, "Registro de planta");
        }

        totalPlantasRegistradas++;
        Timestamp memory fechaActual = Timestamp(block.timestamp);

        plantas[totalPlantasRegistradas] = Planta({
            id: totalPlantasRegistradas,
            idSemilla: _idSemilla,
            estado: "Traslado",
            ubicacionEnParamo: _ubicacionEnParamo,
            responsableTraslado: _responsableTraslado,
            comentariosDeCuidado: _comentariosDeCuidado,
            fechaTraslado: fechaActual
        });
    }

    function actualizarEstadoPlantaYCrecimiento(uint256 _idPlanta, string memory _nuevoEstado) public whenNotPaused {
        require(_idPlanta > 0 && _idPlanta <= totalPlantasRegistradas, "ID de planta invalido");

        if (msg.sender != owner) {
            emit ModificacionPorOtroUsuario(msg.sender, "Actualizacion de planta");
        }

        plantas[_idPlanta].estado = _nuevoEstado;
        historialCrecimiento[_idPlanta].push(HistorialCrecimiento({
            plantaId: _idPlanta,
            estado: _nuevoEstado,
            fechaActualizacion: Timestamp(block.timestamp)
        }));
    }

    function actualizarUbicacionPlantaEnParamo(uint256 _idPlanta, UbicacionGPS memory _nuevaUbicacion) public whenNotPaused {
        require(_idPlanta > 0 && _idPlanta <= totalPlantasRegistradas, "ID de planta invalido");

        if (msg.sender != owner) {
            emit ModificacionPorOtroUsuario(msg.sender, "Actualizacion de ubicacion de planta");
        }

        plantas[_idPlanta].ubicacionEnParamo = _nuevaUbicacion;
    }

    function obtenerUltimoHistorial(uint256 _idPlanta) public view returns (HistorialCrecimiento memory) {
        require(historialCrecimiento[_idPlanta].length > 0, "No hay historial para esta planta");
        return historialCrecimiento[_idPlanta][historialCrecimiento[_idPlanta].length - 1];
    }

    function obtenerSemilla(uint256 _idSemilla) public view returns (Semilla memory) {
        require(_idSemilla > 0 && _idSemilla <= totalSemillasRegistradas, "ID de semilla invalido");
        return semillas[_idSemilla];
    }

    function trasladoPlanta(uint256 _idPlanta) public view returns (Planta memory) {
        require(_idPlanta > 0 && _idPlanta <= totalPlantasRegistradas, "ID de planta invalido");
        return plantas[_idPlanta];
    }

    function eliminarSemilla(uint256 _idSemilla) public soloDueno {
        require(_idSemilla > 0 && _idSemilla <= totalSemillasRegistradas, "ID de semilla invalido");
        delete semillas[_idSemilla];
        totalSemillasRegistradas--;
    }

    function eliminarPlanta(uint256 _idPlanta) public soloDueno {
        require(_idPlanta > 0 && _idPlanta <= totalPlantasRegistradas, "ID de planta invalido");
        delete plantas[_idPlanta];
        totalPlantasRegistradas--;
    }

    function actualizarCondicionesClimaticas(uint256 _idSemilla, CondicionesClimaticas memory _nuevasCondiciones) public whenNotPaused {
        require(_idSemilla > 0 && _idSemilla <= totalSemillasRegistradas, "ID de semilla invalido");
        _nuevasCondiciones.fechaRegistro = Timestamp(block.timestamp);
        semillas[_idSemilla].condicionesClimaticas = _nuevasCondiciones;
    }

    function agregarComentario(uint256 _idSemilla, string memory _comentario) public whenNotPaused {
        require(_idSemilla > 0 && _idSemilla <= totalSemillasRegistradas, "ID de semilla invalido");
        semillas[_idSemilla].comentariosDeCuidado = _comentario;
    }

    function obtenerEstadisticas() public view returns (uint256, uint256, uint256) {
        uint256 totalSemillasFrailejon = 0;
        for (uint256 i = 1; i <= totalSemillasRegistradas; i++) {
            if (keccak256(bytes(semillas[i].tipo)) == keccak256(bytes("Frailejon"))) {
                totalSemillasFrailejon++;
            }
        }
        return (totalSemillasRegistradas, totalPlantasRegistradas, totalSemillasFrailejon);
    }

    function obtenerEventos() public view returns (string[] memory) {
        string[] memory eventos = new string[](totalSemillasRegistradas + totalPlantasRegistradas);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalSemillasRegistradas; i++) {
            eventos[index] = "Registro de semilla";
            index++;
        }
        for (uint256 i = 1; i <= totalPlantasRegistradas; i++) {
            eventos[index] = "Registro de planta";
            index++;
        }
        return eventos;
    }

    function obtenerHistorialDeCambios(uint256 _idSemilla) public view returns (HistorialCrecimiento[] memory) {
        require(_idSemilla > 0 && _idSemilla <= totalSemillasRegistradas, "ID de semilla invalido");
        return historialCrecimiento[_idSemilla];
    }

    function consultarHistorial(uint256 _idPlanta) public view returns (HistorialCrecimiento[] memory) {
        return historialCrecimiento[_idPlanta];
    }

    function pausar() public soloDueno {
        paused = true;
    }

    function despausar() public soloDueno {
        paused = false;
    }

    function agregarAdministrador(address _nuevoAdmin) public soloDueno {
        administradores[_nuevoAdmin] = true;
    }

    function removerAdministrador(address _admin) public soloDueno {
        administradores[_admin] = false;
    }

    function obtenerTodasLasSemillas() public view returns (Semilla[] memory) {
        Semilla[] memory todasLasSemillas = new Semilla[](totalSemillasRegistradas);
        for (uint256 i = 1; i <= totalSemillasRegistradas; i++) {
            todasLasSemillas[i-1] = semillas[i];
        }
        return todasLasSemillas;
    }

    function buscarSemillasPorResponsable(string memory _responsable) public view returns (uint256[] memory) {
        uint256[] memory resultados = new uint256[](totalSemillasRegistradas);
        uint256 count = 0;
        for (uint256 i = 1; i <= totalSemillasRegistradas; i++) {
            if (keccak256(bytes(semillas[i].responsable)) == keccak256(bytes(_responsable))) {
                resultados[count] = i;
                count++;
            }
        }
        return resultados;
    }

    function obtenerEstadisticasDetalladas() public view returns (
        uint256 totalSemillas,
        uint256 totalPlantas,
        uint256 semillasPorMes,
        uint256 plantasPorMes
    ) {
        uint256 mesActual = block.timestamp / 30 days;

        for (uint256 i = 1; i <= totalSemillasRegistradas; i++) {
            if (semillas[i].fechaRegistro.timestamp / 30 days == mesActual) {
                semillasPorMes++;
            }
        }

        for (uint256 i = 1; i <= totalPlantasRegistradas; i++) {
            if (plantas[i].fechaTraslado.timestamp / 30 days == mesActual) {
                plantasPorMes++;
            }
        }

        return (totalSemillasRegistradas, totalPlantasRegistradas, semillasPorMes, plantasPorMes);
    }

    function verificarCondicionesClimaticas(uint256 _idSemilla) public {
        Semilla storage semilla = semillas[_idSemilla];
        if (semilla.condicionesClimaticas.temperatura < -5) {
            emit AlertaClimatica(_idSemilla, "Temperatura demasiado baja");
        }
    }

    function registrarEspecieNativa(
        string memory _nombre,
        string memory _descripcion,
        uint256 _poblacionEstimada
    ) public {
        totalEspeciesNativas++;
        Timestamp memory fechaActual = Timestamp(block.timestamp);
        especiesNativas[totalEspeciesNativas] = EspecieNativa({
            id: totalEspeciesNativas,
            nombre: _nombre,
            descripcion: _descripcion,
            poblacionEstimada: _poblacionEstimada,
            fechaRegistro: fechaActual
        });
        emit EspecieNativaRegistrada(totalEspeciesNativas, _nombre, fechaActual);
    }

    function obtenerEstadisticasParamo() public view returns (
        uint256 _totalSemillas,
        uint256 _totalPlantas,
        uint256 _totalEspeciesNativas,
        uint256 _totalEventosClimaticos
    ) {
        return (
            totalSemillasRegistradas,
            totalPlantasRegistradas,
            totalEspeciesNativas,
            totalEventosClimaticos
        );
    }

    function registrarEventoClimatico(
        string memory _tipo,
        int256 _temperatura,
        uint256 _precipitacion
    ) public {
        totalEventosClimaticos++;
        Timestamp memory fechaActual = Timestamp(block.timestamp);
        eventosClimaticos[totalEventosClimaticos] = EventoClimatico({
            id: totalEventosClimaticos,
            tipo: _tipo,
            temperatura: _temperatura,
            precipitacion: _precipitacion,
            fechaRegistro: fechaActual
        });
        emit EventoClimaticoRegistrado(totalEventosClimaticos, _tipo, fechaActual);
    }
}
