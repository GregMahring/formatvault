import type { Route } from './+types/home';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'formatvault — Developer Data Format Tools' },
    {
      name: 'description',
      content:
        'Free, privacy-first tools for formatting, validating, and converting JSON, CSV, YAML, and more. 100% client-side — no data leaves your browser.',
    },
  ];
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold">formatvault</h1>
      <p className="mt-4 text-lg text-gray-400">
        Developer tools for JSON, CSV, YAML and more — coming soon.
      </p>
    </main>
  );
}
