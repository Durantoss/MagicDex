import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X, Scan, Loader2, CheckCircle, AlertCircle, Plus, Eye } from "lucide-react";
import Tesseract from 'tesseract.js';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import CardDetailModal from "./card-detail-modal";
import { searchCards } from "@/lib/scryfall-api";

interface CardScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DetectedCard {
  name: string;
  confidence: number;
  scryfallData?: any;
}

export function CardScannerModal({ open, onOpenChange }: CardScannerModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedText, setDetectedText] = useState<string>("");
  const [detectedCard, setDetectedCard] = useState<DetectedCard | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showCardDetail, setShowCardDetail] = useState(false);
  const [error, setError] = useState<string>("");
  const [scanProgress, setScanProgress] = useState<string>("");

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
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
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

  const preprocessImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Convert to grayscale and enhance contrast
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      
      // Enhance contrast
      const enhanced = gray < 128 ? Math.max(0, gray - 30) : Math.min(255, gray + 30);
      
      data[i] = enhanced;     // Red
      data[i + 1] = enhanced; // Green
      data[i + 2] = enhanced; // Blue
      // Alpha channel remains unchanged
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
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
      return preprocessImage(canvas);
    }
    
    return null;
  };

  const runOCR = async () => {
    if (!cameraActive || isScanning) return;

    setIsScanning(true);
    setError("");
    setDetectedText("");
    setDetectedCard(null);
    setScanProgress("Capturing image...");

    try {
      const canvas = captureFrame();
      if (!canvas) {
        throw new Error("Unable to capture frame from camera");
      }

      toast({
        title: "Scanning card...",
        description: "Processing image with advanced OCR",
      });

      setScanProgress("Processing with OCR...");

      // Enhanced Tesseract configuration for better card text recognition
      const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setScanProgress(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      console.log("Detected text:", text);
      setDetectedText(text);

      setScanProgress("Analyzing card name...");
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
      setScanProgress("");
    }
  };

  const extractCardNames = (text: string): string[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const potentialNames: string[] = [];

    for (const line of lines) {
      const cleanLine = line.trim();
      
      // Skip lines that are clearly not card names
      if (cleanLine.length < 3) continue;
      if (/^\d+$/.test(cleanLine)) continue; // Pure numbers
      if (/^[^\w\s]+$/.test(cleanLine)) continue; // Only symbols
      if (/^\d+\/\d+$/.test(cleanLine)) continue; // Power/toughness
      if (/^[\d\s\+\-\/]+$/.test(cleanLine)) continue; // Mana costs or stats
      
      // Clean up common OCR artifacts
      let cleaned = cleanLine
        .replace(/[|]/g, 'I') // Common OCR mistake
        .replace(/[0]/g, 'O') // Zero to O
        .replace(/[1]/g, 'I') // One to I in names
        .replace(/^\W+|\W+$/g, '') // Remove leading/trailing symbols
        .replace(/\s+/g, ' '); // Normalize spaces

      // Skip if too short after cleaning
      if (cleaned.length < 3) continue;
      
      // Prefer lines that look like proper names (title case)
      const titleCaseScore = /^[A-Z][a-z]/.test(cleaned) ? 2 : 1;
      const lengthScore = Math.min(cleaned.length / 10, 2);
      const score = titleCaseScore + lengthScore;
      
      potentialNames.push(cleaned);
    }

    // Sort by likely card name characteristics
    return potentialNames.sort((a, b) => {
      const aScore = (a.match(/^[A-Z]/) ? 2 : 0) + Math.min(a.length / 10, 2);
      const bScore = (b.match(/^[A-Z]/) ? 2 : 0) + Math.min(b.length / 10, 2);
      return bScore - aScore;
    });
  };

  const searchScryfallCard = async (cardName: string): Promise<any> => {
    try {
      setScanProgress(`Searching for "${cardName}"...`);
      
      // Use fuzzy search with Scryfall API
      const response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`);
      
      if (response.ok) {
        const cardData = await response.json();
        return cardData;
      } else if (response.status === 404) {
        // Try exact search as fallback
        const exactResponse = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
        if (exactResponse.ok) {
          return await exactResponse.json();
        }
      }
      
      return null;
    } catch (error) {
      console.error("Scryfall API error:", error);
      return null;
    }
  };

  const processDetectedText = async (text: string) => {
    const potentialNames = extractCardNames(text);
    
    if (potentialNames.length === 0) {
      toast({
        title: "Card not recognized",
        description: "Unable to identify card name from the scan.",
        variant: "destructive",
      });
      return;
    }

    // Search for multiple potential matches using direct Scryfall API
    const searchPromises = potentialNames.slice(0, 3).map(async (cardName) => {
      try {
        setScanProgress(`Searching for "${cardName}"...`);
        const response = await fetch(`https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(cardName)}"&unique=cards&order=name`);
        
        if (response.ok) {
          const data = await response.json();
          return data.data?.slice(0, 5) || []; // Limit to top 5 results per search
        }
        return [];
      } catch (error) {
        console.error(`Search failed for "${cardName}":`, error);
        return [];
      }
    });

    const allResults = await Promise.all(searchPromises);
    const flatResults = allResults.flat();
    
    // Remove duplicates based on card ID
    const uniqueResults = flatResults.filter((card: any, index: number, self: any[]) => 
      index === self.findIndex((c: any) => c.id === card.id)
    );

    if (uniqueResults.length > 0) {
      setSearchResults(uniqueResults);
      toast({
        title: "Cards found!",
        description: `Found ${uniqueResults.length} potential matches. Tap a card to view details.`,
      });
    } else {
      toast({
        title: "Card not found",
        description: `Detected "${potentialNames[0]}" but couldn't find it in the database.`,
        variant: "destructive",
      });
    }
  };

  const handleAddCard = async (cardData: { name: string; detectedText: string; scryfallData?: any }) => {
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

  const handleCardClick = (card: any) => {
    setSelectedCard(card);
    setShowCardDetail(true);
  };

  const handleCloseCardDetail = () => {
    setShowCardDetail(false);
    setSelectedCard(null);
  };

  const handleClose = () => {
    stopCamera();
    onOpenChange(false);
    setDetectedText("");
    setSearchResults([]);
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
          {/* Camera View - Portrait orientation for Magic cards */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-[3/4] max-w-md mx-auto">
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
                      <p className="text-sm">{scanProgress || "Scanning card..."}</p>
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

          {/* Detected Card Display */}
          {detectedCard && (
            <div className="bg-glass rounded-lg p-4 border border-glass">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <h4 className="text-sm font-semibold text-slate-300">Card Found!</h4>
              </div>
              <div className="flex gap-3">
                {detectedCard.scryfallData?.image_uris?.small && (
                  <img 
                    src={detectedCard.scryfallData.image_uris.small} 
                    alt={detectedCard.name}
                    className="w-16 h-22 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-white">{detectedCard.name}</p>
                  {detectedCard.scryfallData?.set_name && (
                    <p className="text-xs text-slate-400">{detectedCard.scryfallData.set_name}</p>
                  )}
                  {detectedCard.scryfallData?.mana_cost && (
                    <p className="text-xs text-slate-400">Mana Cost: {detectedCard.scryfallData.mana_cost}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                      {Math.round(detectedCard.confidence * 100)}% confidence
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Results Display */}
          {searchResults.length > 0 && (
            <div className="bg-glass rounded-lg p-4 border border-glass">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <h4 className="text-sm font-semibold text-slate-300">
                  Found {searchResults.length} potential matches
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                {searchResults.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => handleCardClick(card)}
                  >
                    <img
                      src={card.image_uris?.small || "https://via.placeholder.com/63x88/1e293b/ffffff?text=No+Image"}
                      alt={card.name}
                      className="w-12 h-16 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{card.name}</p>
                      <p className="text-xs text-slate-400 truncate">{card.set_name}</p>
                      <p className="text-xs text-slate-500">{card.type_line}</p>
                      {card.prices?.usd && (
                        <p className="text-xs text-green-400">${card.prices.usd}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 border-slate-600 hover:bg-slate-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(card);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detected Text Display */}
          {detectedText && !detectedCard && searchResults.length === 0 && (
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

      {/* Card Detail Modal */}
      {showCardDetail && selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={handleCloseCardDetail}
        />
      )}
    </Dialog>
  );
}
