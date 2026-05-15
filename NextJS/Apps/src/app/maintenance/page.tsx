import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Under construction | Woodside Apps',
  description: 'This platform is being replaced. Please check back soon.',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
          Under construction
        </h1>

        <p className="text-base md:text-lg text-gray-600 mb-2 leading-relaxed">
          We&rsquo;re moving the Apps platform to a new home.
        </p>

        <p className="text-base md:text-lg text-gray-600 leading-relaxed">
          The new version will be available soon at the same address.
        </p>
      </div>
    </div>
  );
}
