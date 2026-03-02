import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, TrendingUp, Sparkles, MapPin, BadgeCheck, Copy, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { getCategoryImage } from "@/lib/categoryImages";
import { useToast } from "@/hooks/use-toast";

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
  isLocalBusiness?: boolean;
  requiresApp?: boolean;
  code?: string | null;
  aiReason?: string;
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
  isLocalBusiness = false,
  requiresApp = false,
  code,
  aiReason,
  onSave,
  onViewDeal,
  distance,
}: DealCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
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
  const bannerImage = getCategoryImage(category);

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Code copied!", description: `${code} copied to clipboard` });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      data-testid={`card-deal-${id}`}
      className="overflow-hidden hover-elevate transition-all duration-300 animate-fade-in"
    >
      {/* Category image banner */}
      <div className="relative h-20 overflow-hidden">
        <img
          src={bannerImage}
          alt={category}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40" />

        {/* Store logo overlapping */}
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <div className="w-10 h-10 rounded-full bg-card border-2 border-card flex items-center justify-center shadow-md overflow-hidden">
            {storeLogoUrl ? (
              <img src={storeLogoUrl} alt={storeName} className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs font-bold text-foreground">
                {storeName.charAt(0)}
              </span>
            )}
          </div>
        </div>

        {/* Discount amount on banner */}
        <div className="absolute top-2 right-3">
          <span
            data-testid={`text-discount-${id}`}
            className="text-3xl font-extrabold text-white font-display drop-shadow-md"
          >
            {discountAmount}
          </span>
        </div>

        {/* Save button on banner */}
        <button
          data-testid={`button-save-${id}`}
          onClick={(e) => { e.stopPropagation(); onSave?.(); }}
          className="absolute top-2 left-3 p-1.5 rounded-full bg-black/30 backdrop-blur-sm hover-elevate active-elevate-2"
        >
          <Heart
            className={`w-4 h-4 ${isSaved ? "fill-white text-white" : "text-white"}`}
          />
        </button>
      </div>

      {/* Card body */}
      <div className="pt-7 px-4 pb-4">
        {/* Store name + badges */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p
              data-testid={`text-store-${id}`}
              className="font-bold text-sm text-foreground truncate"
            >
              {storeName}
            </p>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {isCurated && isVerified && (
                <Badge variant="default" className="gap-1 text-xs px-1.5 py-0 h-5 bg-emerald-600">
                  <BadgeCheck className="w-3 h-3" />
                  Verified
                </Badge>
              )}
              {isLocalBusiness && (
                <Badge variant="outline" className="gap-1 text-xs px-1.5 py-0 h-5 text-indigo-600 border-indigo-300 dark:text-indigo-400 dark:border-indigo-700">
                  <MapPin className="w-3 h-3" />
                  Local
                </Badge>
              )}
              {isAIPick && (
                <Badge variant="default" className="gap-1 text-xs px-1.5 py-0 h-5">
                  <Sparkles className="w-3 h-3" />
                  AI Pick
                </Badge>
              )}
              {trendingValue && (
                <Badge variant="secondary" className="gap-1 text-xs px-1.5 py-0 h-5">
                  <TrendingUp className="w-3 h-3" />
                  Trending
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium mb-2 line-clamp-2 text-foreground">
          {title}
        </h4>

        {/* AI Reason */}
        {aiReason && (
          <p className="text-xs text-muted-foreground mb-2 italic line-clamp-2">
            "{aiReason}"
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
          <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
            {category}
          </span>
          {daysLeft && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {daysLeft}
            </span>
          )}
          {distance !== undefined && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {distance.toFixed(1)} mi
            </span>
          )}
        </div>

        {/* Code row + View Deal */}
        <div className="flex gap-2">
          {code ? (
            <button
              data-testid={`button-copy-code-${id}`}
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-accent text-accent font-mono text-xs font-semibold hover-elevate active-elevate-2 flex-shrink-0 transition-colors"
            >
              {copied ? (
                <><Check className="w-3 h-3" /> Copied!</>
              ) : (
                <><Copy className="w-3 h-3" /> {code}</>
              )}
            </button>
          ) : null}
          <Button
            data-testid={`button-view-deal-${id}`}
            onClick={onViewDeal}
            className="flex-1 bg-primary hover:bg-primary text-primary-foreground"
            size="sm"
          >
            View Deal
          </Button>
        </div>
      </div>
    </Card>
  );
}
