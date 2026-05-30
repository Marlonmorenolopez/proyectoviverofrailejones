import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Truck } from 'lucide-react';
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
  const [semillaId,                setSemillaId]              = useState<string>('');

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

  const [formLatitud,     setFormLatitud]     = useState('');
  const [formLongitud,    setFormLongitud]    = useState('');
  const [formTipo,        setFormTipo]        = useState('');
  const [formResponsable, setFormResponsable] = useState('');
  const [trasResponsable, setTrasResponsable] = useState('');

  const translations = {
    es: {
      registerSeed: "Registrar Semilla (Modo Automatizado CRE)",
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
      registerSeedButton: "Registrar Semilla en Blockchain",
      registerPlantTransfer: "Registrar Traslado de Planta",
      seedId: "ID de la Semilla",
      transferResponsible: "Responsable del Traslado",
      selectTransferResponsible: "Responsable de Quien Realiza el Traslado",
      registerTransferButton: "Registrar Traslado",
      walletNotConnected: "Por favor, conecta tu billetera para poder registrar semillas o trasladar plantas.",
      modoOracle: "🔗 Automatización Activa (Chainlink CRE)",
      modoManual: "✏️ Modo Manual (Local)",
      infoOracle: "Ecosistema Chainlink CRE: Las condiciones climáticas del Páramo se gestionarán asíncronamente en el contrato receptor mediante la infraestructura de nodos.",
      seedTypes: {
        Frailejon: "Frailejón",
        Cardones: "Cardones",
        Macolla: "Macolla",
        Bambues: "Bambúes"
      },
    },
    en: {
      registerSeed: "Register Seed (CRE Automated Mode)",
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
      registerSeedButton: "Register Seed on Blockchain",
      registerPlantTransfer: "Register Plant Transfer",
      seedId: "Seed ID",
      transferResponsible: "Transfer Responsible",
      selectTransferResponsible: "Person Performing the Transfer",
      registerTransferButton: "Register Transfer",
      walletNotConnected: "Please connect your wallet to register seeds or transfer plants.",
      modoOracle: "🔗 Automation Active (Chainlink CRE)",
      modoManual: "✏️ Manual Mode",
      infoOracle: "Chainlink CRE Ecosystem: Climate parameters for the Páramo are handled asynchronously via contract integration with core nodes.",
      seedTypes: {
        Frailejon: "Frailejón (Espeletia)",
        Cardones: "Cardones (Cacti)",
        Macolla: "Macolla (Bunch Grass)",
        Bambues: "Bambúes (Bamboo)"
      },
    },
    fr: {
      registerSeed: "Enregistrer la Graine (Mode CRE)",
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
      modoOracle: "🔗 Mode Automatisé (Chainlink CRE)",
      modoManual: "✏️ Mode Manuel",
      infoOracle: "Écosystème Chainlink CRE: Les données climatiques seront transmises de façon asynchrone par l'infrastructure du forwarder.",
      seedTypes: {
        Frailejon: "Frailejón (Espeletia)",
        Cardones: "Cardones (Cactus)",
        Macolla: "Macolla (Herbe en touffe)",
        Bambues: "Bambúes (Bambou)"
      },
    },
    de: {
      registerSeed: "Samen registrieren (CRE-Modus)",
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
      modoOracle: "🔗 Automatisierung Aktiv (Chainlink CRE)",
      modoManual: "✏️ Manueller Modus",
      infoOracle: "Chainlink CRE-Ökosystem: Klimadaten für das Páramo werden asynchron über die Kontrakt-Infrastruktur verwaltet.",
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
    setFormTipo(value);
    setIsDialogOpen(true);
  };

  const registrarSemilla = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contract || !walletConnected) return;

    const formData             = new FormData(event.currentTarget);
    const tipo                 = formData.get('tipo') as string || formTipo;
    const responsable          = formData.get('responsable') as string || formResponsable;
    const latitud              = parseFloat(formData.get('latitud') as string || formLatitud);
    const longitud             = parseFloat(formData.get('longitud') as string || formLongitud);
    const altitud              = parseFloat(formData.get('altitud') as string);
    const comentariosDeCuidado = formData.get('comentariosDeCuidado') as string;

    try {
      setResultado("⏳ Transmitiendo registro a la red Sepolia...");

     if (tieneOracle) {
        // 1. Forzamos la captura del valor float exacto escrito por el usuario en la pantalla
        const latitudExacta  = parseFloat(formLatitud)  || latitud;
        const longitudExacta = parseFloat(formLongitud) || longitud;

        // 2. Transmitimos multiplicando directamente el decimal real por el millón
        const tx = await contract.registrarSemilla(
          tipo,
          { 
            latitud:  Math.round(latitudExacta * 1000000), 
            longitud: Math.round(longitudExacta * 1000000) 
          },
          responsable,
          10, 
          80, 
          5,  
          8,  
          Math.round(altitud),
          comentariosDeCuidado
        );
        await tx.wait();
        setResultado(`✅ Semilla registrada con éxito en Sepolia.\nEl flujo asíncrono CRE recopilará las métricas climáticas del Páramo.\nHash: ${tx.hash}`);

      } else {
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
        setResultado(`✅ Semilla local registrada con éxito.\nHash: ${tx.hash}`);
      }

      actualizarTotales();
    } catch (error) {
      console.error("Error al registrar la semilla:", error);
      setResultado(`❌ Error al registrar la semilla: ${(error as Error).message}`);
    }
  };

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
        const semilla  = await contract.obtenerSemilla(idSemilla);
        temperatura    = Number(semilla.condicionesClimaticas.temperatura);
        humedad        = Number(semilla.condicionesClimaticas.humedadRelativa);
        altitudPlanta  = Number(semilla.condicionesClimaticas.altitud);
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
          tieneOracle
            ? "bg-blue-100 text-blue-700 border border-blue-300"
            : "bg-gray-100 text-gray-700 border border-gray-300"
        }`}>
          {tieneOracle ? t.modoOracle : t.modoManual}
        </div>
      )}

      <form onSubmit={registrarSemilla} className="space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold">{t.registerSeed}</h3>

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
              id="longitud" name="longitud" type="number"
              required value={formLongitud}
              onChange={(e) => setFormLongitud(e.target.value)}
            />
          </div>
        </div>

        {tieneOracle && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 text-sm font-medium">{t.infoOracle}</p>
          </div>
        )}

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

        <Button type="submit" className="w-full text-sm md:text-base py-1 md:py-2">
          <Send className="mr-2 h-4 w-4" /> {t.registerSeedButton}
        </Button>
      </form>

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