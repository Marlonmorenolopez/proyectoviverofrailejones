"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaCamera, FaDownload, FaImage, FaPlay, FaPause } from 'react-icons/fa';
import nftABI from '@/abis/nftABI.json';

// ─── Tipos ────────────────────────────────────────────────────────────────

interface PlantTransferModalProps {
  isOpen:          boolean;
  onOpenChange:    (open: boolean) => void;
  seedId:          string | null;
  capturedImage:   string | null;
  // Datos de la planta para el NFT
  idPlanta?:       number;
  idSemilla?:      number;
  especie?:        string;
  responsable?:    string;
  latitud?:        number;
  longitud?:       number;
  temperatura?:    number;
  humedad?:        number;
  altitud?:        number;
  // Wallet conectada
  signer?:         ethers.Signer | null;
  chainId?:        number;
}

// ─── Estados del proceso NFT ──────────────────────────────────────────────

type EstadoNFT =
  | "idle"            // sin hacer nada
  | "subiendo_foto"   // subiendo imagen a IPFS (Pinata)
  | "subiendo_meta"   // subiendo metadata JSON a IPFS
  | "minteando"       // llamando al contrato ERC-721
  | "subiendo_video"  // subiendo video a IPFS (opcional)
  | "listo"           // NFT acuñado con éxito
  | "error";          // algo falló

// ─── Dirección del contrato NFT según red ────────────────────────────────

const NFT_ADDRESSES: Record<number, string> = {
  1337:     process.env.NEXT_PUBLIC_NFT_ADDRESS_GANACHE  || "",
  11155111: process.env.NEXT_PUBLIC_NFT_ADDRESS_SEPOLIA  || "",
};

// ─── Pinata API (IPFS) ────────────────────────────────────────────────────
// Crea tu cuenta gratis en https://pinata.cloud y agrega tus keys al .env

const PINATA_API_KEY    = process.env.NEXT_PUBLIC_PINATA_API_KEY    || "";
const PINATA_API_SECRET = process.env.NEXT_PUBLIC_PINATA_API_SECRET || "";
const PINATA_JWT        = process.env.NEXT_PUBLIC_PINATA_JWT        || "";

// ─── Componente ───────────────────────────────────────────────────────────

const PlantTransferModal: React.FC<PlantTransferModalProps> = ({
  isOpen,
  onOpenChange,
  seedId,
  capturedImage,
  idPlanta       = 0,
  idSemilla      = 0,
  especie        = "Frailejon",
  responsable    = "Responsable",
  latitud        = 0,
  longitud       = 0,
  temperatura    = 0,
  humedad        = 0,
  altitud        = 3200,
  signer         = null,
  chainId        = 1337,
}) => {

  // ── Estados de cámara (tu código original, sin cambios) ───────────────
  const [isCameraActive, setIsCameraActive]   = useState(false);
  const [capturedImageState, setCapturedImageState] = useState<string | null>(null);
  const [isRecording, setIsRecording]         = useState(false);
  const [recordedVideo, setRecordedVideo]     = useState<string | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [isMobile, setIsMobile]               = useState(false);

  // ── Estados del proceso NFT ───────────────────────────────────────────
  const [estadoNFT, setEstadoNFT]           = useState<EstadoNFT>("idle");
  const [tokenIdAcunado, setTokenIdAcunado] = useState<number | null>(null);
  const [ipfsImageHash, setIpfsImageHash]   = useState<string>("");
  const [ipfsVideoHash, setIpfsVideoHash]   = useState<string>("");
  const [mensajeNFT, setMensajeNFT]         = useState<string>("");
  const [errorNFT, setErrorNFT]             = useState<string>("");

  // ── Refs (tu código original, sin cambios) ────────────────────────────
  const videoRef        = useRef<HTMLVideoElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef       = useRef<Blob[]>([]);
  const fileInputRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Lógica de cámara (tu código original, sin cambios) ───────────────

  const handleDataAvailable = useCallback((event: BlobEvent) => {
    if (event.data.size > 0) chunksRef.current.push(event.data);
  }, []);

  const handleStop = useCallback(() => {
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    setRecordedVideo(URL.createObjectURL(blob));
    chunksRef.current = [];
  }, []);

  const activateCamera = useCallback(() => {
    if (isMobile) {
      fileInputRef.current?.click();
    } else {
      setIsCameraActive(true);
      if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              mediaRecorderRef.current = new MediaRecorder(stream);
              mediaRecorderRef.current.ondataavailable = handleDataAvailable;
              mediaRecorderRef.current.onstop = handleStop;
            }
          })
          .catch(err => console.error("Error accessing camera:", err));
      }
    }
  }, [isMobile, handleDataAvailable, handleStop]);

  const handleMobileCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCapturedImageState(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const deactivateCamera = useCallback(() => {
    setIsCameraActive(false);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    setIsRecording(false);
  }, []);

  useEffect(() => {
    if (!isOpen) deactivateCamera();
  }, [isOpen, deactivateCamera]);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        setCapturedImageState(canvasRef.current.toDataURL('image/png'));
        // Resetear NFT cuando se toma nueva foto
        setEstadoNFT("idle");
        setTokenIdAcunado(null);
        setIpfsImageHash("");
      }
    }
  }, []);

  const startRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      setIsRecording(true);
      mediaRecorderRef.current.start();
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      setIsRecording(false);
      mediaRecorderRef.current.stop();
    }
  }, []);

  const downloadVideo = useCallback(() => {
    if (recordedVideo) {
      const a = document.createElement('a');
      a.href = recordedVideo;
      a.download = 'planta-paramo.webm';
      a.click();
    }
  }, [recordedVideo]);

  const downloadImage = useCallback(() => {
    if (capturedImageState) {
      const link = document.createElement('a');
      link.href = capturedImageState;
      link.download = `planta-${especie}-${idPlanta}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [capturedImageState, especie, idPlanta]);

  // ─────────────────────────────────────────────────────────────────────
  //  FUNCIONES NFT — NUEVAS
  // ─────────────────────────────────────────────────────────────────────

  // Convierte un dataURL (base64) a Blob para subirlo a Pinata
  const dataURLaBlob = (dataURL: string): Blob => {
    const [header, data] = dataURL.split(',');
    const mime  = header.match(/:(.*?);/)![1];
    const bytes = atob(data);
    const arr   = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  // Sube un archivo a IPFS via Pinata y devuelve el hash
  const subirArchivoIPFS = async (blob: Blob, nombre: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', blob, nombre);
    formData.append('pinataMetadata', JSON.stringify({ name: nombre }));
    formData.append('pinataOptions',  JSON.stringify({ cidVersion: 1 }));

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        // Usa JWT (recomendado) o API Key + Secret
        ...(PINATA_JWT
          ? { Authorization: `Bearer ${PINATA_JWT}` }
          : { pinata_api_key: PINATA_API_KEY, pinata_secret_api_key: PINATA_API_SECRET }
        )
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Error Pinata: ${err}`);
    }

    const data = await response.json();
    return data.IpfsHash; // ej: "QmXxxxx..."
  };

  // Sube el JSON de metadata a IPFS y devuelve el hash
  const subirMetadataIPFS = async (imageHash: string, videoHash?: string): Promise<string> => {
    const fechaISO = new Date().toISOString().split('T')[0];

    const metadata = {
      name:        `${especie} #${idPlanta} — Páramo`,
      description: `Certificado de conservación del páramo colombiano. ${especie} trasladada por ${responsable} el ${fechaISO}. Verificado en blockchain.`,
      image:       `ipfs://${imageHash}`,
      // Si tiene video, se agrega como animation_url (compatible con OpenSea)
      ...(videoHash ? { animation_url: `ipfs://${videoHash}` } : {}),
      external_url: `https://tu-proyecto-vivero.com/planta/${idPlanta}`,
      attributes: [
        { trait_type: "Especie",        value: especie },
        { trait_type: "ID Planta",      value: idPlanta.toString() },
        { trait_type: "Responsable",    value: responsable },
        { trait_type: "Altitud (m)",    value: altitud.toString() },
        { trait_type: "Temperatura",    value: `${temperatura / 10}°C` },
        { trait_type: "Humedad",        value: `${humedad}%` },
        { trait_type: "Latitud",        value: (latitud / 1_000_000).toFixed(6) },
        { trait_type: "Longitud",       value: (longitud / 1_000_000).toFixed(6) },
        { trait_type: "Fecha",          value: fechaISO },
        { trait_type: "Verificado",     value: chainId === 11155111 ? "Chainlink Oracle" : "Manual" },
        { trait_type: "Tiene Video",    value: videoHash ? "Sí" : "No" },
      ]
    };

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(PINATA_JWT
          ? { Authorization: `Bearer ${PINATA_JWT}` }
          : { pinata_api_key: PINATA_API_KEY, pinata_secret_api_key: PINATA_API_SECRET }
        )
      },
      body: JSON.stringify({
        pinataContent:  metadata,
        pinataMetadata: { name: `metadata-planta-${idPlanta}.json` },
      }),
    });

    if (!response.ok) throw new Error("Error subiendo metadata a IPFS");
    const data = await response.json();
    return data.IpfsHash;
  };

  // Función principal: foto → IPFS → contrato NFT
  const crearNFT = async () => {
    if (!capturedImageState) {
      setErrorNFT("❌ Primero toma una foto de la planta.");
      return;
    }
    if (!signer) {
      setErrorNFT("❌ Conecta tu wallet primero.");
      return;
    }

    const nftAddress = NFT_ADDRESSES[chainId];
    if (!nftAddress) {
      setErrorNFT("❌ Contrato NFT no configurado para esta red. Revisa tu .env");
      return;
    }

    setErrorNFT("");

    try {
      // ── Paso 1: Subir foto a IPFS ────────────────────────────
      setEstadoNFT("subiendo_foto");
      setMensajeNFT("📤 Subiendo foto a IPFS (Pinata)...");

      const imagenBlob  = dataURLaBlob(capturedImageState);
      const imageHash   = await subirArchivoIPFS(imagenBlob, `planta-${especie}-${idPlanta}.png`);
      setIpfsImageHash(imageHash);
      setMensajeNFT(`✅ Foto subida: ${imageHash.slice(0, 12)}...`);

      // ── Paso 2 (opcional): Subir video a IPFS ───────────────
      let videoHash = "";
      if (recordedVideo) {
        setEstadoNFT("subiendo_video");
        setMensajeNFT("📤 Subiendo video a IPFS...");
        const videoBlob = await fetch(recordedVideo).then(r => r.blob());
        videoHash = await subirArchivoIPFS(videoBlob, `video-${especie}-${idPlanta}.webm`);
        setIpfsVideoHash(videoHash);
        setMensajeNFT(`✅ Video subido: ${videoHash.slice(0, 12)}...`);
      }

      // ── Paso 3: Subir metadata JSON a IPFS ──────────────────
      setEstadoNFT("subiendo_meta");
      setMensajeNFT("📤 Subiendo metadata a IPFS...");

      const metadataHash = await subirMetadataIPFS(imageHash, videoHash || undefined);
      const tokenURI     = `ipfs://${metadataHash}`;
      setMensajeNFT(`✅ Metadata subida: ${metadataHash.slice(0, 12)}...`);

      // ── Paso 4: Acuñar el NFT en el contrato ────────────────
      setEstadoNFT("minteando");
      setMensajeNFT("⛓️ Acuñando NFT en la blockchain...");

      const nftContrato = new ethers.Contract(nftAddress, nftABI, signer);
      const walletAddress = await signer.getAddress();

      const tx = await nftContrato.acunarNFT(
        walletAddress,           // propietario
        tokenURI,                // URI del metadata en IPFS
        idPlanta,
        idSemilla,
        especie,
        responsable,
        latitud,
        longitud,
        temperatura,
        humedad,
        altitud,
        imageHash
      );

      setMensajeNFT("⏳ Esperando confirmación en la blockchain...");
      const receipt = await tx.wait();

      // Obtener el tokenId del evento emitido
      const evento = receipt.logs
        .map((log: any) => { try { return nftContrato.interface.parseLog(log); } catch { return null; } })
        .find((e: any) => e?.name === "NFTAcunado");

      const nuevoTokenId = evento ? Number(evento.args.tokenId) : null;
      setTokenIdAcunado(nuevoTokenId);
      setEstadoNFT("listo");
      setMensajeNFT(`🎉 ¡NFT #${nuevoTokenId} acuñado con éxito! Tu planta está certificada en la blockchain.`);

    } catch (error: any) {
      console.error("Error al crear NFT:", error);
      setEstadoNFT("error");
      setErrorNFT(`❌ Error: ${error.message || "Error desconocido"}`);
    }
  };

  // ─── Helpers de UI ────────────────────────────────────────────────────

  const getColorEstado = () => {
    switch (estadoNFT) {
      case "listo":  return "bg-green-50 border-green-300 text-green-800";
      case "error":  return "bg-red-50 border-red-300 text-red-700";
      default:       return "bg-blue-50 border-blue-200 text-blue-700";
    }
  };

  const botonNFTDeshabilitado =
    !capturedImageState ||
    !signer ||
    estadoNFT === "subiendo_foto" ||
    estadoNFT === "subiendo_meta" ||
    estadoNFT === "subiendo_video" ||
    estadoNFT === "minteando" ||
    estadoNFT === "listo";

  const textoBotonNFT = () => {
    switch (estadoNFT) {
      case "subiendo_foto":  return "📤 Subiendo foto...";
      case "subiendo_video": return "📤 Subiendo video...";
      case "subiendo_meta":  return "📤 Preparando metadata...";
      case "minteando":      return "⛓️ Acuñando NFT...";
      case "listo":          return "✅ NFT Creado";
      default:               return "🖼️ Crear NFT con esta foto";
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  //  DIALOGS (tus originales, sin cambios)
  // ─────────────────────────────────────────────────────────────────────

  const renderImageDialog = () => (
    <Dialog.Root open={showImageDialog} onOpenChange={setShowImageDialog}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 fixed inset-0 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 md:p-6 w-[95vw] md:w-[90vw] max-w-[700px] max-h-[85vh] overflow-y-auto z-50">
          <Dialog.Title className="text-lg font-bold mb-4">Imagen Capturada</Dialog.Title>
          {capturedImageState &&
            <div className="relative w-full h-[60vh]">
              <img src={capturedImageState} alt="Planta capturada" className="w-full h-full object-contain" />
            </div>
          }
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <Button onClick={downloadImage} className="bg-blue-500 hover:bg-blue-600 text-white">
              <FaDownload className="mr-2 h-4 w-4" /> Descargar Imagen
            </Button>
          </div>
          <Dialog.Close asChild>
            <button className="absolute top-2 right-2 rounded-full p-2" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );

  const renderVideoDialog = () => (
    <Dialog.Root open={showVideoPlayer} onOpenChange={setShowVideoPlayer}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 fixed inset-0 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 md:p-6 w-[95vw] md:w-[90vw] max-w-[700px] max-h-[85vh] overflow-y-auto z-50">
          <Dialog.Title className="text-lg font-bold mb-4">Video Grabado</Dialog.Title>
          <div className="relative">
            <video src={recordedVideo || undefined} controls className="w-full" />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Button onClick={downloadVideo} className="bg-green-500 hover:bg-green-600 text-white">
                <FaDownload className="mr-2 h-4 w-4" /> Descargar Video
              </Button>
            </div>
          </div>
          <Dialog.Close asChild>
            <button className="absolute top-2 right-2 rounded-full p-2" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );

  // ─────────────────────────────────────────────────────────────────────
  //  RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 fixed inset-0 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 md:p-6 w-[95vw] md:w-[90vw] max-w-[900px] max-h-[90vh] overflow-y-auto z-50">
          <Dialog.Title className="text-lg font-bold mb-4">
            Traslado de Planta #{seedId} — {especie}
          </Dialog.Title>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleMobileCapture}
            className="hidden"
          />

          <div className="flex flex-col md:flex-row md:space-x-4">

            {/* ── Panel izquierdo: cámara (tu código original) ── */}
            <Card className="w-full md:w-[500px] bg-white shadow-xl rounded-xl overflow-hidden mb-4 md:mb-0">
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4">
                  {!isCameraActive || isMobile ? (
                    <Button onClick={activateCamera} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                      <FaCamera className="mr-2 h-5 w-5" />
                      {isMobile ? 'Tomar Foto' : 'Activar Cámara'}
                    </Button>
                  ) : (
                    <>
                      <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <Button onClick={captureImage} className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                          <FaCamera className="mr-2 h-4 w-4" /> Tomar Foto
                        </Button>
                        <Button
                          onClick={isRecording ? stopRecording : startRecording}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                        >
                          {isRecording
                            ? <><FaPause className="mr-2 h-4 w-4" /> Pausar grabación</>
                            : <><FaPlay  className="mr-2 h-4 w-4" /> Iniciar grabación</>
                          }
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <Button
                          onClick={() => setShowImageDialog(true)}
                          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                          disabled={!capturedImageState}
                        >
                          <FaImage className="mr-2 h-4 w-4" /> Mostrar Imagen
                        </Button>
                        <Button
                          onClick={() => setShowVideoPlayer(true)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                          disabled={!recordedVideo}
                        >
                          <FaPlay className="mr-2 h-4 w-4" /> Reproducir Video
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" width={640} height={480} />

                {/* ── SECCIÓN NFT — NUEVA ─────────────────────────── */}
                {capturedImageState && (
                  <div className="mt-4 space-y-3">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-semibold text-gray-600 mb-2">
                        🖼️ Certificar en Blockchain
                      </p>

                      {/* Preview de la foto capturada */}
                      <div className="rounded-lg overflow-hidden mb-3 border border-gray-200">
                        <img
                          src={capturedImageState}
                          alt="Foto para NFT"
                          className="w-full h-32 object-cover"
                        />
                        <p className="text-xs text-center text-gray-500 py-1 bg-gray-50">
                          Esta foto será la imagen de tu NFT
                          {recordedVideo && " · Video incluido ✅"}
                        </p>
                      </div>

                      {/* Botón crear NFT */}
                      <Button
                        onClick={crearNFT}
                        disabled={botonNFTDeshabilitado}
                        className={`w-full font-semibold ${
                          estadoNFT === "listo"
                            ? "bg-green-600 hover:bg-green-600 text-white"
                            : "bg-emerald-700 hover:bg-emerald-800 text-white"
                        }`}
                      >
                        {textoBotonNFT()}
                      </Button>

                      {/* Mensaje de progreso */}
                      {mensajeNFT && (
                        <div className={`mt-2 p-3 rounded-lg border text-sm ${getColorEstado()}`}>
                          {mensajeNFT}
                        </div>
                      )}

                      {/* Error */}
                      {errorNFT && (
                        <div className="mt-2 p-3 rounded-lg border bg-red-50 border-red-300 text-red-700 text-sm">
                          {errorNFT}
                        </div>
                      )}

                      {/* Resultado exitoso */}
                      {estadoNFT === "listo" && tokenIdAcunado && (
                        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                          <p className="font-bold text-green-800">🎉 NFT #{tokenIdAcunado} creado</p>
                          <p className="text-xs text-green-700">
                            📷 Imagen IPFS: <code className="bg-green-100 px-1 rounded">{ipfsImageHash.slice(0, 16)}...</code>
                          </p>
                          {ipfsVideoHash && (
                            <p className="text-xs text-green-700">
                              🎬 Video IPFS: <code className="bg-green-100 px-1 rounded">{ipfsVideoHash.slice(0, 16)}...</code>
                            </p>
                          )}
                          {chainId === 11155111 && (
                            <a
                              href={`https://testnets.opensea.io/assets/sepolia/${NFT_ADDRESSES[chainId]}/${tokenIdAcunado}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-blue-600 underline hover:text-blue-800 mt-1"
                            >
                              🌊 Ver en OpenSea Testnet →
                            </a>
                          )}
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${ipfsImageHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 underline hover:text-blue-800"
                          >
                            🌐 Ver foto en IPFS →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Panel derecho: preview (tu código original) ── */}
            <Card className="w-full md:w-[350px] mx-auto">
              <CardContent>
                <div className="mb-6 text-center">
                  <div className="relative w-full h-64 md:w-80 md:h-80 overflow-hidden">
                    {capturedImageState ? (
                      <img
                        src={capturedImageState}
                        alt="Planta trasladada"
                        className="w-full h-full object-cover"
                      />
                    ) : capturedImage ? (
                      <Image
                        src={capturedImage}
                        alt="Planta trasladada"
                        layout="fill"
                        objectFit="cover"
                      />
                    ) : (
                      <Image
                        src="/placeholder.svg?height=320&width=320"
                        alt="Planta trasladada"
                        layout="fill"
                        objectFit="cover"
                      />
                    )}
                  </div>

                  {/* Info de la planta */}
                  <div className="mt-3 text-left space-y-1 text-sm text-gray-600">
                    <p><span className="font-semibold">Especie:</span> {especie}</p>
                    <p><span className="font-semibold">ID Planta:</span> #{idPlanta}</p>
                    <p><span className="font-semibold">Responsable:</span> {responsable}</p>
                    <p><span className="font-semibold">Altitud:</span> {altitud} msnm</p>
                    <p><span className="font-semibold">Red:</span> {chainId === 11155111 ? "Sepolia 🔵" : "Ganache 🟢"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <Button variant="outline" onClick={deactivateCamera}>Cerrar</Button>
            </Dialog.Close>
          </div>

          <Dialog.Close asChild>
            <button className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full p-2" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>

      {renderImageDialog()}
      {renderVideoDialog()}
    </Dialog.Root>
  );
};

export default PlantTransferModal;