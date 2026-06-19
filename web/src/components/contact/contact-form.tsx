'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { LoaderCircle, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const TOPICS = ['General', 'Billing', 'Bug report', 'Feature request'] as const;

export function ContactForm({ defaultEmail = '' }: { defaultEmail?: string }) {
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      topic: String(fd.get('topic') ?? 'General'),
      message: String(fd.get('message') ?? ''),
      company: String(fd.get('company') ?? ''), // honeypot
    };

    setPending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setDone(true);
        toast.success('Message sent — we’ll get back to you soon.');
        form.reset();
      } else if (res.status === 503 && data.fallbackEmail) {
        // Email isn't wired up yet — hand the user a pre-filled mailto.
        const subject = encodeURIComponent(`[SnapSaas] ${payload.topic} — ${payload.name}`);
        const body = encodeURIComponent(payload.message);
        window.location.href = `mailto:${data.fallbackEmail}?subject=${subject}&body=${body}`;
        toast.info('Opening your email app to send the message.');
      } else {
        toast.error(data.error ?? 'Could not send your message.');
      }
    } catch {
      toast.error('Network error — please try again.');
    }
    setPending(false);
  }

  if (done) {
    return (
      <div className="bg-card grid place-items-center rounded-2xl border p-10 text-center">
        <div className="bg-brand/15 text-brand mb-4 grid size-12 place-items-center rounded-full">
          <Send className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">Thanks — message received</h2>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          We read every message and usually reply within one business day.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setDone(false)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-card grid gap-4 rounded-2xl border p-6">
      {/* Honeypot — visually hidden, ignored by humans, filled by bots. */}
      <div aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Ada Lovelace" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="topic">Topic</Label>
        <select
          id="topic"
          name="topic"
          defaultValue="General"
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px]"
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={10}
          rows={6}
          placeholder="How can we help?"
        />
      </div>

      <Button type="submit" variant="brand" disabled={pending} className="w-full sm:w-auto">
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
        Send message
      </Button>
    </form>
  );
}
