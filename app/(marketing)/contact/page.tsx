'use client';
import { useState } from 'react';
export default function Contact() {
  const [sent, setSent] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };
  return (
    <div className="max-w-lg mx-auto py-20 px-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Contact Us</h1>
      {sent ? (
        <div className="p-4 bg-green-100 text-green-800 rounded">Thanks for reaching out! We'll get back to you soon.</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input required type="email" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Message</label>
            <textarea required rows={4} className="w-full p-2 border rounded"></textarea>
          </div>
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Send Message</button>
        </form>
      )}
    </div>
  )
}