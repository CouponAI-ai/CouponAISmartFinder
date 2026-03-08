import { useState } from "react";
import { getBrandLogoUrl, getBrandColor, getStoreInitials } from "@/lib/brandLogos";

interface BrandLogoProps {
  storeName: string;
  storeLogoUrl?: string | null;
  size?: number;
  className?: string;
  /** If true, fill the full parent container instead of using size */
  fill?: boolean;
}

/**
 * Renders the best available brand image for a store:
 *   1. storeLogoUrl (already stored in the deal)
 *   2. Clearbit logo fetched via domain map
 *   3. Colored initials avatar
 */
export default function BrandLogo({ storeName, storeLogoUrl, size = 40, className = "", fill = false }: BrandLogoProps) {
  const clearbitUrl = getBrandLogoUrl(storeName);
  // Decide initial URL to try
  const firstUrl = storeLogoUrl || clearbitUrl;
  const secondUrl = storeLogoUrl && clearbitUrl !== storeLogoUrl ? clearbitUrl : null;

  const [src, setSrc] = useState<string | null>(firstUrl);
  const [triedSecond, setTriedSecond] = useState(false);

  const bgColor = getBrandColor(storeName);
  const initials = getStoreInitials(storeName);

  const handleError = () => {
    if (!triedSecond && secondUrl) {
      setTriedSecond(true);
      setSrc(secondUrl);
    } else {
      setSrc(null);
    }
  };

  const containerStyle = fill
    ? { width: "100%", height: "100%" }
    : { width: size, height: size, flexShrink: 0 };

  if (src) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden ${className}`}
        style={{ ...containerStyle, background: "#fff" }}
      >
        <img
          src={src}
          alt={storeName}
          onError={handleError}
          className="w-full h-full object-contain"
          style={{ padding: fill ? "12%" : "8%" }}
        />
      </div>
    );
  }

  /* Initials avatar fallback */
  const fontSize = fill ? "clamp(12px, 28%, 32px)" : Math.max(10, Math.round(size * 0.38));

  return (
    <div
      className={`flex items-center justify-center font-extrabold text-white select-none ${className}`}
      style={{ ...containerStyle, background: bgColor, fontSize }}
    >
      {initials}
    </div>
  );
}
