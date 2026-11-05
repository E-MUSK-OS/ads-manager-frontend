export default function Pricing() {
  return (
    <div className="min-h-screen flex flex-col items-center py-20 px-4 bg-graph-paper-faint">
      <h1 className="text-4xl font-bold mb-4 text-slate-900">Simple, transparent pricing</h1>
      <p className="text-slate-600 mb-12">Choose the plan that fits your ad spend</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <div className="border border-slate-300 p-8 rounded-lg shadow-xs bg-white">
          <h2 className="text-2xl font-bold mb-2 text-slate-900">Starter</h2>
          <div className="text-4xl font-bold mb-4 font-mono text-slate-900">₹2,499<span className="text-lg text-slate-500 font-sans">/mo</span></div>
          <ul className="mb-8 space-y-2 text-slate-600 text-sm">
            <li>Up to ₹5,00,000 ad spend</li>
            <li>Basic AI Insights</li>
            <li>Email support</li>
          </ul>
          <button className="w-full py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded font-medium transition-colors">Choose Starter</button>
        </div>
        <div className="border-2 border-indigo-600 p-8 rounded-lg shadow-md bg-white relative">
          <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 text-xs font-bold rounded-bl-lg rounded-tr-lg">POPULAR</div>
          <h2 className="text-2xl font-bold mb-2 text-slate-900">Pro</h2>
          <div className="text-4xl font-bold mb-4 font-mono text-slate-900">₹7,999<span className="text-lg text-slate-500 font-sans">/mo</span></div>
          <ul className="mb-8 space-y-2 text-slate-600 text-sm">
            <li>Up to ₹25,00,000 ad spend</li>
            <li>Advanced AI Automations</li>
            <li>Priority support</li>
          </ul>
          <button className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium transition-colors">Choose Pro</button>
        </div>
        <div className="border border-slate-300 p-8 rounded-lg shadow-xs bg-white">
          <h2 className="text-2xl font-bold mb-2 text-slate-900">Enterprise</h2>
          <div className="text-4xl font-bold mb-4 text-slate-900">Custom</div>
          <ul className="mb-8 space-y-2 text-slate-600 text-sm">
            <li>Unlimited ad spend</li>
            <li>Custom AI Models</li>
            <li>Dedicated Account Manager</li>
          </ul>
          <button className="w-full py-2 bg-slate-900 text-white rounded hover:bg-slate-800 font-medium transition-colors">Contact Us</button>
        </div>
      </div>
    </div>
  )
}
