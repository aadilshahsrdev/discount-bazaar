"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasImages = images.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Main display image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100">
        {hasImages ? (
          <Image
            key={activeIndex}
            src={images[activeIndex]}
            alt={alt}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="50vw"
            priority
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-400">No image</div>
        )}
      </div>

      {/* Thumbnail gallery — only show when more than one image */}
      {hasImages && images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-20 ${
                i === activeIndex
                  ? "border-oceanic ring-2 ring-oceanic/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              aria-label={`View image ${i + 1}`}
              aria-current={i === activeIndex}
            >
              <Image
                src={img}
                alt={`${alt} — image ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
