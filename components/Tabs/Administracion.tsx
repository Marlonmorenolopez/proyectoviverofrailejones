import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Lock, Unlock, UserPlus, UserMinus, Trash } from 'lucide-react';
import { ViveroInterface } from '../EcoChainComponent';

interface AdministracionProps {
    contract: ViveroInterface | null;
    setResultado: React.Dispatch<React.SetStateAction<string>>;
    setGasEstimate: React.Dispatch<React.SetStateAction<string>>;
    language: 'es' | 'en' | 'fr' | 'de';
}

const Administracion: React.FC<AdministracionProps> = ({ contract, setResultado, setGasEstimate, language }) => {
    const [newOwnerAddress, setNewOwnerAddress] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const [newAdminAddress, setNewAdminAddress] = useState('');
    const [removeAdminAddress, setRemoveAdminAddress] = useState('');

    const translations = {
        es: {
            transferOwnership: "Transferir Propiedad",
            newOwnerAddress: "Nueva Dirección del Propietario",
            transferButton: "Transferir Propiedad",
            pauseUnpauseContract: "Pausar/Despausar Contrato",
            pauseButton: "Pausar Contrato",
            unpauseButton: "Despausar Contrato",
            addAdmin: "Agregar Administrador",
            newAdminAddress: "Dirección del Nuevo Administrador",
            addAdminButton: "Agregar Administrador",
            removeAdmin: "Remover Administrador",
            removeAdminAddress: "Dirección del Administrador a Remover",
            removeAdminButton: "Remover Administrador",
            deleteSeed: "Eliminar Semilla",
            seedId: "ID de la Semilla",
            deleteSeedButton: "Eliminar Semilla",
            deletePlant: "Eliminar Planta",
            plantId: "ID de la Planta",
            deletePlantButton: "Eliminar Planta",
            successTransfer: "Propiedad transferida exitosamente",
            errorTransfer: "Error al transferir la propiedad:",
            successPause: "Contrato pausado exitosamente",
            errorPause: "Error al pausar el contrato:",
            successUnpause: "Contrato despausado exitosamente",
            errorUnpause: "Error al despausar el contrato:",
            successAddAdmin: "Administrador agregado exitosamente",
            errorAddAdmin: "Error al agregar administrador:",
            successRemoveAdmin: "Administrador removido exitosamente",
            errorRemoveAdmin: "Error al remover administrador:",
            successDeleteSeed: "Semilla eliminada exitosamente",
            errorDeleteSeed: "Error al eliminar la semilla:",
            successDeletePlant: "Planta eliminada exitosamente",
            errorDeletePlant: "Error al eliminar la planta:"
        },
        en: {
            transferOwnership: "Transfer Ownership",
            newOwnerAddress: "New Owner Address",
            transferButton: "Transfer Ownership",
            pauseUnpauseContract: "Pause/Unpause Contract",
            pauseButton: "Pause Contract",
            unpauseButton: "Unpause Contract",
            addAdmin: "Add Administrator",
            newAdminAddress: "New Administrator Address",
            addAdminButton: "Add Administrator",
            removeAdmin: "Remove Administrator",
            removeAdminAddress: "Administrator Address to Remove",
            removeAdminButton: "Remove Administrator",
            deleteSeed: "Delete Seed",
            seedId: "Seed ID",
            deleteSeedButton: "Delete Seed",
            deletePlant: "Delete Plant",
            plantId: "Plant ID",
            deletePlantButton: "Delete Plant",
            successTransfer: "Ownership transferred successfully",
            errorTransfer: "Error transferring ownership:",
            successPause: "Contract paused successfully",
            errorPause: "Error pausing the contract:",
            successUnpause: "Contract unpaused successfully",
            errorUnpause: "Error unpausing the contract:",
            successAddAdmin: "Administrator added successfully",
            errorAddAdmin: "Error adding administrator:",
            successRemoveAdmin: "Administrator removed successfully",
            errorRemoveAdmin: "Error removing administrator:",
            successDeleteSeed: "Seed deleted successfully",
            errorDeleteSeed: "Error deleting the seed:",
            successDeletePlant: "Plant deleted successfully",
            errorDeletePlant: "Error deleting the plant:"
        },
        fr: {
            transferOwnership: "Transférer la Propriété",
            newOwnerAddress: "Nouvelle Adresse du Propriétaire",
            transferButton: "Transférer la Propriété",
            pauseUnpauseContract: "Mettre en Pause/Reprendre le Contrat",
            pauseButton: "Mettre en Pause le Contrat",
            unpauseButton: "Reprendre le Contrat",
            addAdmin: "Ajouter un Administrateur",
            newAdminAddress: "Adresse du Nouvel Administrateur",
            addAdminButton: "Ajouter un Administrateur",
            removeAdmin: "Supprimer un Administrateur",
            removeAdminAddress: "Adresse de l'Administrateur à Supprimer",
            removeAdminButton: "Supprimer l'Administrateur",
            deleteSeed: "Supprimer une Graine",
            seedId: "ID de la Graine",
            deleteSeedButton: "Supprimer la Graine",
            deletePlant: "Supprimer une Plante",
            plantId: "ID de la Plante",
            deletePlantButton: "Supprimer la Plante",
            successTransfer: "Propriété transférée avec succès",
            errorTransfer: "Erreur lors du transfert de propriété :",
            successPause: "Contrat mis en pause avec succès",
            errorPause: "Erreur lors de la mise en pause du contrat :",
            successUnpause: "Contrat repris avec succès",
            errorUnpause: "Erreur lors de la reprise du contrat :",
            successAddAdmin: "Administrateur ajouté avec succès",
            errorAddAdmin: "Erreur lors de l'ajout de l'administrateur :",
            successRemoveAdmin: "Administrateur supprimé avec succès",
            errorRemoveAdmin: "Erreur lors de la suppression de l'administrateur :",
            successDeleteSeed: "Graine supprimée avec succès",
            errorDeleteSeed: "Erreur lors de la suppression de la graine :",
            successDeletePlant: "Plante supprimée avec succès",
            errorDeletePlant: "Erreur lors de la suppression de la plante :"
        },
        de: {
            transferOwnership: "Eigentum übertragen",
            newOwnerAddress: "Neue Eigentümeradresse",
            transferButton: "Eigentum übertragen",
            pauseUnpauseContract: "Vertrag pausieren/fortsetzen",
            pauseButton: "Vertrag pausieren",
            unpauseButton: "Vertrag fortsetzen",
            addAdmin: "Administrator hinzufügen",
            newAdminAddress: "Adresse des neuen Administrators",
            addAdminButton: "Administrator hinzufügen",
            removeAdmin: "Administrator entfernen",
            removeAdminAddress: "Zu entfernende Administratoradresse",
            removeAdminButton: "Administrator entfernen",
            deleteSeed: "Samen löschen",
            seedId: "Samen-ID",
            deleteSeedButton: "Samen löschen",
            deletePlant: "Pflanze löschen",
            plantId: "Pflanzen-ID",
            deletePlantButton: "Pflanze löschen",
            successTransfer: "Eigentum erfolgreich übertragen",
            errorTransfer: "Fehler beim Übertragen des Eigentums:",
            successPause: "Vertrag erfolgreich pausiert",
            errorPause: "Fehler beim Pausieren des Vertrags:",
            successUnpause: "Vertrag erfolgreich fortgesetzt",
            errorUnpause: "Fehler beim Fortsetzen des Vertrags:",
            successAddAdmin: "Administrator erfolgreich hinzugefügt",
            errorAddAdmin: "Fehler beim Hinzufügen des Administrators:",
            successRemoveAdmin: "Administrator erfolgreich entfernt",
            errorRemoveAdmin: "Fehler beim Entfernen des Administrators:",
            successDeleteSeed: "Samen erfolgreich gelöscht",
            errorDeleteSeed: "Fehler beim Löschen des Samens:",
            successDeletePlant: "Pflanze erfolgreich gelöscht",
            errorDeletePlant: "Fehler beim Löschen der Pflanze:"
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

    const transferirPropiedad = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!contract) return;
        try {
            const estimatedGas = await estimateGas(
                'transferirPropiedad',
                newOwnerAddress
            );

            setGasEstimate(estimatedGas);

            const tx = await contract.transferirPropiedad(newOwnerAddress);
            await tx.wait();
            setResultado(t.successTransfer);
        } catch (error) {
            setResultado(t.errorTransfer + ' ' + (error as Error).message);
        }
    };

    const pausarContrato = async () => {
        if (!contract) return;
        try {
            const estimatedGas = await estimateGas('pausar');
            setGasEstimate(estimatedGas);
            const tx = await contract.pausar();
            await tx.wait();
            setIsPaused(true);
            setResultado(t.successPause);
        } catch (error) {
            setResultado(t.errorPause + ' ' + (error as Error).message);
        }
    };

    const despausarContrato = async () => {
        if (!contract) return;
        try {
            const estimatedGas = await estimateGas('despausar');
            setGasEstimate(estimatedGas);
            const tx = await contract.despausar();
            await tx.wait();
            setIsPaused(false);
            setResultado(t.successUnpause);
        } catch (error) {
            setResultado(t.errorUnpause + ' ' + (error as Error).message);
        }
    };

    const agregarAdministrador = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!contract) return;
        try {
            const estimatedGas = await estimateGas('agregarAdministrador', newAdminAddress);
            setGasEstimate(estimatedGas);
            const tx = await contract.agregarAdministrador(newAdminAddress);
            await tx.wait();
            setResultado(t.successAddAdmin);
            setNewAdminAddress('');
        } catch (error) {
            setResultado(t.errorAddAdmin + ' ' + (error as Error).message);
        }
    };

    const removerAdministrador = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!contract) return;
        try {
            const estimatedGas = await estimateGas('removerAdministrador', removeAdminAddress);
            setGasEstimate(estimatedGas);
            const tx = await contract.removerAdministrador(removeAdminAddress);
            await tx.wait();
            setResultado(t.successRemoveAdmin);
            setRemoveAdminAddress('');
        } catch (error) {
            setResultado(t.errorRemoveAdmin + ' ' + (error as Error).message);
        }
    };

    const eliminarSemilla = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!contract) return;
        try {
            const formData = new FormData(event.currentTarget);
            const idSemilla = parseInt(formData.get('idSemilla') as string);

            const estimatedGas = await estimateGas(
                'eliminarSemilla',
                idSemilla
            );

            setGasEstimate(estimatedGas);

            const tx = await contract.eliminarSemilla(idSemilla);
            await tx.wait();
            setResultado(t.successDeleteSeed);
        } catch (error) {
            setResultado(t.errorDeleteSeed + ' ' + (error as Error).message);
        }
    };

    const eliminarPlanta = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!contract) return;
        try {
            const formData = new FormData(event.currentTarget);
            const idPlanta = parseInt(formData.get('idPlanta') as string);

            const estimatedGas = await estimateGas(
                'eliminarPlanta',
                idPlanta
            );

            setGasEstimate(estimatedGas);

            const tx = await contract.eliminarPlanta(idPlanta);
            await tx.wait();
            setResultado(t.successDeletePlant);
        } catch (error) {
            setResultado(t.errorDeletePlant + ' ' + (error as Error).message);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 pt-2 md:pt-0">
            <form onSubmit={transferirPropiedad} className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.transferOwnership}</h3>
                <div>
                    <Label htmlFor="newOwnerAddress">{t.newOwnerAddress}</Label>
                    <Input
                        id="newOwnerAddress"
                        value={newOwnerAddress}
                        onChange={(e) => setNewOwnerAddress(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit" className="w-full text-sm md:text-base py-1 md:py-2">
                    <Users className="mr-2 h-4 w-4" /> {t.transferButton}
                </Button>
            </form>

            <div className="space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.pauseUnpauseContract}</h3>
                <Button onClick={pausarContrato} className="w-full text-sm md:text-base py-1 md:py-2" disabled={isPaused}>
                    <Lock className="mr-2 h-4 w-4" /> {t.pauseButton}
                </Button>
                <Button onClick={despausarContrato} className="w-full text-sm md:text-base py-1 md:py-2" disabled={!isPaused}>
                    <Unlock className="mr-2 h-4 w-4" /> {t.unpauseButton}
                </Button>
            </div>

            <form onSubmit={agregarAdministrador} className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.addAdmin}</h3>
                <div>
                    <Label htmlFor="newAdminAddress">{t.newAdminAddress}</Label>
                    <Input
                        id="newAdminAddress"
                        value={newAdminAddress}
                        onChange={(e) => setNewAdminAddress(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit" className="w-full text-sm md:text-base py-1 md:py-2">
                    <UserPlus className="mr-2 h-4 w-4" /> {t.addAdminButton}
                </Button>
            </form>

            <form onSubmit={removerAdministrador} className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.removeAdmin}</h3>
                <div>
                    <Label htmlFor="removeAdminAddress">{t.removeAdminAddress}</Label>
                    <Input
                        id="removeAdminAddress"
                        value={removeAdminAddress}
                        onChange={(e) => setRemoveAdminAddress(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit" className="w-full text-sm md:text-base py-1 md:py-2">
                    <UserMinus className="mr-2 h-4 w-4" /> {t.removeAdminButton}
                </Button>
            </form>

            <form onSubmit={eliminarSemilla} className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.deleteSeed}</h3>
                <div>
                    <Label htmlFor="idSemilla">{t.seedId}</Label>
                    <Input id="idSemilla" name="idSemilla" type="number" required />
                </div>
                <Button type="submit" className="w-full text-sm md:text-base py-1 md:py-2">
                    <Trash className="mr-2 h-4 w-4" /> {t.deleteSeedButton}
                </Button>
            </form>

            <form onSubmit={eliminarPlanta} className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.deletePlant}</h3>
                <div>
                    <Label htmlFor="idPlanta">{t.plantId}</Label>
                    <Input id="idPlanta" name="idPlanta" type="number" required />
                </div>
                <Button type="submit" className="w-full text-sm md:text-base py-1 md:py-2">
                    <Trash className="mr-2 h-4 w-4" /> {t.deletePlantButton}
                </Button>
            </form>
        </div>
    );
};

export default Administracion;

