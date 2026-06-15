import React from 'react';
import { LineItem } from '../types';

// Two meaningful buckets: Consumable (gets used up & reordered — screws, wire,
// gloves, fittings, material) vs Tool (durable equipment). Other = unknown fallback.
export type ItemCategory = 'Consumable' | 'Tool' | 'Other';

interface CategoryStyle {
  label: string;
  // Tailwind classes for badges
  badge: string;
  dot: string;
}

export const CATEGORY_STYLES: Record<ItemCategory, CategoryStyle> = {
  Consumable: { label: 'Consumable', badge: 'border-green-700 text-green-400 bg-green-500/10', dot: 'bg-green-500' },
  Tool:       { label: 'Tool',       badge: 'border-blue-700 text-blue-400 bg-blue-500/10',   dot: 'bg-blue-500' },
  Other:      { label: 'Other',      badge: 'border-gray-700 text-gray-400 bg-black/30',       dot: 'bg-gray-500' },
};

// Keywords that identify a durable Tool (everything else is consumed).
const TOOL_KEYWORDS = [
  'wrench', 'driver', 'screwdriver', 'plier', 'plyer', 'gun', 'gauge', 'ladder', 'vac',
  'cutter', 'shear', 'mallet', 'hammer', 'tweezer', 'pick set', 'magnifier', 'deburr', 'ratchet',
  'socket', 'tap set', 'punch set', 'knife', 'scalpel', 'hemostat', 'caliper', 'tool',
  'rivet gun', 'tensioner', 'sealer', 'bander', 'dispenser', 'flashlight', 'multimeter', 'meter',
  'magnet', 'channellock', 'bit holder', 'wrench rack', 'pelican case', 'ladder', 'square',
  'torque', 'pliers', 'wera', 'magnifier', 'hand tool set', 'shop vac', 'tool set', 'tool kit',
];

function matchAny(haystack: string, keywords: string[]): boolean {
  return keywords.some(k => haystack.includes(k));
}

/**
 * Derive a clean category from the (messy) historical itemType + name/description heuristics.
 * This enriches the historical data at runtime instead of editing 800+ rows by hand.
 */
export function getItemCategory(item: Pick<LineItem, 'itemType' | 'name' | 'description'>): ItemCategory {
  const type = (item.itemType || '').toLowerCase().trim();
  const text = `${item.name || ''} ${item.description || ''}`.toLowerCase();

  // Direct, unambiguous historical type
  if (type === 'tool') return 'Tool';
  // Consumable / Program / Safety material all get consumed → Consumable
  if (type === 'consumable' || type === 'program' || type === 'safety') return 'Consumable';

  // The ambiguous "Hardware/Tools" bucket → durable tool vs consumed
  if (matchAny(text, TOOL_KEYWORDS)) return 'Tool';

  // Default: hardware/parts/material get consumed and reordered
  return 'Consumable';
}

export const ALL_CATEGORIES: ItemCategory[] = ['Consumable', 'Tool', 'Other'];

/**
 * Highlight occurrences of `term` within `text`. Multi-token (space separated),
 * case-insensitive. Returns the original string when there is no term.
 */
export const Highlight: React.FC<{ text: string; term?: string; className?: string }> = ({ text, term, className }) => {
  if (!term || !term.trim() || !text) return <>{text}</>;

  const tokens = term
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // escape regex

  if (tokens.length === 0) return <>{text}</>;

  const splitRe = new RegExp(`(${tokens.join('|')})`, 'gi');
  const testRe = new RegExp(`^(?:${tokens.join('|')})$`, 'i');
  const parts = text.split(splitRe);

  return (
    <>
      {parts.map((part, i) =>
        part && testRe.test(part) ? (
          <mark key={i} className={className || 'bg-yellow-400/30 text-inherit rounded-sm px-0.5'}>
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
};
