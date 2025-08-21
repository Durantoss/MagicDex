import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

export function AdminUtils() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addSetMutation = useMutation({
    mutationFn: async (setCode: string) => {
      const response = await apiRequest("POST", "/api/collection/bulk-add-set", {
        setCode,
        quantity: 2
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      toast({
        title: "Set Added Successfully!",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Set",
        description: error.message || "Failed to add set to collection.",
        variant: "destructive",
      });
    },
  });

  const addBothSets = async () => {
    try {
      await addSetMutation.mutateAsync("lrw"); // Lorwyn
      await addSetMutation.mutateAsync("dft"); // Aether Drift
    } catch (error) {
      console.error("Error adding sets:", error);
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        onClick={addBothSets}
        disabled={addSetMutation.isPending}
        className="bg-green-600 hover:bg-green-700 text-white"
        data-testid="button-add-sets"
      >
        <Download className="mr-2 h-4 w-4" />
        {addSetMutation.isPending ? "Adding Sets..." : "Add Lorwyn + Aether Drift"}
      </Button>
    </div>
  );
}