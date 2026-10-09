'use client';
import { useEffect, useState, use } from 'react';
import { apiClient } from '@/lib/api-client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Target, DollarSign, TrendingUp, Star, Package, ChevronLeft, ChevronRight, Hash, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetail({ params }: { params: Promise<{ productId: string }> }) {
  const resolvedParams = use(params);
  const productId = parseInt(resolvedParams.productId, 10);
  
  const [product, setProduct] = useState<any>(null);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [negKeywords, setNegKeywords] = useState<any[]>([]);
  const [reviewsData, setReviewsData] = useState<any>({ reviews: [], distribution: {}, trend: [] });
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]); // For switcher

  const [kwPage, setKwPage] = useState(1);
  const [negKwPage, setNegKwPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadData() {
      try {
        const [prod, kws, revs, allProds] = await Promise.all([
          apiClient(`/products/${productId}`),
          apiClient(`/products/${productId}/keywords`),
          apiClient(`/products/${productId}/reviews?page=1&limit=10`),
          apiClient('/products') // to build switcher
        ]);
        setProduct(prod);
        setKeywords(kws);
        
        // Mock negative keywords for pagination demo
        const mockNeg = Array.from({ length: 32 }, (_, i) => ({
          id: i,
          keyword_text: `negative term ${i + 1}`,
          match_type: i % 2 === 0 ? 'EXACT' : 'PHRASE'
        }));
        setNegKeywords(mockNeg);
        
        setReviewsData(revs);
        setProducts(allProds);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Activity className="w-8 h-8 animate-pulse" />
          <div className="font-mono text-sm tracking-wider uppercase">Loading Product Analytics</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="p-8">Product not found.</div>;
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val);

  // Distribution chart data
  const distData = [5, 4, 3, 2, 1].map(stars => ({
    stars: `${stars} Star`,
    count: reviewsData.distribution[stars] || 0
  }));

  // Trend chart data (format dates)
  const trendData = reviewsData.trend.map((t: any) => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    rating: t.rating
  }));

  const kwTotalPages = Math.ceil(keywords.length / itemsPerPage) || 1;
  const currentKeywords = keywords.slice((kwPage - 1) * itemsPerPage, kwPage * itemsPerPage);
  
  const negKwTotalPages = Math.ceil(negKeywords.length / itemsPerPage) || 1;
  const currentNegKeywords = negKeywords.slice((negKwPage - 1) * itemsPerPage, negKwPage * itemsPerPage);

  // Find prev/next products for switcher
  const currentIndex = products.findIndex(p => p.id === productId);
  const prevProduct = currentIndex > 0 ? products[currentIndex - 1] : null;
  const nextProduct = currentIndex < products.length - 1 ? products[currentIndex + 1] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header & Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-4 rounded-lg shadow-sm border border-border-dim">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/product-analytics" className="p-2 border border-border-dim rounded-md hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-16 h-16 bg-slate-100 rounded border border-border-dim overflow-hidden flex-shrink-0 flex items-center justify-center relative">
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-50" />
            ) : (
              <Package className="w-6 h-6 text-slate-300" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{product.asin}</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{product.category}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">{product.title}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Link 
            href={prevProduct ? `/product-analytics/${prevProduct.id}` : '#'} 
            className={`p-2 border border-border-dim rounded-md transition-colors flex items-center justify-center ${prevProduct ? 'hover:bg-slate-50 text-slate-700' : 'opacity-50 cursor-not-allowed text-slate-300'}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="text-xs font-mono font-medium text-slate-500 w-24 text-center">
            {currentIndex + 1} OF {products.length}
          </span>
          <Link 
            href={nextProduct ? `/product-analytics/${nextProduct.id}` : '#'} 
            className={`p-2 border border-border-dim rounded-md transition-colors flex items-center justify-center ${nextProduct ? 'hover:bg-slate-50 text-slate-700' : 'opacity-50 cursor-not-allowed text-slate-300'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Performance Summary Cards (scoped to product) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-surface shadow-sm rounded-md border border-border-dim relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Spend</div>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">{formatCurrency(product.spend)}</div>
        </div>
        
        <div className="p-5 bg-surface shadow-sm rounded-md border border-border-dim relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sales</div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">{formatCurrency(product.sales)}</div>
        </div>
        
        <div className="p-5 bg-surface shadow-sm rounded-md border border-border-dim relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ACOS</div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">{formatNumber(product.acos)}%</div>
        </div>

        <div className="p-5 bg-surface shadow-sm rounded-md border border-border-dim relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ROAS</div>
            <Target className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">{formatNumber(product.roas)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Reviews Analytics */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          <div className="bg-surface shadow-sm rounded-md border border-border-dim p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-6 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> Review Analytics
            </h3>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="flex flex-col items-center">
                <span className="text-5xl font-mono font-bold text-slate-900 tracking-tighter">{product.rating_avg.toFixed(1)}</span>
                <div className="flex mt-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(product.rating_avg) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                  ))}
                </div>
                <span className="text-xs font-medium text-slate-500 mt-2">{product.review_count} ratings</span>
              </div>
              
              <div className="flex-1 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="stars" type="category" hide />
                    <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="count" fill="#FBBF24" radius={[0, 4, 4, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Rating Trend (90d)</h4>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="date" stroke="#94A3B8" tick={{fill: '#64748B', fontSize: 10}} tickLine={false} axisLine={false} dy={5} minTickGap={20} />
                    <YAxis domain={[1, 5]} stroke="#94A3B8" tick={{fill: '#64748B', fontSize: 10}} tickLine={false} axisLine={false} ticks={[1, 3, 5]} />
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '6px' }} />
                    <Line type="monotone" dataKey="rating" stroke="#6366F1" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#6366F1' }} name="Avg Rating" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 mt-6">Recent Reviews</h4>
            <div className="space-y-4">
              {reviewsData.reviews.slice(0, 3).map((r: any) => (
                <div key={r.id} className="text-sm bg-slate-50 p-3 rounded border border-border-dim">
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-3 h-3 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                      ))}
                    </div>
                    {r.verified_purchase && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Verified</span>}
                  </div>
                  {r.review_text ? (
                    <p className="text-slate-700 leading-relaxed text-xs">{r.review_text}</p>
                  ) : (
                    <p className="text-slate-400 italic text-xs">No written review.</p>
                  )}
                  <div className="mt-2 text-[10px] text-slate-400 font-mono">
                    {new Date(r.review_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
              <button className="w-full py-2 text-xs font-semibold text-primary hover:bg-slate-50 rounded border border-transparent hover:border-slate-200 transition-colors">
                Load More Reviews
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Keywords */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface shadow-sm rounded-md border border-border-dim overflow-hidden">
            <div className="p-4 border-b border-border-dim flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" /> Active Keywords for Product
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border-dim bg-slate-50/80">
                    <th className="px-4 py-3 font-medium text-slate-600 uppercase text-xs tracking-wider">Keyword</th>
                    <th className="px-4 py-3 font-medium text-slate-600 uppercase text-xs tracking-wider w-24">Match</th>
                    <th className="px-4 py-3 font-medium text-slate-600 uppercase text-xs tracking-wider text-right">Spend</th>
                    <th className="px-4 py-3 font-medium text-slate-600 uppercase text-xs tracking-wider text-right">Sales</th>
                    <th className="px-4 py-3 font-medium text-slate-600 uppercase text-xs tracking-wider text-right">ACOS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim">
                  {keywords.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No active keywords.</td></tr>
                  ) : (
                    currentKeywords.map((kw) => (
                      <tr key={kw.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{kw.keyword_text}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold tracking-widest uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {kw.match_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">${kw.spend.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">${kw.sales.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{kw.acos.toFixed(1)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {keywords.length > 0 && (
                <div className="p-3 border-t border-border-dim bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">
                    Showing {(kwPage - 1) * itemsPerPage + 1} - {Math.min(kwPage * itemsPerPage, keywords.length)} of {keywords.length} keywords
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setKwPage(p => Math.max(1, p - 1))}
                      disabled={kwPage === 1}
                      className="p-1 border border-border-dim rounded bg-surface text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setKwPage(p => Math.min(kwTotalPages, p + 1))}
                      disabled={kwPage === kwTotalPages}
                      className="p-1 border border-border-dim rounded bg-surface text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Negative Keywords Panel */}
          <div className="bg-surface shadow-sm rounded-md border border-border-dim overflow-hidden">
            <div className="p-4 border-b border-border-dim flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Hash className="w-4 h-4 text-rose-500" /> Negative Keywords
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border-dim bg-slate-50/80">
                    <th className="px-4 py-3 font-medium text-slate-600 uppercase text-xs tracking-wider">Keyword</th>
                    <th className="px-4 py-3 font-medium text-slate-600 uppercase text-xs tracking-wider w-24">Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim">
                  {negKeywords.length === 0 ? (
                    <tr><td colSpan={2} className="p-8 text-center text-slate-500">No negative keywords configured for this product's campaigns.</td></tr>
                  ) : (
                    currentNegKeywords.map((kw) => (
                      <tr key={kw.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{kw.keyword_text}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold tracking-widest uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {kw.match_type}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {negKeywords.length > 0 && (
                <div className="p-3 border-t border-border-dim bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">
                    Showing {(negKwPage - 1) * itemsPerPage + 1} - {Math.min(negKwPage * itemsPerPage, negKeywords.length)} of {negKeywords.length} keywords
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setNegKwPage(p => Math.max(1, p - 1))}
                      disabled={negKwPage === 1}
                      className="p-1 border border-border-dim rounded bg-surface text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setNegKwPage(p => Math.min(negKwTotalPages, p + 1))}
                      disabled={negKwPage === negKwTotalPages}
                      className="p-1 border border-border-dim rounded bg-surface text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
