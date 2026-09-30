export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-20 px-6">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose text-gray-700">
        <p>Last updated: September 2026</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Data We Collect</h2>
        <p>We collect information you provide directly to us when you create an account, as well as data from the Amazon Ads API when you connect your account.</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Your Data</h2>
        <p>Your Amazon advertiser data is used solely to provide analytics, optimization suggestions via the Claude API, and automated bid adjustments. We do not sell your data.</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">3. Third-Party Services</h2>
        <p>We use Stripe for payment processing and Anthropic's Claude API for AI features. No personal identifiable information is sent to the AI.</p>
      </div>
    </div>
  )
}