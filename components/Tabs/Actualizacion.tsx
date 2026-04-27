import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, MapPin, CloudRain, Send } from 'lucide-react';
import { ViveroInterface } from '../EcoChainComponent';

interface ActualizacionProps {
    contract: ViveroInterface | null;
    setResultado: React.Dispatch<React.SetStateAction<string>>;
    setGasEstimate: React.Dispatch<React.SetStateAction<string>>;
    language: 'es' | 'en' | 'fr' | 'de';
}

const Actualizacion: React.FC<ActualizacionProps> = ({ contract, setResultado, setGasEstimate, language }) => {
    const translations = {
        es: {
            updatePlantState: "Actualizar Estado de Planta",
            plantId: "ID de la Planta",
            newState: "Nuevo Estado",
            updateState: "Actualizar Estado",
            updatePlantLocation: "Actualizar Ubicación de Planta",
            newLatitude: "Nueva Latitud",
            newLongitude: "Nueva Longitud",
            updateLocation: "Actualizar Ubicación",
            updateWeatherConditions: "Actualizar Condiciones Climáticas",
            seedId: "ID de la Semilla",
            temperature: "Temperatura (°C)",
            relativeHumidity: "Humedad Relativa (%)",
            precipitation: "Precipitación (mm)",
            sunlightHours: "Horas de Luz Solar",
            altitude: "Altitud (m)",
            updateWeather: "Actualizar Condiciones Climáticas",
            addComment: "Agregar Comentario",
            comment: "Comentario",
            send: "Enviar",
            stateUpdated: "Estado de la planta actualizado exitosamente",
            stateUpdateError: "Error al actualizar el estado de la planta: ",
            locationUpdated: "Ubicación de la planta actualizada exitosamente",
            locationUpdateError: "Error al actualizar la ubicación de la planta: ",
            weatherUpdated: "Condiciones climáticas actualizadas exitosamente",
            weatherUpdateError: "Error al actualizar las condiciones climáticas: ",
            commentAdded: "Comentario agregado exitosamente",
            commentAddError: "Error al agregar el comentario: "
        },
        en: {
            updatePlantState: "Update Plant State",
            plantId: "Plant ID",
            newState: "New State",
            updateState: "Update State",
            updatePlantLocation: "Update Plant Location",
            newLatitude: "New Latitude",
            newLongitude: "New Longitude",
            updateLocation: "Update Location",
            updateWeatherConditions: "Update Weather Conditions",
            seedId: "Seed ID",
            temperature: "Temperature (°C)",
            relativeHumidity: "Relative Humidity (%)",
            precipitation: "Precipitation (mm)",
            sunlightHours: "Sunlight Hours",
            altitude: "Altitude (m)",
            updateWeather: "Update Weather Conditions",
            addComment: "Add Comment",
            comment: "Comment",
            send: "Send",
            stateUpdated: "Plant state updated successfully",
            stateUpdateError: "Error updating plant state: ",
            locationUpdated: "Plant location updated successfully",
            locationUpdateError: "Error updating plant location: ",
            weatherUpdated: "Weather conditions updated successfully",
            weatherUpdateError: "Error updating weather conditions: ",
            commentAdded: "Comment added successfully",
            commentAddError: "Error adding comment: "
        },
        fr: {
            updatePlantState: "Mettre à jour l'état de la plante",
            plantId: "ID de la plante",
            newState: "Nouvel état",
            updateState: "Mettre à jour l'état",
            updatePlantLocation: "Mettre à jour l'emplacement de la plante",
            newLatitude: "Nouvelle latitude",
            newLongitude: "Nouvelle longitude",
            updateLocation: "Mettre à jour l'emplacement",
            updateWeatherConditions: "Mettre à jour les conditions météorologiques",
            seedId: "ID de la graine",
            temperature: "Température (°C)",
            relativeHumidity: "Humidité relative (%)",
            precipitation: "Précipitations (mm)",
            sunlightHours: "Heures d'ensoleillement",
            altitude: "Altitude (m)",
            updateWeather: "Mettre à jour les conditions météorologiques",
            addComment: "Ajouter un commentaire",
            comment: "Commentaire",
            send: "Envoyer",
            stateUpdated: "État de la plante mis à jour avec succès",
            stateUpdateError: "Erreur lors de la mise à jour de l'état de la plante : ",
            locationUpdated: "Emplacement de la plante mis à jour avec succès",
            locationUpdateError: "Erreur lors de la mise à jour de l'emplacement de la plante : ",
            weatherUpdated: "Conditions météorologiques mises à jour avec succès",
            weatherUpdateError: "Erreur lors de la mise à jour des conditions météorologiques : ",
            commentAdded: "Commentaire ajouté avec succès",
            commentAddError: "Erreur lors de l'ajout du commentaire : "
        },
        de: {
            updatePlantState: "Pflanzenzustand aktualisieren",
            plantId: "Pflanzen-ID",
            newState: "Neuer Zustand",
            updateState: "Zustand aktualisieren",
            updatePlantLocation: "Pflanzenstandort aktualisieren",
            newLatitude: "Neue Breite",
            newLongitude: "Neue Länge",
            updateLocation: "Standort aktualisieren",
            updateWeatherConditions: "Wetterbedingungen aktualisieren",
            seedId: "Samen-ID",
            temperature: "Temperatur (°C)",
            relativeHumidity: "Relative Luftfeuchtigkeit (%)",
            precipitation: "Niederschlag (mm)",
            sunlightHours: "Sonnenstunden",
            altitude: "Höhe (m)",
            updateWeather: "Wetterbedingungen aktualisieren",
            addComment: "Kommentar hinzufügen",
            comment: "Kommentar",
            send: "Senden",
            stateUpdated: "Pflanzenzustand erfolgreich aktualisiert",
            stateUpdateError: "Fehler beim Aktualisieren des Pflanzenzustands: ",
            locationUpdated: "Pflanzenstandort erfolgreich aktualisiert",
            locationUpdateError: "Fehler beim Aktualisieren des Pflanzenstandorts: ",
            weatherUpdated: "Wetterbedingungen erfolgreich aktualisiert",
            weatherUpdateError: "Fehler beim Aktualisieren der Wetterbedingungen: ",
            commentAdded: "Kommentar erfolgreich hinzugefügt",
            commentAddError: "Fehler beim Hinzufügen des Kommentars: "
        }
    };

    const t = translations[language];

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

    const actualizarEstadoPlanta = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!contract) return;
        try {
            const formData = new FormData(event.currentTarget);
            const idPlanta = parseInt(formData.get('idPlanta') as string);
            const nuevoEstado = formData.get('nuevoEstado') as string;

            const estimatedGas = await estimateGas(
                'actualizarEstadoPlantaYCrecimiento',
                idPlanta,
                nuevoEstado
            );

            setGasEstimate(estimatedGas);

            const tx = await contract.actualizarEstadoPlantaYCrecimiento(idPlanta, nuevoEstado);
            await tx.wait();
            setResultado(t.stateUpdated);
        } catch (error) {
            setResultado(t.stateUpdateError + (error as Error).message);
        }
    };

    const actualizarUbicacionPlanta = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!contract) return;
        try {
            const formData = new FormData(event.currentTarget);
            const idPlanta = parseInt(formData.get('idPlanta') as string);
            const latitud = parseInt(formData.get('latitud') as string);
            const longitud = parseInt(formData.get('longitud') as string);

            const estimatedGas = await estimateGas(
                'actualizarUbicacionPlantaEnParamo',
                idPlanta,
                { latitud, longitud }
            );

            setGasEstimate(estimatedGas);

            const tx = await contract.actualizarUbicacionPlantaEnParamo(idPlanta, { latitud, longitud });
            await tx.wait();
            setResultado(t.locationUpdated);
        } catch (error) {
            setResultado(t.locationUpdateError + (error as Error).message);
        }
    };

    const actualizarCondicionesClimaticas = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!contract) return;
        try {
            const formData = new FormData(event.currentTarget);
            const idSemilla = parseInt(formData.get('idSemilla') as string);
            const temperatura = parseInt(formData.get('temperatura') as string);
            const humedadRelativa = parseInt(formData.get('humedadRelativa') as string);
            const precipitacion = parseInt(formData.get('precipitacion') as string);
            const horasLuzSolar = parseInt(formData.get('horasLuzSolar') as string);
            const altitud = parseInt(formData.get('altitud') as string);

            const nuevasCondiciones = {
                temperatura,
                humedadRelativa,
                precipitacion,
                horasLuzSolar,
                altitud,
                fechaRegistro: { timestamp: Math.floor(Date.now() / 1000) }
            };

            const estimatedGas = await estimateGas(
                'actualizarCondicionesClimaticas',
                idSemilla,
                nuevasCondiciones
            );

            setGasEstimate(estimatedGas);

            const tx = await contract.actualizarCondicionesClimaticas(idSemilla, nuevasCondiciones);
            await tx.wait();
            setResultado(t.weatherUpdated);
        } catch (error) {
            setResultado(t.weatherUpdateError + (error as Error).message);
        }
    };

    const agregarComentario = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!contract) return;
        try {
            const formData = new FormData(event.currentTarget);
            const idSemilla = parseInt(formData.get('idSemilla') as string);
            const comentario = formData.get('comentario') as string;

            const estimatedGas = await estimateGas(
                'agregarComentario',
                idSemilla,
                comentario
            );

            setGasEstimate(estimatedGas);

            const tx = await contract.agregarComentario(idSemilla, comentario);
            await tx.wait();
            setResultado(t.commentAdded);
        } catch (error) {
            setResultado(t.commentAddError + (error as Error).message);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 pt-2 md:pt-0">
            <form onSubmit={actualizarEstadoPlanta} className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.updatePlantState}</h3>
                <div>
                    <Label htmlFor="idPlanta">{t.plantId}</Label>
                    <Input id="idPlanta" name="idPlanta" type="number" required />
                </div>
                <div>
                    <Label htmlFor="nuevoEstado">{t.newState}</Label>
                    <Input id="nuevoEstado" name="nuevoEstado" required />
                </div>
                <Button type="submit" className="w-full text-sm md:text-base py-1 md:py-2">
                    <RefreshCw className="mr-2 h-4 w-4" /> {t.updateState}
                </Button>
            </form>

            <form onSubmit={actualizarUbicacionPlanta} className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.updatePlantLocation}</h3>
                <div>
                    <Label htmlFor="idPlanta">{t.plantId}</Label>
                    <Input id="idPlanta" name="idPlanta" type="number" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                        <Label htmlFor="latitud">{t.newLatitude}</Label>
                        <Input id="latitud" name="latitud" type="number" required />
                    </div>
                    <div>
                        <Label htmlFor="longitud">{t.newLongitude}</Label>
                        <Input id="longitud" name="longitud" type="number" required />
                    </div>
                </div>
                <Button type="submit" className="w-full text-sm md:text-base py-1 md:py-2">
                    <MapPin className="mr-2 h-4 w-4" /> {t.updateLocation}
                </Button>
            </form>

            <form onSubmit={actualizarCondicionesClimaticas} className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.updateWeatherConditions}</h3>
                <div>
                    <Label htmlFor="idSemilla">{t.seedId}</Label>
                    <Input id="idSemilla" name="idSemilla" type="number" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                        <Label htmlFor="temperatura">{t.temperature}</Label>
                        <Input id="temperatura" name="temperatura" type="number" required />
                    </div>
                    <div>
                        <Label htmlFor="humedadRelativa">{t.relativeHumidity}</Label>
                        <Input id="humedadRelativa" name="humedadRelativa" type="number" required />
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
                    <Input id="altitud" name="altitud" type="number" required />
                </div>
                <Button type="submit" className="w-full text-sm md:text-base py-1 md:py-2">
                    <CloudRain className="mr-2 h-4 w-4" /> {t.updateWeather}
                </Button>
            </form>

            <form onSubmit={agregarComentario} className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.addComment}</h3>
                <div>
                    <Label htmlFor="idSemilla">{t.seedId}</Label>
                    <Input id="idSemilla" name="idSemilla" type="number" required />
                </div>
                <div>
                    <Label htmlFor="comentario">{t.comment}</Label>
                    <Textarea id="comentario" name="comentario" required />
                </div>
                <Button type="submit" className="w-full text-sm md:text-base py-1 md:py-2">
                    <Send className="mr-2 h-4 w-4" /> {t.send}
                </Button>
            </form>
        </div>
    );
};

export default Actualizacion;

