import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, TrendingUp, Sparkles, MapPin, BadgeCheck, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DealCardProps {
  id: string;
  storeName: string;
  storeLogoUrl?: string;
  discountAmount: string;
  title: string;
  description?: string;
  category: string;
  expirationDate?: Date | string | null;
  claimCount?: number;
  isTrending?: boolean | number;
  isSaved?: boolean;
  isAIPick?: boolean;
  isCurated?: boolean;
  isVerified?: boolean;
  requiresApp?: boolean;
  onSave?: () => void;
  onViewDeal?: () => void;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number;
}

export default function DealCard({
  id,
  storeName,
  storeLogoUrl,
  discountAmount,
  title,
  category,
  expirationDate,
  claimCount = 0,
  isTrending = false,
  isSaved = false,
  isAIPick = false,
  isCurated = false,
  isVerified = false,
  requiresApp = false,
  onSave,
  onViewDeal,
  distance,
}: DealCardProps) {
  const trendingValue = typeof isTrending === 'number' ? isTrending === 1 : isTrending;

  const getDaysLeft = () => {
    if (!expirationDate) return null;
    const expDate = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
    const now = new Date();
    const diff = expDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const daysLeft = getDaysLeft();

  return (
    <Card
      data-testid={`card-deal-${id}`}
      className="p-4 hover-elevate transition-all duration-200"
    >
      {/* Top row: Store info + Badges + Save button */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Store logo */}
          {storeLogoUrl && (
            <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src={storeLogoUrl} 
                alt={storeName}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          
          {/* Store name */}
          <p
            data-testid={`text-store-${id}`}
            className="text-xs font-semibold uppercase tracking-wider text-foreground"
          >
            {storeName}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
            {isCurated && isVerified && (
              <Badge variant="default" className="gap-1 text-xs px-2 py-0 h-5 bg-green-600 hover:bg-green-700">
                <BadgeCheck className="w-3 h-3" />
                Verified
              </Badge>
            )}
            {!isCurated && (
              <Badge variant="outline" className="gap-1 text-xs px-2 py-0 h-5 text-muted-foreground">
                <Info className="w-3 h-3" />
                Sample
              </Badge>
            )}
            {isAIPick && (
              <Badge variant="default" className="gap-1 text-xs px-2 py-0 h-5">
                <Sparkles className="w-3 h-3" />
                AI Pick
              </Badge>
            )}
            {trendingValue && (
              <Badge variant="secondary" className="gap-1 text-xs px-2 py-0 h-5">
                <TrendingUp className="w-3 h-3" />
                Trending
              </Badge>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          data-testid={`button-save-${id}`}
          onClick={(e) => {
            e.stopPropagation();
            onSave?.();
          }}
          className="p-1 rounded-full hover-elevate active-elevate-2 flex-shrink-0"
        >
          <Heart
            className={`w-5 h-5 ${
              isSaved ? "fill-primary text-primary" : "text-muted-foreground"
            }`}
          />
        </button>
      </div>

      {/* Discount amount - HUGE and prominent */}
      <div className="mb-3">
        <h3
          data-testid={`text-discount-${id}`}
          className="text-5xl font-extrabold text-primary font-display leading-none"
        >
          {discountAmount}
        </h3>
      </div>

      {/* Title */}
      <h4 className="text-base font-medium mb-3 line-clamp-2 text-foreground">
        {title}
      </h4>

      {/* Category and app requirement */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">{category}</p>
        {requiresApp && (
          <span className="text-xs text-amber-600 dark:text-amber-500">App Required</span>
        )}
      </div>

      {/* Footer: Expiration + Distance */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
        {daysLeft && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{daysLeft}</span>
          </div>
        )}
        {distance !== undefined && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{distance.toFixed(1)} mi</span>
          </div>
        )}
      </div>

      {/* Claim count */}
      {claimCount > 0 && (
        <p className="text-xs text-muted-foreground mb-4" data-testid={`text-claims-${id}`}>
          {claimCount.toLocaleString()} people claimed this
        </p>
      )}

      {/* View Deal Button - Full width purple button */}
      <Button
        data-testid={`button-view-deal-${id}`}
        onClick={onViewDeal}
        className="w-full"
        size="lg"
      >
        View Deal
      </Button>
    </Card>
  );
}
