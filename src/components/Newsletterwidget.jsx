'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import styles from './Newsletterwidget.module.css';

/**
 * NewsletterWidget — reusable email subscription component
 *
 * Props:
 *   headingId   string   — unique id for the <h3> (for aria-labelledby). Default: 'newsletter-heading'
 *   className   string   — extra class on the outer <section>
 *   eyebrow     string   — small label above the title.  Default: 'Executive Intelligence'
 *   title       string   — widget heading.               Default: 'The Briefing Desk'
 *   description string   — body copy below the heading
 *   placeholder string   — input placeholder
 *   buttonText  string   — submit button label
 *   finePrint   string   — small text below the button
 *   onSubmit    async fn — (email: string) => void | Promise<void>
 *                          called with the email value on submit.
 *                          If omitted, the form is a no-op (safe default).
 *   variant     string   — 'default' | 'compact' | 'inline'
 *                          'compact'  hides description + fine-print
 *                          'inline'   single-row input+button, no description
 */

// ── Email validation ────────────────────────────────────────────────────────
// Standard, permissive RFC-5322-ish format check (good enough for real-world
// use without rejecting valid-but-unusual addresses).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Common disposable/temp-mail domains. Not exhaustive (new ones appear
// constantly), but blocks the overwhelming majority of throwaway signups.
// Extend this list over time as you notice new ones in your subscriber data.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.biz',
  'guerrillamail.de', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com',
  'sharklasers.com', 'temp-mail.org', 'tempmail.com', 'tempmail.net', '10minutemail.com',
  '10minutemail.net', 'throwawaymail.com', 'yopmail.com', 'yopmail.net', 'yopmail.fr',
  'trashmail.com', 'trashmail.net', 'getnada.com', 'maildrop.cc', 'mintemail.com',
  'mailnesia.com', 'mohmal.com', 'fakeinbox.com', 'dispostable.com', 'spamgourmet.com',
  'discard.email', 'discardmail.com', 'emailondeck.com', 'moakt.com', 'tempinbox.com',
  'burnermail.io', 'mailcatch.com', 'mailnull.com', 'jetable.org', '33mail.com',
  'anonbox.net', 'incognitomail.org', 'crazymailing.com', 'spambog.com', 'spam4.me',
]);

function validateEmail(rawEmail) {
  const email = rawEmail.trim().toLowerCase();

  if (!email) return { valid: false, reason: 'Please enter your email address.' };
  if (!EMAIL_REGEX.test(email)) return { valid: false, reason: 'Please enter a valid email address.' };

  const domain = email.split('@')[1] || '';
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: 'Temporary or disposable email addresses are not accepted.' };
  }

  return { valid: true, email };
}

export default function NewsletterWidget({
  headingId   = 'newsletter-heading',
  className   = '',
  eyebrow     = 'Executive Intelligence',
  title       = 'The Briefing Desk',
  description = 'Institutional order flow mechanics, alpha generation models, and macro updates directly to your terminal.',
  placeholder = 'trader@institution.com',
  buttonText  = 'Register For Access',
  finePrint   = 'Distributed without advertising. Unsubscribe anytime.',
  onSubmit,
  variant     = 'default',
}) {
  const [email,  setEmail]  = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success'

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (status === 'loading') return;

    const result = validateEmail(email);
    if (!result.valid) {
      toast.error(result.reason);
      return;
    }

    setStatus('loading');
    try {
      if (onSubmit) {
        await onSubmit(result.email);
      }
      toast.success("Thank you for subscribing! You're on the list.");
      setStatus('success');
      setEmail('');
      // Return to idle after a moment so the form is usable again
      // (e.g. if the person wants to subscribe a second address).
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      toast.error(err?.message || 'Could not subscribe right now. Please try again.');
      setStatus('idle');
    }
  }, [email, status, onSubmit]);

  const isInline   = variant === 'inline';
  const isCompact  = variant === 'compact';
  const showDesc   = !isInline && !isCompact && description;
  const showFine   = !isInline && !isCompact && finePrint;

  return (
    <section
      className={[
        styles.newsletter,
        styles[`variant_${variant}`] || '',
        className,
      ].filter(Boolean).join(' ')}
      aria-labelledby={headingId}
    >
      {eyebrow && (
        <span className={styles.eyebrow}>{eyebrow}</span>
      )}

      <h3 id={headingId} className={styles.title}>{title}</h3>

      {showDesc && (
        <p className={styles.description}>{description}</p>
      )}

      <form
        suppressHydrationWarning
        className={isInline ? styles.formInline : styles.form}
        onSubmit={handleSubmit}
        noValidate
      >
        <input
          suppressHydrationWarning
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={placeholder}
          className={styles.input}
          aria-label="Email address for newsletter"
          required
          disabled={status === 'loading'}
        />
        <button
          suppressHydrationWarning
          type="submit"
          className={styles.button}
          disabled={status === 'loading'}
          aria-busy={status === 'loading'}
        >
          {status === 'loading' ? 'Sending…' : buttonText}
        </button>
      </form>

      {showFine && (
        <p className={styles.finePrint}>{finePrint}</p>
      )}
    </section>
  );
}