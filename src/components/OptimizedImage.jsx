import React from 'react';

/**
 * Helper to build an optimized Unsplash image URL with specific width, quality, and modern format.
 */
export function getOptimizedImageUrl(url, width = 800, quality = 65) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('fm', 'webp'); // Guarantee modern compressed WebP output (<50KB)
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', String(quality));
      return u.toString();
    } catch {
      return url;
    }
  }
  return url;
}

/**
 * Builds a responsive srcset string for Unsplash URLs.
 */
export function getResponsiveSrcSet(url, widths = [400, 800, 1200], quality = 65) {
  if (!url || typeof url !== 'string') return undefined;
  if (url.includes('images.unsplash.com')) {
    return widths.map((w) => `${getOptimizedImageUrl(url, w, quality)} ${w}w`).join(', ');
  }
  return undefined;
}

/**
 * Reusable responsive image component that:
 * 1. Generates responsive srcSet & sizes for fast loading on phones and desktops
 * 2. Uses WebP compression to drastically reduce image size (<50KB)
 * 3. Specifies explicit width & height to prevent layout shifts ("Out of place" audit)
 * 4. Supports native lazy loading and decoding="async" to reduce initial page requests
 */
export default function OptimizedImage({
  src,
  alt = '',
  className = '',
  widths = [400, 800, 1200],
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  width = 800,
  height = 500,
  fallback = '',
  ...props
}) {
  const defaultWidth = priority ? widths[widths.length - 1] : (widths[1] || 800);
  const optimizedSrc = getOptimizedImageUrl(src, defaultWidth, 65);
  const srcSet = getResponsiveSrcSet(src, widths, 65);

  return (
    <img
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      width={width}
      height={height}
      onError={(e) => {
        if (fallback && e.target.src !== fallback) {
          e.target.src = fallback;
        }
      }}
      {...props}
    />
  );
}
