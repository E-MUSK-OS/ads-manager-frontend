'use client';
import { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Mail, MapPin, CheckCircle2, AlertCircle, RefreshCw, Phone, Clock } from 'lucide-react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient('/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, message }),
      });
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit message. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-xs font-mono text-primary hover:underline uppercase tracking-wider mb-2 inline-block">
            &larr; Back to AdsManager
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Contact Us</h1>
          <p className="text-sm text-slate-500 mt-2">
            Have questions about AdsManager, API integrations, or enterprise plans? Get in touch with our team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Details Column */}
          <div className="bg-surface border border-border-dim rounded-lg p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Get in Touch</h2>

            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Support &amp; Inquiries</div>
                <div className="text-xs text-slate-500 mt-0.5">support@YOUR-DOMAIN</div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Phone (India)</div>
                <div className="text-xs text-slate-500 mt-0.5 font-mono">+91-XXXXXXXXXX</div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Business Hours</div>
                <div className="text-xs text-slate-500 mt-0.5">Mon – Fri: 9:30 AM – 6:30 PM IST</div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm text-slate-600">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Company Entity</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  YOUR-COMPANY-NAME<br />
                  YOUR-OFFICE-ADDRESS<br />
                  YOUR-CITY, India
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-dim text-xs text-slate-500">
              Response time: typically within 24 hours on business days.
            </div>
          </div>

          {/* Form Column */}
          <div className="md:col-span-2 bg-surface border border-border-dim rounded-lg p-8 shadow-sm">
            {sent ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Message Received</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                  Thank you for reaching out! Our team has received your message and will get back to you shortly.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="px-4 py-2 text-xs font-semibold text-primary border border-primary/20 rounded hover:bg-slate-50"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 border border-rose-200 bg-rose-50 rounded-md flex items-start gap-3 text-rose-800 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>{error}</div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Your Name
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2.5 border border-border-dim rounded-md bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Business Email
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@yourbrand.com"
                    className="w-full px-3.5 py-2.5 border border-border-dim rounded-md bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your brand, store, or questions..."
                    className="w-full px-3.5 py-2.5 border border-border-dim rounded-md bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary text-white font-medium rounded-md hover:bg-indigo-600 transition-colors flex justify-center items-center gap-2 text-sm disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Sending message...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
