import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, History, List, Filter } from 'lucide-react';
import { ViveroInterface } from '../EcoChainComponent';

interface ConsultaProps {
    contract: ViveroInterface | null;
    setResultado: React.Dispatch<React.SetStateAction<string>>;
    language: 'es' | 'en' | 'fr' | 'de';
}

const Consulta: React.FC<ConsultaProps> = ({ contract, setResultado, language }) => {
    const [semillaId, setSemillaId] = useState('');
    const [plantaId, setPlantaId] = useState('');
    const [responsableFilter, setResponsableFilter] = useState('');
    const [semillasFiltradas, setSemillasFiltradas] = useState<number[]>([]);

    const translations = {
        es: {
            title: "Consulta",
            seedQuery: "Consultar Semilla",
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
            seedsFound: "Semillas encontradas:"
        },
        en: {
            title: "Query",
            seedQuery: "Query Seed",
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
            seedsFound: "Seeds found:"
        },
        fr: {
            title: "Consultation",
            seedQuery: "Consulter une Graine",
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
            errorGettingHistory: "Erreur lors de l'obtention de l'historique de croissance :",
            errorGettingAllSeeds: "Erreur lors de l'obtention de toutes les graines :",
            errorSearchingSeeds: "Erreur lors de la recherche de graines par responsable :",
            seedsFound: "Graines trouvées :"
        },
        de: {
            title: "Abfrage",
            seedQuery: "Samen abfragen",
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
            errorGettingHistory: "Fehler beim Abrufen des Wachstumsverlaufs:",
            errorGettingAllSeeds: "Fehler beim Abrufen aller Samen:",
            errorSearchingSeeds: "Fehler bei der Suche nach Samen nach Verantwortlichem:",
            seedsFound: "Gefundene Samen:"
        }
    };

    const t = translations[language];

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    };

    const bigIntToString = (obj: any): any => {
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
    };

    const obtenerSemilla = async () => {
        if (!contract || !semillaId) return;
        try {
            const semillaIdParsed = parseInt(semillaId);
            const semilla = await contract.obtenerSemilla(semillaIdParsed);
            const {
                id,
                tipo,
                ubicacionInicial,
                responsable,
                condicionesClimaticas,
                comentariosDeCuidado,
                fechaRegistro
            } = semilla;

            const ubicacionInicialString = `(${ubicacionInicial.latitud}, ${ubicacionInicial.longitud})`;
            const condicionesClimaticasString = `Temperatura: ${condicionesClimaticas.temperatura}°C, Humedad relativa: ${condicionesClimaticas.humedadRelativa}%, Precipitación: ${condicionesClimaticas.precipitacion}mm, Horas de luz solar: ${condicionesClimaticas.horasLuzSolar}h, Altitud: ${condicionesClimaticas.altitud}m`;

            setResultado(`
                ID: ${id}
                Tipo: ${tipo}
                Ubicación inicial: ${ubicacionInicialString}
                Responsable: ${responsable}
                Condiciones climáticas: ${condicionesClimaticasString}
                Comentarios de cuidado: ${comentariosDeCuidado}
                Fecha de registro: ${formatTimestamp(Number(fechaRegistro.timestamp))}
            `);
        } catch (error) {
            console.error(t.errorGettingSeed, error);
            setResultado(t.errorGettingSeed + ' ' + (error as Error).message);
        }
    };

    const obtenerHistorialCrecimiento = async () => {
        if (!contract || !plantaId) return;
        try {
            const plantaIdParsed = parseInt(plantaId);
            const historial = await contract.obtenerHistorialDeCambios(plantaIdParsed);
            setResultado(t.growthHistory + ': ' + JSON.stringify(bigIntToString(historial), null, 2));
        } catch (error) {
            setResultado(t.errorGettingHistory + ' ' + (error as Error).message);
        }
    };

    const obtenerTodasLasSemillas = async () => {
        if (!contract) return;
        try {
            const semillas = await contract.obtenerTodasLasSemillas();
            setResultado(t.allSeeds + ': ' + JSON.stringify(bigIntToString(semillas), null, 2));
        } catch (error) {
            setResultado(t.errorGettingAllSeeds + ' ' + (error as Error).message);
        }
    };

    const buscarSemillasPorResponsable = async () => {
        if (!contract || !responsableFilter) return;
        try {
            const semillasIds = await contract.buscarSemillasPorResponsable(responsableFilter);
            setSemillasFiltradas(semillasIds.map(Number));
            setResultado(t.seedsFound + ' ' + semillasIds.join(', '));
        } catch (error) {
            setResultado(t.errorSearchingSeeds + ' ' + (error as Error).message);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 pt-2 md:pt-0">
            <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.seedQuery}</h3>
                <div>
                    <Label htmlFor="semillaId">{t.seedId}</Label>
                    <Input
                        id="semillaId"
                        value={semillaId}
                        onChange={(e) => setSemillaId(e.target.value)}
                        type="number"
                    />
                </div>
                <Button onClick={obtenerSemilla} className="w-full text-sm md:text-base py-1 md:py-2">
                    <Search className="mr-2 h-4 w-4" /> {t.queryButton}
                </Button>
            </div>

            <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.growthHistory}</h3>
                <div>
                    <Label htmlFor="plantaId">{t.plantId}</Label>
                    <Input
                        id="plantaId"
                        value={plantaId}
                        onChange={(e) => setPlantaId(e.target.value)}
                        type="number"
                    />
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
                    <Input
                        id="responsableFilter"
                        value={responsableFilter}
                        onChange={(e) => setResponsableFilter(e.target.value)}
                    />
                </div>
                <Button onClick={buscarSemillasPorResponsable} className="w-full text-sm md:text-base py-1 md:py-2">
                    <Filter className="mr-2 h-4 w-4" /> {t.searchButton}
                </Button>
            </div>
        </div>
    );
};

export default Consulta;

