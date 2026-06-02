// components/Tabs/Consulta.tsx
// ============================================================
//  Pestaña de Consulta — v2.0.0 (Factory Pattern)
//
//  Novedades respecto a v1:
//  ─────────────────────────────────────────────────────────
//  • Motor de búsqueda dinámico por ID:
//      1. Consulta la Factory para obtener la dirección del gemelo
//      2. Instancia ethers.Contract apuntando al SemillaIndividual
//      3. Extrae historial climático, fases y Cuadro de Honor en vivo
//  • Formatos corregidos:
//      - Coordenadas ÷ 1,000,000 antes de mostrar
//      - Temperatura ÷ 10 antes de mostrar
//  • Botón "Apoyar esta semilla" → donarParaMantenimiento()
//  • Preserva 100% la consulta legacy de ViveroBogota para Ganache
// ============================================================

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search, History, List, Filter,
  CloudRain, Sun, Thermometer, Droplets, Clock,
  Heart, Trophy, MapPin, Sprout, Leaf
} from 'lucide-react';
import { ViveroInterface } from '../EcoChainComponent';
import { ethers } from 'ethers';

// ─── ABI mínimo de la Factory ─────────────────────────────────────────────
const FACTORY_ABI = [
  "function buscarContratoPorId(uint256) external view returns (address)",
  "function totalSemillasAdoptadas() external view returns (uint256)"
];

// ─── ABI del SemillaIndividual para lecturas ──────────────────────────────
const SEMILLA_INDIVIDUAL_ABI = [
  "function obtenerResumen() external view returns (uint256,string,string,int256,int256,uint256,uint256,uint256,uint256,uint256)",
  "function obtenerHistorialClimatico() external view returns (tuple(int256 temperatura, uint256 humedadRelativa, uint256 precipitacion, uint256 horasLuzSolar, uint256 timestamp)[])",
  "function obtenerHistorialTraslados() external view returns (tuple(int256 latitud, int256 longitud, uint256 altitud, string responsable, string comentarios, uint256 timestamp)[])",
  "function obtenerFasesCrecimiento() external view returns (tuple(string estado, string observaciones, uint256 timestamp)[])",
  "function obtenerUltimoClima() external view returns (tuple(int256 temperatura, uint256 humedadRelativa, uint256 precipitacion, uint256 horasLuzSolar, uint256 timestamp))",
  "function obtenerLeaderboard() external view returns (address[] billeteras, uint256[] montos, uint256[] numeroDonaciones)",
  "function donarParaMantenimiento() external payable",
  "function totalDonacionesRecibidas() external view returns (uint256)",
  "function climaEsReciente() external view returns (bool)"
];

interface ConsultaProps {
  contract:     ViveroInterface | null;
  setResultado: React.Dispatch<React.SetStateAction<string>>;
  language:     'es' | 'en' | 'fr' | 'de';
  // Signer necesario para el botón de donación
  signer?:      ethers.Signer | null;
  chainId?:     number;
}

// Tipo para un donante en el leaderboard
interface Donante {
  billetera: string;
  monto:     string; // en ETH formateado
  posicion:  number;
}

// Tipo para el resumen del gemelo
interface ResumenGemelo {
  id:             number;
  especie:        string;
  responsable:    string;
  latitud:        string;  // ya dividido × 1M
  longitud:       string;  // ya dividido × 1M
  altitud:        number;
  totalReportes:  number;
  totalTraslados: number;
  totalDonaciones: string; // en ETH
  fechaAdopcion:  string;
  contratoDir:    string;
}

const Consulta: React.FC<ConsultaProps> = ({
  contract,
  setResultado,
  language,
  signer,
  chainId = 11155111
}) => {
  const [semillaId,         setSemillaId]         = useState('');
  const [plantaId,          setPlantaId]           = useState('');
  const [responsableFilter, setResponsableFilter]  = useState('');
  const [semillasFiltradas, setSemillasFiltradas]  = useState<number[]>([]);

  // Estado para la telemetría legacy (ViveroBogota)
  const [telemetria, setTelemetria] = useState<any>(null);

  // Estado para el Gemelo Digital (SemillaIndividual)
  const [resumenGemelo,     setResumenGemelo]     = useState<ResumenGemelo | null>(null);
  const [historialClima,    setHistorialClima]     = useState<any[]>([]);
  const [historialTraslados, setHistorialTraslados] = useState<any[]>([]);
  const [fasesCrecimiento,  setFasesCrecimiento]  = useState<any[]>([]);
  const [leaderboard,       setLeaderboard]        = useState<Donante[]>([]);
  const [ultimoClima,       setUltimoClima]        = useState<any>(null);
  const [cargandoGemelo,    setCargandoGemelo]     = useState(false);
  const [gemeloDireccion,   setGemeloDireccion]    = useState<string>('');

  // Estado donación
  const [montoDonacion,     setMontoDonacion]     = useState('0.001');
  const [donando,           setDonando]            = useState(false);
  const [msgDonacion,       setMsgDonacion]        = useState('');

  const translations = {
    es: {
      gemeloBuscar: "Buscar Gemelo Digital por ID",
      gemeloBtn: "🔍 Buscar en Factory",
      gemeloTitulo: "Gemelo Digital — Semilla #",
      gemeloEspecie: "Especie",
      gemeloResponsable: "Responsable",
      gemeloUbicacion: "Ubicación inicial",
      gemeloAltitud: "Altitud",
      gemeloAdopcion: "Fecha de adopción",
      gemeloReportes: "Reportes climáticos",
      gemeloTraslados: "Traslados registrados",
      gemelo0Donaciones: "Total donado a esta semilla",
      climaTitle: "Último Clima Inyectado (Oráculo)",
      histClimaTitle: "Historial Climático Completo",
      histTrasladosTitle: "Historial de Traslados",
      fasesTitle: "Fases de Crecimiento",
      leaderTitle: "🏆 Cuadro de Honor — Padrinos Oficiales",
      donarTitle: "💚 Apoyar el mantenimiento de esta semilla",
      donarMonto: "Monto a donar (ETH)",
      donarBtn: "Donar a esta semilla",
      donarInfo: "97% va directo a la ONG · 3% tasa de plataforma",
      contratoDir: "Contrato individual",
      noGemelo: "Esta semilla no existe en la Factory o aún no fue adoptada.",
      // Legacy
      seedQuery: "Consultar Semilla (Legacy - ViveroBogota)",
      seedId: "ID de la Semilla",
      queryButton: "Consultar Semilla",
      growthHistory: "Consultar Historial de Crecimiento",
      plantId: "ID de la Planta",
      historyButton: "Consultar Historial",
      allSeeds: "Obtener Todas las Semillas",
      allSeedsButton: "Obtener Todas las Semillas",
      searchByResponsible: "Buscar Semillas por Responsable",
      responsible: "Responsable",
      searchButton: "Buscar Semillas",
      errorGettingSeed: "Error al obtener la semilla:",
      errorGettingHistory: "Error al obtener el historial de crecimiento:",
      errorGettingAllSeeds: "Error al obtener todas las semillas:",
      errorSearchingSeeds: "Error al buscar semillas por responsable:",
      seedsFound: "Semillas encontradas:",
      oracleTitle: "Telemetría Satelital Real (Oráculo CRE)",
      temp: "Temp", humidity: "Humedad", rain: "Lluvia", solar: "Luz Solar", sync: "Sincronizado"
    },
    en: {
      gemeloBuscar: "Search Digital Twin by ID",
      gemeloBtn: "🔍 Search in Factory",
      gemeloTitulo: "Digital Twin — Seed #",
      gemeloEspecie: "Species",
      gemeloResponsable: "Responsible",
      gemeloUbicacion: "Initial Location",
      gemeloAltitud: "Altitude",
      gemeloAdopcion: "Adoption date",
      gemeloReportes: "Climate reports",
      gemeloTraslados: "Registered transfers",
      gemelo0Donaciones: "Total donated to this seed",
      climaTitle: "Latest Climate Report (Oracle)",
      histClimaTitle: "Full Climate History",
      histTrasladosTitle: "Transfer History",
      fasesTitle: "Growth Phases",
      leaderTitle: "🏆 Honor Board — Official Sponsors",
      donarTitle: "💚 Support maintenance of this seed",
      donarMonto: "Amount to donate (ETH)",
      donarBtn: "Donate to this seed",
      donarInfo: "97% goes directly to the NGO · 3% platform fee",
      contratoDir: "Individual contract",
      noGemelo: "This seed does not exist in the Factory or has not been adopted yet.",
      seedQuery: "Query Seed (Legacy - ViveroBogota)",
      seedId: "Seed ID",
      queryButton: "Query Seed",
      growthHistory: "Query Growth History",
      plantId: "Plant ID",
      historyButton: "Query History",
      allSeeds: "Get All Seeds",
      allSeedsButton: "Get All Seeds",
      searchByResponsible: "Search Seeds by Responsible",
      responsible: "Responsible",
      searchButton: "Search Seeds",
      errorGettingSeed: "Error getting the seed:",
      errorGettingHistory: "Error getting growth history:",
      errorGettingAllSeeds: "Error getting all seeds:",
      errorSearchingSeeds: "Error searching seeds by responsible:",
      seedsFound: "Seeds found:",
      oracleTitle: "Real Satellite Telemetry (CRE Oracle)",
      temp: "Temp", humidity: "Humidity", rain: "Rain", solar: "Sunlight", sync: "Synchronized"
    },
    fr: {
      gemeloBuscar: "Rechercher le Jumeau Numérique par ID",
      gemeloBtn: "🔍 Rechercher dans la Factory",
      gemeloTitulo: "Jumeau Numérique — Graine #",
      gemeloEspecie: "Espèce",
      gemeloResponsable: "Responsable",
      gemeloUbicacion: "Localisation initiale",
      gemeloAltitud: "Altitude",
      gemeloAdopcion: "Date d'adoption",
      gemeloReportes: "Rapports climatiques",
      gemeloTraslados: "Transferts enregistrés",
      gemelo0Donaciones: "Total donné à cette graine",
      climaTitle: "Dernier Rapport Climatique (Oracle)",
      histClimaTitle: "Historique Climatique Complet",
      histTrasladosTitle: "Historique des Transferts",
      fasesTitle: "Phases de Croissance",
      leaderTitle: "🏆 Tableau d'Honneur — Parrains Officiels",
      donarTitle: "💚 Soutenir la maintenance de cette graine",
      donarMonto: "Montant à donner (ETH)",
      donarBtn: "Donner à cette graine",
      donarInfo: "97% va directement à l'ONG · 3% frais de plateforme",
      contratoDir: "Contrat individuel",
      noGemelo: "Cette graine n'existe pas dans la Factory ou n'a pas encore été adoptée.",
      seedQuery: "Consulter une Graine (Legacy)",
      seedId: "ID de la Graine",
      queryButton: "Consulter la Graine",
      growthHistory: "Consulter l'Historique de Croissance",
      plantId: "ID de la Plante",
      historyButton: "Consulter l'Historique",
      allSeeds: "Obtenir Toutes les Graines",
      allSeedsButton: "Obtenir Toutes les Graines",
      searchByResponsible: "Rechercher des Graines par Responsable",
      responsible: "Responsable",
      searchButton: "Rechercher des Graines",
      errorGettingSeed: "Erreur lors de l'obtention de la graine :",
      errorGettingHistory: "Erreur lors de l'obtention de l'historique :",
      errorGettingAllSeeds: "Erreur lors de l'obtention de toutes les graines :",
      errorSearchingSeeds: "Erreur lors de la recherche de graines :",
      seedsFound: "Graines trouvées :",
      oracleTitle: "Télémétrie Satellitaire Réelle (Oracle CRE)",
      temp: "Temp", humidity: "Humidité", rain: "Pluie", solar: "Lumière", sync: "Synchronisé"
    },
    de: {
      gemeloBuscar: "Digitalen Zwilling nach ID suchen",
      gemeloBtn: "🔍 In Factory suchen",
      gemeloTitulo: "Digitaler Zwilling — Samen #",
      gemeloEspecie: "Art",
      gemeloResponsable: "Verantwortlicher",
      gemeloUbicacion: "Anfangsstandort",
      gemeloAltitud: "Höhe",
      gemeloAdopcion: "Adoptionsdatum",
      gemeloReportes: "Klimaberichte",
      gemeloTraslados: "Registrierte Transfers",
      gemelo0Donaciones: "Gesamt gespendet für diesen Samen",
      climaTitle: "Letzter Klimabericht (Orakel)",
      histClimaTitle: "Vollständige Klimahistorie",
      histTrasladosTitle: "Transfer-Historie",
      fasesTitle: "Wachstumsphasen",
      leaderTitle: "🏆 Ehrentafel — Offizielle Paten",
      donarTitle: "💚 Wartung dieses Samens unterstützen",
      donarMonto: "Spendenbetrag (ETH)",
      donarBtn: "Für diesen Samen spenden",
      donarInfo: "97% gehen direkt an die NGO · 3% Plattformgebühr",
      contratoDir: "Einzelvertrag",
      noGemelo: "Dieser Samen existiert nicht in der Factory oder wurde noch nicht adoptiert.",
      seedQuery: "Samen abfragen (Legacy)",
      seedId: "Samen-ID",
      queryButton: "Samen abfragen",
      growthHistory: "Wachstumsverlauf abfragen",
      plantId: "Pflanzen-ID",
      historyButton: "Verlauf abfragen",
      allSeeds: "Alle Samen abrufen",
      allSeedsButton: "Alle Samen abrufen",
      searchByResponsible: "Samen nach Verantwortlichem suchen",
      responsible: "Verantwortlicher",
      searchButton: "Samen suchen",
      errorGettingSeed: "Fehler beim Abrufen des Samens:",
      errorGettingHistory: "Fehler beim Abrufen des Verlaufs:",
      errorGettingAllSeeds: "Fehler beim Abrufen aller Samen:",
      errorSearchingSeeds: "Fehler bei der Suche nach Samen:",
      seedsFound: "Gefundene Samen:",
      oracleTitle: "Echte Satellitentelemetrie (CRE Orakel)",
      temp: "Temp", humidity: "Feuchtigkeit", rain: "Regen", solar: "Sonnenlicht", sync: "Synchronisiert"
    }
  };

  const t = translations[language];

  const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS_SEPOLIA;
  const tieneFactory   = Boolean(factoryAddress);

  const formatTimestamp = (ts: number) => new Date(ts * 1000).toLocaleString();

  const bigIntToString = (obj: any): any => {
    if (typeof obj === 'bigint')            return obj.toString();
    if (Array.isArray(obj))                return obj.map(bigIntToString);
    if (typeof obj === 'object' && obj !== null)
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, bigIntToString(v)]));
    return obj;
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  BUSCAR GEMELO DIGITAL (Factory v2)
  // ─────────────────────────────────────────────────────────────────────────
  const buscarGemeloDigital = async () => {
    if (!semillaId || !signer) return;

    setCargandoGemelo(true);
    setResumenGemelo(null);
    setLeaderboard([]);
    setHistorialClima([]);
    setHistorialTraslados([]);
    setFasesCrecimiento([]);
    setUltimoClima(null);
    setMsgDonacion('');
    setTelemetria(null);

    try {
      // 1. Obtener dirección del gemelo desde la Factory
      const factory = new ethers.Contract(factoryAddress!, FACTORY_ABI, signer);
      const dir     = await factory.buscarContratoPorId(parseInt(semillaId));

      if (!dir || dir === ethers.ZeroAddress) {
        setResultado(`❌ ${t.noGemelo}`);
        setCargandoGemelo(false);
        return;
      }

      setGemeloDireccion(dir);

      // 2. Instanciar el SemillaIndividual dinámicamente
      const gemelo = new ethers.Contract(dir, SEMILLA_INDIVIDUAL_ABI, signer);

      // 3. Leer resumen, clima, traslados, fases y leaderboard en paralelo
      const [resumenRaw, climaRaw, trasladosRaw, fasesRaw, leaderRaw, ultimoClimaRaw] =
        await Promise.all([
          gemelo.obtenerResumen(),
          gemelo.obtenerHistorialClimatico(),
          gemelo.obtenerHistorialTraslados(),
          gemelo.obtenerFasesCrecimiento(),
          gemelo.obtenerLeaderboard(),
          gemelo.obtenerUltimoClima()
        ]);

      // 4. Formatear resumen (coordenadas ÷ 1M, temperatura ÷ 10)
      const resumen: ResumenGemelo = {
        id:              Number(resumenRaw[0]),
        especie:         resumenRaw[1],
        responsable:     resumenRaw[2],
        latitud:         (Number(resumenRaw[3]) / 1_000_000).toFixed(6),
        longitud:        (Number(resumenRaw[4]) / 1_000_000).toFixed(6),
        altitud:         Number(resumenRaw[5]),
        totalReportes:   Number(resumenRaw[6]),
        totalTraslados:  Number(resumenRaw[7]),
        totalDonaciones: ethers.formatEther(resumenRaw[8]),
        fechaAdopcion:   formatTimestamp(Number(resumenRaw[9])),
        contratoDir:     dir
      };
      setResumenGemelo(resumen);

      // 5. Formatear historial climático (temp ÷ 10, precip ÷ 10)
      const climaFormateado = climaRaw.map((r: any) => ({
        temperatura:     (Number(r.temperatura) / 10).toFixed(1),
        humedadRelativa: Number(r.humedadRelativa),
        precipitacion:   (Number(r.precipitacion) / 10).toFixed(1),
        horasLuzSolar:   Number(r.horasLuzSolar),
        fecha:           formatTimestamp(Number(r.timestamp))
      }));
      setHistorialClima(climaFormateado);

      // 6. Formatear último clima
      if (Number(ultimoClimaRaw.timestamp) > 0) {
        setUltimoClima({
          temperatura:     (Number(ultimoClimaRaw.temperatura) / 10).toFixed(1),
          humedadRelativa: Number(ultimoClimaRaw.humedadRelativa),
          precipitacion:   (Number(ultimoClimaRaw.precipitacion) / 10).toFixed(1),
          horasLuzSolar:   Number(ultimoClimaRaw.horasLuzSolar),
          fecha:           formatTimestamp(Number(ultimoClimaRaw.timestamp))
        });
      }

      // 7. Formatear traslados (coordenadas ÷ 1M)
      const trasladosFormateados = trasladosRaw.map((tr: any) => ({
        latitud:     (Number(tr.latitud)  / 1_000_000).toFixed(6),
        longitud:    (Number(tr.longitud) / 1_000_000).toFixed(6),
        altitud:     Number(tr.altitud),
        responsable: tr.responsable,
        comentarios: tr.comentarios,
        fecha:       formatTimestamp(Number(tr.timestamp))
      }));
      setHistorialTraslados(trasladosFormateados);

      // 8. Fases de crecimiento
      const fasesFormateadas = fasesRaw.map((f: any) => ({
        estado:        f.estado,
        observaciones: f.observaciones,
        fecha:         formatTimestamp(Number(f.timestamp))
      }));
      setFasesCrecimiento(fasesFormateadas);

      // 9. Leaderboard — ordenar por monto descendente
      const { billeteras, montos } = leaderRaw;
      const donantesArr: Donante[] = billeteras
        .map((b: string, i: number) => ({
          billetera: b,
          monto:     ethers.formatEther(montos[i]),
          posicion:  i + 1
        }))
        .sort((a: Donante, b: Donante) => parseFloat(b.monto) - parseFloat(a.monto))
        .map((d: Donante, i: number) => ({ ...d, posicion: i + 1 }));
      setLeaderboard(donantesArr);

      setResultado(`✅ Gemelo Digital #${resumen.id} cargado. Contrato: ${dir}`);

    } catch (error) {
      console.error("Error al buscar gemelo digital:", error);
      setResultado(`❌ Error al consultar el gemelo digital: ${(error as Error).message}`);
    } finally {
      setCargandoGemelo(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  DONACIÓN A LA SEMILLA
  // ─────────────────────────────────────────────────────────────────────────
  const donarParaMantenimiento = async () => {
    if (!signer || !gemeloDireccion) return;
    setDonando(true);
    setMsgDonacion('');

    try {
      const gemelo = new ethers.Contract(gemeloDireccion, SEMILLA_INDIVIDUAL_ABI, signer);
      const monto  = ethers.parseEther(montoDonacion || "0.001");

      setMsgDonacion("⏳ Enviando donación...");
      const tx = await gemelo.donarParaMantenimiento({ value: monto });
      await tx.wait();

      setMsgDonacion(`✅ ¡Gracias por tu apoyo! ${montoDonacion} ETH donados.\n97% → ONG | 3% → Plataforma`);

      // Refrescar leaderboard
      const [leaderRaw, resumenRaw] = await Promise.all([
        gemelo.obtenerLeaderboard(),
        gemelo.obtenerResumen()
      ]);

      const { billeteras, montos } = leaderRaw;
      const donantesArr: Donante[] = billeteras
        .map((b: string, i: number) => ({
          billetera: b,
          monto:     ethers.formatEther(montos[i]),
          posicion:  i + 1
        }))
        .sort((a: Donante, b: Donante) => parseFloat(b.monto) - parseFloat(a.monto))
        .map((d: Donante, i: number) => ({ ...d, posicion: i + 1 }));
      setLeaderboard(donantesArr);

      if (resumenGemelo) {
        setResumenGemelo({
          ...resumenGemelo,
          totalDonaciones: ethers.formatEther(resumenRaw[8])
        });
      }

    } catch (error) {
      console.error("Error al donar:", error);
      setMsgDonacion(`❌ Error: ${(error as Error).message}`);
    } finally {
      setDonando(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  CONSULTAS LEGACY (ViveroBogota) — intactas respecto a v1
  // ─────────────────────────────────────────────────────────────────────────
  const obtenerSemillaLegacy = async () => {
    if (!contract || !semillaId) return;
    setTelemetria(null);
    setResumenGemelo(null);

    try {
      const semillaIdParsed = parseInt(semillaId);
      const semilla = await contract.obtenerSemilla(semillaIdParsed);
      const { id, tipo, ubicacionInicial, responsable, condicionesClimaticas, comentariosDeCuidado, fechaRegistro } = semilla;

      const lat = (Number(ubicacionInicial.latitud)  / 1_000_000).toFixed(6);
      const lon = (Number(ubicacionInicial.longitud) / 1_000_000).toFixed(6);

      setResultado(
        `ID: ${id}\nTipo: ${tipo}\nUbicación: (${lat}, ${lon})\n` +
        `Responsable: ${responsable}\n` +
        `Temp: ${(Number(condicionesClimaticas.temperatura) / 10).toFixed(1)}°C | ` +
        `Humedad: ${condicionesClimaticas.humedadRelativa}% | ` +
        `Precipitación: ${condicionesClimaticas.precipitacion}mm | ` +
        `Luz: ${condicionesClimaticas.horasLuzSolar}h | ` +
        `Altitud: ${condicionesClimaticas.altitud}m\n` +
        `Comentarios: ${comentariosDeCuidado}\n` +
        `Registrado: ${formatTimestamp(Number(fechaRegistro.timestamp))}`
      );

      if ((contract as any).obtenerClimaRealSemilla) {
        try {
          const climaData = await (contract as any).obtenerClimaRealSemilla(semillaIdParsed);
          if (Number(climaData[4]) > 0) {
            setTelemetria({
              temperatura:  (Number(climaData[0]) / 10).toFixed(1),
              humedad:      Number(climaData[1]).toString(),
              precipitacion: (Number(climaData[2]) / 10).toFixed(1),
              horasLuz:     Number(climaData[3]).toString(),
              fecha:        new Date(Number(climaData[4]) * 1000).toLocaleString()
            });
          }
        } catch (e) {
          console.log("Semilla sin telemetría CRE inyectada aún.");
        }
      }
    } catch (error) {
      setResultado(`${t.errorGettingSeed} ${(error as Error).message}`);
    }
  };

  const obtenerHistorialCrecimiento = async () => {
    if (!contract || !plantaId) return;
    try {
      const historial = await contract.obtenerHistorialDeCambios(parseInt(plantaId));
      setResultado(t.growthHistory + ':\n' + JSON.stringify(bigIntToString(historial), null, 2));
    } catch (error) {
      setResultado(`${t.errorGettingHistory} ${(error as Error).message}`);
    }
  };

  const obtenerTodasLasSemillas = async () => {
    if (!contract) return;
    try {
      const semillas = await contract.obtenerTodasLasSemillas();
      setResultado(t.allSeeds + ':\n' + JSON.stringify(bigIntToString(semillas), null, 2));
    } catch (error) {
      setResultado(`${t.errorGettingAllSeeds} ${(error as Error).message}`);
    }
  };

  const buscarSemillasPorResponsable = async () => {
    if (!contract || !responsableFilter) return;
    try {
      const semillasIds = await contract.buscarSemillasPorResponsable(responsableFilter);
      setSemillasFiltradas(semillasIds.map(Number));
      setResultado(`${t.seedsFound} ${semillasIds.join(', ')}`);
    } catch (error) {
      setResultado(`${t.errorSearchingSeeds} ${(error as Error).message}`);
    }
  };

  const medallas = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4 md:space-y-6 pt-2 md:pt-0">

      {/* ═══════════════════════════════════════════════════════════════════
          SECCIÓN 1: BUSCADOR DE GEMELO DIGITAL (Factory v2)
          Solo visible si hay Factory configurada
      ═══════════════════════════════════════════════════════════════════ */}
      {tieneFactory && (
        <div className="space-y-3 border-2 border-purple-200 rounded-xl p-4 bg-purple-50/40">
          <h3 className="text-base md:text-lg font-semibold text-purple-800 flex items-center">
            <Sprout className="mr-2 h-5 w-5 text-purple-600" />
            {t.gemeloBuscar}
          </h3>

          <div className="flex gap-2">
            <Input
              value={semillaId}
              onChange={(e) => setSemillaId(e.target.value)}
              placeholder="Ej: 1"
              type="number"
              className="flex-1"
            />
            <Button
              onClick={buscarGemeloDigital}
              disabled={cargandoGemelo || !semillaId}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {cargandoGemelo ? "⏳ Buscando..." : t.gemeloBtn}
            </Button>
          </div>

          {/* ─── Tarjeta del Gemelo Digital ─────────────────────────────── */}
          {resumenGemelo && (
            <div className="space-y-4 mt-2">

              {/* Identidad */}
              <Card className="border-purple-200 bg-white shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-bold text-purple-900 text-sm flex items-center">
                    <Leaf className="mr-2 h-4 w-4 text-purple-500" />
                    {t.gemeloTitulo}{resumenGemelo.id} — {resumenGemelo.especie}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div><span className="font-semibold">{t.gemeloResponsable}:</span> {resumenGemelo.responsable}</div>
                    <div><span className="font-semibold">{t.gemeloAltitud}:</span> {resumenGemelo.altitud} msnm</div>
                    <div className="col-span-2">
                      <span className="font-semibold">{t.gemeloUbicacion}:</span>{" "}
                      <MapPin className="inline h-3 w-3" /> {resumenGemelo.latitud}, {resumenGemelo.longitud}
                    </div>
                    <div><span className="font-semibold">{t.gemeloAdopcion}:</span> {resumenGemelo.fechaAdopcion}</div>
                    <div><span className="font-semibold">{t.gemeloReportes}:</span> {resumenGemelo.totalReportes}</div>
                    <div><span className="font-semibold">{t.gemeloTraslados}:</span> {resumenGemelo.totalTraslados}</div>
                    <div><span className="font-semibold">{t.gemelo0Donaciones}:</span> {resumenGemelo.totalDonaciones} ETH</div>
                    <div className="col-span-2 truncate text-[10px] text-gray-400">
                      <span className="font-semibold">{t.contratoDir}:</span> {resumenGemelo.contratoDir}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Último clima inyectado */}
              {ultimoClima && (
                <Card className="border-blue-200 bg-blue-50/40 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-bold text-blue-900 text-xs md:text-sm flex items-center">
                      <CloudRain className="mr-2 text-blue-600 h-4 w-4 animate-pulse" />
                      {t.climaTitle}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                      <div className="bg-white p-2 rounded border border-blue-100 shadow-sm">
                        <Thermometer className="mx-auto text-red-500 h-4 w-4 mb-1" />
                        <p className="text-[10px] text-gray-400 font-medium">{t.temp}</p>
                        <p className="font-bold text-sm text-gray-800">{ultimoClima.temperatura}°C</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-100 shadow-sm">
                        <Droplets className="mx-auto text-blue-500 h-4 w-4 mb-1" />
                        <p className="text-[10px] text-gray-400 font-medium">{t.humidity}</p>
                        <p className="font-bold text-sm text-gray-800">{ultimoClima.humedadRelativa}%</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-100 shadow-sm">
                        <CloudRain className="mx-auto text-indigo-500 h-4 w-4 mb-1" />
                        <p className="text-[10px] text-gray-400 font-medium">{t.rain}</p>
                        <p className="font-bold text-sm text-gray-800">{ultimoClima.precipitacion}mm</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-100 shadow-sm">
                        <Sun className="mx-auto text-yellow-500 h-4 w-4 mb-1" />
                        <p className="text-[10px] text-gray-400 font-medium">{t.solar}</p>
                        <p className="font-bold text-sm text-gray-800">{ultimoClima.horasLuzSolar}h</p>
                      </div>
                    </div>
                    <p className="text-right text-[10px] text-blue-800 font-medium flex items-center justify-end">
                      <Clock className="inline h-3 w-3 mr-1" />{t.sync}: {ultimoClima.fecha}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Historial climático completo (acordeón compacto) */}
              {historialClima.length > 0 && (
                <Card className="border-green-200 bg-green-50/30">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-green-800 text-xs mb-3 flex items-center">
                      <History className="mr-2 h-4 w-4" />{t.histClimaTitle} ({historialClima.length})
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {historialClima.slice().reverse().map((r, i) => (
                        <div key={i} className="text-[11px] bg-white rounded p-2 border border-green-100 flex justify-between items-center">
                          <span>🌡️ {r.temperatura}°C · 💧 {r.humedadRelativa}% · 🌧️ {r.precipitacion}mm · ☀️ {r.horasLuzSolar}h</span>
                          <span className="text-gray-400 ml-2 whitespace-nowrap">{r.fecha}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Historial de traslados */}
              {historialTraslados.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/30">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-orange-800 text-xs mb-3 flex items-center">
                      <MapPin className="mr-2 h-4 w-4" />{t.histTrasladosTitle} ({historialTraslados.length})
                    </h4>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {historialTraslados.map((tr, i) => (
                        <div key={i} className="text-[11px] bg-white rounded p-2 border border-orange-100">
                          <span className="font-semibold">#{i+1}</span> · 📍 ({tr.latitud}, {tr.longitud}) · {tr.altitud}m · {tr.responsable}
                          <br /><span className="text-gray-400">{tr.fecha}</span>
                          {tr.comentarios && <><br /><em>{tr.comentarios}</em></>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fases de crecimiento */}
              {fasesCrecimiento.length > 0 && (
                <Card className="border-teal-200 bg-teal-50/30">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-teal-800 text-xs mb-3 flex items-center">
                      <Leaf className="mr-2 h-4 w-4" />{t.fasesTitle} ({fasesCrecimiento.length})
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      {fasesCrecimiento.map((f, i) => (
                        <div key={i} className="text-[11px] bg-white rounded-full px-3 py-1 border border-teal-200 text-teal-700 font-medium">
                          {f.estado}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cuadro de Honor / Leaderboard */}
              <Card className="border-yellow-300 bg-yellow-50/40">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-bold text-yellow-800 text-sm flex items-center">
                    <Trophy className="mr-2 h-4 w-4 text-yellow-600" />
                    {t.leaderTitle}
                  </h4>
                  {leaderboard.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">Aún no hay donantes. ¡Sé el primero en apoyar esta semilla!</p>
                  ) : (
                    <div className="space-y-1">
                      {leaderboard.map((d, i) => (
                        <div key={i} className="flex items-center justify-between bg-white rounded p-2 border border-yellow-200 text-xs">
                          <span className="font-bold text-lg w-8 text-center">
                            {i < 3 ? medallas[i] : `#${d.posicion}`}
                          </span>
                          <span className="font-mono text-gray-600 flex-1 mx-2 truncate">
                            {d.billetera.slice(0,6)}...{d.billetera.slice(-4)}
                          </span>
                          <span className="font-bold text-yellow-700">{d.monto} ETH</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Botón de donación */}
              <Card className="border-green-300 bg-green-50/40">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-bold text-green-800 text-sm flex items-center">
                    <Heart className="mr-2 h-4 w-4 text-green-600" />
                    {t.donarTitle}
                  </h4>
                  <p className="text-xs text-green-600">{t.donarInfo}</p>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={montoDonacion}
                      onChange={(e) => setMontoDonacion(e.target.value)}
                      placeholder="0.001"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500 font-medium">ETH</span>
                  </div>
                  <Button
                    onClick={donarParaMantenimiento}
                    disabled={donando || !signer || !gemeloDireccion}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {donando ? "⏳ Enviando..." : <><Heart className="mr-2 h-4 w-4" /> {t.donarBtn}</>}
                  </Button>
                  {msgDonacion && (
                    <div className={`p-3 rounded text-sm ${
                      msgDonacion.startsWith('✅')
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-red-50 text-red-700 border border-red-300'
                    }`}>
                      {msgDonacion}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECCIÓN 2: CONSULTAS LEGACY (ViveroBogota) — 100% intactas
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold">{t.seedQuery}</h3>
        <div>
          <Label htmlFor="semillaIdLegacy">{t.seedId}</Label>
          <Input
            id="semillaIdLegacy"
            value={semillaId}
            onChange={(e) => setSemillaId(e.target.value)}
            type="number"
          />
        </div>
        <Button onClick={obtenerSemillaLegacy} className="w-full text-sm md:text-base py-1 md:py-2">
          <Search className="mr-2 h-4 w-4" /> {t.queryButton}
        </Button>
      </div>

      {/* Tarjeta telemetría CRE legacy */}
      {telemetria && (
        <Card className="border-blue-200 bg-blue-50/40 shadow-sm transition-all duration-300">
          <CardContent className="p-4 space-y-3">
            <h4 className="font-bold text-blue-900 text-xs md:text-sm flex items-center">
              <CloudRain className="mr-2 text-blue-600 h-4 w-4 animate-pulse" />
              {t.oracleTitle}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2 rounded border border-blue-100 shadow-sm">
                <Thermometer className="mx-auto text-red-500 h-4 w-4 mb-1" />
                <p className="text-[10px] text-gray-400 font-medium">{t.temp}</p>
                <p className="font-bold text-sm text-gray-800">{telemetria.temperatura}°C</p>
              </div>
              <div className="bg-white p-2 rounded border border-blue-100 shadow-sm">
                <Droplets className="mx-auto text-blue-500 h-4 w-4 mb-1" />
                <p className="text-[10px] text-gray-400 font-medium">{t.humidity}</p>
                <p className="font-bold text-sm text-gray-800">{telemetria.humedad}%</p>
              </div>
              <div className="bg-white p-2 rounded border border-blue-100 shadow-sm">
                <CloudRain className="mx-auto text-indigo-500 h-4 w-4 mb-1" />
                <p className="text-[10px] text-gray-400 font-medium">{t.rain}</p>
                <p className="font-bold text-sm text-gray-800">{telemetria.precipitacion}mm</p>
              </div>
              <div className="bg-white p-2 rounded border border-blue-100 shadow-sm">
                <Sun className="mx-auto text-yellow-500 h-4 w-4 mb-1" />
                <p className="text-[10px] text-gray-400 font-medium">{t.solar}</p>
                <p className="font-bold text-sm text-gray-800">{telemetria.horasLuz}h</p>
              </div>
            </div>
            <p className="text-right text-[10px] text-blue-800 font-medium flex items-center justify-end">
              <Clock className="inline h-3 w-3 mr-1" />{t.sync}: {telemetria.fecha}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold">{t.growthHistory}</h3>
        <div>
          <Label htmlFor="plantaId">{t.plantId}</Label>
          <Input id="plantaId" value={plantaId} onChange={(e) => setPlantaId(e.target.value)} type="number" />
        </div>
        <Button onClick={obtenerHistorialCrecimiento} className="w-full text-sm md:text-base py-1 md:py-2">
          <History className="mr-2 h-4 w-4" /> {t.historyButton}
        </Button>
      </div>

      <div className="space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold">{t.allSeeds}</h3>
        <Button onClick={obtenerTodasLasSemillas} className="w-full text-sm md:text-base py-1 md:py-2">
          <List className="mr-2 h-4 w-4" /> {t.allSeedsButton}
        </Button>
      </div>

      <div className="space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold">{t.searchByResponsible}</h3>
        <div>
          <Label htmlFor="responsableFilter">{t.responsible}</Label>
          <Input id="responsableFilter" value={responsableFilter} onChange={(e) => setResponsableFilter(e.target.value)} />
        </div>
        <Button onClick={buscarSemillasPorResponsable} className="w-full text-sm md:text-base py-1 md:py-2">
          <Filter className="mr-2 h-4 w-4" /> {t.searchButton}
        </Button>
      </div>
    </div>
  );
};

export default Consulta;
