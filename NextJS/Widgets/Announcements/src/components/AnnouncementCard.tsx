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
        backgroundColor: '#1c2b39',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.15'/%3E%3Ccircle cx='12' cy='12' r='1' fill='%23ffffff' fill-opacity='0.25'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'repeat',
        backgroundSize: '20px 20px',
        outlineOffset: '-10px'
      } as React.CSSProperties}
    >
      <span className="text-white font-extrabold uppercase leading-tight text-center tracking-tight" style={{ fontSize: 'clamp(1rem, 8cqw, 1.875rem)' }}>
        {announcement.Title}
      </span>
    </div>
  );

  return (
    <article
      className={cn('flex flex-col overflow-hidden group @container', className)}
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
        className="p-4 md:p-5 flex items-center gap-3 overflow-hidden group/link"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-bold leading-tight mb-1.5 line-clamp-2 text-primary dark:text-white transition-colors duration-200 group-hover/link:text-secondary dark:group-hover/link:text-secondary" style={{ fontSize: 'clamp(0.9375rem, 5cqw, 1.125rem)' }}>
            {heading}
          </h3>
          {subHeading && (
            <p className="text-primary/60 dark:text-white/60 leading-relaxed line-clamp-2" style={{ fontSize: 'clamp(0.8125rem, 3.5cqw, 0.9375rem)' }}>
              {subHeading.replace(/<[^>]*>/g, '').trim().substring(0, 140)}
            </p>
          )}
        </div>
        <svg
          className="w-5 h-5 flex-shrink-0 text-primary/40 dark:text-white/40 transition-all duration-200 group-hover/link:text-secondary group-hover/link:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </article>
  );
}
