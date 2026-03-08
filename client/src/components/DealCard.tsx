import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, TrendingUp, Sparkles, MapPin, BadgeCheck, Copy, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { getBrandColor } from "@/lib/brandLogos";
import BrandLogo from "@/components/BrandLogo";
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
  const trendingValue = typeof isTrending === "number" ? isTrending === 1 : isTrending;
  const brandBg = getBrandColor(storeName);

  const getDaysLeft = () => {
    if (!expirationDate) return null;
    const expDate = typeof expirationDate === "string" ? new Date(expirationDate) : expirationDate;
    const now = new Date();
    const diff = expDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Expired";
    if (days === 0) return "Today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  const daysLeft = getDaysLeft();

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
      {/* ── Brand banner ───────────────────────────────────────── */}
      <div className="relative h-24 overflow-hidden" style={{ background: brandBg }}>
        <BrandLogo
          storeName={storeName}
          storeLogoUrl={storeLogoUrl}
          categoryFallbackImage={getCategoryImage(category)}
          fill
          className="absolute inset-0"
        />
        {/* Gradient wash for discount text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30 pointer-events-none" />

        {/* Discount amount */}
        <div className="absolute top-2 right-3 z-10">
          <span
            data-testid={`text-discount-${id}`}
            className="text-3xl font-extrabold text-white font-display drop-shadow-md"
          >
            {discountAmount}
          </span>
        </div>

        {/* Save button */}
        <button
          data-testid={`button-save-${id}`}
          onClick={(e) => { e.stopPropagation(); onSave?.(); }}
          className="absolute top-2 left-3 z-10 p-1.5 rounded-full bg-black/30 backdrop-blur-sm hover-elevate active-elevate-2"
        >
          <Heart className={`w-4 h-4 ${isSaved ? "fill-white text-white" : "text-white"}`} />
        </button>

        {/* Category pill */}
        <div className="absolute bottom-2 right-3 z-10">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
            {category}
          </span>
        </div>
      </div>

      {/* ── Card body ──────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-4">
        {/* Store name + badges */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
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
        <h4 className="text-sm font-medium mb-2 line-clamp-2 text-foreground">{title}</h4>

        {/* AI Reason */}
        {aiReason && (
          <p className="text-xs text-muted-foreground mb-2 italic line-clamp-2">"{aiReason}"</p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
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
          {requiresApp && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
              App Required
            </span>
          )}
        </div>

        {/* Action row */}
        <div className="flex gap-2">
          {code ? (
            <button
              data-testid={`button-copy-code-${id}`}
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-bold hover-elevate active-elevate-2 flex-shrink-0 transition-all"
              style={{ background: copied ? "hsl(45 93% 38%)" : "hsl(var(--accent))", color: "hsl(40 50% 10%)" }}
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
            className="flex-1 rounded-full"
            variant="default"
            size="sm"
          >
            View Deal
          </Button>
        </div>
      </div>
    </Card>
  );
}
