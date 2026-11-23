import Image from "next/image";
import type { StyleArtwork as Artwork } from "@/lib/visual-styles";

export function StyleArtwork({
  artwork,
  className = "",
  sizes,
  priority = false,
}: {
  artwork: Artwork;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <figure className={`style-artwork ${className}`}>
      <div className="style-artwork-image">
        <Image
          src={artwork.src}
          alt={artwork.alt}
          width={artwork.width}
          height={artwork.height}
          sizes={sizes}
          priority={priority}
        />
      </div>
      <figcaption>
        <span>{artwork.title}</span>
        {artwork.source && <a href={artwork.source.href} target="_blank" rel="noreferrer">{artwork.source.label}</a>}
      </figcaption>
    </figure>
  );
}
