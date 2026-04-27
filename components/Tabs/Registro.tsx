import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Truck } from 'lucide-react';
import { ViveroInterface } from '../EcoChainComponent';
import SeedSelectionModal from '../SeedSelectionModal';
import PlantTransferModal from '../PlantTransferModal';
import { useLanguage } from '../contexts/LanguageContext';

const SEED_TYPES = ["Frailejon", "Cardones", "Macolla", "Bambues"];

interface RegistroProps {
  contract: ViveroInterface | null;
  setResultado: React.Dispatch<React.SetStateAction<string>>;
  setGasEstimate: React.Dispatch<React.SetStateAction<string>>;
  walletConnected: boolean;
  actualizarTotales: () => Promise<void>;
  language: 'es' | 'en' | 'fr' | 'de';
}

const Registro: React.FC<RegistroProps> = ({ contract, setResultado, setGasEstimate, walletConnected, actualizarTotales, language }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isPlantTransferModalOpen, setIsPlantTransferModalOpen] = useState(false);
  const [semillaId, setSemillaId] = useState<string>('');

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
      seedTypes: {
        Espeletia: "Espeletia (Frailejón)",
        Polylepis: "Polylepis (Coloradito)",
        Weinmannia: "Weinmannia (Encenillo)",
        Diplostephium: "Diplostephium (Romero de Páramo)",
        Calamagrostis: "Calamagrostis (Paja de Páramo)",
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
      selectResponsible: "Responsible for Registering the Seed",
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
      selectTransferResponsible: "Responsible for Performing the Transfer",
      registerTransferButton: "Register Transfer",
      walletNotConnected: "Please connect your wallet to register seeds or transfer plants.",
      seedTypes: {
        Espeletia: "Espeletia (Frailejón)",
        Polylepis: "Polylepis (Coloradito)",
        Weinmannia: "Weinmannia (Encenillo)",
        Diplostephium: "Diplostephium (Romero de Páramo)",
        Calamagrostis: "Calamagrostis (Paja de Páramo)",
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
      selectResponsible: "Responsable de l'Enregistrement de la Graine",
      latitude: "Latitude",
      longitude: "Longitude",
      temperature: "Température (°C)",
      relativeHumidity: "Humidité Relative (%)",
      precipitation: "Précipitations (mm)",
      sunlightHours: "Heures d'Ensoleillement",
      altitude: "Altitude (m)",
      careComments: "Commentaires de Soin",
      registerSeedButton: "Enregistrer la Graine",
      registerPlantTransfer: "Enregistrer le Transfert de Plante",
      seedId: "ID de la Graine",
      transferResponsible: "Responsable du Transfert",
      selectTransferResponsible: "Responsable Effectuant le Transfert",
      registerTransferButton: "Enregistrer le Transfert",
      walletNotConnected: "Veuillez connecter votre portefeuille pour enregistrer des graines ou transférer des plantes.",
      seedTypes: {
        Espeletia: "Espeletia (Frailejón)",
        Polylepis: "Polylepis (Coloradito)",
        Weinmannia: "Weinmannia (Encenillo)",
        Diplostephium: "Diplostephium (Romero de Páramo)",
        Calamagrostis: "Calamagrostis (Paja de Páramo)",
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
      selectTransferResponsible: "Verantwortlicher für die Durchführung des Transfers",
      registerTransferButton: "Transfer registrieren",
      walletNotConnected: "Bitte verbinden Sie Ihr Wallet, um Samen zu registrieren oder Pflanzen zu transferieren.",
      seedTypes: {
        Espeletia: "Espeletia (Frailejón)",
        Polylepis: "Polylepis (Coloradito)",
        Weinmannia: "Weinmannia (Encenillo)",
        Diplostephium: "Diplostephium (Romero de Páramo)",
        Calamagrostis: "Calamagrostis (Paja de Páramo)",
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
    setIsDialogOpen(true);
  };

  const handleSemillaIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSemillaId(event.target.value);
  };

  const registrarSemilla = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contract || !walletConnected) return;

    const formData = new FormData(event.currentTarget);
    const tipo = formData.get('tipo') as string;
    const responsable = formData.get('responsable') as string;
    const latitud = parseFloat(formData.get('latitud') as string);
    const longitud = parseFloat(formData.get('longitud') as string);
    const temperatura = parseFloat(formData.get('temperatura') as string);
    const humedadRelativa = parseFloat(formData.get('humedadRelativa') as string);
    const precipitacion = parseFloat(formData.get('precipitacion') as string);
    const horasLuzSolar = parseFloat(formData.get('horasLuzSolar') as string);
    const altitud = parseFloat(formData.get('altitud') as string);
    const comentariosDeCuidado = formData.get('comentariosDeCuidado') as string;

    try {
      const gasEstimate = await contract.registrarSemilla.estimateGas(
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
      setGasEstimate(gasEstimate.toString());

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
      setResultado(`Semilla registrada con éxito. Hash de la transacción: ${tx.hash}`);
      actualizarTotales();
    } catch (error) {
      console.error("Error al registrar la semilla:", error);
      setResultado(`Error al registrar la semilla: ${(error as Error).message}`);
    }
  };

  const registrarTrasladoPlanta = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contract || !walletConnected) return;

    const formData = new FormData(event.currentTarget);
    const idSemilla = parseInt(formData.get('idSemilla') as string);
    const latitud = parseFloat(formData.get('latitud') as string);
    const longitud = parseFloat(formData.get('longitud') as string);
    const responsableTraslado = formData.get('responsableTraslado') as string;
    const comentariosDeCuidado = formData.get('comentariosDeCuidado') as string;

    try {
      const gasEstimate = await contract.registroTrasladoPlanta.estimateGas(
        idSemilla,
        { latitud, longitud },
        responsableTraslado,
        comentariosDeCuidado
      );
      setGasEstimate(gasEstimate.toString());

      const tx = await contract.registroTrasladoPlanta(
        idSemilla,
        { latitud, longitud },
        responsableTraslado,
        comentariosDeCuidado
      );
      await tx.wait();
      setResultado(`Traslado de planta registrado con éxito. Hash de la transacción: ${tx.hash}`);
      actualizarTotales();
      setIsPlantTransferModalOpen(true);
    } catch (error) {
      console.error("Error al registrar el traslado de la planta:", error);
      setResultado(`Error al registrar el traslado de la planta: ${(error as Error).message}`);
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
      <form onSubmit={registrarSemilla} className="space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold">{t.registerSeed}</h3>
        <div className="space-y-6">
          <div className="p-4">
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
                      {language === 'es' ? seed : (seed in t.seedTypes ? t.seedTypes[seed as keyof typeof t.seedTypes] : seed)}
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

          <Label htmlFor="responsable">{t.responsible}</Label>
          <Select name="responsable" required>
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
            <Input id="latitud" name="latitud" type="number" min="-90000000" max="90000000" step="1"  required />
          </div>
          <div>
            <Label htmlFor="longitud">{t.longitude}</Label>
            <Input id="longitud" name="longitud" type="number" min="-180000000" max="180000000" step="1" required />
          </div>
        </div>

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
            id="idSemilla"
            name="idSemilla"
            value={semillaId}
            onChange={handleSemillaIdChange}
            type="number"
            required
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
          <Select name="responsableTraslado" required>
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
      />
    </div>
  );
};

export default Registro;

