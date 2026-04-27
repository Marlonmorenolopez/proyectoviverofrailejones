import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Leaf, CloudRain, BarChart2, AlertTriangle } from 'lucide-react';
import { ViveroInterface } from '../EcoChainComponent';

interface BiodiversidadProps {
    contract: ViveroInterface | null;
    setResultado: React.Dispatch<React.SetStateAction<string>>;
    setGasEstimate: React.Dispatch<React.SetStateAction<string>>;
    actualizarEstadisticasParamo: () => Promise<void>;
    language: 'es' | 'en' | 'fr' | 'de';
}

const Biodiversidad: React.FC<BiodiversidadProps> = ({ contract, setResultado, setGasEstimate, actualizarEstadisticasParamo, language }) => {
    const [estadisticasDetalladas, setEstadisticasDetalladas] = useState<{
        totalSemillas: number;
        totalPlantas: number;
        semillasPorMes: number;
        plantasPorMes: number;
    } | null>(null);

    const translations = {
        es: {
            registerNativeSpecies: "Registrar Especie Nativa",
            speciesName: "Nombre de la Especie",
            description: "Descripción",
            estimatedPopulation: "Población Estimada",
            registerSpeciesButton: "Registrar Especie Nativa",
            registerClimaticEvent: "Registrar Evento Climático",
            eventType: "Tipo de Evento",
            selectEventType: "Seleccione el tipo de evento",
            temperature: "Temperatura (°C)",
            precipitation: "Precipitación (mm)",
            registerEventButton: "Registrar Evento Climático",
            paramoStatistics: "Estadísticas del Páramo",
            updateStatisticsButton: "Actualizar Estadísticas",
            detailedStatistics: "Estadísticas Detalladas",
            getDetailedStatsButton: "Obtener Estadísticas Detalladas",
            totalSeeds: "Total Semillas",
            totalPlants: "Total Plantas",
            seedsPerMonth: "Semillas por Mes",
            plantsPerMonth: "Plantas por Mes",
            verifyClimaticConditions: "Verificar Condiciones Climáticas",
            seedId: "ID de la Semilla",
            verifyConditionsButton: "Verificar Condiciones",
            errorRegisteringSpecies: "Error al registrar la especie nativa:",
            errorRegisteringEvent: "Error al registrar el evento climático:",
            errorGettingDetailedStats: "Error al obtener estadísticas detalladas:",
            errorVerifyingConditions: "Error al verificar condiciones climáticas:",
            successRegisteringSpecies: "Especie nativa registrada exitosamente",
            successRegisteringEvent: "Evento climático registrado exitosamente",
            successGettingDetailedStats: "Estadísticas detalladas obtenidas exitosamente",
            successVerifyingConditions: "Condiciones climáticas verificadas exitosamente"
        },
        en: {
            registerNativeSpecies: "Register Native Species",
            speciesName: "Species Name",
            description: "Description",
            estimatedPopulation: "Estimated Population",
            registerSpeciesButton: "Register Native Species",
            registerClimaticEvent: "Register Climatic Event",
            eventType: "Event Type",
            selectEventType: "Select event type",
            temperature: "Temperature (°C)",
            precipitation: "Precipitation (mm)",
            registerEventButton: "Register Climatic Event",
            paramoStatistics: "Páramo Statistics",
            updateStatisticsButton: "Update Statistics",
            detailedStatistics: "Detailed Statistics",
            getDetailedStatsButton: "Get Detailed Statistics",
            totalSeeds: "Total Seeds",
            totalPlants: "Total Plants",
            seedsPerMonth: "Seeds per Month",
            plantsPerMonth: "Plants per Month",
            verifyClimaticConditions: "Verify Climatic Conditions",
            seedId: "Seed ID",
            verifyConditionsButton: "Verify Conditions",
            errorRegisteringSpecies: "Error registering native species:",
            errorRegisteringEvent: "Error registering climatic event:",
            errorGettingDetailedStats: "Error getting detailed statistics:",
            errorVerifyingConditions: "Error verifying climatic conditions:",
            successRegisteringSpecies: "Native species registered successfully",
            successRegisteringEvent: "Climatic event registered successfully",
            successGettingDetailedStats: "Detailed statistics obtained successfully",
            successVerifyingConditions: "Climatic conditions verified successfully"
        },
        fr: {
            registerNativeSpecies: "Enregistrer une Espèce Native",
            speciesName: "Nom de l'Espèce",
            description: "Description",
            estimatedPopulation: "Population Estimée",
            registerSpeciesButton: "Enregistrer l'Espèce Native",
            registerClimaticEvent: "Enregistrer un Événement Climatique",
            eventType: "Type d'Événement",
            selectEventType: "Sélectionnez le type d'événement",
            temperature: "Température (°C)",
            precipitation: "Précipitations (mm)",
            registerEventButton: "Enregistrer l'Événement Climatique",
            paramoStatistics: "Statistiques du Páramo",
            updateStatisticsButton: "Mettre à Jour les Statistiques",
            detailedStatistics: "Statistiques Détaillées",
            getDetailedStatsButton: "Obtenir des Statistiques Détaillées",
            totalSeeds: "Total des Graines",
            totalPlants: "Total des Plantes",
            seedsPerMonth: "Graines par Mois",
            plantsPerMonth: "Plantes par Mois",
            verifyClimaticConditions: "Vérifier les Conditions Climatiques",
            seedId: "ID de la Graine",
            verifyConditionsButton: "Vérifier les Conditions",
            errorRegisteringSpecies: "Erreur lors de l'enregistrement de l'espèce native :",
            errorRegisteringEvent: "Erreur lors de l'enregistrement de l'événement climatique :",
            errorGettingDetailedStats: "Erreur lors de l'obtention des statistiques détaillées :",
            errorVerifyingConditions: "Erreur lors de la vérification des conditions climatiques :",
            successRegisteringSpecies: "Espèce native enregistrée avec succès",
            successRegisteringEvent: "Événement climatique enregistré avec succès",
            successGettingDetailedStats: "Statistiques détaillées obtenues avec succès",
            successVerifyingConditions: "Conditions climatiques vérifiées avec succès"
        },
        de: {
            registerNativeSpecies: "Einheimische Art registrieren",
            speciesName: "Artname",
            description: "Beschreibung",
            estimatedPopulation: "Geschätzte Population",
            registerSpeciesButton: "Einheimische Art registrieren",
            registerClimaticEvent: "Klimaereignis registrieren",
            eventType: "Ereignistyp",
            selectEventType: "Ereignistyp auswählen",
            temperature: "Temperatur (°C)",
            precipitation: "Niederschlag (mm)",
            registerEventButton: "Klimaereignis registrieren",
            paramoStatistics: "Páramo-Statistiken",
            updateStatisticsButton: "Statistiken aktualisieren",
            detailedStatistics: "Detaillierte Statistiken",
            getDetailedStatsButton: "Detaillierte Statistiken abrufen",
            totalSeeds: "Gesamtzahl Samen",
            totalPlants: "Gesamtzahl Pflanzen",
            seedsPerMonth: "Samen pro Monat",
            plantsPerMonth: "Pflanzen pro Monat",
            verifyClimaticConditions: "Klimabedingungen überprüfen",
            seedId: "Samen-ID",
            verifyConditionsButton: "Bedingungen überprüfen",
            errorRegisteringSpecies: "Fehler beim Registrieren der einheimischen Art:",
            errorRegisteringEvent: "Fehler beim Registrieren des Klimaereignisses:",
            errorGettingDetailedStats: "Fehler beim Abrufen detaillierter Statistiken:",
            errorVerifyingConditions: "Fehler beim Überprüfen der Klimabedingungen:",
            successRegisteringSpecies: "Einheimische Art erfolgreich registriert",
            successRegisteringEvent: "Klimaereignis erfolgreich registriert",
            successGettingDetailedStats: "Detaillierte Statistiken erfolgreich abgerufen",
            successVerifyingConditions: "Klimabedingungen erfolgreich überprüft"
        }
    };

    const t = translations[language];

    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [poblacionEstimada, setPoblacionEstimada] = useState('');

    const estimateGas = async (method: string, ...args: any[]): Promise<string> => {
        if (!contract) return "0";
        try {
            const gasEstimate = await (contract as any).estimateGas[method](...args);
            return (gasEstimate * BigInt(110) / BigInt(100)).toString();
        } catch (error) {
            console.error('Error estimating gas:', error);
            return "0";
        }
    };

    const registrarEspecieNativa = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!contract) return;
        try {
            const formData = new FormData(event.currentTarget);
            const nombre = formData.get('nombre') as string;
            const descripcion = formData.get('descripcion') as string;
            const poblacionEstimada = parseInt(formData.get('poblacionEstimada') as string, 10);

            const estimatedGas = await estimateGas(
                'registrarEspecieNativa',
                nombre,
                descripcion,
                poblacionEstimada
            );

            setGasEstimate(estimatedGas.toString());

            const tx = await contract.registrarEspecieNativa(
                nombre,
                descripcion,
                poblacionEstimada
            );
            await tx.wait();
            setResultado(t.successRegisteringSpecies);
            actualizarEstadisticasParamo();
        } catch (error) {
            setResultado(t.errorRegisteringSpecies + ' ' + (error as Error).message);
            setGasEstimate("0");
        }
    };

    const registrarEventoClimatico = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!contract) return;
        try {
            const formData = new FormData(event.currentTarget);
            const tipo = formData.get('tipo') as string;
            const temperatura = parseInt(formData.get('temperatura') as string, 10);
            const precipitacion = parseInt(formData.get('precipitacion') as string, 10);

            const estimatedGas = await estimateGas(
                'registrarEventoClimatico',
                tipo,
                temperatura,
                precipitacion
            );

            setGasEstimate(estimatedGas.toString());

            const tx = await contract.registrarEventoClimatico(
                tipo,
                temperatura,
                precipitacion
            );
            await tx.wait();
            setResultado(t.successRegisteringEvent);
            actualizarEstadisticasParamo();
        } catch (error) {
            setResultado(t.errorRegisteringEvent + ' ' + (error as Error).message);
            setGasEstimate("0");
        }
    };

    const obtenerEstadisticasDetalladas = async () => {
        if (!contract) return;
        try {
            const stats = await contract.obtenerEstadisticasDetalladas();
            setEstadisticasDetalladas({
                totalSemillas: Number(stats[0]),
                totalPlantas: Number(stats[1]),
                semillasPorMes: Number(stats[2]),
                plantasPorMes: Number(stats[3])
            });
            setResultado(t.successGettingDetailedStats);
        } catch (error) {
            setResultado(t.errorGettingDetailedStats + ' ' + (error as Error).message);
        }
    };

    const verificarCondicionesClimaticas = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!contract) return;
        try {
            const formData = new FormData(event.currentTarget);
            const idSemilla = parseInt(formData.get('idSemilla') as string);
            const estimatedGas = await estimateGas(
                'verificarCondicionesClimaticas',
                idSemilla
            );
            setGasEstimate(estimatedGas.toString());
            const tx = await contract.verificarCondicionesClimaticas(idSemilla);
            await tx.wait();
            setResultado(t.successVerifyingConditions);
        } catch (error) {
            setResultado(t.errorVerifyingConditions + ' ' + (error as Error).message);
            setGasEstimate("0");
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 pt-2 md:pt-0">
            <form onSubmit={registrarEspecieNativa} className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.registerNativeSpecies}</h3>
                <div>
                    <Label htmlFor="nombre">{t.speciesName}</Label>
                    <Input id="nombre" name="nombre" required />
                </div>
                <div>
                    <Label htmlFor="descripcion">{t.description}</Label>
                    <Textarea id="descripcion" name="descripcion" required />
                </div>
                <div>
                    <Label htmlFor="poblacionEstimada">{t.estimatedPopulation}</Label>
                    <Input id="poblacionEstimada" name="poblacionEstimada" type="number" required />
                </div>
                <Button type="submit" className="w-full text-sm md:text-base py-1 md:py-2">
                    <Leaf className="mr-2 h-4 w-4" /> {t.registerSpeciesButton}
                </Button>
            </form>

            <form onSubmit={registrarEventoClimatico} className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.registerClimaticEvent}</h3>
                <div>
                    <Label htmlFor="tipo">{t.eventType}</Label>
                    <Select name="tipo" required>
                        <SelectTrigger>
                            <SelectValue placeholder={t.selectEventType} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lluvia">Lluvia</SelectItem>
                            <SelectItem value="sequia">Sequía</SelectItem>
                            <SelectItem value="helada">Helada</SelectItem>
                            <SelectItem value="tormenta">Tormenta</SelectItem>
                            <SelectItem value="granizo">Granizo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="temperatura">{t.temperature}</Label>
                    <Input id="temperatura" name="temperatura" type="number" required />
                </div>
                <div>
                    <Label htmlFor="precipitacion">{t.precipitation}</Label>
                    <Input id="precipitacion" name="precipitacion" type="number" required />
                </div>
                <Button type="submit" className="w-full text-sm md:text-base py-1 md:py-2">
                    <CloudRain className="mr-2 h-4 w-4" /> {t.registerEventButton}
                </Button>
            </form>

            <div>
                <h3 className="text-base md:text-lg font-semibold mb-2">{t.paramoStatistics}</h3>
                <Button onClick={actualizarEstadisticasParamo} className="w-full text-sm md:text-base py-1 md:py-2">
                    <BarChart2 className="mr-2 h-4 w-4" /> {t.updateStatisticsButton}
                </Button>
            </div>

            <div>
                <h3 className="text-base md:text-lg font-semibold mb-2">{t.detailedStatistics}</h3>
                <Button onClick={obtenerEstadisticasDetalladas} className="w-full text-sm md:text-base py-1 md:py-2">
                    <BarChart2 className="mr-2 h-4 w-4" /> {t.getDetailedStatsButton}
                </Button>
                {estadisticasDetalladas && (
                    <div className="mt-4 text-sm md:text-base">
                        <p>{t.totalSeeds}: {estadisticasDetalladas.totalSemillas}</p>
                        <p>{t.totalPlants}: {estadisticasDetalladas.totalPlantas}</p>
                        <p>{t.seedsPerMonth}: {estadisticasDetalladas.semillasPorMes}</p>
                        <p>{t.plantsPerMonth}: {estadisticasDetalladas.plantasPorMes}</p>
                    </div>
                )}
            </div>

            <form onSubmit={verificarCondicionesClimaticas} className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.verifyClimaticConditions}</h3>
                <div>
                    <Label htmlFor="idSemilla">{t.seedId}</Label>
                    <Input id="idSemilla" name="idSemilla" type="number" required />
                </div>
                <Button type="submit" className="w-full text-sm md:text-base py-1 md:py-2">
                    <AlertTriangle className="mr-2 h-4 w-4" /> {t.verifyConditionsButton}
                </Button>
            </form>
        </div>
    );
};

export default Biodiversidad;

