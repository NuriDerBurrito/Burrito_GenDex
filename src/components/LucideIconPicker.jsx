import { memo } from 'react';
import clsx from 'clsx';
import {
  Star, Heart, Flame, Sparkles, Zap, Moon, Sun, Cloud, Snowflake, Droplets, Bomb, Rainbow, Crown, Gem, Key, Lock, Gift,
  Leaf, Flower, Flower2, TreePine, Fish, Bird, Bug, Cat, Dog, Rabbit, Turtle, Snail, Squirrel, PawPrint,
  Smile, Angry, Frown, Laugh, User, Users, Bot, Skull, Ghost, Eye,
  Sword, Swords, Shield, Axe, Hammer, Anchor, Target, Crosshair, Wand, Wand2,
  Shirt, Scissors, Glasses, Palette, Brush, Camera, Music, Headphones, Gamepad2, Dices, Puzzle,
  Book, Bookmark, Map, Compass, Package, Flag, Tag, Bell, Pin,
  Cherry, Citrus, Apple, Banana, Cake, CupSoda, Coffee, Candy, Pizza, Cookie,
  Circle, Hexagon, Triangle, Square, Diamond, Octagon, Pentagon,
  Ban, CaseUpper, CaseLower,
} from 'lucide-react';
import { ICON_GROUPS, isLetterIcon } from '../constants/index.js';

// 1.1.6 — LUCIDE_ICONS / getLucideIcon are no longer EXPORTED ("remove
// deprecated code"): they were module internals all along — ChipGlyph is
// the public face, and no other module ever imported these two.
const LUCIDE_ICONS = {
  Star, Heart, Flame, Sparkles, Zap, Moon, Sun, Cloud, Snowflake, Droplets, Bomb, Rainbow, Crown, Gem, Key, Lock, Gift,
  Leaf, Flower, Flower2, TreePine, Fish, Bird, Bug, Cat, Dog, Rabbit, Turtle, Snail, Squirrel, PawPrint,
  Smile, Angry, Frown, Laugh, User, Users, Bot, Skull, Ghost, Eye,
  Sword, Swords, Shield, Axe, Hammer, Anchor, Target, Crosshair, Wand, Wand2,
  Shirt, Scissors, Glasses, Palette, Brush, Camera, Music, Headphones, Gamepad2, Dices, Puzzle,
  Book, Bookmark, Map, Compass, Package, Flag, Tag, Bell, Pin,
  Cherry, Citrus, Apple, Banana, Cake, CupSoda, Coffee, Candy, Pizza, Cookie,
  Circle, Hexagon, Triangle, Square, Diamond, Octagon, Pentagon,
};

const getLucideIcon = (name) => LUCIDE_ICONS[String(name || '')] || null;

// Any chip glyph: a lucide icon OR a 'letter:X' mark (case preserved).
export function ChipGlyph({ name, size = 12, className, style }) {
  const raw = String(name || '');
  if (isLetterIcon(raw)) {
    return (
      <span className={clsx('gd-letter-icon', className)} style={{ fontSize: size, ...style }} aria-hidden>
        {raw.slice(7)}
      </span>
    );
  }
  const Icon = getLucideIcon(raw);
  if (!Icon) return null;
  return <Icon size={size} strokeWidth={2.6} className={className} style={style} />;
}

// Memoized: the ~90-icon grid only re-renders when the value actually changes,
// so typing a tag name or dragging a color wheel stays butter-smooth.
const LucideIconPickerInner = function LucideIconPicker({ value, onSelect, fullHeight = false }) {
  const letterValue = isLetterIcon(value) ? value.slice(7) : '';

  // A/a buttons TRANSFORM the current letter's case (they don't insert 'a').
  // With no letter yet, they start one.
  const setCase = (upper) => {
    const cur = isLetterIcon(value) ? value.slice(7) : '';
    const ch = cur || 'A';
    const next = upper ? ch.toUpperCase() : ch.toLowerCase();
    onSelect(`letter:${next}`);
  };

  const isUpper = /[A-Z]/.test(letterValue);
  const isLower = /[a-z]/.test(letterValue);

  return (
    /* 1.2.9 — THE PICKER IS A SHELL + ITS OWN SCROLLER ("the emoji
       picker's scrollbar clips out of the container especially in the
       rounded edges theme"): the picker used to BE the scroller — a
       rounded .gd-panel with overflow-y-auto — and Chromium's classic
       scrollbar pays no mind to the container's border-radius: the 10px
       track ran the padding box's full height, its square ends poking
       straight past the panel's rounded corners (worst on the round-edge
       themes, where the corner cut is deepest). The rounded shell now
       CLIPS (overflow hidden) and carries its own padding, while an inner
       div owns the scroll — the scrollbar's whole lane lives inside the
       shell's straight-walled zone, clear of every corner curve.
       1.3.0 — AND THE SCROLLER ACTUALLY SCROLLS ("now the scrollbar is
       missing from the emoji picker and i cant scroll, fix that bruh"):
       the inner div used to carry h-full — height: 100% — which resolves
       to AUTO against the shell's max-height (a percentage needs a
       DEFINITE parent height; max-height is not one), so the inner box
       grew to its own content height and the shell's overflow-hidden
       simply ATE the overflow: no scrollbar, no wheel, the icon grid
       dead below the fold (the fullHeight variant never noticed — its
       parent carries a real height). The shell is a FLEX COLUMN now and
       the scroller speaks flex: 1 + min-height: 0 — the one combination
       that shrinks the child to the shell's capped box (max-height OR
       h-full, both seats) and hands the surplus to the scrollbar. */
    <div className={clsx('gd-panel gd-icon-picker-shell p-1.5 overflow-hidden flex flex-col', fullHeight ? 'h-full' : 'max-h-56')}>
      <div className="gd-icon-picker-scroll flex-1 min-h-0 overflow-y-auto p-1">
      {/* Letter glyphs — type any single character; it replaces whatever is
          there now, before or after the current letter. */}
      <div className="mb-2 flex items-center gap-1.5 px-1 pb-2 gd-hairline-b">
        <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-gd-mute flex-shrink-0">LETTER</span>
        <input
          className="gd-input !w-9 !py-0.5 text-center font-bold"
          spellCheck={false}
          value={letterValue}
          maxLength={1}
          title="Use a letter as the icon: capital or small"
          onChange={(e) => {
            const ch = e.target.value.slice(0, 1);
            if (!ch) return;
            if (/[A-Za-z0-9]/.test(ch)) onSelect(`letter:${ch}`);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !e.target.value) onSelect(null);
          }}
        />
        <button
          type="button"
          className={clsx('gd-icon-btn !w-6 !h-6 text-[11px] font-bold', isUpper && 'gd-is-live')}
          title="Uppercase the current letter"
          onClick={() => setCase(true)}
        >
          <CaseUpper size={12} />
        </button>
        <button
          type="button"
          className={clsx('gd-icon-btn !w-6 !h-6 text-[11px] font-bold', isLower && 'gd-is-live')}
          title="Lowercase the current letter"
          onClick={() => setCase(false)}
        >
          <CaseLower size={12} />
        </button>
        <button className="gd-icon-btn !w-6 !h-6 ml-auto" title="No icon (default)" onClick={() => onSelect(null)}>
          <Ban size={12} />
        </button>
      </div>
      {ICON_GROUPS.map((group) => (
        <div key={group.label} className="mb-2 last:mb-0">
          <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute px-1 pb-1">
            {group.label}
          </div>
          <div className="grid grid-cols-10 gap-0.5">
            {group.list.map((name) => {
              const Icon = LUCIDE_ICONS[name];
              if (!Icon) return null;
              const active = value === name;
              return (
                <button
                  key={name}
                  type="button"
                  className={clsx(
                    'h-7 flex items-center justify-center rounded',
                    'hover:bg-[color-mix(in_srgb,var(--gd-accent)_16%,transparent)]',
                    active && 'bg-[color-mix(in_srgb,var(--gd-accent)_28%,transparent)]'
                  )}
                  title={name}
                  onClick={() => onSelect(name)}
                >
                  <Icon size={14} strokeWidth={2.2} className={active ? 'text-gd-accent' : undefined} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};

export default memo(LucideIconPickerInner);
