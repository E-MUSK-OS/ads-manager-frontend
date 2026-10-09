'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Package, Activity, Star, Search, X } from 'lucide-react';
import Link from 'next/link';

export default function ProductAnalyticsList() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiClient('/products');
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Activity className="w-8 h-8 animate-pulse" />
          <div className="font-mono text-sm tracking-wider uppercase">Loading Products</div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="bg-surface border border-border-dim shadow-sm rounded-lg p-10 max-w-lg text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-400"></div>
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-dim">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">No Products Found</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Connect your Amazon Ads account to sync your catalog and start analyzing product-level performance.
          </p>
          <Link 
            href="/connect-amazon" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-surface font-medium rounded-md hover:bg-indigo-600 transition-colors"
          >
            Connect Amazon Ads
          </Link>
        </div>
      </div>
    );
  }

  const formatNumber = (val: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(val);

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.asin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Product Analytics</h1>
          <p className="text-sm text-slate-500 font-mono tracking-tight">{filteredProducts.length} PRODUCTS // ACTIVE WORKSPACE</p>
        </div>
        
        <div className="relative flex items-center justify-end h-10">
          <div className={`relative flex items-center bg-surface border border-border-dim rounded-md transition-all duration-300 ease-in-out overflow-hidden ${
            isSearchExpanded ? 'w-64 shadow-sm border-primary/50 ring-1 ring-primary/20' : 'w-10 hover:bg-slate-50 cursor-pointer'
          }`}>
            <button 
              onClick={() => {
                if (isSearchExpanded && !searchQuery) {
                  setIsSearchExpanded(false);
                } else {
                  setIsSearchExpanded(true);
                }
              }}
              className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-10 text-slate-400 hover:text-primary transition-colors z-10"
            >
              <Search className="w-4 h-4" />
            </button>
            <input
              id="productSearchInput"
              type="text"
              placeholder="Search ASIN or Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchExpanded(true)}
              onBlur={() => {
                if (!searchQuery) setIsSearchExpanded(false);
              }}
              className={`w-full h-10 pl-10 pr-8 text-sm bg-transparent focus:outline-none placeholder-slate-400 transition-opacity duration-300 ${
                isSearchExpanded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ pointerEvents: isSearchExpanded ? 'auto' : 'none' }}
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  document.getElementById('productSearchInput')?.focus();
                }}
                className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-8 text-slate-400 hover:text-slate-700 z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map(p => (
          <Link href={`/product-analytics/${p.id}`} key={p.id} className="block group">
            <div className="bg-surface border border-border-dim shadow-sm rounded-lg overflow-hidden hover:border-primary transition-colors flex flex-col h-full">
              <div className="h-32 bg-slate-100 flex items-center justify-center relative border-b border-border-dim overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-200/50 mix-blend-multiply"></div>
                 {p.image_url ? (
                   <img src={p.image_url} alt={p.title} className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-50" />
                 ) : (
                   <span className="font-mono text-3xl text-slate-300 font-bold opacity-30">{p.asin}</span>
                 )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs font-mono font-bold text-indigo-600 mb-1 tracking-tight">{p.asin}</div>
                <h3 className="font-semibold text-sm text-slate-900 leading-tight mb-4 flex-1 line-clamp-2">{p.title}</h3>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-sm text-slate-700">{formatNumber(p.rating_avg)}</span>
                      <span className="text-xs text-slate-400 ml-0.5">({p.review_count})</span>
                    </div>
                  </div>
                  
                  <div className="w-px h-6 bg-border-dim"></div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">ACOS</span>
                    <span className="font-mono font-bold text-sm text-slate-700">{formatNumber(p.acos)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
