import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCardImageUrl } from "@/lib/scryfall-api";
import { Download, Share2, Printer, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CollectionModalProps {
  onClose: () => void;
}

export default function CollectionModal({ onClose }: CollectionModalProps) {
  const { toast } = useToast();

  const { data: collection = [], isLoading } = useQuery({
    queryKey: ["/api/collection"],
  });

  // Calculate collection stats
  const totalCards = collection.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const uniqueCards = collection.length;
  const totalValue = collection.reduce((sum: number, item: any) => {
    const price = item.cardData?.prices?.usd ? parseFloat(item.cardData.prices.usd) : 0;
    return sum + (price * item.quantity);
  }, 0);

  const handleExport = () => {
    toast({
      title: "Export Collection",
      description: "Collection export feature coming soon!",
    });
  };

  const handleShare = () => {
    toast({
      title: "Share Collection",
      description: "Collection sharing feature coming soon!",
    });
  };

  const handlePrint = () => {
    toast({
      title: "Print Collection",
      description: "Collection printing feature coming soon!",
    });
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-screen bg-mtg-secondary border border-slate-700 text-white overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400" data-testid="text-loading-collection">Loading collection...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-screen bg-mtg-secondary border border-slate-700 text-white overflow-y-auto">
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center justify-between mb-6">
              <DialogTitle className="text-3xl font-bold text-white" data-testid="text-collection-title">
                My Collection
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
                data-testid="button-close-collection"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          {/* Collection Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-mtg-gray border-slate-600">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1">Total Cards</h3>
                <p className="text-2xl font-bold text-mtg-accent" data-testid="text-total-cards">
                  {totalCards}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-mtg-gray border-slate-600">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1">Unique Cards</h3>
                <p className="text-2xl font-bold text-blue-400" data-testid="text-unique-cards">
                  {uniqueCards}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-mtg-gray border-slate-600">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1">Total Value</h3>
                <p className="text-2xl font-bold text-green-400" data-testid="text-total-value">
                  ${totalValue.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-mtg-gray border-slate-600">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1">Average Value</h3>
                <p className="text-2xl font-bold text-purple-400" data-testid="text-average-value">
                  ${uniqueCards > 0 ? (totalValue / uniqueCards).toFixed(2) : "0.00"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Collection Grid */}
          {collection.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-white mb-2" data-testid="text-empty-collection">
                  Your collection is empty
                </h3>
                <p className="text-slate-400" data-testid="text-empty-collection-hint">
                  Start adding cards to build your collection!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {collection.map((item: any) => (
                <Card
                  key={item.id}
                  className="bg-mtg-gray border-slate-600 hover:bg-slate-600 transition-colors cursor-pointer"
                  data-testid={`collection-item-${item.cardId}`}
                >
                  <CardContent className="p-3">
                    <img
                      src={getCardImageUrl(item.cardData, "small")}
                      alt={item.cardData.name}
                      className="w-full h-32 object-cover rounded mb-2"
                      loading="lazy"
                    />
                    <h4 className="font-semibold text-white text-sm mb-1 truncate" data-testid={`text-collection-card-name-${item.cardId}`}>
                      {item.cardData.name}
                    </h4>
                    <p className="text-xs text-slate-400 mb-1" data-testid={`text-collection-quantity-${item.cardId}`}>
                      Qty: {item.quantity}
                    </p>
                    <p className="text-xs text-green-400" data-testid={`text-collection-value-${item.cardId}`}>
                      ${item.cardData.prices?.usd ? (parseFloat(item.cardData.prices.usd) * item.quantity).toFixed(2) : "0.00"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Collection Actions */}
          <div className="flex space-x-3 mt-6 pt-4 border-t border-slate-600">
            <Button
              onClick={handleExport}
              className="bg-mtg-primary hover:bg-mtg-primary/90 text-white py-2 px-4 rounded-lg transition-colors duration-200"
              data-testid="button-export-collection"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Collection
            </Button>
            <Button
              onClick={handleShare}
              className="bg-mtg-accent hover:bg-mtg-accent/90 text-white py-2 px-4 rounded-lg transition-colors duration-200"
              data-testid="button-share-collection"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share Collection
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors duration-200"
              data-testid="button-print-collection"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print List
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
