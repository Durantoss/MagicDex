import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X, Scan, Loader2 } from "lucide-react";
import Tesseract from 'tesseract.js';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface CardScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardScannerModal({ open, onOpenChange }: CardScannerModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedText, setDetectedText] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Initialize camera when modal opens
  useEffect(() => {
    if (open) {
      initializeCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  const initializeCamera = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please ensure camera permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureFrame = (): HTMLCanvasElement | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas;
    }
    
    return null;
  };

  const runOCR = async () => {
    if (!cameraActive || isScanning) return;

    setIsScanning(true);
    setError("");
    setDetectedText("");

    try {
      const canvas = captureFrame();
      if (!canvas) {
        throw new Error("Unable to capture frame from camera");
      }

      toast({
        title: "Scanning card...",
        description: "Processing image with OCR",
      });

      const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
        logger: m => console.log(m)
      });

      console.log("Detected text:", text);
      setDetectedText(text);

      // Process the detected text to extract card information
      await processDetectedText(text);

    } catch (err) {
      console.error("OCR error:", err);
      setError("Failed to scan card. Please try again.");
      toast({
        title: "Scan failed",
        description: "Unable to process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const processDetectedText = async (text: string) => {
    const normalizedName = text.trim().toLowerCase();
    
    // Basic card name extraction - look for lines that might be card names
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Try to find the card name (usually the first significant line)
    let cardName = "";
    for (const line of lines) {
      const cleanLine = line.trim();
      // Skip very short lines or lines with mostly numbers/symbols
      if (cleanLine.length > 3 && !/^\d+$/.test(cleanLine) && !/^[^\w\s]+$/.test(cleanLine)) {
        cardName = cleanLine;
        break;
      }
    }

    if (cardName) {
      await handleAddCard({ name: cardName, detectedText: text });
    } else {
      toast({
        title: "Card not recognized",
        description: "Unable to identify card name from the scan.",
        variant: "destructive",
      });
    }
  };

  const handleAddCard = async (cardData: { name: string; detectedText: string }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add cards to your collection.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Here you would typically:
      // 1. Search for the card in your database or Scryfall API
      // 2. Add it to the user's collection
      // For now, we'll just log it and show a success message

      console.log("Card added:", cardData);
      
      toast({
        title: "Card detected!",
        description: `Found: ${cardData.name}`,
      });

      // You can integrate with your existing collection logic here
      // For example, calling your Supabase collection insert function

    } catch (err) {
      console.error("Error adding card:", err);
      toast({
        title: "Error",
        description: "Failed to add card to collection.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    stopCamera();
    onOpenChange(false);
    setDetectedText("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-mtg-dark border-glass">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gradient-primary">
            <Camera className="h-5 w-5" />
            Card Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {error ? (
              <div className="flex items-center justify-center h-full text-red-400 p-4 text-center">
                <div>
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{error}</p>
                  <Button 
                    onClick={initializeCamera} 
                    className="mt-2 bg-mtg-primary hover:bg-mtg-primary/80"
                  >
                    Retry Camera Access
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanning overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Scanning card...</p>
                    </div>
                  </div>
                )}

                {/* Scan guide overlay */}
                <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg pointer-events-none">
                  <div className="absolute -top-6 left-0 text-white text-sm bg-black/50 px-2 py-1 rounded">
                    Position card within frame
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={runOCR}
              disabled={!cameraActive || isScanning}
              className="bg-mtg-primary hover:bg-mtg-primary/80 text-white"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Scan className="mr-2 h-4 w-4" />
                  Scan Card
                </>
              )}
            </Button>
            
            <Button
              onClick={handleClose}
              variant="outline"
              className="border-glass hover:bg-glass"
            >
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>

          {/* Detected Text Display */}
          {detectedText && (
            <div className="bg-glass rounded-lg p-4 border border-glass">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Detected Text:</h4>
              <pre className="text-xs text-slate-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {detectedText}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-slate-400 text-center space-y-1">
            <p>• Position the card clearly within the frame</p>
            <p>• Ensure good lighting for best results</p>
            <p>• The card name should be clearly visible</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
