import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Truck, CloudSun, Loader2 } from 'lucide-react';
import { ViveroInterface } from '../EcoChainComponent';
import { ethers } from 'ethers';
import SeedSelectionModal from '../SeedSelectionModal';
import PlantTransferModal from '../PlantTransferModal';

const SEED_TYPES = ["Frailejon", "Cardones", "Macolla", "Bambues"];

interface RegistroProps {
  contract:          ViveroInterface | null;
  oracleContract:    ethers.Contract | null;
  chainId:           number;
  tieneOracle:       boolean;
  // ✅ NUEVOS: necesarios para crear el NFT con la foto real
  signer:            ethers.Signer | null;
  nftAddress:        string;
  setResultado:      React.Dispatch<React.SetStateAction<string>>;
  setGasEstimate:    React.Dispatch<React.SetStateAction<string>>;
  walletConnected:   boolean;
  actualizarTotales: () => Promise<void>;
  language:          'es' | 'en' | 'fr' | 'de';
}

const Registro: React.FC<RegistroProps> = ({
  contract,
  oracleContract,
  chainId,
  tieneOracle,
  signer,
  nftAddress,
  setResultado,
  setGasEstimate,
  walletConnected,
  actualizarTotales,
  language
}) => {
  const [isDialogOpen,           setIsDialogOpen]           = useState(false);
  const [selectedItem,           setSelectedItem]           = useState<string | null>(null);
  const [isPlantTransferModalOpen, setIsPlantTransferModalOpen] = useState(false);
  const [semillaId,              setSemillaId]              = useState<string>('');

  // ── Estados para el oráculo (solo en Sepolia) ─────────────
  const [cargandoOracle, setCargandoOracle] = useState(false);
  const [datosOracle,    setDatosOracle]    = useState<{
    temperatura: number;
    humedad: number;
    precipitacion: number;
    horasLuz: number;
  } | null>(null);
  const [oracleRequestId, setOracleRequestId] = useState<string>('');

  // ✅ NUEVOS: datos de la última planta trasladada para el modal NFT
  const [ultimaPlanta, setUltimaPlanta] = useState<{
    idPlanta:    number;
    idSemilla:   number;
    especie:     string;
    responsable: string;
    latitud:     number;
    longitud:    number;
    temperatura: number;
    humedad:     number;
    altitud:     number;
  } | null>(null);

  // Estado local de formulario para pasar latitud/longitud al botón del oráculo
  const [formLatitud,    setFormLatitud]    = useState('');
  const [formLongitud,   setFormLongitud]   = useState('');
  const [formSemillaId,  setFormSemillaId]  = useState('1');
  // ✅ NUEVO: guardar el tipo y responsable del formulario de semilla
  const [formTipo,       setFormTipo]       = useState('');
  const [formResponsable,setFormResponsable]= useState('');
  // Estados del formulario de traslado
  const [trasResponsable,setTrasResponsable]= useState('');

  const translations = {
    es: {
      registerSeed: "Registrar Semilla",
      seedType: "Tipo de Semilla",
      selectSeedType: "Seleccionar Tipo de Semilla",
      responsible: "Responsable",
      selectResponsible: "Responsable de Quien Registra la Semilla",
      latitude: "Latitud",
      longitude: "Longitud",
      temperature: "Temperatura (°C)",
      relativeHumidity: "Humedad Relativa (%)",
      precipitation: "Precipitación (mm)",
      sunlightHours: "Horas de Luz Solar",
      altitude: "Altitud (m)",
      careComments: "Comentarios de Cuidado",
      registerSeedButton: "Registrar Semilla",
      registerPlantTransfer: "Registrar Traslado de Planta",
      seedId: "ID de la Semilla",
      transferResponsible: "Responsable del Traslado",
      selectTransferResponsible: "Responsable de Quien Realiza el Traslado",
      registerTransferButton: "Registrar Traslado",
      walletNotConnected: "Por favor, conecta tu billetera para poder registrar semillas o trasladar plantas.",
      obtenerClima: "Obtener Clima del Oráculo Chainlink",
      cargandoClima: "Consultando oráculo... (~30 seg)",
      climaObtenido: "✅ Datos del Oráculo recibidos",
      modoOracle: "🔗 Modo Oráculo (Sepolia)",
      modoManual: "✏️ Modo Manual",
      infoOracle: "Los datos de temperatura, humedad y precipitación serán tomados automáticamente del oráculo Chainlink.",
      seedTypes: {
        Frailejon: "Frailejón",
        Cardones: "Cardones",
        Macolla: "Macolla",
        Bambues: "Bambúes"
      },
    },
    en: {
      registerSeed: "Register Seed",
      seedType: "Seed Type",
      selectSeedType: "Select Seed Type",
      responsible: "Responsible",
      selectResponsible: "Person Registering the Seed",
      latitude: "Latitude",
      longitude: "Longitude",
      temperature: "Temperature (°C)",
      relativeHumidity: "Relative Humidity (%)",
      precipitation: "Precipitation (mm)",
      sunlightHours: "Sunlight Hours",
      altitude: "Altitude (m)",
      careComments: "Care Comments",
      registerSeedButton: "Register Seed",
      registerPlantTransfer: "Register Plant Transfer",
      seedId: "Seed ID",
      transferResponsible: "Transfer Responsible",
      selectTransferResponsible: "Person Performing the Transfer",
      registerTransferButton: "Register Transfer",
      walletNotConnected: "Please connect your wallet to register seeds or transfer plants.",
      obtenerClima: "Get Climate from Chainlink Oracle",
      cargandoClima: "Querying oracle... (~30 sec)",
      climaObtenido: "✅ Oracle data received",
      modoOracle: "🔗 Oracle Mode (Sepolia)",
      modoManual: "✏️ Manual Mode",
      infoOracle: "Temperature, humidity and precipitation will be taken automatically from the Chainlink oracle.",
      seedTypes: {
        Frailejon: "Frailejón (Espeletia)",
        Cardones: "Cardones (Cacti)",
        Macolla: "Macolla (Bunch Grass)",
        Bambues: "Bambúes (Bamboo)"
      },
    },
    fr: {
      registerSeed: "Enregistrer la Graine",
      seedType: "Type de Graine",
      selectSeedType: "Sélectionner le Type de Graine",
      responsible: "Responsable",
      selectResponsible: "Responsable de l'Enregistrement",
      latitude: "Latitude",
      longitude: "Longitude",
      temperature: "Température (°C)",
      relativeHumidity: "Humidité Relative (%)",
      precipitation: "Précipitations (mm)",
      sunlightHours: "Heures d'Ensoleillement",
      altitude: "Altitude (m)",
      careComments: "Commentaires de Soin",
      registerSeedButton: "Enregistrer la Graine",
      registerPlantTransfer: "Enregistrer le Transfert",
      seedId: "ID de la Graine",
      transferResponsible: "Responsable du Transfert",
      selectTransferResponsible: "Responsable du Transfert",
      registerTransferButton: "Enregistrer le Transfert",
      walletNotConnected: "Veuillez connecter votre portefeuille.",
      obtenerClima: "Obtenir Climat via Oracle Chainlink",
      cargandoClima: "Interrogation de l'oracle... (~30 sec)",
      climaObtenido: "✅ Données de l'oracle reçues",
      modoOracle: "🔗 Mode Oracle (Sepolia)",
      modoManual: "✏️ Mode Manuel",
      infoOracle: "Les données climatiques seront prises automatiquement de l'oracle Chainlink.",
      seedTypes: {
        Frailejon: "Frailejón (Espeletia)",
        Cardones: "Cardones (Cactus)",
        Macolla: "Macolla (Herbe en touffe)",
        Bambues: "Bambúes (Bambou)"
      },
    },
    de: {
      registerSeed: "Samen registrieren",
      seedType: "Samentyp",
      selectSeedType: "Samentyp auswählen",
      responsible: "Verantwortlicher",
      selectResponsible: "Verantwortlicher für die Samenregistrierung",
      latitude: "Breitengrad",
      longitude: "Längengrad",
      temperature: "Temperatur (°C)",
      relativeHumidity: "Relative Luftfeuchtigkeit (%)",
      precipitation: "Niederschlag (mm)",
      sunlightHours: "Sonnenstunden",
      altitude: "Höhe (m)",
      careComments: "Pflegekommentare",
      registerSeedButton: "Samen registrieren",
      registerPlantTransfer: "Pflanzentransfer registrieren",
      seedId: "Samen-ID",
      transferResponsible: "Verantwortlicher für den Transfer",
      selectTransferResponsible: "Verantwortlicher für den Transfer",
      registerTransferButton: "Transfer registrieren",
      walletNotConnected: "Bitte verbinden Sie Ihr Wallet.",
      obtenerClima: "Klima via Chainlink-Orakel abrufen",
      cargandoClima: "Orakel wird abgefragt... (~30 Sek)",
      climaObtenido: "✅ Orakeldaten empfangen",
      modoOracle: "🔗 Orakel-Modus (Sepolia)",
      modoManual: "✏️ Manueller Modus",
      infoOracle: "Temperatur, Luftfeuchtigkeit und Niederschlag werden automatisch vom Chainlink-Orakel übernommen.",
      seedTypes: {
        Frailejon: "Frailejón (Espeletia)",
        Cardones: "Cardones (Kakteen)",
        Macolla: "Macolla (Büschelgras)",
        Bambues: "Bambúes (Bambus)"
      },
    },
  };

  const t = translations[language];

  const handleItemSelect = (value: string) => {
    setSelectedItem(value);
    setFormTipo(value); // ✅ NUEVO: guardar el tipo seleccionado
    setIsDialogOpen(true);
  };

  // ── Consultar el oráculo (solo Sepolia) ───────────────────

  const consultarOracle = async (latitud: string, longitud: string, idSemilla: string) => {
    if (!oracleContract) return;
    if (!latitud || !longitud || !idSemilla) {
      setResultado("⚠️ Completa Latitud, Longitud e ID de semilla antes de consultar el oráculo.");
      return;
    }
    try {
      setCargandoOracle(true);
      setDatosOracle(null);
      setResultado("📡 Enviando solicitud a Chainlink...");

      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "";
      const tx = await oracleContract.solicitarDatosClimaticos(
        parseInt(idSemilla),
        Math.round(parseFloat(latitud) * 1_000_000),
        Math.round(parseFloat(longitud) * 1_000_000),
        apiKey
      );
      const receipt = await tx.wait();
      setOracleRequestId(receipt.hash);
      setResultado("⏳ Solicitud enviada. Esperando respuesta del oráculo (~30 segundos)...");

      oracleContract.once("DatosClimaRecibidos", (reqId: string, semId: bigint, temp: bigint, hum: bigint, precip: bigint) => {
        const temperatura   = Number(temp) / 10;
        const humedad       = Number(hum);
        const precipitacion = Number(precip) / 10;
        const horasLuz      = 8;

        setDatosOracle({ temperatura, humedad, precipitacion, horasLuz });
        setResultado(`✅ Datos del oráculo recibidos:\n🌡️ Temperatura: ${temperatura}°C\n💧 Humedad: ${humedad}%\n🌧️ Precipitación: ${precipitacion}mm`);
        setCargandoOracle(false);
      });

    } catch (error) {
      console.error("Error al consultar el oráculo:", error);
      setResultado(`❌ Error al consultar oráculo: ${(error as Error).message}`);
      setCargandoOracle(false);
    }
  };

  // ── Registrar Semilla ──────────────────────────────────────

  const registrarSemilla = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contract || !walletConnected) return;

    const formData            = new FormData(event.currentTarget);
    const tipo                = formData.get('tipo') as string || formTipo;
    const responsable         = formData.get('responsable') as string || formResponsable;
    const latitud             = parseFloat(formData.get('latitud') as string || formLatitud);
    const longitud            = parseFloat(formData.get('longitud') as string || formLongitud);
    const altitud             = parseFloat(formData.get('altitud') as string);
    const comentariosDeCuidado = formData.get('comentariosDeCuidado') as string;

    try {
      if (tieneOracle) {
        // ── Sepolia: usar datos del oráculo ───────────────────
        if (!datosOracle) {
          setResultado("⚠️ Primero obtén los datos del oráculo Chainlink.");
          return;
        }

        const tx = await (contract as any).registrarSemilla(
          tipo,
          { latitud: Math.round(latitud), longitud: Math.round(longitud) },
          responsable,
          0, 0, 0, 0,
          Math.round(altitud),
          comentariosDeCuidado,
          true,
          parseInt(formData.get('idSemillaOracle') as string || formSemillaId || "1")
        );
        await tx.wait();
        setResultado(`✅ Semilla registrada con datos del oráculo Chainlink.\nHash: ${tx.hash}`);

      } else {
        // ── Ganache: datos manuales (contrato original sin cambios) ──
        const temperatura     = parseFloat(formData.get('temperatura') as string);
        const humedadRelativa = parseFloat(formData.get('humedadRelativa') as string);
        const precipitacion   = parseFloat(formData.get('precipitacion') as string);
        const horasLuzSolar   = parseFloat(formData.get('horasLuzSolar') as string);

        const gasEst = await contract.registrarSemilla.estimateGas(
          tipo,
          { latitud, longitud },
          responsable,
          temperatura,
          humedadRelativa,
          precipitacion,
          horasLuzSolar,
          altitud,
          comentariosDeCuidado
        );
        setGasEstimate(gasEst.toString());

        const tx = await contract.registrarSemilla(
          tipo,
          { latitud, longitud },
          responsable,
          temperatura,
          humedadRelativa,
          precipitacion,
          horasLuzSolar,
          altitud,
          comentariosDeCuidado
        );
        await tx.wait();
        setResultado(`✅ Semilla registrada con éxito.\nHash: ${tx.hash}`);
      }

      actualizarTotales();
    } catch (error) {
      console.error("Error al registrar la semilla:", error);
      setResultado(`❌ Error al registrar la semilla: ${(error as Error).message}`);
    }
  };

  // ── Registrar Traslado ────────────────────────────────────

  const registrarTrasladoPlanta = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contract || !walletConnected) return;

    const formData             = new FormData(event.currentTarget);
    const idSemilla            = parseInt(formData.get('idSemilla') as string || semillaId);
    const latitud              = parseFloat(formData.get('latitud') as string);
    const longitud             = parseFloat(formData.get('longitud') as string);
    const responsableTraslado  = formData.get('responsableTraslado') as string || trasResponsable;
    const comentariosDeCuidado = formData.get('comentariosDeCuidado') as string;

    try {
      const gasEst = await contract.registroTrasladoPlanta.estimateGas(
        idSemilla,
        { latitud, longitud },
        responsableTraslado,
        comentariosDeCuidado
      );
      setGasEstimate(gasEst.toString());

      const tx = await contract.registroTrasladoPlanta(
        idSemilla,
        { latitud, longitud },
        responsableTraslado,
        comentariosDeCuidado
      );
      await tx.wait();
      await actualizarTotales();

      // ✅ NUEVO: capturar el ID de la planta recién creada y datos para el NFT
      const totalPlantas = await contract.totalPlantasRegistradas();
      const idPlanta     = Number(totalPlantas);

      // Intentar obtener datos de la semilla para el NFT
      let temperatura = 0, humedad = 0, altitudPlanta = 0;
      try {
        const semilla  = await contract.obtenerSemilla(idSemilla);
        temperatura    = Number(semilla.condicionesClimaticas.temperatura);
        humedad        = Number(semilla.condicionesClimaticas.humedadRelativa);
        altitudPlanta  = Number(semilla.condicionesClimaticas.altitud);
      } catch { /* si falla no es crítico */ }

      // ✅ NUEVO: guardar todos los datos para pasarlos al PlantTransferModal
      setUltimaPlanta({
        idPlanta,
        idSemilla,
        especie:     formTipo || "Planta",
        responsable: responsableTraslado,
        latitud:     Math.round(latitud),
        longitud:    Math.round(longitud),
        temperatura,
        humedad,
        altitud:     altitudPlanta,
      });

      setResultado(`✅ Traslado de planta registrado con éxito. Planta #${idPlanta} creada.\nHash: ${tx.hash}`);
      setIsPlantTransferModalOpen(true);

    } catch (error) {
      console.error("Error al registrar el traslado:", error);
      setResultado(`❌ Error al registrar el traslado: ${(error as Error).message}`);
    }
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6 pt-2 md:pt-0">

      {!walletConnected && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p className="font-bold">Atención</p>
          <p>{t.walletNotConnected}</p>
        </div>
      )}

      {/* ── Badge de modo ── */}
      {walletConnected && (
        <div className={`text-center text-xs font-semibold py-1 px-3 rounded-full inline-block ${
          tieneOracle
            ? "bg-blue-100 text-blue-700 border border-blue-300"
            : "bg-gray-100 text-gray-700 border border-gray-300"
        }`}>
          {tieneOracle ? t.modoOracle : t.modoManual}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          FORMULARIO DE REGISTRO DE SEMILLA
      ══════════════════════════════════════════════════════ */}
      <form onSubmit={registrarSemilla} className="space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold">{t.registerSeed}</h3>

        {/* Tipo de semilla */}
        <div className="space-y-2">
          <Label htmlFor="tipo">{t.seedType}</Label>
          <Select name="tipo" onValueChange={handleItemSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.selectSeedType} />
            </SelectTrigger>
            <SelectContent>
              {SEED_TYPES.map((seed) => (
                <SelectItem key={seed} value={seed}>
                  <div className="flex items-center">
                    <img src={`/imagenesSemillas/${seed}.png`} alt={seed} className="w-6 h-6 mr-2" />
                    {t.seedTypes[seed as keyof typeof t.seedTypes] || seed}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SeedSelectionModal
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          selectedItem={selectedItem}
        />

        {/* Responsable */}
        <div className="space-y-2">
          <Label htmlFor="responsable">{t.responsible}</Label>
          <Select name="responsable" required onValueChange={setFormResponsable}>
            <SelectTrigger>
              <SelectValue placeholder={t.selectResponsible} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Juan Pérez">Juan Pérez</SelectItem>
              <SelectItem value="María Rodríguez">María Rodríguez</SelectItem>
              <SelectItem value="Carlos López">Carlos López</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Coordenadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <Label htmlFor="latitud">{t.latitude}</Label>
            <Input
              id="latitud" name="latitud" type="number"
              min="-90000000" max="90000000" step="1" required
              value={formLatitud}
              onChange={(e) => setFormLatitud(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="longitud">{t.longitude}</Label>
            <Input
              id="longitud" name="longitud" type="number"
              min="-180000000" max="180000000" step="1" required
              value={formLongitud}
              onChange={(e) => setFormLongitud(e.target.value)}
            />
          </div>
        </div>

        {/* ══ SEPOLIA: bloque del oráculo ══════════════════════ */}
        {tieneOracle && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <p className="text-blue-700 text-sm">{t.infoOracle}</p>

            <div>
              <Label htmlFor="idSemillaOracle">ID de referencia en el oráculo</Label>
              <Input
                id="idSemillaOracle" name="idSemillaOracle"
                type="number" min="1" defaultValue="1"
                value={formSemillaId}
                onChange={(e) => setFormSemillaId(e.target.value)}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-blue-400 text-blue-700"
              disabled={cargandoOracle}
              onClick={() => consultarOracle(formLatitud, formLongitud, formSemillaId)}
            >
              {cargandoOracle
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.cargandoClima}</>
                : <><CloudSun className="mr-2 h-4 w-4" />{t.obtenerClima}</>
              }
            </Button>

            {datosOracle && (
              <div className="grid grid-cols-2 gap-2 text-sm bg-white rounded p-3 border border-blue-100">
                <span>🌡️ Temperatura:</span>  <span className="font-semibold">{datosOracle.temperatura}°C</span>
                <span>💧 Humedad:</span>       <span className="font-semibold">{datosOracle.humedad}%</span>
                <span>🌧️ Precipitación:</span> <span className="font-semibold">{datosOracle.precipitacion}mm</span>
                <span>☀️ Luz solar:</span>     <span className="font-semibold">{datosOracle.horasLuz}h</span>
              </div>
            )}
          </div>
        )}

        {/* ══ GANACHE: campos manuales ═════════════════════════ */}
        {!tieneOracle && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <Label htmlFor="temperatura">{t.temperature}</Label>
                <Input id="temperatura" name="temperatura" type="number" min="-10" max="15" step="1" required />
              </div>
              <div>
                <Label htmlFor="humedadRelativa">{t.relativeHumidity}</Label>
                <Input id="humedadRelativa" name="humedadRelativa" type="number" min="50" max="100" step="1" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <Label htmlFor="precipitacion">{t.precipitation}</Label>
                <Input id="precipitacion" name="precipitacion" type="number" required />
              </div>
              <div>
                <Label htmlFor="horasLuzSolar">{t.sunlightHours}</Label>
                <Input id="horasLuzSolar" name="horasLuzSolar" type="number" required />
              </div>
            </div>
          </>
        )}

        {/* Altitud y comentarios (siempre visibles) */}
        <div>
          <Label htmlFor="altitud">{t.altitude}</Label>
          <Input id="altitud" name="altitud" type="number" min="2800" max="4200" step="1" required />
        </div>
        <div>
          <Label htmlFor="comentariosDeCuidado">{t.careComments}</Label>
          <Textarea id="comentariosDeCuidado" name="comentariosDeCuidado" required />
        </div>

        <Button
          type="submit"
          className="w-full text-sm md:text-base py-1 md:py-2"
          disabled={tieneOracle && !datosOracle}
        >
          <Send className="mr-2 h-4 w-4" /> {t.registerSeedButton}
        </Button>

        {tieneOracle && !datosOracle && (
          <p className="text-xs text-center text-blue-500">
            ⚠️ Obtén los datos del oráculo antes de registrar la semilla
          </p>
        )}
      </form>

      {/* ══════════════════════════════════════════════════════
          FORMULARIO DE TRASLADO DE PLANTA
      ══════════════════════════════════════════════════════ */}
      <form onSubmit={registrarTrasladoPlanta} className="space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold">{t.registerPlantTransfer}</h3>

        <div>
          <Label htmlFor="idSemilla">{t.seedId}</Label>
          <Input
            id="idSemilla" name="idSemilla"
            value={semillaId}
            onChange={(e) => setSemillaId(e.target.value)}
            type="number" required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <Label htmlFor="latitud">{t.latitude}</Label>
            <Input id="latitud" name="latitud" type="number" required />
          </div>
          <div>
            <Label htmlFor="longitud">{t.longitude}</Label>
            <Input id="longitud" name="longitud" type="number" required />
          </div>
        </div>

        <div>
          <Label htmlFor="responsableTraslado">{t.transferResponsible}</Label>
          {/* ✅ ACTUALIZADO: guardamos el responsable para pasarlo al modal NFT */}
          <Select name="responsableTraslado" required onValueChange={setTrasResponsable}>
            <SelectTrigger>
              <SelectValue placeholder={t.selectTransferResponsible} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Juan Pérez">Juan Pérez</SelectItem>
              <SelectItem value="María Rodríguez">María Rodríguez</SelectItem>
              <SelectItem value="Carlos López">Carlos López</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="comentariosDeCuidado">{t.careComments}</Label>
          <Textarea id="comentariosDeCuidado" name="comentariosDeCuidado" required />
        </div>

        <Button type="submit" className="w-full text-sm md:text-base py-1 md:py-2">
          <Truck className="mr-2 h-4 w-4" /> {t.registerTransferButton}
        </Button>
      </form>

      {/* ✅ ACTUALIZADO: PlantTransferModal ahora recibe TODOS los datos
          para crear el NFT con la foto real de la planta */}
      <PlantTransferModal
        isOpen={isPlantTransferModalOpen}
        onOpenChange={setIsPlantTransferModalOpen}
        seedId={semillaId}
        capturedImage={null}
        idPlanta={ultimaPlanta?.idPlanta      ?? 0}
        idSemilla={ultimaPlanta?.idSemilla    ?? 0}
        especie={ultimaPlanta?.especie         ?? formTipo || "Planta"}
        responsable={ultimaPlanta?.responsable ?? trasResponsable}
        latitud={ultimaPlanta?.latitud         ?? 0}
        longitud={ultimaPlanta?.longitud        ?? 0}
        temperatura={ultimaPlanta?.temperatura  ?? 0}
        humedad={ultimaPlanta?.humedad          ?? 0}
        altitud={ultimaPlanta?.altitud          ?? 3200}
        signer={signer}
        chainId={chainId}
        nftAddress={nftAddress}
      />
    </div>
  );
};

export default Registro;