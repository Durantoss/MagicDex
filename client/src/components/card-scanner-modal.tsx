import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X, Scan, Loader2, CheckCircle, AlertCircle, Plus, Eye, Search, Edit3 } from "lucide-react";
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
  const [manualSearchText, setManualSearchText] = useState<string>("");
  const [isManualSearching, setIsManualSearching] = useState(false);

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

    // Create a new canvas focused on the card name area (top 30% of the card)
    const nameAreaHeight = Math.floor(canvas.height * 0.3);
    const nameCanvas = document.createElement("canvas");
    nameCanvas.width = canvas.width;
    nameCanvas.height = nameAreaHeight;
    const nameCtx = nameCanvas.getContext("2d");
    
    if (!nameCtx) return canvas;

    // Copy the top portion of the original canvas (where card names are located)
    nameCtx.drawImage(canvas, 0, 0, canvas.width, nameAreaHeight, 0, 0, canvas.width, nameAreaHeight);

    // Get image data from the name area
    const imageData = nameCtx.getImageData(0, 0, nameCanvas.width, nameCanvas.height);
    const data = imageData.data;

    // Enhanced preprocessing for better text recognition
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      
      // More aggressive contrast enhancement for text
      let enhanced;
      if (gray < 100) {
        enhanced = Math.max(0, gray - 50); // Make dark text darker
      } else if (gray > 180) {
        enhanced = 255; // Make light backgrounds pure white
      } else {
        enhanced = gray < 128 ? 0 : 255; // Binary threshold for better text clarity
      }
      
      data[i] = enhanced;     // Red
      data[i + 1] = enhanced; // Green
      data[i + 2] = enhanced; // Blue
      // Alpha channel remains unchanged
    }

    nameCtx.putImageData(imageData, 0, 0);
    
    // Scale up the name area for better OCR recognition
    const scaledCanvas = document.createElement("canvas");
    scaledCanvas.width = nameCanvas.width * 2;
    scaledCanvas.height = nameCanvas.height * 2;
    const scaledCtx = scaledCanvas.getContext("2d");
    
    if (scaledCtx) {
      // Use smooth scaling for better text quality
      scaledCtx.imageSmoothingEnabled = true;
      scaledCtx.imageSmoothingQuality = 'high';
      scaledCtx.drawImage(nameCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
      return scaledCanvas;
    }

    return nameCanvas;
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

      setScanProgress("Deciphering ancient texts...");

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

      setScanProgress("Combing the Archives...");
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
    console.log("Raw OCR text:", text);
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const potentialNames: string[] = [];
    const allWords: string[] = [];

    // Extract all words for potential partial matching
    const words = text.split(/\s+/).map(word => word.trim()).filter(word => word.length > 0);
    allWords.push(...words);

    for (const line of lines) {
      const cleanLine = line.trim();
      
      // More lenient filtering - only skip obvious non-names
      if (cleanLine.length < 2) continue;
      if (/^\d+$/.test(cleanLine)) continue; // Pure numbers only
      if (/^\d+\/\d+$/.test(cleanLine)) continue; // Power/toughness only
      if (/^[\{\}\d\s\+\-\/WUBRG]+$/.test(cleanLine)) continue; // Mana costs only
      
      // Clean up common OCR artifacts with more options
      let cleaned = cleanLine
        .replace(/[|]/g, 'I') // Common OCR mistake
        .replace(/[1]/g, 'I') // One to I in names
        .replace(/[0]/g, 'O') // Zero to O
        .replace(/[8]/g, 'B') // Eight to B
        .replace(/[5]/g, 'S') // Five to S
        .replace(/[6]/g, 'G') // Six to G
        .replace(/^\W+|\W+$/g, '') // Remove leading/trailing symbols
        .replace(/\s+/g, ' ') // Normalize spaces
        .replace(/[^\w\s'-]/g, ' ') // Keep only letters, numbers, spaces, hyphens, apostrophes
        .trim();

      // More lenient length check
      if (cleaned.length < 2) continue;
      
      potentialNames.push(cleaned);
      
      // Also try individual words from longer lines
      if (cleaned.includes(' ')) {
        const wordsInLine = cleaned.split(' ').filter(word => word.length >= 3);
        potentialNames.push(...wordsInLine);
      }
    }

    // Add combinations of consecutive words
    for (let i = 0; i < allWords.length - 1; i++) {
      const word1 = allWords[i].replace(/[^\w]/g, '');
      const word2 = allWords[i + 1].replace(/[^\w]/g, '');
      if (word1.length >= 2 && word2.length >= 2) {
        potentialNames.push(`${word1} ${word2}`);
      }
    }

    // Remove duplicates and sort by likelihood
    const uniqueNames = Array.from(new Set(potentialNames));
    
    console.log("Extracted potential names:", uniqueNames);
    
    return uniqueNames.sort((a, b) => {
      // Prefer longer names
      const lengthScore = b.length - a.length;
      // Prefer names with title case
      const titleCaseA = /^[A-Z][a-z]/.test(a) ? 10 : 0;
      const titleCaseB = /^[A-Z][a-z]/.test(b) ? 10 : 0;
      // Prefer names with multiple words
      const wordCountA = a.split(' ').length > 1 ? 5 : 0;
      const wordCountB = b.split(' ').length > 1 ? 5 : 0;
      
      return (titleCaseB + wordCountB + lengthScore) - (titleCaseA + wordCountA);
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
    console.log("Processing potential names:", potentialNames);
    
    if (potentialNames.length === 0) {
      toast({
        title: "Card not recognized",
        description: "Unable to identify card name from the scan.",
        variant: "destructive",
      });
      return;
    }

    let allResults: any[] = [];

    // Strategy 1: Fuzzy search with Scryfall named endpoint (most accurate)
    for (const cardName of potentialNames.slice(0, 10)) {
      try {
        setScanProgress("Combing the Archives...");
        const response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`);
        
        if (response.ok) {
          const cardData = await response.json();
          allResults.push(cardData);
          console.log(`Fuzzy search found: ${cardData.name}`);
        }
      } catch (error) {
        console.error(`Fuzzy search failed for "${cardName}":`, error);
      }
    }

    // Strategy 2: General search with partial matching (if fuzzy didn't find enough)
    if (allResults.length < 3) {
      for (const cardName of potentialNames.slice(0, 10)) {
        try {
          setScanProgress("Combing the Archives...");
          // Use general search without exact match quotes for more flexibility
          const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardName)}&unique=cards&order=name`);
          
          if (response.ok) {
            const data = await response.json();
            const results = data.data?.slice(0, 3) || [];
            allResults.push(...results);
            console.log(`General search found ${results.length} results for "${cardName}"`);
          }
        } catch (error) {
          console.error(`General search failed for "${cardName}":`, error);
        }
      }
    }

    // Strategy 3: Partial word matching (if still not enough results)
    if (allResults.length < 3) {
      for (const cardName of potentialNames.slice(0, 5)) {
        const words = cardName.split(' ').filter(word => word.length >= 2);
        for (const word of words) {
          try {
            setScanProgress("Combing the Archives...");
            const response = await fetch(`https://api.scryfall.com/cards/search?q=name:${encodeURIComponent(word)}&unique=cards&order=name`);
            
            if (response.ok) {
              const data = await response.json();
              const results = data.data?.slice(0, 2) || [];
              allResults.push(...results);
              console.log(`Partial search found ${results.length} results for "${word}"`);
            }
          } catch (error) {
            console.error(`Partial search failed for "${word}":`, error);
          }
        }
      }
    }

    // Remove duplicates based on card ID
    const uniqueResults = allResults.filter((card: any, index: number, self: any[]) => 
      index === self.findIndex((c: any) => c.id === card.id)
    );

    console.log(`Total unique results found: ${uniqueResults.length}`);

    if (uniqueResults.length > 0) {
      setSearchResults(uniqueResults.slice(0, 15)); // Limit to 15 results
      toast({
        title: "Cards found!",
        description: `Found ${uniqueResults.length} potential matches. Tap a card to view details.`,
      });
    } else {
      // Show detected text for debugging
      toast({
        title: "Card not found",
        description: `No matches found. Check the detected text below for debugging.`,
        variant: "destructive",
      });
    }
  };

  const handleAddCard = async (card: any) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add cards to your collection.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add card to user's collection via Supabase
      const { error } = await supabase
        .from('user_cards')
        .insert({
          user_id: user.id,
          scryfall_id: card.id,
          card_name: card.name,
          set_code: card.set,
          set_name: card.set_name,
          rarity: card.rarity,
          mana_cost: card.mana_cost,
          type_line: card.type_line,
          oracle_text: card.oracle_text,
          power: card.power,
          toughness: card.toughness,
          image_url: card.image_uris?.normal || card.image_uris?.large,
          price_usd: card.prices?.usd ? parseFloat(card.prices.usd) : null,
          quantity: 1
        });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Card added to collection!",
        description: `${card.name} has been added to your collection.`,
      });

      console.log("Card successfully added to collection:", card.name);

    } catch (err) {
      console.error("Error adding card to collection:", err);
      toast({
        title: "Error adding card",
        description: "Failed to add card to your collection. Please try again.",
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

  const handleManualSearch = async () => {
    if (!manualSearchText.trim()) {
      toast({
        title: "Enter card name",
        description: "Please enter a card name to search for.",
        variant: "destructive",
      });
      return;
    }

    setIsManualSearching(true);
    setError("");
    setSearchResults([]);

    try {
      toast({
        title: "Combing the Archives...",
        description: `Looking for "${manualSearchText}"`,
      });

      await processDetectedText(manualSearchText);
    } catch (err) {
      console.error("Manual search error:", err);
      setError("Failed to search for card. Please try again.");
      toast({
        title: "Search failed",
        description: "Unable to find the card. Please check the spelling.",
        variant: "destructive",
      });
    } finally {
      setIsManualSearching(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onOpenChange(false);
    setDetectedText("");
    setSearchResults([]);
    setError("");
    setManualSearchText("");
    setIsManualSearching(false);
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

                {/* Enhanced scan guide overlay with name area focus */}
                <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg pointer-events-none">
                  <div className="absolute -top-6 left-0 text-white text-sm bg-black/50 px-2 py-1 rounded">
                    Position card within frame
                  </div>
                  
                  {/* Card name area highlight - top 30% of the frame */}
                  <div className="absolute top-0 left-0 right-0 h-[30%] border-2 border-solid border-green-400/70 rounded-t-lg bg-green-400/10">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-green-400 text-xs bg-black/70 px-2 py-1 rounded whitespace-nowrap">
                      📝 Card Name Area - Focus Here
                    </div>
                  </div>
                  
                  {/* Rules text area (dimmed) */}
                  <div className="absolute top-[30%] left-0 right-0 bottom-0 bg-red-500/5 border border-red-400/30 rounded-b-lg">
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-red-400/70 text-xs">
                      Rules text (ignored)
                    </div>
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

          {/* Manual Search Section */}
          <div className="bg-glass rounded-lg p-4 border border-glass">
            <div className="flex items-center gap-2 mb-3">
              <Edit3 className="h-4 w-4 text-blue-400" />
              <h4 className="text-sm font-semibold text-slate-300">Manual Search</h4>
              <span className="text-xs text-slate-500">(Use if OCR fails)</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter card name manually..."
                value={manualSearchText}
                onChange={(e) => setManualSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isManualSearching) {
                    handleManualSearch();
                  }
                }}
                className="flex-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                disabled={isManualSearching}
              />
              <Button
                onClick={handleManualSearch}
                disabled={isManualSearching || !manualSearchText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isManualSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              If the OCR produces garbled text, manually type the card name here for accurate results.
            </p>
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
                      <Button
                        size="sm"
                        className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddCard(card);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detected Text Display - Always show when text is detected */}
          {detectedText && (
            <div className="bg-glass rounded-lg p-4 border border-glass">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <h4 className="text-sm font-semibold text-slate-300">Debug Information:</h4>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Raw OCR Text:</p>
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap max-h-24 overflow-y-auto bg-slate-800/50 p-2 rounded">
                    {detectedText}
                  </pre>
                </div>
                {extractCardNames(detectedText).length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Extracted Potential Names:</p>
                    <div className="flex flex-wrap gap-1">
                      {extractCardNames(detectedText).slice(0, 10).map((name, index) => (
                        <span key={index} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
