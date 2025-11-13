import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import type { UserPreferences } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const allCategories = [
  "Groceries",
  "Fashion",
  "Electronics",
  "Dining",
  "Travel",
  "Health",
  "Beauty",
  "Fitness",
];

export default function ProfilePage() {
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/user-preferences"],
  });

  useEffect(() => {
    if (preferences?.categories) {
      setSelectedCategories(preferences.categories);
    }
  }, [preferences]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await apiRequest("POST", "/api/user-preferences", {
        categories: selectedCategories,
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/coupons/ai-picks"] });
      
      toast({
        title: "Preferences saved!",
        description: "Your AI picks will be updated based on your new preferences",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(selectedCategories.sort()) !==
    JSON.stringify((preferences?.categories || []).sort());

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 pt-8 pb-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-semibold">Profile</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your preferences and settings
          </p>
        </div>
      </div>

      {/* Preferences */}
      <div className="max-w-md mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Shopping Preferences</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Select your favorite categories to get personalized AI recommendations
          </p>

          <div className="space-y-3 mb-6">
            {allCategories.map((category) => (
              <div key={category} className="flex items-center space-x-3">
                <Checkbox
                  id={`pref-${category}`}
                  data-testid={`checkbox-category-${category.toLowerCase()}`}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                />
                <Label
                  htmlFor={`pref-${category}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>

          <Button
            data-testid="button-save-preferences"
            onClick={handleSavePreferences}
            disabled={!hasChanges || isSaving}
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>

          {selectedCategories.length > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              {selectedCategories.length} {selectedCategories.length === 1 ? "category" : "categories"} selected
            </p>
          )}
        </Card>

        {/* App Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>CouponAI v1.0.0</p>
          <p className="mt-1">Smart Savings, Powered by AI</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
