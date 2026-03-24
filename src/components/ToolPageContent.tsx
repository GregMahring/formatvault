import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ToolSection {
  heading: string;
  content: ReactNode;
}

export interface FaqItem {
  q: string;
  a: ReactNode;
}

interface SectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

function Section({ title, children, className }: SectionProps) {
  return (
    <section className={cn('', className)}>
      <h2 className="mb-4 text-lg font-semibold text-fg">{title}</h2>
      {children}
    </section>
  );
}

interface ToolPageContentProps {
  why: ReactNode;
  howItWorks: ReactNode;
  useCases: string[];
  faq: FaqItem[];
  toolName: string;
}

export function ToolPageContent({
  why,
  howItWorks,
  useCases,
  faq,
  toolName,
}: ToolPageContentProps) {
  return (
    <div className="border-t border-edge bg-surface-raised">
      <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6">
        <Section title={`Why use a private ${toolName}?`}>{why}</Section>

        <Section title="How it works">{howItWorks}</Section>

        <Section title="Common use cases">
          <ul className="space-y-2">
            {useCases.map((uc) => (
              <li key={uc} className="flex gap-2 text-fg-secondary">
                <span className="mt-1 shrink-0 text-brand-indigo" aria-hidden="true">
                  ›
                </span>
                {uc}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Frequently asked questions">
          <dl className="space-y-6">
            {faq.map(({ q, a }) => (
              <div key={q}>
                <dt className="mb-1.5 font-medium text-fg">{q}</dt>
                <dd className="text-fg-secondary">{a}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </div>
  );
}
