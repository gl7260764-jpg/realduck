import Image from "next/image";

interface SEOBlockProps {
  heading: string;
  content: string;
  imageSrc: string;
  imageAlt: string;
  headingLevel?: "h1" | "h2";
  variant?: "visible" | "hidden";
}

export default function SEOBlock({
  heading,
  content,
  imageSrc,
  imageAlt,
  headingLevel = "h2",
  variant = "visible",
}: SEOBlockProps) {
  const HeadingTag = headingLevel;

  if (variant === "hidden") {
    return (
      <section className="sr-only" aria-label="About Real Duck Distro">
        <HeadingTag>{heading}</HeadingTag>
        <p>{content}</p>
        <Image src={imageSrc} alt={imageAlt} width={800} height={450} loading="lazy" />
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        {/* Text */}
        <div>
          {/* Heading with accent line */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-[3px] bg-slate-900 rounded-full" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                About Us
              </span>
            </div>
            <HeadingTag className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
              {heading}
            </HeadingTag>
          </div>
          <p className="text-gray-600 text-sm sm:text-base leading-[1.85] text-justify">
            {content}
          </p>
        </div>

        {/* Image */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            loading="lazy"
          />
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
}
