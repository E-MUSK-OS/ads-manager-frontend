import React, { useState, useMemo } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { describeCondition, describeRuleAction } from './describe';
import type { Template, Meta, RuleAction } from '@/lib/types/recommendation';

interface TemplateGalleryProps {
  meta: Meta | null;
  currencySymbol: string;
  onSelectTemplate: (template: Template) => void;
}

export function TemplateGallery({
  meta,
  currencySymbol,
  onSelectTemplate,
}: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = useMemo(() => {
    const list = [
      { key: 'ALL', label: 'All templates' },
      { key: 'SEARCH_TERM', label: 'Search terms' },
      { key: 'TARGETING', label: 'Targeting' },
      { key: 'CAMPAIGN', label: 'Campaigns' },
      { key: 'PLACEMENT', label: 'Placements' },
    ];
    return list;
  }, []);

  const filteredTemplates = useMemo(() => {
    const templates = meta?.templates || [];
    if (selectedCategory === 'ALL') return templates;
    return templates.filter((t) => {
      if (t.affected_parameter === selectedCategory) return true;
      if (t.category?.toUpperCase() === selectedCategory) return true;
      return false;
    });
  }, [meta?.templates, selectedCategory]);

  return (
    <div className="flex flex-col gap-5">
      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all shrink-0 select-none ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
        {filteredTemplates.map((template) => {
          const isAvailable = template.available !== false;
          const disabledReason = template.unavailable_reason || 'Needs placement data';

          return (
            <div
              key={template.key}
              className={`flex flex-col justify-between p-4 rounded-lg border transition-all ${
                isAvailable
                  ? 'bg-surface border-border-dim hover:border-primary/50 hover:shadow-xs'
                  : 'bg-slate-50/70 border-border-dim opacity-70 cursor-not-allowed'
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-text-main leading-snug">
                    {template.name}
                  </h4>
                  {!isAvailable && (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded shrink-0">
                      <Lock className="size-3" />
                      {disabledReason}
                    </span>
                  )}
                </div>

                <p className="text-xs text-text-muted leading-relaxed">
                  {template.description}
                </p>

                {/* Readable preview of conditions & actions */}
                <div className="mt-2 p-2.5 rounded bg-slate-50 border border-slate-200/60 flex flex-col gap-1.5 text-xs">
                  <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Logic Preview
                  </div>
                  <div className="flex flex-col gap-0.5 text-[11px] text-text-main font-mono">
                    <span className="text-text-muted">
                      When {template.date_filter.replace(/_/g, ' ').toLowerCase()}:
                    </span>
                    {template.conditions.map((cond, i) => (
                      <span key={i} className="pl-2">
                        • {describeCondition(cond, meta, currencySymbol)}
                      </span>
                    ))}
                    {template.min_clicks > 0 && (
                      <span className="pl-2 text-text-muted">
                        • Min clicks: {template.min_clicks}
                      </span>
                    )}
                    <div className="border-t border-slate-200/60 my-1" />
                    <span className="text-text-muted">Suggested Action:</span>
                    {template.actions.map((act, i) => (
                      <span key={i} className="pl-2 text-primary font-sans font-medium">
                        ➜ {describeRuleAction(act as unknown as RuleAction, meta, currencySymbol)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-2 flex items-center justify-end">
                <Button
                  size="sm"
                  disabled={!isAvailable}
                  onClick={() => onSelectTemplate(template)}
                  className="gap-1.5"
                >
                  <span>Use template</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
