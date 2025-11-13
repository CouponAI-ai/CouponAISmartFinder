import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Calendar, Check } from "lucide-react";
import { formatDistance } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="modal-deal-detail"
        className="max-w-md max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Deal Details</DialogTitle>
        </DialogHeader>

        {/* Store logo and discount */}
        <div className="flex flex-col items-center text-center mb-6">
          {deal.storeLogoUrl && (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <img
                src={deal.storeLogoUrl}
                alt={deal.storeName}
                className="w-14 h-14 object-contain rounded-full"
              />
            </div>
          )}
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-2 font-display">
            {deal.discountAmount}
          </h2>
          
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-2">
            {deal.storeName}
          </p>
          
          <h3 className="text-2xl font-semibold mb-2">{deal.title}</h3>
          
          {deal.description && (
            <p className="text-base text-muted-foreground">{deal.description}</p>
          )}
        </div>

        {/* Category and expiration */}
        <div className="flex items-center justify-center gap-4 mb-6">
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
          <div className="mb-6">
            <Button
              data-testid="button-copy-code"
              onClick={handleCopyCode}
              variant="outline"
              className="w-full h-auto py-4 text-lg font-mono"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  {deal.code}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Shop Now button */}
        <Button
          data-testid="button-shop-now"
          className="w-full mb-6"
          size="lg"
        >
          <ExternalLink className="w-5 h-5 mr-2" />
          Shop Now
        </Button>

        {/* Terms and conditions */}
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
      </DialogContent>
    </Dialog>
  );
}
