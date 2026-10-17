'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldBan,
  Tag,
  Package,
  Plus,
  Trash2,
  X,
  Search,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { getNegativeSuggestions, searchBrands } from '@/lib/api-client';
import type {
  CampaignDraft,
  MarketplaceRules,
  NegMatch,
  NegativeSuggestion,
} from '@/lib/types/campaign';
import { money } from '@/lib/format';
import { FieldError } from '@/components/ui/FieldError';

interface Step4NegativesProps {
  draft: CampaignDraft;
  onChange: (updated: Partial<CampaignDraft['negatives']>) => void;
  rules: MarketplaceRules;
  errors: Record<string, string>;
  warnings: string[];
}

export function Step4Negatives({
  draft,
  onChange,
  rules,
  errors,
  warnings,
}: Step4NegativesProps) {
  const neg = draft.negatives;

  // Negative keywords state
  const [kwText, setKwText] = useState('');
  const [matchType, setMatchType] = useState<NegMatch>('NEGATIVE_EXACT');
  const [suggestedNegs, setSuggestedNegs] = useState<NegativeSuggestion[]>([]);

  // Negative products & brands state
  const [activeProductTab, setActiveProductTab] = useState<'brands' | 'asins'>('brands');
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [brandResults, setBrandResults] = useState<string[]>([]);
  const [asinInput, setAsinInput] = useState('');

  // Fetch suggested negatives
  useEffect(() => {
    if (draft.accountId) {
      getNegativeSuggestions(draft.accountId, draft.products.selected.map((p) => p.id))
        .then(setSuggestedNegs)
        .catch(() => {});
    }
  }, [draft.accountId, draft.products.selected]);

  // Brand search
  useEffect(() => {
    if (!brandSearchQuery.trim()) {
      setBrandResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchBrands(brandSearchQuery.trim());
        setBrandResults(results);
      } catch {
        setBrandResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [brandSearchQuery]);

  // Add negative keywords
  const handleAddKeywords = () => {
    const lines = kwText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= 80);

    if (lines.length === 0) return;
    const newKws = [...neg.keywords];

    for (const line of lines) {
      const exists = newKws.some(
        (k) => k.text.toLowerCase() === line.toLowerCase() && k.match === matchType
      );
      if (!exists) {
        newKws.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          text: line,
          match: matchType,
        });
      }
    }

    onChange({ keywords: newKws });
    setKwText('');
  };

  const handleAddSuggestedNeg = (sug: NegativeSuggestion) => {
    const exists = neg.keywords.some(
      (k) => k.text.toLowerCase() === sug.keyword_text.toLowerCase() && k.match === matchType
    );
    if (!exists) {
      onChange({
        keywords: [
          ...neg.keywords,
          {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            text: sug.keyword_text,
            match: matchType,
          },
        ],
      });
    }
  };

  // Add brand
  const handleAddBrand = (brand: string) => {
    if (!neg.brands.includes(brand)) {
      onChange({ brands: [...neg.brands, brand] });
    }
    setBrandSearchQuery('');
    setBrandResults([]);
  };

  // Add ASINs
  const handleAddAsins = () => {
    const lines = asinInput
      .split('\n')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z0-9]{10}$/.test(s));

    if (lines.length === 0) return;
    const newAsins = [...neg.asins];
    for (const asin of lines) {
      if (!newAsins.includes(asin)) {
        newAsins.push(asin);
      }
    }
    onChange({ asins: newAsins });
    setAsinInput('');
  };

  return (
    <div className="space-y-5 font-mono text-xs text-text-main">
      {/* Title */}
      <div className="bg-surface border border-border-dim rounded-md p-4 shadow-2xs">
        <span className="font-bold uppercase tracking-wider text-slate-800 text-sm block">
          Negative Targeting (Optional)
        </span>
        <p className="text-slate-500 text-xs mt-0.5">
          Prevent your ads from appearing when customer search terms match specific unwanted keywords, brands, or products.
        </p>
      </div>

      {warnings.length > 0 && (
        <div className="p-3 rounded border border-amber-200 bg-amber-50/50 space-y-1 text-amber-800 text-[11px]">
          {warnings.map((w, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* CARD 1: Negative Keywords */}
      <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-dim">
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-800 text-xs block">
              Negative Keyword Targeting
            </span>
            <span className="text-[11px] text-slate-400 font-sans">
              Exclude specific queries from triggering ads
            </span>
          </div>
          {neg.keywords.length > 0 && (
            <button
              type="button"
              onClick={() => onChange({ keywords: [] })}
              className="text-spend hover:underline text-[11px]"
            >
              Remove all ({neg.keywords.length})
            </button>
          )}
        </div>

        {/* Match Type selection */}
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-slate-500 font-semibold">Match Type:</span>
          {(['NEGATIVE_EXACT', 'NEGATIVE_PHRASE'] as NegMatch[]).map((m) => (
            <label key={m} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="neg_match"
                checked={matchType === m}
                onChange={() => setMatchType(m)}
                className="text-primary focus:ring-primary"
              />
              <span>{m === 'NEGATIVE_EXACT' ? 'Negative Exact' : 'Negative Phrase'}</span>
            </label>
          ))}
        </div>

        {/* Textarea */}
        <div>
          <textarea
            rows={3}
            value={kwText}
            onChange={(e) => setKwText(e.target.value)}
            placeholder="cheap&#10;free shipping&#10;used"
            className="w-full p-2.5 border border-border-dim rounded bg-white text-xs font-mono focus:outline-hidden focus:border-primary"
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={handleAddKeywords}
              disabled={!kwText.trim()}
              className="px-3.5 py-1.5 bg-primary text-white rounded font-medium disabled:opacity-50 hover:bg-indigo-800"
            >
              Add negative keywords
            </button>
          </div>
        </div>

        {/* Suggested Negatives Strip */}
        {suggestedNegs.length > 0 && (
          <div className="p-3 rounded border border-border-dim bg-slate-50 space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
              Suggested wasteful terms from your account (clicks with zero sales):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedNegs.map((sug) => (
                <button
                  key={sug.keyword_text}
                  type="button"
                  onClick={() => handleAddSuggestedNeg(sug)}
                  className="px-2 py-1 rounded bg-white border border-border-dim text-[11px] text-slate-700 hover:border-spend hover:text-spend transition-colors inline-flex items-center gap-1"
                  title={`${sug.clicks} clicks • ${money(sug.spend, rules)} spend • 0 sales`}
                >
                  <Plus className="w-3 h-3 text-slate-400" />
                  <span className="font-medium">{sug.keyword_text}</span>
                  <span className="text-[10px] text-spend tabular-nums font-mono">
                    ({sug.clicks} clk • {money(sug.spend, rules)})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Negative Keywords Table */}
        {neg.keywords.length > 0 && (
          <div className="overflow-x-auto border border-border-dim rounded bg-white max-h-56 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-border-dim text-[10px] uppercase text-slate-500 sticky top-0">
                <tr>
                  <th className="py-2 px-3">Keyword</th>
                  <th className="py-2 px-3">Match Type</th>
                  <th className="py-2 px-3 w-10 text-center" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dim">
                {neg.keywords.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-medium text-slate-900">{k.text}</td>
                    <td className="py-1.5 px-3 text-slate-500">{k.match}</td>
                    <td className="py-1.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          onChange({ keywords: neg.keywords.filter((item) => item.id !== k.id) })
                        }
                        className="text-slate-400 hover:text-spend p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CARD 2: Negative Products & Brands */}
      <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-dim">
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-800 text-xs block">
              Negative Product & Brand Targeting
            </span>
            <span className="text-[11px] text-slate-400 font-sans">
              Exclude specific competitor brands or products
            </span>
          </div>
          {(neg.brands.length > 0 || neg.asins.length > 0) && (
            <button
              type="button"
              onClick={() => onChange({ brands: [], asins: [] })}
              className="text-spend hover:underline text-[11px]"
            >
              Remove all
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveProductTab('brands')}
            className={`px-3 py-1.5 rounded font-medium text-xs transition-colors inline-flex items-center gap-1.5 ${
              activeProductTab === 'brands'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Exclude Brands ({neg.brands.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveProductTab('asins')}
            className={`px-3 py-1.5 rounded font-medium text-xs transition-colors inline-flex items-center gap-1.5 ${
              activeProductTab === 'asins'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Exclude Products ({neg.asins.length})</span>
          </button>
        </div>

        {activeProductTab === 'brands' ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={brandSearchQuery}
                onChange={(e) => setBrandSearchQuery(e.target.value)}
                placeholder="Search brand name to exclude..."
                className="w-full pl-8 pr-3 py-1.5 border border-border-dim rounded bg-white text-xs font-mono"
              />
            </div>

            {/* Brand dropdown search results */}
            {brandResults.length > 0 && (
              <div className="border border-border-dim rounded bg-white shadow-md p-1.5 max-h-40 overflow-y-auto space-y-0.5">
                {brandResults.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleAddBrand(b)}
                    className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 flex items-center justify-between text-xs"
                  >
                    <span>{b}</span>
                    <Plus className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Added brands chips */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px] pt-1">
              {neg.brands.length === 0 ? (
                <span className="text-slate-400 text-[11px]">No brands excluded.</span>
              ) : (
                neg.brands.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-border-dim text-[11px] text-slate-800"
                  >
                    <span>{b}</span>
                    <button
                      type="button"
                      onClick={() => onChange({ brands: neg.brands.filter((x) => x !== b) })}
                      className="text-slate-400 hover:text-spend"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Exclude ASINs */
          <div className="space-y-3">
            <textarea
              rows={3}
              value={asinInput}
              onChange={(e) => setAsinInput(e.target.value)}
              placeholder="B0791TX5P5&#10;B084DWG2VQ"
              className="w-full p-2.5 border border-border-dim rounded bg-white text-xs font-mono focus:outline-hidden focus:border-primary"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddAsins}
                disabled={!asinInput.trim()}
                className="px-3.5 py-1.5 bg-primary text-white rounded font-medium disabled:opacity-50 hover:bg-indigo-800"
              >
                Add ASINs to exclude
              </button>
            </div>

            {/* Added ASINs list */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px] pt-1">
              {neg.asins.length === 0 ? (
                <span className="text-slate-400 text-[11px]">No product ASINs excluded.</span>
              ) : (
                neg.asins.map((asin) => (
                  <span
                    key={asin}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-border-dim text-[11px] font-mono text-slate-800"
                  >
                    <span>{asin}</span>
                    <button
                      type="button"
                      onClick={() => onChange({ asins: neg.asins.filter((x) => x !== asin) })}
                      className="text-slate-400 hover:text-spend"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
