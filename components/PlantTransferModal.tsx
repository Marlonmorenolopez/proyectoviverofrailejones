"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaCamera, FaDownload, FaImage, FaPlay, FaPause } from 'react-icons/fa';

interface PlantTransferModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  seedId: string | null;
  capturedImage: string | null;
}

const PlantTransferModal: React.FC<PlantTransferModalProps> = ({ isOpen, onOpenChange, seedId, capturedImage }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImageState, setCapturedImageState] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDataAvailable = useCallback((event: BlobEvent) => {
    if (event.data.size > 0) {
      chunksRef.current.push(event.data);
    }
  }, []);

  const handleStop = useCallback(() => {
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    setRecordedVideo(URL.createObjectURL(blob));
    chunksRef.current = [];
  }, []);

  const activateCamera = useCallback(() => {
    if (isMobile) {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      setIsCameraActive(true);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
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
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setCapturedImageState(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const deactivateCamera = useCallback(() => {
    setIsCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      deactivateCamera();
    }
  }, [isOpen, deactivateCamera]);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageDataUrl = canvasRef.current.toDataURL('image/png');
        setCapturedImageState(imageDataUrl);
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
      a.download = 'recorded-video.webm';
      a.click();
    }
  }, [recordedVideo]);

  const downloadImage = useCallback(() => {
    if (capturedImageState) {
      const link = document.createElement('a');
      link.href = capturedImageState;
      link.download = 'imagen_capturada.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [capturedImageState]);

  const renderImageDialog = () => (
    <Dialog.Root open={showImageDialog} onOpenChange={setShowImageDialog}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 fixed inset-0 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 md:p-6 w-[95vw] md:w-[90vw] max-w-[700px] max-h-[85vh] overflow-y-auto z-50">
          <Dialog.Title className="text-lg font-bold mb-4">Imagen Capturada</Dialog.Title>
          {capturedImageState && 
            <div className="relative w-full h-[60vh]">
              <img
                src={capturedImageState}
                alt="Captured Image"
                className="w-full h-full object-contain"
              />
            </div>
          }
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <Button onClick={downloadImage} className="bg-blue-500 hover:bg-blue-600 text-white">
              <FaDownload className="mr-2 h-4 w-4" /> Descargar Imagen
            </Button>
          </div>
          <Dialog.Close asChild>
            <button className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full p-2 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75" aria-label="Close">
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
            <button className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full p-2 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 fixed inset-0 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 md:p-6 w-[95vw] md:w-[90vw] max-w-[900px] max-h-[90vh] overflow-y-auto z-50">
          <Dialog.Title className="text-lg font-bold mb-4">Detalles del Traslado de Planta (ID: {seedId})</Dialog.Title>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleMobileCapture}
            className="hidden"
          />

          <div className="flex flex-col md:flex-row md:space-x-4">
            <Card className="w-full md:w-[500px] bg-white shadow-xl rounded-xl overflow-hidden mb-4 md:mb-0">
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4">
                  {!isCameraActive || isMobile ? (
                    <Button onClick={activateCamera} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                      <FaCamera className="mr-2 h-5 w-5" /> {isMobile ? 'Tomar Foto' : 'Activar Cámara'}
                    </Button>
                  ) : (
                    <>
                      <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <Button onClick={captureImage} className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                          <FaCamera className="mr-2 h-4 w-4" /> Tomar Foto
                        </Button>
                        <Button 
                          onClick={isRecording ? stopRecording : startRecording} 
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                        >
                          {isRecording ? (
                            <>
                              <FaPause className="mr-2 h-4 w-4" />
                              Pausar grabación
                            </>
                          ) : (
                            <>
                              <FaPlay className="mr-2 h-4 w-4" />
                              Iniciar grabación
                            </>
                          )}
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
              </CardContent>
            </Card>

            <Card className="w-full md:w-[350px] mx-auto">
              <CardContent>
                <div className="mb-6 text-center">
                  <div className="relative w-full h-64 md:w-80 md:h-80 overflow-hidden">
                    {capturedImage ? (
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
            <button 
              className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full p-2 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75" 
              aria-label="Close"
            >
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