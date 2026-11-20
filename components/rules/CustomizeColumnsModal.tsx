'use client';

import React, { useState, useEffect } from 'react';
import { Columns2, Search, GripVertical, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Modal } from './ui/RulesModal';
import { Button } from './ui/RulesButton';

export interface ColumnItem {
  id: string;
  label: string;
  isDefault?: boolean;
}

export const ALL_CUSTOMIZABLE_COLUMNS: ColumnItem[] = [
  { id: 'action', label: 'Action', isDefault: true },
  { id: 'is_active', label: 'Is Active' },
  { id: 'name', label: 'Rule Name' },
  { id: 'conditions', label: 'Conditions' },
  { id: 'action_type', label: 'Action Type' },
  { id: 'assign_campaign', label: 'Assign Campaign' },
  { id: 'trigger_at', label: 'Trigger At' },
  { id: 'created_at', label: 'Created At' },
  { id: 'updated_at', label: 'Updated At' },
];

export const DEFAULT_VISIBLE_COLUMNS = [
  'action',
  'is_active',
  'name',
  'conditions',
  'action_type',
  'assign_campaign',
  'trigger_at',
  'created_at',
  'updated_at',
];

interface CustomizeColumnsModalProps {
  open: boolean;
  onClose: () => void;
  visibleColumns: string[];
  onApply: (newVisibleColumns: string[]) => void;
}

export function CustomizeColumnsModal({
  open,
  onClose,
  visibleColumns,
  onApply,
}: CustomizeColumnsModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(visibleColumns);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync state whenever modal opens
  useEffect(() => {
    if (open) {
      setSelectedIds(visibleColumns.length > 0 ? visibleColumns : DEFAULT_VISIBLE_COLUMNS);
      setSearchQuery('');
    }
  }, [open, visibleColumns]);

  const filteredColumns = ALL_CUSTOMIZABLE_COLUMNS.filter((c) =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle selection on left side
  const handleToggleColumn = (id: string, isDefault?: boolean) => {
    if (isDefault) return; // Default columns cannot be unselected
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((colId) => colId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Select all columns
  const handleSelectAll = () => {
    const allIds = ALL_CUSTOMIZABLE_COLUMNS.map((c) => c.id);
    const missing = allIds.filter((id) => !selectedIds.includes(id));
    setSelectedIds((prev) => [...prev, ...missing]);
  };

  // Remove all non-default columns
  const handleRemoveAll = () => {
    const defaultIds = ALL_CUSTOMIZABLE_COLUMNS.filter((c) => c.isDefault).map((c) => c.id);
    setSelectedIds(defaultIds);
  };

  // Move column up or down
  const handleMoveColumn = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedIds.length) return;

    setSelectedIds((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    setSelectedIds((prev) => {
      const copy = [...prev];
      const [draggedItem] = copy.splice(draggedIndex, 1);
      copy.splice(dropIndex, 0, draggedItem);
      return copy;
    });
    setDraggedIndex(null);
  };

  const handleSave = () => {
    // Ensure default columns are always present
    const defaultIds = ALL_CUSTOMIZABLE_COLUMNS.filter((c) => c.isDefault).map((c) => c.id);
    const missingDefaults = defaultIds.filter((id) => !selectedIds.includes(id));
    const finalIds = [...missingDefaults, ...selectedIds];
    onApply(finalIds);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Columns2 className="w-4 h-4" />
          </div>
          <span className="text-base font-bold text-slate-800">Customize Columns</span>
        </div>
      }
      showCloseButton={true}
    >
      <div className="flex flex-col gap-4">
        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Panel: Available Columns */}
          <div className="flex flex-col gap-2.5 p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Available Columns ({ALL_CUSTOMIZABLE_COLUMNS.length})
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                Select All
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search column..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-slate-300 bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Columns List */}
            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
              {filteredColumns.map((col) => {
                const isSelected = selectedIds.includes(col.id);
                return (
                  <label
                    key={col.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-xs select-none ${
                      col.isDefault
                        ? 'bg-slate-100 text-slate-700 cursor-not-allowed opacity-90'
                        : 'hover:bg-slate-100 cursor-pointer text-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={col.isDefault}
                      onChange={() => handleToggleColumn(col.id, col.isDefault)}
                      className="size-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="font-medium">
                      {col.label}
                      {col.isDefault && (
                        <span className="text-slate-400 font-normal ml-1 text-[11px]">(Default)</span>
                      )}
                    </span>
                  </label>
                );
              })}
              {filteredColumns.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400 font-mono">
                  No columns match &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Selected Columns with Reordering */}
          <div className="flex flex-col gap-2 p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                {selectedIds.length} Selected
              </span>
              <button
                type="button"
                onClick={handleRemoveAll}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Remove all
              </button>
            </div>

            {/* Drag Subtitle */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pb-0.5">
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>Drag items or use arrows to change column order in the grid</span>
            </div>

            {/* Selected Ordered List */}
            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
              {selectedIds.map((colId, index) => {
                const col = ALL_CUSTOMIZABLE_COLUMNS.find((c) => c.id === colId);
                if (!col) return null;

                const isFirst = index === 0;
                const isLast = index === selectedIds.length - 1;
                const isBeingDragged = draggedIndex === index;

                return (
                  <div
                    key={col.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md border text-xs bg-white transition-all ${
                      isBeingDragged
                        ? 'opacity-40 border-indigo-400 bg-indigo-50/50'
                        : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600">
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <span className="font-semibold text-slate-800 truncate">
                        {col.label}
                        {col.isDefault && (
                          <span className="text-slate-400 font-normal ml-1 text-[11px]">(Default)</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveColumn(index, -1)}
                        title="Move column up"
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveColumn(index, 1)}
                        title="Move column down"
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {selectedIds.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 font-mono">
                  No columns selected. Please choose columns from the left panel.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-slate-700 border-slate-300 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[85px] font-medium"
          >
            Submit
          </Button>
        </div>
      </div>
    </Modal>
  );
}
