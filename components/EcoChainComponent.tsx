'use client'

import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import Particles from "react-tsparticles";
import { Engine } from "tsparticles-engine";
import { loadFull } from "tsparticles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Wallet, Globe } from 'lucide-react';
import { motion } from "framer-motion";
import { BackgroundImages } from './BackgroundImages';
import Registro from './Tabs/Registro';
import Consulta from './Tabs/Consulta';
import Actualizacion from './Tabs/Actualizacion';
import Biodiversidad from './Tabs/Biodiversidad';
import Administracion from './Tabs/Administracion';
import contractABI from '@/abis/contractABI.json';
import ResultadoDetallado from './ResultadoDetallado';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

import "../styles/globals.css";

// Interfaces y tipos (mantener los existentes)
type ObtenerSemilla = (id: number) => Promise<Semilla>;
type RegistrarSemilla = {
  (tipo: string, ubicacionInicial: { latitud: number; longitud: number }, responsable: string, temperatura: number, humedadRelativa: number, precipitacion: number, horasLuzSolar: number, altitud: number, comentariosDeCuidado: string): Promise<ethers.ContractTransactionResponse>;
  estimateGas: (tipo: string, ubicacionInicial: { latitud: number; longitud: number }, responsable: string, temperatura: number, humedadRelativa: number, precipitacion: number, horasLuzSolar: number, altitud: number, comentariosDeCuidado: string) => Promise<bigint>;
}

type RegistroTrasladoPlanta = {
  (idSemilla: number, ubicacionEnParamo: { latitud: number; longitud: number }, responsableTraslado: string, comentariosDeCuidado: string): Promise<ethers.ContractTransactionResponse>;
  estimateGas: (idSemilla: number, ubicacionEnParamo: { latitud: number; longitud: number }, responsableTraslado: string, comentariosDeCuidado: string) => Promise<bigint>;
}
type ActualizarEstadoPlantaYCrecimiento = (idPlanta: number, nuevoEstado: string) => Promise<ethers.ContractTransactionResponse>;
type ConsultarHistorialCrecimiento = (idPlanta: number) => Promise<HistorialCrecimiento[]>;
type ActualizarUbicacionPlantaEnParamo = (idPlanta: number, nuevaUbicacion: { latitud: number; longitud: number }) => Promise<ethers.ContractTransactionResponse>;
type TransferirPropiedad = (nuevaDireccion: string) => Promise<ethers.ContractTransactionResponse>;
type TotalSemillasRegistradas = () => Promise<bigint>;
type TotalPlantasRegistradas = () => Promise<bigint>;
type TrasladoPlanta = (idPlanta: number) => Promise<Planta>;

type RegistrarEspecieNativa = (
  nombre: string,
  descripcion: string,
  poblacionEstimada: number
) => Promise<ethers.ContractTransactionResponse>;

type ObtenerEstadisticasParamo = () => Promise<[bigint, bigint, bigint, bigint]>;
type RegistrarEventoClimatico = (
  tipo: string,
  temperatura: number,
  precipitacion: number
) => Promise<ethers.ContractTransactionResponse>;

type EliminarSemilla = (idSemilla: number) => Promise<ethers.ContractTransactionResponse>;
type EliminarPlanta = (idPlanta: number) => Promise<ethers.ContractTransactionResponse>;
type ActualizarCondicionesClimaticas = (idSemilla: number, nuevasCondiciones: CondicionesClimaticas) => Promise<ethers.ContractTransactionResponse>;
type AgregarComentario = (idSemilla: number, comentario: string) => Promise<ethers.ContractTransactionResponse>;
type ObtenerEstadisticas = () => Promise<[bigint, bigint, bigint]>;
type ObtenerEventos = () => Promise<string[]>;
type ObtenerHistorialDeCambios = (idSemilla: number) => Promise<HistorialCrecimiento[]>;
type Pausar = () => Promise<ethers.ContractTransactionResponse>;
type Despausar = () => Promise<ethers.ContractTransactionResponse>;
type AgregarAdministrador = (nuevadireccion: string) => Promise<ethers.ContractTransactionResponse>;
type RemoverAdministrador = (direccion: string) => Promise<ethers.ContractTransactionResponse>;
type ObtenerTodasLasSemillas = () => Promise<Semilla[]>;
type BuscarSemillasPorResponsable = (responsable: string) => Promise<number[]>;
type ObtenerEstadisticasDetalladas = () => Promise<[bigint, bigint, bigint, bigint]>;
type VerificarCondicionesClimaticas = (idSemilla: number) => Promise<ethers.ContractTransactionResponse>;

interface ViveroInterface extends ethers.BaseContract {
  obtenerSemilla: ObtenerSemilla;
  registrarSemilla: RegistrarSemilla;
  registroTrasladoPlanta: RegistroTrasladoPlanta;
  actualizarEstadoPlantaYCrecimiento: ActualizarEstadoPlantaYCrecimiento;
  consultarHistorialCrecimiento: ConsultarHistorialCrecimiento;
  actualizarUbicacionPlantaEnParamo: ActualizarUbicacionPlantaEnParamo;
  transferirPropiedad: TransferirPropiedad;
  totalSemillasRegistradas: TotalSemillasRegistradas;
  totalPlantasRegistradas: TotalPlantasRegistradas;
  trasladoPlanta: TrasladoPlanta;
  registrarEspecieNativa: RegistrarEspecieNativa;
  obtenerEstadisticasParamo: ObtenerEstadisticasParamo;
  registrarEventoClimatico: RegistrarEventoClimatico;
  eliminarSemilla: EliminarSemilla;
  eliminarPlanta: EliminarPlanta;
  actualizarCondicionesClimaticas: ActualizarCondicionesClimaticas;
  agregarComentario: AgregarComentario;
  obtenerEstadisticas: ObtenerEstadisticas;
  obtenerEventos: ObtenerEventos;
  obtenerHistorialDeCambios: ObtenerHistorialDeCambios;
  pausar: Pausar;
  despausar: Despausar;
  agregarAdministrador: AgregarAdministrador;
  removerAdministrador: RemoverAdministrador;
  obtenerTodasLasSemillas: ObtenerTodasLasSemillas;
  buscarSemillasPorResponsable: BuscarSemillasPorResponsable;
  obtenerEstadisticasDetalladas: ObtenerEstadisticasDetalladas;
  verificarCondicionesClimaticas: VerificarCondicionesClimaticas;
}

type Semilla = {
  id: bigint;
  tipo: string;
  ubicacionInicial: { latitud: number; longitud: number };
  responsable: string;
  condicionesClimaticas: {
    temperatura: number;
    humedadRelativa: number;
    precipitacion: number;
    horasLuzSolar: number;
    altitud: number;
  };
  comentariosDeCuidado: string;
  fechaRegistro: { timestamp: number };
};

type HistorialCrecimiento = {
  plantaId: bigint;
  estado: string;
  fechaActualizacion: { timestamp: number };
};

type Planta = {
  id: bigint;
  idSemilla: bigint;
  estado: string;
  ubicacionEnParamo: { latitud: number; longitud: number };
  responsableTraslado: string;
  comentariosDeCuidado: string;
  fechaTraslado: { timestamp: number };
};

type CondicionesClimaticas = {
  temperatura: number;
  humedadRelativa: number;
  precipitacion: number;
  horasLuzSolar: number;
  altitud: number;
  fechaRegistro: { timestamp: number };
};

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

function getViveroContract(address: string, signer: ethers.Signer): ViveroInterface {
  return new ethers.Contract(address, contractABI, signer) as unknown as ViveroInterface;
}

async function estimateGas(contract: ViveroInterface, method: string, ...args: any[]): Promise<string> {
  try {
    const gasEstimate = await (contract as any).estimateGas[method](...args);
    return (gasEstimate * BigInt(110) / BigInt(100)).toString();
  } catch (error) {
    console.error('Error estimating gas:', error);
    return "0";
  }
}

function bigIntToString(obj: any): any {
  if (typeof obj === 'bigint') {
    return obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map(bigIntToString);
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, bigIntToString(value)])
    );
  }
  return obj;
}

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Select value={language} onValueChange={(value: 'es' | 'en' | 'fr' | 'de') => setLanguage(value)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Seleccionar idioma" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="es">Español</SelectItem>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="fr">Français</SelectItem>
        <SelectItem value="de">Deutsch</SelectItem>
      </SelectContent>
    </Select>
  );
};

function EcoChainComponent() {
  const [contract, setContract] = useState<ViveroInterface | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [networkName, setNetworkName] = useState<string>("");
  const [accountAddress, setAccountAddress] = useState<string>("");
  const [totalSemillas, setTotalSemillas] = useState(0);
  const [totalPlantas, setTotalPlantas] = useState(0);
  const [currentTimestamp, setCurrentTimestamp] = useState<string>('Cargando...');
  const [estadisticasParamo, setEstadisticasParamo] = useState<{
    totalSemillas: number;
    totalPlantas: number;
    totalEspeciesNativas: number;
    totalEventosClimaticos: number;
  } | null>(null);
  const [resultado, setResultado] = useState('');
  const [gasEstimate, setGasEstimate] = useState<string>('');
  const [activeTab, setActiveTab] = useState("registro");

  const { language } = useLanguage();

  // Traducciones
  const translations = {
    es: {
      title: "EcoChain: Vivero de Frailejones",
      description: "Gestión y Registro de Semillas, Plantas y Biodiversidad del Páramo",
      currentDateTime: "Fecha y hora actual:",
      totalSeeds: "Total de Semillas Registradas:",
      totalPlants: "Total de Plantas Trasladadas:",
      connectWallet: "Conectar Billetera",
      walletConnected: "Billetera Conectada",
      networkConnected: "Red conectada:",
      contractAddress: "Dirección del contrato:",
      selectSection: "Seleccionar sección",
      registro: "Registro",
      consulta: "Consulta",
      actualizacion: "Actualización",
      biodiversidad: "Biodiversidad",
      administracion: "Administración",
      result: "Resultado",
      errors: {
        walletNotInstalled: "MetaMask no está instalado",
        wrongNetwork: "Por favor, conecte MetaMask a la red Ganache",
        connectionError: "Error de conexión: ",
        unknownError: "Error de conexión desconocido",
        statsError: "Error al obtener las estadísticas del páramo: ",
        updateTotalsError: "Error al actualizar los totales: "
      }
    },
    en: {
      title: "EcoChain: Frailejones Nursery",
      description: "Management and Registration of Seeds, Plants, and Páramo Biodiversity",
      currentDateTime: "Current date and time:",
      totalSeeds: "Total Registered Seeds:",
      totalPlants: "Total Transferred Plants:",
      connectWallet: "Connect Wallet",
      walletConnected: "Wallet Connected",
      networkConnected: "Connected network:",
      contractAddress: "Contract address:",
      selectSection: "Select section",
      registro: "Registration",
      consulta: "Query",
      actualizacion: "Update",
      biodiversidad: "Biodiversity",
      administracion: "Administration",
      result: "Result",
      errors: {
        walletNotInstalled: "MetaMask is not installed",
        wrongNetwork: "Please connect MetaMask to the Ganache network",
        connectionError: "Connection error: ",
        unknownError: "Unknown connection error",
        statsError: "Error fetching páramo statistics: ",
        updateTotalsError: "Error updating totals: "
      }
    },
    fr: {
      title: "EcoChain: Pépinière de Frailejones",
      description: "Gestion et Enregistrement des Graines, Plantes et Biodiversité du Páramo",
      currentDateTime: "Date et heure actuelles :",
      totalSeeds: "Total des Graines Enregistrées :",
      totalPlants: "Total des Plantes Transférées :",
      connectWallet: "Connecter le Portefeuille",
      walletConnected: "Portefeuille Connecté",
      networkConnected: "Réseau connecté :",
      contractAddress: "Adresse du contrat :",
      selectSection: "Sélectionner une section",
      registro: "Enregistrement",
      consulta: "Consultation",
      actualizacion: "Mise à jour",
      biodiversidad: "Biodiversité",
      administracion: "Administration",
      result: "Résultat",
      errors: {
        walletNotInstalled: "MetaMask n'est pas installé",
        wrongNetwork: "Veuillez connecter MetaMask au réseau Ganache",
        connectionError: "Erreur de connexion : ",
        unknownError: "Erreur de connexion inconnue",
        statsError: "Erreur lors de la récupération des statistiques du páramo : ",
        updateTotalsError: "Erreur lors de la mise à jour des totaux : "
      }
    },
    de: {
      title: "EcoChain: Frailejones-Baumschule",
      description: "Verwaltung und Registrierung von Samen, Pflanzen und Biodiversität des Páramo",
      currentDateTime: "Aktuelles Datum und Uhrzeit:",
      totalSeeds: "Gesamtzahl der registrierten Samen:",
      totalPlants: "Gesamtzahl der umgesiedelten Pflanzen:",
      connectWallet: "Wallet verbinden",
      walletConnected: "Wallet verbunden",
      networkConnected: "Verbundenes Netzwerk:",
      contractAddress: "Vertragsadresse:",
      selectSection: "Abschnitt auswählen",
      registro: "Registrierung",
      consulta: "Abfrage",
      actualizacion: "Aktualisierung",
      biodiversidad: "Biodiversität",
      administracion: "Verwaltung",
      result: "Ergebnis",
      errors: {
        walletNotInstalled: "MetaMask ist nicht installiert",
        wrongNetwork: "Bitte verbinden Sie MetaMask mit dem Ganache-Netzwerk",
        connectionError: "Verbindungsfehler: ",
        unknownError: "Unbekannter Verbindungsfehler",
        statsError: "Fehler beim Abrufen der Páramo-Statistiken: ",
        updateTotalsError: "Fehler beim Aktualisieren der Gesamtzahlen: "
      }
    },
  };

  const t = translations[language];

  const connectWallet = async () => {
    try {   
      if (typeof window.ethereum === 'undefined') {
        throw new Error(t.errors.walletNotInstalled);
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new ethers.BrowserProvider(window.ethereum);

      const network = await provider.getNetwork();
      setNetworkName(network.name);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccountAddress(address);

      if (network.chainId !== BigInt(1337)) {
        throw new Error(t.errors.wrongNetwork);
      }

      const contractInstance = getViveroContract(contractAddress, signer);
      
      const totalSemillas = await contractInstance.totalSemillasRegistradas();
      console.log(t.totalSeeds, totalSemillas.toString());

      setContract(contractInstance);
      setWalletConnected(true);
      
      setConnectionStatus(t.walletConnected);

      setAccountAddress(contractAddress);

    } catch (error: unknown) {
      if (error instanceof Error) {
        setConnectionStatus(t.errors.connectionError + error.message);
      } else {
        setConnectionStatus(t.errors.unknownError);
      }
    }
  };

  const updateTotals = async (contractInstance: ViveroInterface) => {
    try {
      const semillas: bigint = await contractInstance.totalSemillasRegistradas();
      const plantas: bigint = await contractInstance.totalPlantasRegistradas();

      console.log("Gesamtzahl Samen:", semillas);
      console.log("Gesamtzahl Pflanzen:", plantas);

      setTotalSemillas(Number(semillas));
      setTotalPlantas(Number(plantas));
    } catch (error) {
      console.error(t.errors.updateTotalsError, error);
    }
  };

  const actualizarEstadisticasParamo = async () => {
    if (!contract) return;
    try {
      const stats = await contract.obtenerEstadisticasParamo();
      setEstadisticasParamo({
        totalSemillas: Number(stats[0]),
        totalPlantas: Number(stats[1]),
        totalEspeciesNativas: Number(stats[2]),
        totalEventosClimaticos: Number(stats[3])
      });
    } catch (error) {
      console.error(t.errors.statsError, error);
    }
  };

  const actualizarTotales = async () => {
    if (!contract) return;
    try {
      const semillas = await contract.totalSemillasRegistradas();
      const plantas = await contract.totalPlantasRegistradas();
      setTotalSemillas(Number(semillas));
      setTotalPlantas(Number(plantas));
    } catch (error) {
      console.error(t.errors.updateTotalsError, error);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  useEffect(() => {
    const updateTimestamp = () => {
      setCurrentTimestamp(new Date().toLocaleString());
    };
    updateTimestamp();
    const timer = setInterval(updateTimestamp, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (walletConnected && contract) {
      updateTotals(contract);
      actualizarEstadisticasParamo();
    }
  }, [walletConnected, contract]);

  const particlesInit = useCallback(async (engine: Engine) => {
    console.log("Initialisiere tsParticles");
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: any) => {
    console.log(container);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <BackgroundImages />

      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          background: {
            color: {
              value: "transparent",
            },
          },
          fpsLimit: 120,
          interactivity: {
            events: {
              onClick: {
                enable: true,
                mode: "push",
              },
              onHover: {
                enable: true,
                mode: "repulse",
              },
              resize: true,
            },
            modes: {
              push: {
                quantity: 4,
              },
              repulse: {
                distance: 200,
                duration: 0.4,
              },
            },
          },
          particles: {
            color: {
              value: "#ffffff",
            },
            links: {
              color: "#ffffff",
              distance: 150,
              enable: true,
              opacity: 0.5,
              width: 1,
            },
            collisions: {
              enable: true,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: false,
              speed: 1,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 80,
            },
            opacity: {
              value: 0.5,
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 5 },
            },
          },
          detectRetina: true,
        }}
      />

      <Card className="w-full max-w-4xl bg-white/30 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden border border-white/50 relative z-10">
        <CardHeader className="text-center relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-300 via-blue-500 to-purple-600"></div>
          <CardTitle className="text-2xl md:text-4xl font-bold mb-2 flex items-center justify-center" style={{
            background: "linear-gradient(to right, #3498db, #2ecc71)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            {t.title}
          </CardTitle>
          <CardDescription className="text-base md:text-lg" style={{
            background: "linear-gradient(to right, #3498db, #2ecc71)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            {t.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-2 md:px-6 pt-2 md:pt-4">
          <div className="flex justify-between items-center mb-4">
            <div className="inline-flex p-2 bg-gray-100 border border-gray-300 rounded-md">
              <CardDescription className="text-sm md:text-lg text-black-500 font-semibold text-center">
                <span className="text-gray-700">{t.currentDateTime}</span> {currentTimestamp}
              </CardDescription>
            </div>
            <LanguageSelector />
          </div>

          <div className="mb-6 text-center">
            <p className="text-black text-sm md:text-lg">{t.totalSeeds} {totalSemillas}</p>
            <p className="text-black text-sm md:text-lg">{t.totalPlants} {totalPlantas}</p>
          </div>

          <div className="mb-6 text-center">
            {estadisticasParamo && (
              <>
                <p className="text-black text-sm md:text-lg">Total de Semillas: {estadisticasParamo.totalSemillas}</p>
                <p className="text-black text-sm md:text-lg">Total de Plantas: {estadisticasParamo.totalPlantas}</p>
                <p className="text-black text-sm md:text-lg">Especies Nativas: {estadisticasParamo.totalEspeciesNativas}</p>
                <p className="text-black text-sm md:text-lg">Eventos Climáticos: {estadisticasParamo.totalEventosClimaticos}</p>
              </>
            )}
          </div>

          <div className="mb-6">
            <Button
              onClick={connectWallet}
              disabled={walletConnected}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm md:text-base"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {walletConnected ? t.walletConnected : t.connectWallet}
            </Button>
            {connectionStatus && <p className="mt-2 text-center text-sm md:text-base">{connectionStatus}</p>}
            {networkName && <p className="mt-2 text-center text-sm md:text-base">{t.networkConnected} {networkName}</p>}
            {accountAddress && <p className="mt-2 text-center text-sm md:text-base">{t.contractAddress} {accountAddress}</p>}
          </div>

          <div className="md:hidden mb-4">
            <Select onValueChange={handleTabChange} value={activeTab}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.selectSection} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registro">{t.registro}</SelectItem>
                <SelectItem value="consulta">{t.consulta}</SelectItem>
                <SelectItem value="actualizacion">{t.actualizacion}</SelectItem>
                <SelectItem value="biodiversidad">{t.biodiversidad}</SelectItem>
                <SelectItem value="administracion">{t.administracion}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="hidden md:block">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-5 gap-1 mb-4">
                <TabsTrigger value="registro">{t.registro}</TabsTrigger>
                <TabsTrigger value="consulta">{t.consulta}</TabsTrigger>
                <TabsTrigger value="actualizacion">{t.actualizacion}</TabsTrigger>
                <TabsTrigger value="biodiversidad">{t.biodiversidad}</TabsTrigger>
                <TabsTrigger value="administracion">{t.administracion}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="mt-4">
            {activeTab === "registro" && (
              <Registro 
                contract={contract} 
                setResultado={setResultado} 
                setGasEstimate={setGasEstimate} 
                walletConnected={walletConnected} 
                actualizarTotales={actualizarTotales}
                language={language}
              />
            )}
            {activeTab === "consulta" && (
              <Consulta contract={contract} setResultado={setResultado} language={language} />
            )}
            {activeTab === "actualizacion" && (
              <Actualizacion contract={contract} setResultado={setResultado} setGasEstimate={setGasEstimate} language={language} />
            )}
            {activeTab === "biodiversidad" && (
              <Biodiversidad contract={contract} setResultado={setResultado} setGasEstimate={setGasEstimate} actualizarEstadisticasParamo={actualizarEstadisticasParamo} language={language} />
            )}
            {activeTab === "administracion" && (
              <Administracion contract={contract} setResultado={setResultado} setGasEstimate={setGasEstimate} language={language} />
            )}
          </div>
        </CardContent>

        <CardFooter className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 opacity-50"></div>
          <div className="absolute inset-0 bg-[url('/abstract-pattern.png')] opacity-10"></div>
          <motion.div
            className="relative w-full p-4 md:p-6 bg-white bg-opacity-80 rounded-lg shadow-lg result-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg md:text-xl font-semibold mb-4 pb-2 border-b-2 border-green-300">
              {t.result}
            </h3>
            <ResultadoDetallado resultado={resultado} gasEstimate={gasEstimate} language={language}/>
          </motion.div>
        </CardFooter>
      </Card>
    </div>
  )
}

const WrappedEcoChainComponent = () => {
  return (
    <LanguageProvider>
      <EcoChainComponent />
    </LanguageProvider>
  );
};

export { WrappedEcoChainComponent as EcoChainComponent, type ViveroInterface };

