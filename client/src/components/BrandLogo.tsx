import { useState } from "react";
import { getBrandLogoUrl, getBrandPhoto, getBrandColor, getStoreInitials } from "@/lib/brandLogos";

interface BrandLogoProps {
  storeName: string;
  storeLogoUrl?: string | null;
  size?: number;
  className?: string;
  /** Fill mode: fills the parent container completely (used for card banners) */
  fill?: boolean;
}

/**
 * Renders the best available brand visual for a store.
 *
 * Fill mode (card banners):
 *   - Shows a brand-specific Unsplash photo background (e.g. a pizza photo for Domino's)
 *   - Overlays the Google-fetched brand logo in a white pill at the bottom-left
 *   - Falls back to colored initials avatar if no photo available
 *
 * Size mode (small logos):
 *   - Shows the Google-fetched brand logo
 *   - Falls back to colored initials circle
 */
export default function BrandLogo({ storeName, storeLogoUrl, size = 40, className = "", fill = false }: BrandLogoProps) {
  const brandPhoto = getBrandPhoto(storeName);
  const logoUrl = storeLogoUrl || getBrandLogoUrl(storeName);
  const bgColor = getBrandColor(storeName);
  const initials = getStoreInitials(storeName);

  const [photoFailed, setPhotoFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const containerStyle = fill
    ? { width: "100%", height: "100%" }
    : { width: size, height: size, flexShrink: 0 as const };

  /* ── Fill mode: photo background + logo badge ── */
  if (fill) {
    const showPhoto = brandPhoto && !photoFailed;

    return (
      <div className={`relative overflow-hidden ${className}`} style={containerStyle}>
        {showPhoto ? (
          <img
            src={brandPhoto}
            alt={storeName}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          /* Colored background with large initials for unknown brands */
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: bgColor }}
          >
            <span
              className="font-extrabold text-white select-none opacity-30"
              style={{ fontSize: "clamp(24px, 40%, 56px)" }}
            >
              {initials}
            </span>
          </div>
        )}

        {/* Logo badge — white pill at bottom-left */}
        {logoUrl && !logoFailed && (
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
            <img
              src={logoUrl}
              alt={storeName}
              className="object-contain"
              style={{ width: 20, height: 20 }}
              onError={() => setLogoFailed(true)}
            />
            <span className="text-[10px] font-bold text-gray-800 max-w-[80px] truncate leading-none">
              {storeName}
            </span>
          </div>
        )}

        {/* Name badge fallback when no logo */}
        {(!logoUrl || logoFailed) && (
          <div className="absolute bottom-2 left-2 z-10 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
            <span className="text-[10px] font-bold text-white max-w-[90px] truncate block leading-none">
              {storeName}
            </span>
          </div>
        )}
      </div>
    );
  }

  /* ── Size mode: small logo circle ── */
  if (logoUrl && !logoFailed) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden rounded-full bg-white ${className}`}
        style={{ ...containerStyle, border: "1px solid #e5e7eb" }}
      >
        <img
          src={logoUrl}
          alt={storeName}
          className="object-contain"
          style={{ width: size * 0.75, height: size * 0.75 }}
          onError={() => setLogoFailed(true)}
        />
      </div>
    );
  }

  /* Initials fallback */
  const fontSize = Math.max(10, Math.round(size * 0.38));
  return (
    <div
      className={`flex items-center justify-center font-extrabold text-white select-none rounded-full ${className}`}
      style={{ ...containerStyle, background: bgColor, fontSize }}
    >
      {initials}
    </div>
  );
}
