export default function Pricing() {
  return (
    <div className="min-h-screen flex flex-col items-center py-20 px-4">
      <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
      <p className="text-gray-600 mb-12">Choose the plan that fits your ad spend</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <div className="border p-8 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-2">Starter</h2>
          <div className="text-4xl font-bold mb-4">$49<span className="text-lg text-gray-500">/mo</span></div>
          <ul className="mb-8 space-y-2 text-gray-600">
            <li>Up to $10k ad spend</li>
            <li>Basic AI Insights</li>
            <li>Email support</li>
          </ul>
          <button className="w-full py-2 bg-blue-100 text-blue-600 rounded">Choose Starter</button>
        </div>
        <div className="border p-8 rounded-lg shadow-md border-blue-600 relative">
          <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm font-bold rounded-bl-lg rounded-tr-lg">POPULAR</div>
          <h2 className="text-2xl font-bold mb-2">Pro</h2>
          <div className="text-4xl font-bold mb-4">$149<span className="text-lg text-gray-500">/mo</span></div>
          <ul className="mb-8 space-y-2 text-gray-600">
            <li>Up to $50k ad spend</li>
            <li>Advanced AI Automations</li>
            <li>Priority support</li>
          </ul>
          <button className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Choose Pro</button>
        </div>
        <div className="border p-8 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-2">Enterprise</h2>
          <div className="text-4xl font-bold mb-4">Custom</div>
          <ul className="mb-8 space-y-2 text-gray-600">
            <li>Unlimited ad spend</li>
            <li>Custom AI Models</li>
            <li>Dedicated Account Manager</li>
          </ul>
          <button className="w-full py-2 bg-gray-900 text-white rounded">Contact Us</button>
        </div>
      </div>
    </div>
  )
}