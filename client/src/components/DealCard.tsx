import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, TrendingUp, Sparkles } from "lucide-react";
import { formatDistance } from "date-fns";

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
  onSave?: () => void;
  onViewDeal?: () => void;
}

export default function DealCard({
  id,
  storeName,
  storeLogoUrl,
  discountAmount,
  title,
  description,
  category,
  expirationDate,
  claimCount = 0,
  isTrending = false,
  isSaved = false,
  isAIPick = false,
  onSave,
  onViewDeal,
}: DealCardProps) {
  const expirationText = expirationDate
    ? formatDistance(
        typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate,
        new Date(),
        { addSuffix: true }
      )
    : null;

  const trendingValue = typeof isTrending === 'number' ? isTrending === 1 : isTrending;

  return (
    <Card
      data-testid={`card-deal-${id}`}
      className="relative p-4 hover-elevate transition-all duration-200"
    >
      {/* Save button - top right */}
      <button
        data-testid={`button-save-${id}`}
        onClick={(e) => {
          e.stopPropagation();
          onSave?.();
        }}
        className="absolute top-4 right-4 p-2 rounded-full hover-elevate active-elevate-2 z-10"
      >
        <Heart
          className={`w-5 h-5 ${
            isSaved ? "fill-primary text-primary" : "text-muted-foreground"
          }`}
        />
      </button>

      {/* Badges - top left */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        {trendingValue && (
          <Badge variant="destructive" className="gap-1">
            <TrendingUp className="w-3 h-3" />
            Trending
          </Badge>
        )}
        {isAIPick && (
          <Badge variant="default" className="gap-1">
            <Sparkles className="w-3 h-3" />
            AI Pick
          </Badge>
        )}
      </div>

      {/* Store logo */}
      {storeLogoUrl && (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 mt-8">
          <img
            src={storeLogoUrl}
            alt={storeName}
            className="w-10 h-10 object-contain rounded-full"
          />
        </div>
      )}

      {/* Discount amount - the star of the show */}
      <div className="mb-2">
        <h3
          data-testid={`text-discount-${id}`}
          className="text-3xl md:text-4xl font-extrabold text-primary font-display"
        >
          {discountAmount}
        </h3>
      </div>

      {/* Store name */}
      <div className="mb-2">
        <p
          data-testid={`text-store-${id}`}
          className="text-sm font-medium uppercase tracking-wide text-muted-foreground"
        >
          {storeName}
        </p>
      </div>

      {/* Title */}
      <h4 className="text-lg font-semibold mb-2 line-clamp-2">{title}</h4>

      {/* Description */}
      {description && (
        <p className="text-base text-muted-foreground line-clamp-2 mb-3">
          {description}
        </p>
      )}

      {/* Category badge */}
      <div className="mb-3">
        <Badge variant="secondary">{category}</Badge>
      </div>

      {/* Expiration and claim count */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        {expirationText && (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Expires {expirationText}</span>
          </div>
        )}
        {claimCount > 0 && (
          <span data-testid={`text-claims-${id}`}>
            {claimCount.toLocaleString()} claimed
          </span>
        )}
      </div>

      {/* CTA Button */}
      <Button
        data-testid={`button-view-deal-${id}`}
        onClick={onViewDeal}
        className="w-full"
      >
        View Deal
      </Button>
    </Card>
  );
}
