import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Calendar, Check, BadgeCheck, Smartphone, MapPin, Eye } from "lucide-react";
import { formatDistance } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { getStoreUrl } from "@/lib/storeUrls";
import BrandLogo from "@/components/BrandLogo";
import { getBrandColor } from "@/lib/brandLogos";
import { getCategoryImage } from "@/lib/categoryImages";
import type { Coupon } from "@shared/schema";

interface DealDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Coupon;
}

export default function DealDetailModal({
  open,
  onOpenChange,
  deal,
}: DealDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const trackedRef = useRef<string | null>(null);
  const { toast } = useToast();

  const [viewCountLoading, setViewCountLoading] = useState(false);

  useEffect(() => {
    if (open && deal.id && trackedRef.current !== deal.id) {
      trackedRef.current = deal.id;
      setViewCountLoading(true);

      const fetchViewCount = async () => {
        try {
          const postRes = await fetch(`/api/coupons/${deal.id}/view`, {
            method: "POST",
            credentials: "include",
          });
          if (postRes.ok) {
            const data = await postRes.json();
            if (data && typeof data.viewCount === "number") {
              setViewCount(data.viewCount);
              setViewCountLoading(false);
              return;
            }
          }
        } catch {
        }

        try {
          const getRes = await fetch(`/api/coupons/${deal.id}/views`, {
            credentials: "include",
          });
          if (getRes.ok) {
            const data = await getRes.json();
            if (data && typeof data.viewCount === "number") {
              setViewCount(data.viewCount);
            }
          }
        } catch {
        }
        setViewCountLoading(false);
      };

      fetchViewCount();
    }
    if (!open) {
      trackedRef.current = null;
      setViewCount(null);
      setViewCountLoading(false);
    }
  }, [open, deal.id]);

  const expirationText = deal.expirationDate
    ? formatDistance(
        typeof deal.expirationDate === 'string' ? new Date(deal.expirationDate) : deal.expirationDate,
        new Date(),
        { addSuffix: true }
      )
    : null;

  const handleCopyCode = async () => {
    if (deal.code) {
      await navigator.clipboard.writeText(deal.code);
      setCopied(true);
      toast({
        title: "Code copied!",
        description: "Coupon code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const storeUrl = getStoreUrl(deal.storeName);
  const brandBg = getBrandColor(deal.storeName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="modal-deal-detail"
        className="max-w-md max-h-[90vh] overflow-y-auto p-0"
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Deal Details</DialogTitle>
        </DialogHeader>

        {/* Hero banner — brand logo fills the header */}
        <div className="relative h-36 overflow-hidden rounded-t-lg" style={{ background: brandBg }}>
          {/* Brand logo centered in header */}
          <BrandLogo
            storeName={deal.storeName}
            storeLogoUrl={deal.storeLogoUrl ?? undefined}
            categoryFallbackImage={getCategoryImage(deal.category)}
            fill
            className="absolute inset-0"
          />
          {/* Dark wash for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/60" />

          {/* Discount + store name overlay */}
          <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80 mb-0.5">
              {deal.storeName}
            </p>
            <p className="text-5xl font-extrabold font-display text-white drop-shadow-lg">
              {deal.discountAmount}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-5">
          {/* Title */}
          <h3 className="text-xl font-bold text-center mb-1">{deal.title}</h3>

          {deal.description && (
            <p className="text-sm text-muted-foreground text-center mb-4">{deal.description}</p>
          )}

          {/* Status badges */}
          <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
            {(deal as any).isCurated && (deal as any).isVerified && (
              <Badge variant="default" className="gap-1 bg-emerald-600">
                <BadgeCheck className="w-3 h-3" />
                Verified Code
              </Badge>
            )}
            {(deal as any).isLocalBusiness && (
              <Badge variant="outline" className="gap-1 text-indigo-600 border-indigo-300 dark:text-indigo-400 dark:border-indigo-700">
                <MapPin className="w-3 h-3" />
                Local Business
              </Badge>
            )}
            {(deal as any).requiresApp && (
              <Badge variant="secondary" className="gap-1">
                <Smartphone className="w-3 h-3" />
                App Required
              </Badge>
            )}
          </div>

          {/* Source */}
          {(deal as any).source && (deal as any).isCurated && (
            <p className="text-xs text-center text-muted-foreground mb-4">
              Source: {(deal as any).source}
            </p>
          )}

          {/* Category and expiration */}
          <div className="flex items-center justify-center gap-4 mb-5 flex-wrap">
            <Badge variant="secondary">{deal.category}</Badge>
            {expirationText && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Expires {expirationText}</span>
              </div>
            )}
          </div>

          {/* Coupon code */}
          {deal.code && (
            <div className="mb-5">
              <p className="text-xs text-muted-foreground text-center mb-3 font-semibold uppercase tracking-widest">
                Your Coupon Code
              </p>
              <Button
                data-testid="button-copy-code"
                onClick={handleCopyCode}
                className="w-full rounded-full text-base font-bold"
                size="lg"
                style={{ background: copied ? "hsl(45 93% 38%)" : "hsl(var(--accent))", color: "hsl(40 50% 10%)" }}
              >
                {copied ? (
                  <><Check className="w-5 h-5 mr-2" /> Copied!</>
                ) : (
                  <><Copy className="w-5 h-5 mr-2" /> Copy Code</>
                )}
              </Button>
              <div className="mt-2 bg-muted border border-border rounded-lg px-4 py-2.5 text-center">
                <p className="font-mono text-xl font-extrabold text-foreground tracking-[0.2em]">
                  {deal.code}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Tap button above to copy</p>
              </div>
            </div>
          )}

          {/* Shop Now button */}
          {storeUrl ? (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-5"
              data-testid="button-shop-now"
            >
              <Button
                className="w-full rounded-full"
                variant="default"
                size="lg"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Shop at {deal.storeName}
              </Button>
            </a>
          ) : (
            <Button
              data-testid="button-shop-now"
              className="w-full mb-5 rounded-full"
              variant="default"
              size="lg"
              disabled
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Shop Now
            </Button>
          )}

          {/* Terms */}
          {deal.termsAndConditions && (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-2">Terms & Conditions</h4>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {deal.termsAndConditions}
              </p>
            </div>
          )}

          {/* Interest count */}
          {viewCountLoading && (
            <div className="flex items-center justify-center gap-1 text-center text-sm text-muted-foreground mt-4" data-testid="text-interest-loading">
              <Eye className="w-4 h-4 animate-pulse" />
              <span className="animate-pulse">Loading interest...</span>
            </div>
          )}
          {!viewCountLoading && viewCount !== null && viewCount > 0 && (
            <div className="flex items-center justify-center gap-1 text-center text-sm text-muted-foreground mt-4" data-testid="text-interest-count">
              <Eye className="w-4 h-4" />
              {viewCount.toLocaleString()} {viewCount === 1 ? "person is" : "people are"} interested in this deal
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
