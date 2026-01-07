import { Announcement } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AnnouncementCardProps {
  announcement: Announcement;
  className?: string;
  featured?: boolean;
  featuredIndex?: number;
}

export function AnnouncementCard({
  announcement,
  className,
}: AnnouncementCardProps) {
  const heading = announcement.CallToAction?.Heading || announcement.Title;
  const subHeading = announcement.CallToAction?.SubHeading || announcement.Body;
  const hasLink = announcement.CallToAction?.Link;

  const imageContent = announcement.Image ? (
    <img
      src={announcement.Image}
      alt={announcement.Title}
      loading="lazy"
      className="w-full h-full object-cover transition-transform duration-[650ms] ease-out group-hover:scale-[1.025]"
    />
  ) : (
    <div
      className="w-full h-full grid place-items-center p-4 md:p-7 outline outline-1 outline-white/95"
      style={{
        backgroundColor: '#62bb46',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.15'/%3E%3Ccircle cx='12' cy='12' r='1' fill='%23ffffff' fill-opacity='0.25'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'repeat',
        backgroundSize: '20px 20px',
        outlineOffset: '-10px'
      } as React.CSSProperties}
    >
      <span className="text-white font-extrabold uppercase leading-tight text-center text-xl md:text-3xl tracking-tight">
        {announcement.Title}
      </span>
    </div>
  );

  return (
    <article
      className={cn('bg-white flex flex-col overflow-hidden group', className)}
      data-announcement-id={announcement.ID}
    >
      <a
        href={hasLink || '#'}
        className="relative block aspect-video overflow-hidden"
        aria-label={announcement.Title}
      >
        {imageContent}
      </a>
      <a
        href={hasLink || '#'}
        className="p-3 md:p-4 flex flex-col overflow-hidden hover:underline"
      >
        <h3 className="font-extrabold text-lg md:text-xl leading-tight mb-1 line-clamp-1">
          {heading}
        </h3>
        {subHeading && (
          <p className="text-primary/65 text-sm leading-snug line-clamp-2">
            {subHeading.replace(/<[^>]*>/g, '').trim().substring(0, 140)}
          </p>
        )}
      </a>
    </article>
  );
}
