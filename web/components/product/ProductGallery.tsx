/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

function isVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMedia = images.length > 0;
  const media = images.slice(0, 4);
  const current = media[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      {/* Main display */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100">
        {hasMedia && current ? (
          isVideo(current) ? (
            <video
              key={activeIndex}
              src={current}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              key={activeIndex}
              src={current}
              alt={alt}
              className="h-full w-full object-cover transition-opacity duration-300"
              loading="eager"
            />
          )
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-400">No media</div>
        )}
      </div>

      {/* Thumbnail gallery — always show 4 slots */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 4 }).map((_, i) => {
          const url = media[i];
          const active = i === activeIndex;
          return (
            <button
              key={i}
              onClick={() => url && setActiveIndex(i)}
              disabled={!url}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-20 ${
                active
                  ? "border-oceanic ring-2 ring-oceanic/20"
                  : url
                    ? "border-slate-200 hover:border-slate-300"
                    : "border-dashed border-slate-200 bg-slate-50"
              }`}
              aria-label={url ? `View media ${i + 1}` : `Empty slot ${i + 1}`}
              aria-current={active}
            >
              {url ? (
                isVideo(url) ? (
                  <div className="relative h-full w-full">
                    <video src={url} className="h-full w-full object-cover" muted />
                    <div className="absolute inset-0 grid place-items-center bg-black/20">
                      <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <img
                    src={url}
                    alt={`${alt} — image ${i + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )
              ) : (
                <div className="grid h-full w-full place-items-center text-xs text-slate-300">—</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
