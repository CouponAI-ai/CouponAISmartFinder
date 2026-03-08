import { useState } from "react";
import { getBrandLogoUrl, getBrandPhoto, getBrandColor, getStoreInitials } from "@/lib/brandLogos";

interface BrandLogoProps {
  storeName: string;
  storeLogoUrl?: string | null;
  /** Category image URL used as fallback when no brand photo exists */
  categoryFallbackImage?: string | null;
  size?: number;
  className?: string;
  /** Fill mode: fills the parent container completely (used for card banners) */
  fill?: boolean;
}

/**
 * Renders the best available brand visual for a store.
 *
 * Fill mode (card banners) priority:
 *   1. Brand-specific photo  (e.g. pizza photo for Domino's)
 *   2. Category image         (e.g. grocery photo for Brookshires, shoe photo for Shoe Show)
 *   3. Colored initials avatar (absolute last resort — virtually never shown)
 *
 * In all fill cases, a white logo-pill badge is shown bottom-left with the
 * Google-cached brand icon + store name.
 *
 * Size mode (small logos):
 *   - Google-cached brand icon → colored initials circle
 */
export default function BrandLogo({
  storeName,
  storeLogoUrl,
  categoryFallbackImage,
  size = 40,
  className = "",
  fill = false,
}: BrandLogoProps) {
  const brandPhoto = getBrandPhoto(storeName);
  const logoUrl = storeLogoUrl || getBrandLogoUrl(storeName);
  const bgColor = getBrandColor(storeName);
  const initials = getStoreInitials(storeName);

  // Photo fallback chain: brand photo → category image → null (shows colored bg)
  const bestPhoto = brandPhoto || categoryFallbackImage || null;

  const [photoFailed, setPhotoFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const containerStyle = fill
    ? { width: "100%", height: "100%" }
    : { width: size, height: size, flexShrink: 0 as const };

  /* ── Fill mode: photo + logo badge overlay ── */
  if (fill) {
    const showPhoto = bestPhoto && !photoFailed;

    return (
      <div className={`relative overflow-hidden ${className}`} style={containerStyle}>
        {showPhoto ? (
          <img
            src={bestPhoto}
            alt={storeName}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          /* Colored bg with large faded initials — truly last resort */
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: bgColor }}
          >
            <span
              className="font-extrabold text-white select-none opacity-25"
              style={{ fontSize: "clamp(24px, 40%, 56px)" }}
            >
              {initials}
            </span>
          </div>
        )}

        {/* Logo + name badge — always shown */}
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-full shadow-sm"
          style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(6px)", padding: "3px 8px 3px 4px" }}>
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt={storeName}
              className="object-contain flex-shrink-0"
              style={{ width: 18, height: 18 }}
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span
              className="flex-shrink-0 flex items-center justify-center rounded-full text-[9px] font-extrabold text-white"
              style={{ width: 18, height: 18, background: bgColor }}
            >
              {initials.charAt(0)}
            </span>
          )}
          <span className="text-[10px] font-bold text-gray-800 max-w-[88px] truncate leading-none">
            {storeName}
          </span>
        </div>
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
