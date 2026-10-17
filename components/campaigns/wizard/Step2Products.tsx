'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Upload,
  List,
  Check,
  X,
  Star,
  AlertTriangle,
  RotateCw,
  ShoppingBag,
} from 'lucide-react';
import { searchProducts, lookupProducts } from '@/lib/api-client';
import type {
  CampaignDraft,
  ProductLite,
  MarketplaceRules,
} from '@/lib/types/campaign';
import { money } from '@/lib/format';
import { FieldError } from '@/components/ui/FieldError';

interface Step2ProductsProps {
  draft: CampaignDraft;
  onUpdateSelected: (selected: ProductLite[]) => void;
  rules: MarketplaceRules;
  errors: Record<string, string>;
  warnings: string[];
}

export function Step2Products({
  draft,
  onUpdateSelected,
  rules,
  errors,
  warnings,
}: Step2ProductsProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'enter_list' | 'upload'>('search');

  // Search tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState<'all' | 'title' | 'asin'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating'>('relevance');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Enter list state
  const [listText, setListText] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<{ foundCount: number; notFound: string[] } | null>(null);

  // Upload state
  const [uploadLoading, setUploadLoading] = useState(false);

  // Perform search
  const executeSearch = useCallback(async (q = searchQuery, p = page, s = sortBy) => {
    if (!draft.accountId) return;
    setLoading(true);
    try {
      const res = await searchProducts({
        ads_account_id: draft.accountId,
        q: q.trim() || undefined,
        targeting_type: draft.details.targetingType,
        sort: s,
        page: p,
        page_size: 12,
      });
      setProducts(res.items);
      setTotalCount(res.total_count);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [draft.accountId, draft.details.targetingType, searchQuery, page, sortBy]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    executeSearch(searchQuery, 1, sortBy);
  };

  const isSelected = (id: number) => draft.products.selected.some((p) => p.id === id);

  const toggleProduct = (prod: ProductLite) => {
    if (prod.eligible === false) return;
    if (isSelected(prod.id)) {
      onUpdateSelected(draft.products.selected.filter((p) => p.id !== prod.id));
    } else {
      onUpdateSelected([...draft.products.selected, prod]);
    }
  };

  const handleSelectAllOnPage = () => {
    const eligibleOnPage = products.filter((p) => p.eligible !== false);
    const newItems = eligibleOnPage.filter((p) => !isSelected(p.id));
    onUpdateSelected([...draft.products.selected, ...newItems]);
  };

  const handleRemoveAllSelected = () => {
    onUpdateSelected([]);
  };

  // Enter list lookup
  const handleLookupList = async () => {
    const lines = listText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (lines.length === 0 || !draft.accountId) return;

    setLookupLoading(true);
    try {
      const res = await lookupProducts(draft.accountId, lines);
      const newlyFound = res.found.filter((f) => !isSelected(f.id));
      onUpdateSelected([...draft.products.selected, ...newlyFound]);
      setLookupResult({
        foundCount: res.found.length,
        notFound: res.not_found,
      });
    } catch {
      // ignore
    } finally {
      setLookupLoading(false);
    }
  };

  // CSV file upload handler
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !draft.accountId) return;

    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) return;

        // Find ASIN column header or take first column
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toUpperCase());
        let asinColIdx = headers.indexOf('ASIN');
        if (asinColIdx === -1) asinColIdx = headers.indexOf('SKU');
        if (asinColIdx === -1) asinColIdx = 0;

        const identifiers: string[] = [];
        const startRow = headers.includes('ASIN') || headers.includes('SKU') ? 1 : 0;
        for (let i = startRow; i < Math.min(lines.length, 500); i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols[asinColIdx]) identifiers.push(cols[asinColIdx]);
        }

        if (identifiers.length > 0) {
          const res = await lookupProducts(draft.accountId, identifiers);
          const newlyFound = res.found.filter((f) => !isSelected(f.id));
          onUpdateSelected([...draft.products.selected, ...newlyFound]);
          setLookupResult({
            foundCount: res.found.length,
            notFound: res.not_found,
          });
        }
      } catch {
        // ignore
      } finally {
        setUploadLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / 12));

  return (
    <div className="space-y-4 font-mono text-xs text-text-main">
      {/* Title */}
      <div className="bg-surface border border-border-dim rounded-md p-4 shadow-2xs">
        <span className="font-bold uppercase tracking-wider text-slate-800 text-sm block">
          Add products to campaign
        </span>
        <p className="text-slate-500 text-xs mt-0.5">
          Select the products you want to feature. You can search by product name, enter ASINs/SKUs, or upload a CSV file.
        </p>

        {warnings.length > 0 && (
          <div className="mt-3 p-2.5 rounded border border-amber-200 bg-amber-50/50 flex items-start gap-2 text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="text-[11px] leading-relaxed">
              {warnings.map((w, idx) => (
                <div key={idx}>{w}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Product Search & Tabs */}
        <div className="lg:col-span-2 bg-surface border border-border-dim rounded-md shadow-2xs p-4 flex flex-col space-y-4">
          {/* Tabs header */}
          <div className="flex items-center gap-2 border-b border-border-dim pb-2">
            {[
              { key: 'search', label: 'Search', icon: Search },
              { key: 'enter_list', label: 'Enter List', icon: List },
              { key: 'upload', label: 'Upload CSV', icon: Upload },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
                    active
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Search */}
          {activeTab === 'search' && (
            <div className="space-y-3">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, ASIN or SKU..."
                    className="w-full pl-8 pr-3 py-1.5 border border-border-dim rounded bg-white text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-primary text-white rounded font-medium hover:bg-indigo-800"
                >
                  Search
                </button>
              </form>

              {/* Sort & Select all bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-border-dim">
                <div className="flex items-center gap-2">
                  <span>Available products ({totalCount})</span>
                  <button
                    type="button"
                    onClick={handleSelectAllOnPage}
                    className="text-primary hover:underline font-medium"
                  >
                    Select all on page
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span>Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      const newSort = e.target.value as any;
                      setSortBy(newSort);
                      executeSearch(searchQuery, 1, newSort);
                    }}
                    className="border border-border-dim rounded px-1.5 py-0.5 bg-white text-xs font-mono"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Rating</option>
                  </select>
                </div>
              </div>

              {/* Product items list */}
              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <RotateCw className="w-4 h-4 animate-spin text-primary mx-auto mb-1" />
                  <span>Loading products...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  No products found matching your search.
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {products.map((prod) => {
                    const checked = isSelected(prod.id);
                    const isIneligible = prod.eligible === false;
                    const activeCount = prod.active_campaign_count || 0;

                    return (
                      <div
                        key={prod.id}
                        onClick={() => toggleProduct(prod)}
                        className={`p-2.5 rounded-md border transition-all flex items-start gap-3 select-none ${
                          isIneligible
                            ? 'bg-slate-50 border-border-dim opacity-50 cursor-not-allowed'
                            : checked
                            ? 'bg-indigo-50/50 border-primary cursor-pointer'
                            : 'bg-white border-border-dim hover:border-slate-300 cursor-pointer'
                        }`}
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isIneligible}
                          onChange={() => {}}
                          className="rounded border-border-dim text-primary focus:ring-primary h-3.5 w-3.5 mt-1 pointer-events-none"
                        />

                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded bg-slate-100 border border-border-dim shrink-0 flex items-center justify-center overflow-hidden">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-slate-300" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-900 line-clamp-1 block" title={prod.title}>
                              {prod.title}
                            </span>
                            <span className="font-bold text-slate-900 tabular-nums shrink-0">
                              {money(prod.price, rules)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                            <span>ASIN: {prod.asin}</span>
                            {prod.sku && <span>SKU: {prod.sku}</span>}
                            {prod.rating_avg !== undefined && (
                              <span className="flex items-center gap-0.5 text-amber-600">
                                <Star className="w-3 h-3 fill-amber-500" />
                                <span>{prod.rating_avg.toFixed(1)}</span>
                                <span className="text-slate-400">({prod.review_count})</span>
                              </span>
                            )}
                          </div>

                          {/* Cannibalisation / Ineligibility tags */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {activeCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                In {activeCount} active {draft.details.targetingType.toLowerCase()} campaign{activeCount > 1 ? 's' : ''}
                              </span>
                            )}
                            {isIneligible && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-spend border border-rose-200 font-medium">
                                Ineligible: {prod.ineligible_reason || 'Missing price'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-border-dim text-[11px] text-slate-500">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => {
                      const p = page - 1;
                      setPage(p);
                      executeSearch(searchQuery, p, sortBy);
                    }}
                    className="px-2 py-0.5 border rounded hover:bg-slate-50 disabled:opacity-40"
                  >
                    ‹ Previous
                  </button>
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => {
                      const p = page + 1;
                      setPage(p);
                      executeSearch(searchQuery, p, sortBy);
                    }}
                    className="px-2 py-0.5 border rounded hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next ›
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Enter List */}
          {activeTab === 'enter_list' && (
            <div className="space-y-3">
              <label className="block text-slate-600 text-[11px] uppercase font-medium">
                Enter ASINs or SKUs (one per line)
              </label>
              <textarea
                rows={6}
                value={listText}
                onChange={(e) => setListText(e.target.value)}
                placeholder="B0791TX5P5&#10;SKU-7F3A21&#10;B084DWG2VQ"
                className="w-full p-2.5 border border-border-dim rounded bg-white font-mono text-xs focus:outline-hidden focus:border-primary"
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">Max 500 identifiers</span>
                <button
                  type="button"
                  onClick={handleLookupList}
                  disabled={lookupLoading || !listText.trim()}
                  className="px-4 py-1.5 bg-primary text-white rounded font-medium disabled:opacity-50 hover:bg-indigo-800"
                >
                  {lookupLoading ? 'Looking up...' : 'Add identifiers'}
                </button>
              </div>

              {lookupResult && (
                <div className="p-3 rounded border border-border-dim bg-slate-50 space-y-1 text-[11px]">
                  <span className="font-semibold text-slate-800">
                    {lookupResult.foundCount} products added to campaign.
                  </span>
                  {lookupResult.notFound.length > 0 && (
                    <div className="text-spend">
                      <span>Not found ({lookupResult.notFound.length}): </span>
                      <span className="font-mono">{lookupResult.notFound.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Upload CSV */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border-dim rounded-md p-6 text-center hover:bg-slate-50/50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Upload CSV file with ASIN column</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                  File should have an &ldquo;ASIN&rdquo; or &ldquo;SKU&rdquo; header (max 500 rows).
                </p>
                <label className="mt-3 inline-block px-4 py-1.5 bg-primary text-white rounded font-medium cursor-pointer hover:bg-indigo-800">
                  <span>{uploadLoading ? 'Processing file...' : 'Choose CSV file'}</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    disabled={uploadLoading}
                    className="hidden"
                  />
                </label>
              </div>

              {lookupResult && (
                <div className="p-3 rounded border border-border-dim bg-slate-50 space-y-1 text-[11px]">
                  <span className="font-semibold text-slate-800">
                    {lookupResult.foundCount} products added from file.
                  </span>
                  {lookupResult.notFound.length > 0 && (
                    <div className="text-spend">
                      <span>Not found ({lookupResult.notFound.length}): </span>
                      <span className="font-mono">{lookupResult.notFound.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Selected Products Summary Panel */}
        <div className={`bg-surface border rounded-md shadow-2xs p-4 flex flex-col justify-between ${
          errors.products ? 'border-spend' : 'border-border-dim'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border-dim mb-3">
              <span className="font-bold uppercase tracking-wider text-slate-800 text-xs">
                Selected Products ({draft.products.selected.length})
              </span>
              {draft.products.selected.length > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveAllSelected}
                  className="text-spend hover:underline text-[11px]"
                >
                  Remove all
                </button>
              )}
            </div>

            {draft.products.selected.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingBag className="w-8 h-8 stroke-[1.5] mx-auto mb-2 text-slate-300" />
                <p className="font-medium text-slate-600">No products selected</p>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  Select at least one product from the search or list to advertise.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {draft.products.selected.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded border border-border-dim bg-white flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-slate-100 border border-border-dim shrink-0 flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-slate-900 block truncate text-[11px]" title={item.title}>
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {item.asin} • {money(item.price, rules)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSelected(draft.products.selected.filter((p) => p.id !== item.id))
                      }
                      className="text-slate-400 hover:text-spend p-1 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border-dim mt-3">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>Total products:</span>
              <span>{draft.products.selected.length}</span>
            </div>
            <FieldError error={errors.products} />
          </div>
        </div>
      </div>
    </div>
  );
}
