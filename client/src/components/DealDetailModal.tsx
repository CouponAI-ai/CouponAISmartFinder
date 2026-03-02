import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Calendar, Check, BadgeCheck, Smartphone, MapPin } from "lucide-react";
import { formatDistance } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

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

  const bannerImage = getCategoryImage(deal.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="modal-deal-detail"
        className="max-w-md max-h-[90vh] overflow-y-auto p-0"
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Deal Details</DialogTitle>
        </DialogHeader>

        {/* Hero banner */}
        <div className="relative h-32 overflow-hidden rounded-t-lg">
          <img src={bannerImage} alt={deal.category} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/60" />

          {/* Discount overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">
              {deal.storeName}
            </p>
            <p className="text-5xl font-extrabold font-display drop-shadow-lg">
              {deal.discountAmount}
            </p>
          </div>

          {/* Store logo */}
          {deal.storeLogoUrl && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
              <div className="w-14 h-14 rounded-full bg-card border-4 border-card shadow-lg flex items-center justify-center overflow-hidden">
                <img
                  src={deal.storeLogoUrl}
                  alt={deal.storeName}
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`px-6 pb-6 ${deal.storeLogoUrl ? 'pt-10' : 'pt-6'}`}>
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
            <div className="mb-4">
              <p className="text-xs text-muted-foreground text-center mb-2 font-medium uppercase tracking-wide">
                Coupon Code
              </p>
              <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-3 text-center mb-3">
                <p className="font-mono text-lg font-bold text-accent tracking-widest">
                  {deal.code}
                </p>
              </div>
              <Button
                data-testid="button-copy-code"
                onClick={handleCopyCode}
                className="w-full bg-accent hover:bg-accent text-accent-foreground rounded-full"
                size="lg"
              >
                {copied ? (
                  <><Check className="w-5 h-5 mr-2" /> Copied!</>
                ) : (
                  <><Copy className="w-5 h-5 mr-2" /> Copy Code</>
                )}
              </Button>
            </div>
          )}

          {/* Shop Now button */}
          <Button
            data-testid="button-shop-now"
            className="w-full mb-5 rounded-full"
            variant="default"
            size="lg"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Shop Now
          </Button>

          {/* Terms */}
          {deal.termsAndConditions && (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-2">Terms & Conditions</h4>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {deal.termsAndConditions}
              </p>
            </div>
          )}

          {/* Claim count */}
          {deal.claimCount && deal.claimCount > 0 && (
            <div className="text-center text-sm text-muted-foreground mt-4">
              {deal.claimCount.toLocaleString()} people claimed this deal
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
