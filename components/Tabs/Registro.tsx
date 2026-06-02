// components/Tabs/Registro.tsx
// ============================================================
//  Pestaña de Registro — v2.0.0 (Factory Pattern)
//
//  Novedades respecto a v1:
//  ─────────────────────────────────────────────────────────
//  • Botón de adopción apunta a ViveroFactory.adoptarSemilla()
//  • Calcula y envía el precio base de adopción en ETH
//  • Tras confirmación on-chain dispara /api/inject-climate
//    pasando semillaId + coordenadas + dirección del gemelo
//  • Mantiene el modo manual (Ganache / registrarSemilla)
//    100% intacto como fallback
//  • Registrar traslado sigue usando ViveroBogota (sin cambio)
// ============================================================

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Truck, Sprout } from 'lucide-react';
import { ViveroInterface } from '../EcoChainComponent';
import { ethers } from 'ethers';
import SeedSelectionModal from '../SeedSelectionModal';
import PlantTransferModal from '../PlantTransferModal';

const SEED_TYPES = ["Frailejon", "Cardones", "Macolla", "Bambues"];

// ─── ABI mínimo de la Factory para la pestaña de Registro ────────────────
const FACTORY_ABI_MINIMO = [
  "function adoptarSemilla(string especie, string responsable, int256 latitud, int256 longitud, uint256 altitud, string comentariosIniciales) external payable returns (uint256 semillaId, address contratoIndividual)",
  "function precioAdopcion() external view returns (uint256)",
  "function totalSemillasAdoptadas() external view returns (uint256)",
  "function buscarContratoPorId(uint256) external view returns (address)",
  "event SemillaAdoptada(uint256 indexed semillaId, address indexed contratoIndividual, address indexed adoptante, string especie, string responsable, int256 latitud, int256 longitud, uint256 altitud, uint256 montoONG, uint256 montoPlataforma, uint256 timestamp)"
];

interface RegistroProps {
  contract:          ViveroInterface | null;
  oracleContract:    ethers.Contract | null;
  chainId:           number;
  tieneOracle:       boolean;
  signer:            ethers.Signer | null;
  nftAddress:        string;
  setResultado:      React.Dispatch<React.SetStateAction<string>>;
  setGasEstimate:    React.Dispatch<React.SetStateAction<string>>;
  walletConnected:   boolean;
  actualizarTotales: (latitud?: number, longitud?: number) => Promise<void>;
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
  const [isDialogOpen,             setIsDialogOpen]             = useState(false);
  const [selectedItem,             setSelectedItem]             = useState<string | null>(null);
  const [isPlantTransferModalOpen, setIsPlantTransferModalOpen] = useState(false);
  const [semillaId,                setSemillaId]                = useState<string>('');

  // Estado del último gemelo digital creado (para el modal de traslado)
  const [ultimaPlanta, setUltimaPlanta] = useState<{
    idPlanta:              number;
    idSemilla:             number;
    especie:               string;
    responsable:           string;
    latitud:               number;
    longitud:              number;
    temperatura:           number;
    humedad:               number;
    altitud:               number;
    contratoIndividual?:   string; // ← dirección del gemelo recién creado
  } | null>(null);

  const [formLatitud,     setFormLatitud]     = useState('');
  const [formLongitud,    setFormLongitud]    = useState('');
  const [formTipo,        setFormTipo]        = useState('');
  const [formResponsable, setFormResponsable] = useState('');
  const [trasResponsable, setTrasResponsable] = useState('');

  // Precio de adopción leído de la Factory
  const [precioAdopcionWei, setPrecioAdopcionWei] = useState<bigint>(BigInt(0));
  const [precioAdopcionETH, setPrecioAdopcionETH] = useState<string>('');

  const translations = {
    es: {
      registerSeed: "Adoptar Semilla (Factory — Gemelo Digital)",
      registerSeedLegacy: "Registrar Semilla (Modo Automatizado CRE)",
      seedType: "Tipo de Semilla",
      selectSeedType: "Seleccionar Tipo de Semilla",
      responsible: "Responsable",
      selectResponsible: "Responsable de Quien Registra la Semilla",
      latitude: "Latitud (Coordenada)",
      longitude: "Longitud (Coordenada)",
      temperature: "Temperatura (°C)",
      relativeHumidity: "Humedad Relativa (%)",
      precipitation: "Precipitación (mm)",
      sunlightHours: "Horas de Luz Solar",
      altitude: "Altitud (m)",
      careComments: "Comentarios de Cuidado",
      adoptButton: "🌱 Adoptar Semilla (crea Gemelo Digital)",
      registerSeedButton: "Registrar Semilla en Blockchain",
      registerPlantTransfer: "Registrar Traslado de Planta",
      seedId: "ID de la Semilla",
      transferResponsible: "Responsable del Traslado",
      selectTransferResponsible: "Responsable de Quien Realiza el Traslado",
      registerTransferButton: "Registrar Traslado",
      walletNotConnected: "Por favor, conecta tu billetera para poder registrar semillas o trasladar plantas.",
      modoFactory: "🏭 Factory Activa (Gemelos Digitales)",
      modoOracle: "🔗 Automatización Activa (Chainlink CRE)",
      modoManual: "✏️ Modo Manual (Local)",
      infoFactory: "Modo Factory: Cada semilla adoptada despliega su propio contrato inteligente independiente. El 95% del valor va a la ONG y el 5% a la plataforma.",
      infoOracle: "Ecosistema Chainlink CRE: Las condiciones climáticas del Páramo se gestionarán asíncronamente en el contrato receptor mediante la infraestructura de nodos.",
      loadingPrice: "Cargando precio...",
      seedTypes: {
        Frailejon: "Frailejón",
        Cardones: "Cardones",
        Macolla: "Macolla",
        Bambues: "Bambúes"
      },
    },
    en: {
      registerSeed: "Adopt Seed (Factory — Digital Twin)",
      registerSeedLegacy: "Register Seed (CRE Automated Mode)",
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
      adoptButton: "🌱 Adopt Seed (creates Digital Twin)",
      registerSeedButton: "Register Seed on Blockchain",
      registerPlantTransfer: "Register Plant Transfer",
      seedId: "Seed ID",
      transferResponsible: "Transfer Responsible",
      selectTransferResponsible: "Person Performing the Transfer",
      registerTransferButton: "Register Transfer",
      walletNotConnected: "Please connect your wallet to register seeds or transfer plants.",
      modoFactory: "🏭 Factory Active (Digital Twins)",
      modoOracle: "🔗 Automation Active (Chainlink CRE)",
      modoManual: "✏️ Manual Mode",
      infoFactory: "Factory Mode: Each adopted seed deploys its own independent smart contract. 95% goes to the NGO, 5% to the platform.",
      infoOracle: "Chainlink CRE Ecosystem: Climate parameters are handled asynchronously via contract integration with core nodes.",
      loadingPrice: "Loading price...",
      seedTypes: {
        Frailejon: "Frailejón (Espeletia)",
        Cardones: "Cardones (Cacti)",
        Macolla: "Macolla (Bunch Grass)",
        Bambues: "Bambúes (Bamboo)"
      },
    },
    fr: {
      registerSeed: "Adopter la Graine (Factory — Jumeau Numérique)",
      registerSeedLegacy: "Enregistrer la Graine (Mode CRE)",
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
      adoptButton: "🌱 Adopter la Graine (crée un Jumeau Numérique)",
      registerSeedButton: "Enregistrer la Graine",
      registerPlantTransfer: "Enregistrer le Transfert",
      seedId: "ID de la Graine",
      transferResponsible: "Responsable du Transfert",
      selectTransferResponsible: "Responsable du Transfert",
      registerTransferButton: "Enregistrer le Transfert",
      walletNotConnected: "Veuillez connecter votre portefeuille.",
      modoFactory: "🏭 Factory Active (Jumeaux Numériques)",
      modoOracle: "🔗 Mode Automatisé (Chainlink CRE)",
      modoManual: "✏️ Mode Manuel",
      infoFactory: "Mode Factory: Chaque graine adoptée déploie son propre contrat indépendant. 95% va à l'ONG, 5% à la plateforme.",
      infoOracle: "Écosystème Chainlink CRE: Les données climatiques seront transmises de façon asynchrone.",
      loadingPrice: "Chargement du prix...",
      seedTypes: {
        Frailejon: "Frailejón (Espeletia)",
        Cardones: "Cardones (Cactus)",
        Macolla: "Macolla (Herbe en touffe)",
        Bambues: "Bambúes (Bambou)"
      },
    },
    de: {
      registerSeed: "Samen adoptieren (Factory — Digitaler Zwilling)",
      registerSeedLegacy: "Samen registrieren (CRE-Modus)",
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
      adoptButton: "🌱 Samen adoptieren (erstellt Digitalen Zwilling)",
      registerSeedButton: "Samen registrieren",
      registerPlantTransfer: "Pflanzentransfer registrieren",
      seedId: "Samen-ID",
      transferResponsible: "Verantwortlicher für den Transfer",
      selectTransferResponsible: "Verantwortlicher für den Transfer",
      registerTransferButton: "Transfer registrieren",
      walletNotConnected: "Bitte verbinden Sie Ihr Wallet.",
      modoFactory: "🏭 Factory Aktiv (Digitale Zwillinge)",
      modoOracle: "🔗 Automatisierung Aktiv (Chainlink CRE)",
      modoManual: "✏️ Manueller Modus",
      infoFactory: "Factory-Modus: Jeder adoptierte Samen erstellt einen eigenen unabhängigen Smart Contract. 95% geht an die NGO, 5% an die Plattform.",
      infoOracle: "Chainlink CRE-Ökosystem: Klimadaten werden asynchron übertragen.",
      loadingPrice: "Preis wird geladen...",
      seedTypes: {
        Frailejon: "Frailejón (Espeletia)",
        Cardones: "Cardones (Kakteen)",
        Macolla: "Macolla (Büschelgras)",
        Bambues: "Bambúes (Bambus)"
      },
    },
  };

  const t = translations[language];

  // ─── Determinar si estamos en modo Factory (Sepolia con Factory configurada) ──
  const tieneFactory = tieneOracle &&
    Boolean(process.env.NEXT_PUBLIC_FACTORY_ADDRESS_SEPOLIA);

  // ─── Obtener precio de adopción de la Factory ──────────────────────────
  const cargarPrecioAdopcion = async () => {
    if (!signer || !tieneFactory) return;
    try {
      const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS_SEPOLIA!;
      const factory = new ethers.Contract(factoryAddress, FACTORY_ABI_MINIMO, signer);
      const precio  = await factory.precioAdopcion();
      setPrecioAdopcionWei(precio);
      setPrecioAdopcionETH(ethers.formatEther(precio));
    } catch (e) {
      console.warn("No se pudo cargar precio de adopción:", e);
    }
  };

  const handleItemSelect = (value: string) => {
    setSelectedItem(value);
    setFormTipo(value);
    setIsDialogOpen(true);
    // Cargar el precio cuando el usuario selecciona una especie
    cargarPrecioAdopcion();
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  MODO FACTORY: adoptarSemilla() → ViveroFactory
  //  Despliega un SemillaIndividual y hace split 95/5 inmediato
  // ─────────────────────────────────────────────────────────────────────────
  const adoptarSemillaFactory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signer || !walletConnected) return;

    const formData             = new FormData(event.currentTarget);
    const tipo                 = formData.get('tipo') as string || formTipo;
    const responsable          = formData.get('responsable') as string || formResponsable;
    const comentariosDeCuidado = formData.get('comentariosDeCuidado') as string;
    const altitud              = parseFloat(formData.get('altitud') as string);
    const latitudExacta        = parseFloat(formLatitud);
    const longitudExacta       = parseFloat(formLongitud);

    if (!tipo || !responsable) {
      setResultado("❌ Completa el tipo de semilla y el responsable.");
      return;
    }

    try {
      setResultado("⏳ Conectando con la Factory... obteniendo precio de adopción...");

      const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS_SEPOLIA!;
      const factory = new ethers.Contract(factoryAddress, FACTORY_ABI_MINIMO, signer);

      // Leer precio actualizado
      const precio = await factory.precioAdopcion();
      setPrecioAdopcionWei(precio);
      setPrecioAdopcionETH(ethers.formatEther(precio));

      setResultado(`⏳ Adoptando semilla de ${tipo}...\n💰 Precio: ${ethers.formatEther(precio)} ETH (95% → ONG | 5% → Plataforma)`);

      // Llamar a adoptarSemilla con el valor exacto
      const latitudSolidity  = BigInt(Math.round(latitudExacta  * 1_000_000));
      const longitudSolidity = BigInt(Math.round(longitudExacta * 1_000_000));
      const altitudSolidity  = BigInt(Math.round(altitud));

      const tx = await factory.adoptarSemilla(
        tipo,
        responsable,
        latitudSolidity,
        longitudSolidity,
        altitudSolidity,
        comentariosDeCuidado,
        { value: precio }
      );

      setResultado(prev => prev + `\n⏳ Transacción enviada: ${tx.hash}\nEsperando confirmación en Sepolia...`);
      const receipt = await tx.wait();

      // Parsear el evento SemillaAdoptada para obtener el ID y dirección del gemelo
      let semillaIdCreada: number   = 0;
      let gemeloDireccion: string   = "";

      try {
        const iface = new ethers.Interface(FACTORY_ABI_MINIMO);
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === "SemillaAdoptada") {
              semillaIdCreada = Number(parsed.args.semillaId);
              gemeloDireccion = parsed.args.contratoIndividual;
              break;
            }
          } catch { /* log de otro contrato, ignorar */ }
        }
      } catch (e) {
        console.warn("No se pudo parsear evento SemillaAdoptada:", e);
      }

      setResultado(
        `✅ ¡Semilla adoptada con éxito!\n` +
        `🌱 Semilla ID: #${semillaIdCreada}\n` +
        `🔗 Gemelo Digital: ${gemeloDireccion}\n` +
        `📦 Tx: ${receipt.hash}\n` +
        `\n⏳ Activando oráculo climático en segundo plano...`
      );

      // ── Disparar inyección de clima de forma asíncrona ─────────────────
      if (semillaIdCreada > 0) {
        fetch('/api/inject-climate', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            semillaId:          semillaIdCreada,
            lat:                latitudExacta,
            lon:                longitudExacta,
            contratoIndividual: gemeloDireccion,
            modo:               "factory"
          })
        })
          .then(r => r.json())
          .then(data => {
            if (data.success) {
              setResultado(prev =>
                prev + `\n\n🌡️ ¡Clima inyectado en el Gemelo Digital!\n` +
                `Temp: ${Number(data.info.temp).toFixed(1)}°C | Humedad: ${data.info.hum}% | Ciudad: ${data.info.ciudad}`
              );
            } else {
              setResultado(prev => prev + `\n\n⚠️ Oráculo automático: ${data.error}`);
            }
          })
          .catch(err => {
            setResultado(prev => prev + `\n\n⚠️ Error de red al conectar con el oráculo: ${err.message}`);
          });
      }

      await actualizarTotales(latitudExacta, longitudExacta);

    } catch (error) {
      console.error("Error al adoptar la semilla:", error);
      setResultado(`❌ Error al adoptar la semilla: ${(error as Error).message}`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  MODO LEGACY: registrarSemilla() → ViveroBogota (sin cambios)
  //  Se mantiene idéntico al original para compatibilidad con Ganache
  // ─────────────────────────────────────────────────────────────────────────
  const registrarSemillaLegacy = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contract || !walletConnected) return;

    const formData             = new FormData(event.currentTarget);
    const tipo                 = formData.get('tipo') as string || formTipo;
    const responsable          = formData.get('responsable') as string || formResponsable;
    const altitud              = parseFloat(formData.get('altitud') as string);
    const comentariosDeCuidado = formData.get('comentariosDeCuidado') as string;
    const latitudExacta        = parseFloat(formLatitud);
    const longitudExacta       = parseFloat(formLongitud);

    try {
      setResultado("⏳ Transmitiendo registro a la red Sepolia...");

      if (tieneOracle) {
        const tx = await contract.registrarSemilla(
          tipo,
          {
            latitud:  Math.round(latitudExacta  * 1_000_000),
            longitud: Math.round(longitudExacta * 1_000_000)
          },
          responsable,
          10, 80, 5, 8,
          Math.round(altitud),
          comentariosDeCuidado
        );
        await tx.wait();
        setResultado(
          `✅ Semilla registrada con éxito en Sepolia.\n` +
          `El flujo asíncrono CRE recopilará las métricas climáticas del Páramo.\n` +
          `Hash: ${tx.hash}`
        );
      } else {
        const temperatura     = parseFloat(formData.get('temperatura') as string);
        const humedadRelativa = parseFloat(formData.get('humedadRelativa') as string);
        const precipitacion   = parseFloat(formData.get('precipitacion') as string);
        const horasLuzSolar   = parseFloat(formData.get('horasLuzSolar') as string);

        const gasEst = await contract.registrarSemilla.estimateGas(
          tipo,
          { latitud: Math.round(latitudExacta), longitud: Math.round(longitudExacta) },
          responsable, temperatura, humedadRelativa, precipitacion, horasLuzSolar,
          Math.round(altitud), comentariosDeCuidado
        );
        setGasEstimate(gasEst.toString());

        const tx = await contract.registrarSemilla(
          tipo,
          { latitud: Math.round(latitudExacta), longitud: Math.round(longitudExacta) },
          responsable, temperatura, humedadRelativa, precipitacion, horasLuzSolar,
          Math.round(altitud), comentariosDeCuidado
        );
        await tx.wait();
        setResultado(`✅ Semilla local registrada con éxito.\nHash: ${tx.hash}`);
      }

      await actualizarTotales(latitudExacta, longitudExacta);
    } catch (error) {
      console.error("Error al registrar la semilla:", error);
      setResultado(`❌ Error al registrar la semilla: ${(error as Error).message}`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  REGISTRAR TRASLADO — Sin cambios respecto a v1
  // ─────────────────────────────────────────────────────────────────────────
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

      const totalPlantas = await contract.totalPlantasRegistradas();
      const idPlanta     = Number(totalPlantas);

      let temperatura = 0, humedad = 0, altitudPlanta = 0;
      try {
        const semilla = await contract.obtenerSemilla(idSemilla);
        temperatura   = Number(semilla.condicionesClimaticas.temperatura);
        humedad       = Number(semilla.condicionesClimaticas.humedadRelativa);
        altitudPlanta = Number(semilla.condicionesClimaticas.altitud);
      } catch { /* Opcional */ }

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

  // ─── Determinar qué formulario de semilla mostrar ──────────────────────
  const handleSubmitSemilla = tieneFactory
    ? adoptarSemillaFactory
    : registrarSemillaLegacy;

  return (
    <div className="space-y-4 md:space-y-6 pt-2 md:pt-0">

      {!walletConnected && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p className="font-bold">Atención</p>
          <p>{t.walletNotConnected}</p>
        </div>
      )}

      {walletConnected && (
        <div className={`text-center text-xs font-semibold py-1 px-3 rounded-full inline-block ${
          tieneFactory
            ? "bg-purple-100 text-purple-700 border border-purple-300"
            : tieneOracle
              ? "bg-blue-100 text-blue-700 border border-blue-300"
              : "bg-gray-100 text-gray-700 border border-gray-300"
        }`}>
          {tieneFactory ? t.modoFactory : tieneOracle ? t.modoOracle : t.modoManual}
        </div>
      )}

      {/* ── FORMULARIO PRINCIPAL DE SEMILLA ──────────────────────────────── */}
      <form onSubmit={handleSubmitSemilla} className="space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold">
          {tieneFactory ? t.registerSeed : t.registerSeedLegacy}
        </h3>

        {/* Precio de adopción visible si modo Factory */}
        {tieneFactory && precioAdopcionETH && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-purple-700 text-sm font-medium">💰 Precio de adopción:</span>
            <span className="text-purple-900 font-bold">{precioAdopcionETH} ETH</span>
          </div>
        )}

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <Label htmlFor="latitud">{t.latitude}</Label>
            <Input
              id="latitud" name="latitud" type="number"
              required value={formLatitud}
              onChange={(e) => setFormLatitud(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="longitud">{t.longitude}</Label>
            <Input
              id="longitud" name="longitud" type="number" step="any"
              required value={formLongitud}
              placeholder="Ej: -74.0721"
              onChange={(e) => setFormLongitud(e.target.value)}
            />
            {formLongitud && parseFloat(formLongitud) > 0 && parseFloat(formLongitud) < 180 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ La longitud en Colombia es negativa. ¿Quisiste escribir -{formLongitud}?
              </p>
            )}
          </div>
        </div>

        {/* Info boxes contextuales */}
        {tieneFactory && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-purple-700 text-sm font-medium">{t.infoFactory}</p>
          </div>
        )}
        {!tieneFactory && tieneOracle && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 text-sm font-medium">{t.infoOracle}</p>
          </div>
        )}

        {/* Campos manuales solo en modo Ganache/local */}
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

        <div>
          <Label htmlFor="altitud">{t.altitude}</Label>
          <Input id="altitud" name="altitud" type="number" min="2800" max="4200" step="1" required />
        </div>
        <div>
          <Label htmlFor="comentariosDeCuidado">{t.careComments}</Label>
          <Textarea id="comentariosDeCuidado" name="comentariosDeCuidado" required />
        </div>

        <Button type="submit" className={`w-full text-sm md:text-base py-1 md:py-2 ${
          tieneFactory ? "bg-purple-600 hover:bg-purple-700 text-white" : ""
        }`}>
          {tieneFactory
            ? <><Sprout className="mr-2 h-4 w-4" /> {t.adoptButton}</>
            : <><Send    className="mr-2 h-4 w-4" /> {t.registerSeedButton}</>
          }
        </Button>
      </form>

      {/* ── FORMULARIO DE TRASLADO (sin cambios) ─────────────────────────── */}
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

      <PlantTransferModal
        isOpen={isPlantTransferModalOpen}
        onOpenChange={setIsPlantTransferModalOpen}
        seedId={semillaId}
        capturedImage={null}
        idPlanta={ultimaPlanta?.idPlanta      ?? 0}
        idSemilla={ultimaPlanta?.idSemilla    ?? 0}
        especie={ultimaPlanta?.especie        ?? formTipo ?? "Planta"}
        responsable={ultimaPlanta?.responsable ?? trasResponsable}
        latitud={ultimaPlanta?.latitud         ?? 0}
        longitud={ultimaPlanta?.longitud        ?? 0}
        temperatura={ultimaPlanta?.temperatura  ?? 0}
        humedad={ultimaPlanta?.humedad          ?? 0}
        altitud={ultimaPlanta?.altitud          ?? 3200}
        signer={signer}
        chainId={chainId}
        nftAddress={nftAddress}
        // Dirección del gemelo digital (nueva prop para PlantTransferModal v2)
        contratoIndividual={ultimaPlanta?.contratoIndividual ?? ""}
      />
    </div>
  );
};

export default Registro;