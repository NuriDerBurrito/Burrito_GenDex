import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardPaste, ChevronDown, CircleHelp, GripVertical, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Modal from './Modal.jsx';
import RichInput, { RichText } from './RichText.jsx';
import CardLookEditor, { useImageAspect } from './CardLookEditor.jsx';
import LucideIconPicker, { ChipGlyph } from './LucideIconPicker.jsx';
import TagRibbon from './TagRibbon.jsx';
import useThumbSort from './useThumbSort.js';
import useAutoStampColor, { useStampHue } from './useAutoStampColor.js';
import StampColorControls from './StampColorControls.jsx';
import StampPosControls from './StampPosControls.jsx';
import CardStyleControls from './CardStyleControls.jsx';
import { StampAddButton, StampPasteTile, StampSlots, useStampNamingQueue } from './StampEditModal.jsx';
import { ColorPickerButton } from './ColorPicker.jsx';
import { SideFlowZone } from './SideFlow.jsx';
import { CHIP_COLORS, CLASS_COLOR_PRESETS, DEFAULT_CARD_TRIM, DEFAULT_FINISH_TRANSPARENCY, ROOT_CLASS_ID, sanitizeStampSettings } from '../constants/index.js';
import { buildImageUrl, customStampHue, imageRecord, readableInk, saveImageBlobWithThumb, stampAlpha, stampHueAlpha, stripRichText, thumbOf } from '../utils/helpers.js';
import { gdToast } from '../utils/toasts.js';

// 0.39.0 — THE DEFAULT CAP FITS TWELVE ("when i reach 10 images, the
// container collapses and becomes so small, fix that so it at least
// displays enough area to fit the first 12"): four rows of three squares
// before the grid ever scrolls — and the cap is now DRAG-RESIZABLE between
// one row and the four-row default ("with the ability to make the container
// shorter or longer (not longer than the default tho)").
// 0.40.0 — THE BUDGET IS TEN PICTURES ("make it so it activates the image
// viewer container of the card creation not when it exceeds 12 but when it
// exceeds 10 instead"): the ADD + PASTE tiles ride the SAME grid, so the
// four-row budget holds ten pictures + the two tiles — the clamp + grip
// engage from the ELEVENTH picture on. The rows themselves (and the drag
// range, one row to four) are unchanged.
const DEFAULT_GRID_ROWS = 4;
const MIN_GRID_ROWS = 1;
// the two utility tiles (ADD MORE + PASTE) that always ride the grid
const GRID_FIXED_TILES = 2;

// New Card — three panels: LEFT builds the card's look (live preview you
// drag/zoom directly, aspect ratio, trim, and since 0.38.0 the CARD COLOR),
// MIDDLE holds the details and image importing (plus the STAMP area below
// the image upload, 0.15.0 — and its own PASTE tile, 0.38.0), RIGHT edits
// the first version (label, color, icon).
// 0.24.0 — the stamp library strip is the STAMPS GALLERY: a stamp saved
// through the stamp window joins it RIGHT AWAY (not only when the card is
// created), each chip wears a TRASH key (a confirm window asks before
// removing it from the gallery). 0.26.0 — stamps already on this card are
// GREYED OUT (visible but inert) instead of hidden. The ADD key's picker
// shows the gallery as generous tiles (attached ones greyed out too).
// 0.38.0 — "rename new character to new card and so on, i dont want mention
// of character, replace it with card": the window (and every surface that
// speaks of it) says CARD.
export default function NewCharacterModal({
  initialImages,
  imagesPath,
  defaultRatio,
  classes = [],
  defaultClassId = ROOT_CLASS_ID,
  stampLibrary = [],
  // 1.1.2 — TAGS AT BIRTH ("add adding tags to the card when creating it
  // in card creation window, as i can add tags already added, when i press
  // on the + to add a new tag the tag manager will open"): the whole tag
  // vocabulary, the open-request for the + key, and whether the manager is
  // currently open above this window (the close lock below).
  tags = [],
  tagManagerOpen = false,
  onOpenTagManager = null,
  showHelp = false,
  // 1.5.8 — THE EXPERIMENTAL GATE (App passes settings.livingFinishes ===
  // false): the creation window's finish row offers None alone while the
  // master switch is off (CardStyleControls' finishesHidden law).
  finishesHidden = false,
  // 1.1.5 — THE HELP KEY RIDES THE FOOTER'S LEFT ("add the help text option
  // in the card creation window in the bottom left, just like the settings
  // window"): the same switch the settings window's footer wears, wired to
  // the same setting — one toggle, both windows, every helper paragraph.
  onToggleHelp = null,
  confirm,
  onDeleteFromGallery,
  onAddToGallery,
  onClose,
  onCreate,
  // 1.5.4 — THE RETAINED SEAT ("the new card window is still quite
  // delayed, fix that"): the window rides ONE instance for the whole
  // session — App births it a beat after the app settles (or on the first
  // open, whichever comes first) and it never unmounts again. `live` is
  // the open state (Modal's flight law: CSS owns the fade + rise, parked
  // owns the inert hide); `openSeq` counts the opens — every increment
  // resets the whole draft in one pre-paint commit (the RESET law below),
  // so each open is born exactly as fresh as a cold mount ever was, at a
  // warm path's speed. A parked window never focuses, never freezes the
  // coats, never hears a key (Modal's parked law).
  live = true,
  openSeq = 0,
  // the prewarm ghost prop (retired with the retained seat — kept for the
  // signature so any old caller still parses): never live, never opened.
  parked = false,
}) {
  const [name, setName] = useState('');
  // 1.1.2 — THE CLASS IS NOT A CHOICE ANYMORE ("in card creation window,
  // remove the option to select which class it goes to, by default when
  // pressing on create card or right click then new card it would create
  // it in current opened class"): the selector is gone; the window files
  // the card into the class it was opened from (the selected class, or the
  // right-clicked class row — App still passes that as defaultClassId). A
  // class that dies later already lands its cards in Unsorted (the deletion
  // law, unchanged).
  // 1.5.4 — classId is re-seedable now: a retained seat can be opened from
  // a DIFFERENT class than it was born under (the class row's NEW CARD
  // context menu pre-picks its own class) — the locked-at-mount read the
  // seat's whole point away.
  const [classId, setClassId] = useState(defaultClassId || ROOT_CLASS_ID);
  const [images, setImages] = useState(Array.isArray(initialImages) ? initialImages : initialImages ? [initialImages] : []);
  const [busy, setBusy] = useState(false);
  const [filesOver, setFilesOver] = useState(false);

  // Card look
  const [ratio, setRatio] = useState(defaultRatio && defaultRatio.w > 0 ? defaultRatio : { w: 3, h: 4 });
  const [trim, setTrim] = useState(DEFAULT_CARD_TRIM);
  // 1.6.2 — THE TRIM'S OWN INK, AT BIRTH (the picker's create seat — the
  // same door the EDIT CARD window speaks): null keeps the theme's own
  // trim exactly as every card before the picker painted.
  const [trimColor, setTrimColor] = useState(null);
  // 0.42.0 — THE CROP IS A FIRST-CLASS DRAFT VALUE NOW ("fix the issue
  // where im unable to adjust the image inside the card preview when i drag
  // it around"): the window's onChange used to swallow the preview's crop
  // patches entirely — the preview sent {ratio, trim, crop} and the handler
  // kept only ratio + trim, so neither the DRAG (placement) nor the WHEEL
  // (zoom) ever moved the picture, and CREATE shipped no crop at all. The
  // draft carries it, the preview edits it, and submit lands it — the same
  // wiring the EDIT CARD window always had.
  const [crop, setCrop] = useState(null);
  // 0.38.0 — CARD COLOR ("in card creation also add the option to color the
  // card itself"): the foot plate's own hex; null = the theme's own foot.
  const [cardColor, setCardColor] = useState(null);
  // 1.3.8 — THE CARD'S OWN LOOKS (the "for fun" pass): the finish + its
  // image switch, riding the card object at CREATE exactly like the color
  // always has (one submit, one record). 1.3.9 — the secondary color and
  // the pattern left with the feature ("remove secondary color and pattern
  // option"); the creation window speaks the finish alone.
  const [finish, setFinish] = useState('none');
  const [finishOnImage, setFinishOnImage] = useState(false);
  // 1.4.5 — the coat's trim reach, riding the same create-time draft
  // law the finish speaks. 1.7.2 — THE STAMP REACH IS RETIRED ("delete
  // the stamp effect option"): a new card is never born with it.
  const [finishOnTrim, setFinishOnTrim] = useState(false);
  // 1.9.5 — THE COAT'S OWN VOLUME (the transparency knob): riding the
  // same create-time draft law the finish speaks — what you slide here
  // is exactly what the card is born wearing (the default, 15%, is the
  // softened voice the report asked for).
  const [finishTransparency, setFinishTransparency] = useState(DEFAULT_FINISH_TRANSPARENCY);
  /* 1.9.6 — THE SPLIT VOLUME ("add a checkbox that adds another
     transparency slider, but this slider affects the transparency of teh
     finishes on the image itself"): the checkbox + the image knob's own
     create-time drafts — the split is born OFF and the image knob at the
     same 15% the main knob speaks (arming it changes nothing until the
     second slider moves). */
  const [finishSplitImage, setFinishSplitImage] = useState(false);
  const [finishImageTransparency, setFinishImageTransparency] = useState(DEFAULT_FINISH_TRANSPARENCY);
  // 1.4.1 — IMAGE MOTION (the sway switch beside affect-the-image).
  const [imageMotion, setImageMotion] = useState(false);
  // 1.4.7 — STAMP MOTION ("add stamp motion too, which when checked will
  // move the stamp alongside the image with a slight delay"): the band +
  // any placed sticker follow the art's sway a beat behind it — riding
  // the same create-time draft law the family speaks.
  const [stampMotion, setStampMotion] = useState(false);

  // Version details
  const [vLabel, setVLabel] = useState('V1');
  const [vColor, setVColor] = useState(null);
  const [vIcon, setVIcon] = useState(null);

  // 1.1.2 — TAGS AT BIRTH: the picked ids (a Set-flavored array — order is
  // the vocabulary's own, the card stores ids only). Toggling a chip is the
  // same gesture the details panel's tag row speaks: click to wear, click
  // again to take off. New tags arrive through the TAG MANAGER opening
  // ABOVE this window (the + key) — its writes land in the vocabulary this
  // row renders, so a tag minted over the window is pickable the moment the
  // manager closes.
  const [pickedTagIds, setPickedTagIds] = useState([]);
  const toggleTag = (id) => {
    setPickedTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  // 1.1.5 — THE TAG BOARD FOLDS ("add an option to collapse tags inside
  // the card creation window, only shows the first 3 rows lets say (not
  // affecting detail pannel)").
  // 1.1.8 — THE BOARD SPEAKS THE SIDE-FLOW LAW NOW ("…also implement the
  // sideways feature to the card creation tags container there too"): a
  // SideFlowZone, the same engine the detail panel's rows ride.
  // 1.1.9 — THE BOARD'S OWN LIMITS ("the limit in the new card creation
  // window should be different though as retracted should show 3 rows but
  // expanded would show 5 rows"): the FOLDED seat keeps THREE rows (the
  // creation board's own retract — collapsedRows 3) and the OPEN cap is
  // FIVE rows (rows 5) — everything past the fifth row stacks as columns
  // to the right, panned by the scrollbar + edge arrows, and the folded
  // front is the same first-three-rows orientation the open seat's front
  // rows paint (the twin-block law — see SideFlow.jsx). Local state on
  // purpose: the fold is this window's own, and the board always OPENS
  // expanded — a fresh window is a fresh look.
  const [tagsFold, setTagsFold] = useState(false);

  // 0.15.0 — STAMPS · 0.22.0 — ONE WORLD, ONE SETTING. The draft stamps are
  // plain image slots (top-first; only the top one shows on the card) and
  // there is exactly ONE settings object for all of them — hue, position,
  // size, angle, transparency and clipping belong to the CARD. Every upload
  // joins the library on CREATE (no public/private switch anymore).
  const [stamps, setStamps] = useState([]);
  const [stampSettings, setStampSettings] = useState(() => sanitizeStampSettings({}));

  // 0.23.0 — the upload naming queue: each picked file passes through the
  // STAMP WINDOW (preview + name + save) and joins the DRAFT wearing its
  // name. 0.24.0 — it joins the GALLERY right away too ("make it so when a
  // stamp is created its added there right away, not just when a card
  // is created") — the App writes the library record the moment the window
  // is saved, so the strip below updates instantly.
  // 0.26.0 — THE GALLERY-BUG FIX: this used to pass a single { image, name }
  // OBJECT while App.addStampToGallery reads POSITIONAL (image, name) args —
  // String(object) landed as "[object Object]", so the gallery stored an
  // INVALID image and CREATE later re-added the real file as a DUPLICATE.
  // Positional args keep the record and the draft pointing at the same file.
  const naming = useStampNamingQueue(imagesPath, (record, name) => {
    setStamps((prev) => [...prev, { id: uuidv4(), image: record.file, name }]);
    // 1.1.5 — the record's PREVIEW rides the gallery add (see
    // addStampToGallery): the library's spotlight tiles and pickers read
    // the lightweight prev from the first breath.
    onAddToGallery?.(record.file, name, record?.prev || null);
  });

  const nameRef = useRef(null);
  const dragCounterRef = useRef(0);
  // 1.0.6 — THE UNSAVED-CHANGES GUARD ("closing a window with unsaved
  // changes should warn about it … when its confirmed to close it shouldnt
  // apply said changes"): the creation window is one big draft — once
  // anything real has been put into it (a name, an image, a stamp), the
  // accidental close gestures (✕ / Escape / backdrop) ask before throwing
  // it away; confirming closes with NOTHING created. The footer's own
  // CANCEL (explicit discard) and CREATE (explicit commit) stay direct —
  // a labeled key is intent, not an accident.
  const draftStarted =
    stripRichText(name).trim().length > 0 || images.length > 0 || stamps.length > 0 || pickedTagIds.length > 0;
  // 0.39.0 — CALLBACK REF, not a plain ref: the Modal's lazy portal re-renders
  // the whole window into document.body right after mount (see Modal.jsx),
  // and a []-effect that captured the pre-portal node would observe a
  // DETACHED element forever — the cap would never engage. The callback ref
  // hands the effect the LIVE node every time the tree re-seats.
  const [gridWrapEl, setGridWrapEl] = useState(null);
  const [rowUnit, setRowUnit] = useState(null); // one row's height (cell + gap)
  // 0.39.0 — the user's own cap, in ROWS (float while dragging): null = the
  // four-row default. Clamped to [MIN, DEFAULT] — never taller than default.
  const [gridRowsCap, setGridRowsCap] = useState(DEFAULT_GRID_ROWS);
  // 0.41.0 — TRUE while the cap grip is held: the grid's wrapper RESERVES the
  // full four-row height (see the reserve note below), so the modal's
  // measured content height never changes mid-drag — the window stops
  // re-centering itself under the cursor.
  const [capLive, setCapLive] = useState(false);
  const gridDragRef = useRef(null);

  // 0.8.0 — same smooth pointer sorting as the card's image sorter:
  // grabbed thumb follows the pointer, the grid glides cells aside (the gap
  // is the placeholder), release animates into place before committing.
  // 0.45.0 — THE COVER MARK POPS BETWEEN TILES (the flight is retired — see
  // the StampSlots note): keyed by the COVER IMAGE'S OWN FILE, the ring +
  // badge mount fresh when the cover changes hands — the old mark pops out
  // on the demoted image, the new one pops in on the cover (~180ms). A
  // reorder that keeps the same cover pops nothing: the mark rides its own
  // tile through the glide and the atomic commit.
  const { sort, bindItem, itemStyle, dragStyle, sorting } = useThumbSort({
    count: images.length,
    cols: 3,
    gapX: 8,
    gapY: 8,
    onCommit: (from, to) => {
      setImages((prev) => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    },
  });

  useEffect(() => {
    // 1.5.4 — a parked ghost never steals the focus the user owns; a LIVE
    // open takes it once per openSeq (the retained seat re-opens on the
    // same instance — every open must focus the name field exactly the way
    // a fresh mount's effect always did).
    if (parked || !live) return;
    nameRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, openSeq, parked]);

  // 1.5.4 — THE RESET LAW (the retained seat's whole correctness): every
  // openSeq increment lands while the window is turning live IN THE SAME
  // COMMIT (App bumps the seq through a render-time mirror, so the flip and
  // the count travel together) — this pre-paint pass re-seeds EVERY draft
  // field to the fresh-open truth in one batched commit, exactly the values
  // a cold mount's useState initializers would have spoken. Nothing from a
  // previous draft can survive: not the name, not the images (a fresh open
  // can carry pasted/dragged records — they seed HERE), not the class (a
  // class-scoped open pre-picks its own), not the look (ratio from the
  // CURRENT settings, default trim, no crop, no color, no finish), not the
  // version, not the tags, not the stamps and their settings, not the grid
  // cap or its grip, not the drag counters, not the naming queue's orphaned
  // windows, not the missing-field flash. The seat's birth (openSeq 0)
  // skips the pass — the initial state IS the fresh truth.
  useLayoutEffect(() => {
    if (!openSeq) return;
    setName('');
    setImages(Array.isArray(initialImages) ? initialImages : initialImages ? [initialImages] : []);
    setClassId(defaultClassId || ROOT_CLASS_ID);
    setBusy(false);
    setFilesOver(false);
    setRatio(defaultRatio && defaultRatio.w > 0 ? defaultRatio : { w: 3, h: 4 });
    setTrim(DEFAULT_CARD_TRIM);
    // 1.6.3 — THE TRIM'S INK RETURNS TO THE THEME ("options such as trim
    // color should not be retained after i cancel in the new card windiow ,
    // it should go by default usually"): trimColor joined the draft in
    // 1.6.2 but never joined this RESET law — a picked trim ink survived a
    // CANCEL and greeted the next CREATE still wearing it (the one draft
    // field that never went home). It re-seeds with everything else now:
    // every open is born at the theme's own trim ink, the default the
    // window always meant to speak.
    setTrimColor(null);
    setCrop(null);
    setCardColor(null);
    setFinish('none');
    setFinishOnImage(false);
    setFinishOnTrim(false);
    // 1.9.5 — the knob re-seeds with the family (a CANCEL never leaks the
    // last draft's clarity into the next CREATE).
    setFinishTransparency(DEFAULT_FINISH_TRANSPARENCY);
    // 1.9.6 — the split re-seeds with the family (OFF + the shared default).
    setFinishSplitImage(false);
    setFinishImageTransparency(DEFAULT_FINISH_TRANSPARENCY);
    setImageMotion(false);
    setStampMotion(false);
    setVLabel('V1');
    setVColor(null);
    setVIcon(null);
    setPickedTagIds([]);
    setTagsFold(false);
    setStamps([]);
    setStampSettings(sanitizeStampSettings({}));
    setGridRowsCap(DEFAULT_GRID_ROWS);
    setCapLive(false);
    setNeedFlash(null);
    /* 1.9.3 — THE KEY RETURNS TO PRESS ("for some reason im unable to
       create cards, the create button is not pressable/highlighted even
       tho we have nothing to prevent it ... right now its not even
       clickable"): the 1.8.6 wheel parked the window with `creating`
       still true (the seat never unmounts — nothing ever re-seeded it),
       so every open after the FIRST create of a session greeted a CREATE
       key wearing is-loading's pressed face — no highlight, and submit's
       own guard returning before the press could ever speak. The RESET
       law re-seeds the wheel's latch with every other draft field now:
       each open is born with a key that takes the press exactly the way
       the 1.5.4 law promised ("not even clickable" was the one state the
       key was never allowed to wear). */
    setCreating(false);
    dragCounterRef.current = 0;
    gridDragRef.current = null;
    naming.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSeq]);

  // Measure ONE ROW's height (a square cell + the 8px gap) so the cap can
  // be expressed in rows and dragged by rows. The old fixed 3-row maxHeight
  // is gone — the default is the four-row / twelve-image budget now.
  useEffect(() => {
    if (!gridWrapEl || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => {
      const w = gridWrapEl.clientWidth;
      if (w > 40) setRowUnit((w - 16) / 3 + 8); // grid-cols-3, gap-2 (8px)
    });
    ro.observe(gridWrapEl);
    return () => ro.disconnect();
  }, [gridWrapEl]);

  // The cap only applies when the content actually overflows it — ten
  // pictures (+ the ADD + PASTE tiles) sit at natural height inside the
  // default four-row budget; the ELEVENTH is where the clamp + grip engage.
  const capRows = Math.min(DEFAULT_GRID_ROWS, Math.max(MIN_GRID_ROWS, gridRowsCap));
  const gridMaxH = rowUnit ? capRows * rowUnit - 8 + 12 : null; // - trailing gap, + scrollbar pad
  const capActive = rowUnit != null && images.length + GRID_FIXED_TILES > Math.floor(capRows * 3);
  // 0.42.0 — THE RESERVE IS GONE, THE WINDOW IS PINNED: the 0.41 fix held
  // the wrapper at the FULL four-row height through the drag so the modal
  // never re-measured — which parked the STAMP section at that fixed
  // distance no matter where the cap actually was, and everything snapped
  // home only on release ("its not following the resizing dynamically as at
  // some point it just stops and stays back, only when i let go is when it
  // snaps back"). The layout now flows LIVE (the grid's box breathes, the
  // stamps ride its bottom edge frame by frame) while the MODAL itself is
  // position-pinned for the drag's duration (see Modal's `pinned` prop) —
  // the window never re-centers, nothing wanders, and the content tracks
  // the grip honestly.

  // 0.39.0 — THE CAP'S RESIZE HANDLE: a slim ns-resize grip centered under
  // the grid. 0.41.0 — THE DIRECTION IS HONEST ("the drag to resize the image
  // area has the issue of being reversed, when i pull down it should pull
  // down"): pulling DOWN lengthens toward the four-row ceiling, pulling UP
  // shortens to a single row — a bottom-edge handle follows the hand, like
  // every other resize grip in the app. The pick follows the pointer in row
  // fractions, clamped, and the wrapper's reserve keeps the modal stone-still.
  const onCapDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (!rowUnit) return;
    setCapLive(true);
    gridDragRef.current = { startY: e.clientY, startRows: capRows };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };
  const onCapMove = (e) => {
    const drag = gridDragRef.current;
    if (!drag || !rowUnit) return;
    const dRows = (e.clientY - drag.startY) / rowUnit; // down = longer (0.41.0)
    setGridRowsCap(Math.min(DEFAULT_GRID_ROWS, Math.max(MIN_GRID_ROWS, drag.startRows + dRows)));
  };
  const onCapUp = () => {
    gridDragRef.current = null;
    setCapLive(false);
  };

  const cover = images[0] || null;
  const coverUrl = cover ? buildImageUrl(imagesPath, thumbOf(cover)) : '';
  const imgAspect = useImageAspect(coverUrl);
  // 0.22.0 — the card's TOP stamp renders in the preview wearing the SHARED
  // settings (exactly what the card will show); the others stay behind it.
  // 0.23.0 — the hue resolves through the SAME chain every surface shares
  // (custom → library autoColor → live derivation → default), so the preview,
  // the grid card and the color window can never disagree — the hue always
  // paints, at the transparency the window shows (no fake defaults).
  const topStamp = stamps[0] || null;
  const topStampUrl = topStamp ? buildImageUrl(imagesPath, topStamp.image) : null;
  const topLibAuto = topStamp ? (stampLibrary || []).find((s) => s.image === topStamp.image)?.autoColor || null : null;
  const resolvedHue = useStampHue(stampSettings, topStampUrl, topLibAuto);
  // 1.4.5 — THE HUE SPEAKS WITHOUT A STAMP ("make it so hue can be applied
  // even without a stamp, thats the main reason we even made it so the
  // stamp options is greyed out, since hue shouldnt rely on it"): the
  // preview paints the picked hue with no stamp on the card — same law as
  // the grid card (see customStampHue in helpers).
  const hue = topStamp ? resolvedHue : customStampHue(stampSettings);
  // The window's AUTO swatch reads the same chain (library cache, else the
  // live derivation — both memoized per image).
  const derivedAuto = useAutoStampColor(topStampUrl);
  const autoColor = topStamp ? topLibAuto || derivedAuto || null : null;
  // 0.22.0 follow-up — the top stamp's measured aspect + the draft card
  // ratio feed the band capture (the settings popover shows the band's REAL
  // values and lifts from them — the first edit never jumps the stamp).
  const topStampAspect = useImageAspect(topStampUrl);

  // ---- image intake ---------------------------------------------------------
  const addRecords = (records) => {
    if (!records?.length) return;
    setImages((prev) => [...prev, ...records.map(imageRecord)]);
  };

  const pickImages = async () => {
    if (busy) return;
    setBusy(true);
    try {
      addRecords(await window.api.importImagesFromFiles());
    } finally {
      setBusy(false);
    }
  };

  // 0.30.0 — MANUAL PASTE on the creation window's image grid ("the upload
  // image section, add a section on the right too to paste, which when
  // pressed will automatically grab the clipboard image (if its not an
  // image it will just not do anything)").
  // 0.39.0 — THE VERDICT SPEAKS ("the tag paste area is missing the
  // noticification feedback that the others do, same with the image,
  // implement them"): the same toasts the stage's PASTE key fires — a green
  // "image pasted" when it lands, the red "no image on the clipboard" when
  // there is nothing to grab. The quiet no-op is gone.
  const pasteFromClipboard = async () => {
    try {
      const img = await window.api?.clipboardReadImage?.();
      if (!img?.base64) {
        gdToast('No image on the clipboard', 'fail');
        return;
      }
      const rec = await window.api.saveImageBuffer(img.base64, img.ext || '.png');
      if (rec) {
        addRecords([rec]);
        setFilesOver(false);
        gdToast('Image pasted');
      } else {
        gdToast('Paste failed', 'fail');
      }
    } catch {
      gdToast('Paste failed', 'fail');
    }
  };

  const handleFilesDrop = async (e) => {
    const files = Array.from(e.dataTransfer?.files || []).filter(
      (f) => f && (f.type?.startsWith('image/') || /\.(png|jpe?g|jfif|webp|gif|bmp|avif|tiff?|svg|ico)$/i.test(f.name || ''))
    );
    if (!files.length) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setFilesOver(false);
    const records = [];
    for (const file of files) {
      try {
        // 0.33.0 — the renderer's own canvas thumb (all formats).
        const rec = await saveImageBlobWithThumb(file);
        if (rec) records.push(rec);
      } catch {
        /* skip unreadable file */
      }
    }
    addRecords(records);
  };

  // ---- thumb removal -----------------------------------------------------------
  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // ---- stamps (0.15.0 · 0.22.0 one world, one setting · 0.23.0 the library) --
  // Add a stamp straight from the library (the strip below the slots or the
  // picker's rows): it joins the draft right away wearing the library name.
  const attachFromLibrary = (tpl) => {
    if (!tpl?.image || stamps.some((s) => s.image === tpl.image)) return;
    setStamps((prev) => [...prev, { id: uuidv4(), image: tpl.image, name: tpl.name || 'stamp' }]);
  };

  const removeStamp = (idx) => {
    setStamps((prev) => prev.filter((_, i) => i !== idx));
  };

  // The STAR — bring a draft stamp to the top (it starts wearing the card's
  // SHARED settings — the look stays).
  const promoteStamp = (idx) => {
    setStamps((prev) => {
      if (idx <= 0 || idx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.unshift(moved);
      return next;
    });
  };

  // Drag-sort the draft slots (the pointer sort commits here).
  const reorderStamps = (from, to) => {
    setStamps((prev) => {
      if (from === to || from < 0 || from >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(Math.max(0, Math.min(prev.length - 1, to)), 0, moved);
      return next;
    });
  };

  // The stamp window's SAVE on an existing slot — rename the draft record.
  const renameStamp = (idx, name) => {
    setStamps((prev) => prev.map((s, i) => (i === idx ? { ...s, name } : s)));
  };

  // 0.22.0 — the ONE settings patcher: the color window and the stamp
  // settings popover both write sparse patches here ({color} | {colorAlpha} |
  // {pos} | {scale} | {rot} | {clip} | {alpha}). Everything persists on
  // CREATE — the full object travels, so nothing resets behind your back
  // (the 0.21.0 bug: rotation/scale/transparency/clip silently fell back to
  // defaults after creating the card).
  const patchSettings = (patch) => {
    setStampSettings((prev) => sanitizeStampSettings({ ...prev, ...patch }));
  };

  // 1.5.4 — THE CREATE KEY SPEAKS INSTEAD OF GREYING OUT ("make the create
  // character button not greyout, but instead it will highlight the areas
  // need filling, since it may be unclear whats preventing the character
  // from being made, which right now is the name of the card, add that
  // also to the version name, if the version name is blank, then it will
  // not create it and will highlight it to be filled, also add
  // noticifications on top related to which fields needs to be filled"):
  // the disabled seat is retired — the key always takes the press, and a
  // press with a field still empty ANSWERS: one toast per missing field
  // (the hub's own pills at the top of the screen), the empty fields wear
  // the breathing red rim (.gd-field-need — a DERIVED class, so the rim
  // holds exactly until the field is filled, no clearing ceremony), and
  // the key itself takes a short shake so the press is acknowledged in
  // place. The gate grows its second tooth: the VERSION's label blanks
  // the create exactly like the card's own name always has.
  const [needFlash, setNeedFlash] = useState(null); // { name, vLabel, nonce }
  // 1.8.6 — THE WHEEL THAT OUTLIVES THE FREEZE ("when pressing on buttons
  // that load things (such as ... new card button etc..) , i want you to
  // darken it slightly as if pressed"): the CREATE key holds the pressed
  // darken through the whole road — App closes this window the moment the
  // hand commits and the CARD VIEWER carries the wheel (see newCardPending
  // there), so the key's own word is the pressed face it wears while the
  // window fades, never a second press on top of a build already in
  // flight.
  const [creating, setCreating] = useState(false);
  const submit = () => {
    if (creating) return;
    const nameMissing = !stripRichText(name).trim();
    const vLabelMissing = !stripRichText(vLabel).trim();
    if (nameMissing || vLabelMissing) {
      setNeedFlash({ name: nameMissing, vLabel: vLabelMissing, nonce: Date.now() });
      if (nameMissing) gdToast('Card name is empty — give the card a name', 'fail');
      if (vLabelMissing) gdToast('Version label is empty — give the first version a name', 'fail');
      return;
    }
    setNeedFlash(null);
    setCreating(true);
    onCreate({
      name: name.trim(),
      classId,
      // 1.1.2 — the picked tag ids ride the card at birth (see the TAGS
      // row below): makeCharacter lands them on the character directly.
      tags: pickedTagIds,
      images: images.map(imageRecord),
      // 0.42.0 — the CROP rides the card object (see the draft note above).
      // 1.6.2 — the trim's own ink rides it too (the picker's create seat —
      // makeCharacter lands it on the character as cardTrimColor).
      /* 1.7.2 — the stamp reach left with the option: a card is born without
         it (the saved field stays false by construction). */
      card: { ratio, trim, trimColor, crop, color: cardColor, finish, finishOnImage, finishOnTrim, finishTransparency, finishSplitImage, finishImageTransparency, imageMotion, stampMotion },
      version: { label: vLabel, color: vColor, icon: vIcon },
      stamps: stamps.map(({ image, name }) => ({ image, name })),
      stampSettings,
    });
  };

  const chipStyle = vColor ? { background: vColor, color: readableInk(vColor) } : undefined;

  return (
    <Modal
      title="NEW CARD"
      /* 1.5.4 — the retained seat's flight: CSS owns the fade both ways
         (Modal's flight law), parked tracks NOT-live (the closed seat is
         inert + hidden after its farewell fade). */
      flight
      parked={parked || !live}
      onClose={onClose}
      confirmClose={
        draftStarted
          ? {
              message:
                'The card has not been created yet: its draft (name, images, stamps) is still only in this window. Close and discard it?',
            }
          : null
      }
      width="w-[940px]"
      // 1.1.2 — THE CLOSE LOCK ("dont allow me to close the card creation
      // window if i have tag manager open"): while the tag manager floats
      // above this window, every accidental close gesture is inert — the
      // manager owns the Escape and the clicks; a stray ✕ here would throw
      // the whole draft away under the very window that was building its
      // vocabulary. The footer's CANCEL / CREATE stay direct (intent), and
      // the lock lifts the moment the manager closes.
      closeLocked={tagManagerOpen}
      // 0.42.0 — pinned while the image-area grip is held (see the cap
      // notes above): the window's seat freezes, the content flows live.
      pinned={capLive}
      footer={
        /* 1.1.5 — THE HELP KEY RIDES THE FOOTER'S LEFT, exactly like the
            settings window ("add the help text option in the card creation
            window in the bottom left, just like the settings window"): icon
            chip + label + switch on the left, the action pill on the right
            — one toggle, the same setting, every helper paragraph. */
        <div className="flex items-center gap-3">
          <div className="gd-foot-help" title="Show the explanatory paragraphs under settings and editors everywhere">
            <span className="gd-rail-icon">
              <CircleHelp size={12} />
            </span>
            <span className={clsx('gd-rail-help-label', showHelp && 'is-on')}>HELP TEXT</span>
            <button
              className={clsx('gd-switch', showHelp && 'is-on')}
              title={showHelp ? 'Help text ON: hide the helper paragraphs' : 'Help text OFF: show the helper paragraphs'}
              onClick={onToggleHelp}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="gd-foot-bar">
              <button className="gd-btn" onClick={onClose}>
                CANCEL
              </button>
              {/* 1.5.4 — the key never greys out (see the submit note): a
                  press with missing fields shakes in place while the
                  verdicts climb to the top. The nonce-keyed remount replays
                  the shake on every failed press. */}
              <button
                key={`create-${needFlash?.nonce ?? 0}`}
                className={clsx(
                  'gd-btn gd-btn-solid',
                  creating && 'is-loading',
                  needFlash && (needFlash.name || needFlash.vLabel) && 'gd-need-shake'
                )}
                onClick={submit}
              >
                CREATE
              </button>
            </div>
          </div>
        </div>
      }
    >
      <div
        className="grid grid-cols-[236px_1fr_248px] gap-5"
        onDragEnter={(e) => {
          if (Array.from(e.dataTransfer?.types || []).includes('Files')) {
            dragCounterRef.current += 1;
            setFilesOver(true);
          }
        }}
        onDragOver={(e) => {
          if (Array.from(e.dataTransfer?.types || []).includes('Files')) e.preventDefault();
        }}
        onDragLeave={() => {
          dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
          if (dragCounterRef.current === 0) setFilesOver(false);
        }}
        onDrop={handleFilesDrop}
      >
        {/* LEFT — the card's look: interactive preview, ratio, trim, color */}
        <div className="space-y-4">
          <div className="gd-rule">CARD LOOK</div>
          <CardLookEditor
            name={name}
            imageUrl={coverUrl}
            imgAspect={imgAspect}
            ratio={ratio}
            trim={trim}
            /* 1.6.2 — the trim color picker rides the create seat too (the
               EDIT CARD window's own door — one law, both windows). */
            trimColor={trimColor}
            onTrimColor={setTrimColor}
            crop={crop}
            onChange={({ ratio: r, trim: t, crop: c }) => {
              setRatio(r);
              setTrim(t);
              // 0.42.0 — the crop finally lands (see the draft note above):
              // drag-to-place and scroll-to-zoom now move the picture.
              setCrop(c);
            }}
            stampUrl={topStampUrl}
            stampHueHex={hue}
            stampHueAlpha={stampHueAlpha(stampSettings)}
            stampPos={stampSettings.pos || null}
            stampScale={stampSettings.scale || 1}
            stampRot={stampSettings.rot || 0}
            stampClip={stampSettings.clip === true}
            stampAlpha={stampAlpha(stampSettings)}
            stampHueOver={stampSettings.hueOver === true}
            stampHueOverTrim={stampSettings.hueOverTrim === true}
            cardColor={cardColor}
            finish={finish}
            finishOnImage={finishOnImage}
            finishOnTrim={finishOnTrim}
            finishTransparency={finishTransparency}
            /* 1.9.6 — the split volume threads into the preview (what you
               check and slide is what the card is born wearing). */
            finishSplitImage={finishSplitImage}
            finishImageTransparency={finishImageTransparency}
            imageMotion={imageMotion}
            /* 1.4.7 — STAMP MOTION, one voice with the shipped card (the
               preview's band + sticker follow the art's sway). */
            stampMotion={stampMotion}
          />
          {/* 0.39.0 — THE CARD COLOR SECTION MOVED ("make card colors on the
              right side below the emojie picker"): the swatch ladder now
              lives in the RIGHT column, under the version's icon picker —
              the left column stays focused on the look itself. */}
        </div>

        {/* MIDDLE — details + images */}
        <div className="space-y-4 min-w-0">
          <div className="gd-rule">DETAILS</div>
          <div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">NAME</div>
            {/* 1.0.7 — THE NAME IS CAPPED AT 60 ("card names should have a
                limit of 60 characters"): the creation field wears the same
                maxLength seat the edit window wears — counter, paste cap and
                all — so a card is born under the same law it lives under. */}
            <RichInput
              inputRef={nameRef}
              value={name}
              maxLength={60}
              placeholder="e.g. amy (select text for formatting)"
              onChange={setName}
              /* 1.5.4 — the missing-field rim: worn only while the CREATE
                 verdict flagged this field AND it is still empty (derived —
                 filling it clears the rim in the same breath). */
              className={clsx(needFlash?.name && !stripRichText(name).trim() && 'gd-field-need')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
          </div>

          {/* 1.1.4 — THE CLASS LINE IS GONE TOO ("remove field under class in
              the card creation, as i said it auto creates in the class
              opened"): the read-only FILED UNDER line was the last echo of
              the retired selector — the card lands in the class the window
              was opened from (see the classId note at the top), and the
              window no longer needs to say so. The DETAILS column leads
              with the NAME, then the TAGS. */}

          {/* 1.1.2 — TAGS AT BIRTH ("add adding tags to the card when
              creating it in card creation window, as i can add tags already
              added, when i press on the + to add a new tag the tag manager
              will open"): every tag in the vocabulary sits here as a toggle
              chip — the same wear-it / take-it-off gesture the details
              panel's tag row speaks, with the tag's own color on the picked
              face. The + key opens the TAG MANAGER OVER this window (App
              seats it above; closing it never closes this window, and this
              window cannot close while it is open) — a tag minted there
              joins this row the moment the manager shuts.
              1.1.5 — THE BOARD HAS ITS OWN VOICE AND ITS OWN FOLD: the
              container is a TAG BOARD now, not a text field (see
              .gd-tagfield in index.css — "change the look of the tags
              container in card creation window so it doesnt match the text
              input containers"), and the label row carries a fold key that
              keeps the first three rows when the vocabulary runs long
              ("add an option to collapse tags inside the card creation
              window, only shows the first 3 rows lets say (not affecting
              detail pannel)").
              1.1.6 — THE FOLD KEY SAYS ITS NAME ("make it so the button to
              collapse the tags&stamps is visible…"): the same bordered
              COLLAPSE/EXPAND pill the filter card's rule lines wear — one
              fold language everywhere, impossible to miss. */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute">
                TAGS{pickedTagIds.length > 0 ? ` (${pickedTagIds.length})` : ''}
              </div>
              {(tags || []).length > 0 && (
                <button
                  type="button"
                  className="gd-spot-fold"
                  title={tagsFold ? 'Expand the tag board (five rows, more stack sideways)' : 'Collapse the tag board to its first three rows'}
                  onClick={() => setTagsFold((f) => !f)}
                >
                  <ChevronDown size={11} className={clsx('transition-transform', !tagsFold && 'rotate-180')} />
                  <span className="gd-spot-fold-word">{tagsFold ? 'EXPAND' : 'COLLAPSE'}</span>
                </button>
              )}
            </div>
            {/* 1.1.8 — THE BOARD IS A SIDE-FLOW ZONE (see the fold note at
                the state); 1.1.9 — THE BOARD'S OWN LIMITS: folded keeps its
                first THREE rows, open caps at FIVE with the rest stacked
                right as columns. The board keeps its dotted-tray look
                (.gd-tagfield rides as the zone's own class). */}
            <SideFlowZone
              rows={5}
              collapsedRows={3}
              collapsed={tagsFold}
              floorPx={31}
              selfFlow
              zoneClassName="gd-tagfield"
              ariaLabel="tag board"
              seatClassName="w-full"
            >
              {(tags || []).length === 0 && !tagManagerOpen && (
                <span className="text-[10px]" style={{ color: 'var(--gd-mute)' }}>
                  No tags yet: the + key creates the first one
                </span>
              )}
              {(tags || []).map((tag) => {
                const on = pickedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className="gd-chip gd-tag-chip !py-0.5 !px-2 text-[10px]"
                    style={on ? { background: tag.color, color: readableInk(tag.color) } : undefined}
                    title={on ? `Remove tag "${stripRichText(tag.name)}"` : `Add tag "${stripRichText(tag.name)}"`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {/* 1.1.4 — THE TAG'S OWN MARKS (the details panel's row
                        speaks the same law): the icon at the left of the
                        label, and the tag's SHAPE — a miniature of the exact
                        ribbon the card wears — hanging off the chip's left
                        edge, painted in the tag's own color whether the chip
                        is picked or not. The container keeps its own law:
                        colored only once selected. */}
                    <TagRibbon tag={tag} scale={0.55} className="gd-chip-shape" />
                    {tag.icon && <ChipGlyph name={tag.icon} size={10} className="flex-shrink-0" />}
                    {/* 1.2.2 — THE LABEL CAP (the detail panel's tags speak
                        the same law): a long-named tag never outgrows its
                        row — the label ellipsizes, the tooltip carries all. */}
                    <RichText text={tag.name} className="gd-tag-label-cap" />
                  </button>
                );
              })}
              {onOpenTagManager && (
                <button
                  type="button"
                  className="gd-btn !py-0.5 !px-2 text-[10px]"
                  onClick={onOpenTagManager}
                  title="Open the tag manager (creates a new tag)"
                >
                  <Plus size={10} />
                </button>
              )}
            </SideFlowZone>
          </div>

          <div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">
              IMAGES ({images.length})
            </div>
            {/* 0.42.0 — NO RESERVE ON THE WRAPPER: the grid's box breathes at
                its LIVE cap height and the stamps below ride its bottom edge
                frame by frame; the MODAL's `pinned` prop keeps the window's
                own seat frozen for the drag, so nothing re-centers while it
                happens. */}
            <div ref={setGridWrapEl} className="relative">
              <div
                className="grid grid-cols-3 gap-2 overflow-y-auto overflow-x-hidden pr-0.5"
                style={capActive && gridMaxH ? { maxHeight: gridMaxH } : undefined}
              >
                {images.map((img, i) => {
                  const isDragged = sorting && sort?.from === i;
                  return (
                    <div
                      key={img.file}
                      className={clsx(
                        'relative rounded border-2 overflow-hidden cursor-grab gd-sort-item group/thumb',
                        isDragged && 'is-dragging'
                      )}
                      style={{
                        borderColor: 'var(--gd-line)',
                        aspectRatio: '1 / 1',
                        background: 'var(--gd-panel)',
                        ...(isDragged ? dragStyle : itemStyle(i) || {}),
                        // 0.42.0 — THE COVER SLOT OUT-RANKS THE RIDE ("the top
                        // label/outline around top image … is below the other
                        // images, thats wrong as it should be above their
                        // layer"): while a sort runs, the slot carrying the
                        // COVER ring + badge sits ABOVE every other thumb —
                        // including the one being dragged (40) — so the marks
                        // never dip under a passing image again.
                        // 0.47.0 — THE RIDE OUT-RANKS THE MARKS (the manager's
                        // new law, applied here too): the tile IN THE HAND
                        // rides at z 50, above the cover slot's 45; parked
                        // slots keep their marks above the gliding neighbors.
                        ...(!isDragged && i === 0 && sorting ? { zIndex: 45 } : null),
                        ...(isDragged ? { zIndex: 50 } : null),
                      }}
                      {...bindItem(i)}
                      title={i === 0 ? 'Cover: drag to rearrange' : 'Drag to rearrange'}
                    >
                      <img
                        src={buildImageUrl(imagesPath, img.thumb || img.file)}
                        alt=""
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                      {/* 0.42.0 — THE MARKS ARE WELDED, NOT FLOWN: plain
                          absolute spans ride the slot's own box — CSS welds
                          them; no measurement, no drift, ever.
                          0.45.0 — THE HAND-OFF POPS: keyed by the cover
                          image's own file, the wrapper mounts fresh when the
                          cover changes hands — pop out on the old image, pop
                          in on the new one (see the note above the sorter). */}
                      <AnimatePresence initial={false}>
                        {i === 0 && (
                          <motion.span
                            key={`cover-${img.file}`}
                            className="gd-thumb-topmark"
                            aria-hidden
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ duration: 0.18, ease: [0.25, 0.9, 0.35, 1] }}
                          >
                            <span className="gd-thumb-ring" />
                            <span className="gd-thumb-badge">COVER</span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <GripVertical
                        size={11}
                        className="absolute top-1 left-1 opacity-0 group-hover/thumb:opacity-100 pointer-events-none"
                        style={{ color: 'var(--gd-chrome)' }}
                      />
                      <button
                        className="absolute top-1 right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                        style={{ background: 'var(--gd-panel)', borderColor: 'var(--gd-ink)', color: '#c8402f' }}
                        title="Remove image"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  );
                })}
                <button
                  className="rounded border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors group/slot"
                  style={{ borderColor: 'var(--gd-line)', color: 'var(--gd-mute)', aspectRatio: '1 / 1' }}
                  onClick={pickImages}
                  disabled={busy}
                  title="Browse for images: drop works too"
                >
                  <ImagePlus size={18} />
                  <span className="text-[8px] font-bold tracking-[0.14em] px-1 text-center group-hover/slot:text-[color-mix(in_srgb,var(--gd-panel-text)_80%,transparent)]">
                    {images.length ? 'ADD MORE' : 'ADD IMAGES'}
                  </span>
                </button>
                {/* 0.30.0 — the PASTE tile beside the ADD tile: grabs the
                    clipboard image; nothing there = a quiet no-op. 0.32.0 —
                    paste stopped advertising itself inside the ADD key's
                    tooltip too ("since paste has its own way") — the PASTE
                    tile IS that way. */}
                <button
                  className="rounded border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors group/paste"
                  style={{ borderColor: 'var(--gd-line)', color: 'var(--gd-mute)', aspectRatio: '1 / 1' }}
                  onClick={pasteFromClipboard}
                  title="Paste the clipboard image"
                >
                  <ClipboardPaste size={18} />
                  <span className="text-[8px] font-bold tracking-[0.14em] px-1 text-center group-hover/paste:text-[color-mix(in_srgb,var(--gd-panel-text)_80%,transparent)]">
                    PASTE
                  </span>
                </button>
              </div>
              {/* 0.39.0 — THE GRID'S OWN RESIZE GRIP: only while the cap is
                  active (more pictures than the budget holds). 0.41.0 — DOWN
                  lengthens toward the four-row default, UP shortens to a
                  single row — the handle follows the hand. 0.42.0 — the
                  window itself is position-pinned while the grip is held
                  (see the Modal `pinned` prop), so nothing re-centers while
                  the LIVE layout breathes under it. */}
              {capActive && (
                <div
                  className={clsx('gd-grid-cap-handle', capLive && 'is-live')}
                  role="separator"
                  aria-orientation="horizontal"
                  title="Drag to resize the image area: down to four rows, up to one"
                  onPointerDown={onCapDown}
                  onPointerMove={onCapMove}
                  onPointerUp={onCapUp}
                  onPointerCancel={onCapUp}
                >
                  <span className="gd-grid-cap-grip" aria-hidden />
                </div>
              )}
            </div>
            {showHelp && (
              <p className="mt-2 text-[9px] leading-relaxed text-gd-mute">
                Import as many as you like: the first ten show at once, the rest scroll (and the area itself is
                drag-resizable). Drag thumbnails to rearrange; the first one is the card cover.
              </p>
            )}
          </div>

          {/* 0.15.0 — STAMPS: below the image upload. 0.23.0 — the full kit:
              the card's slots (drag to order, star to promote, cross to
              remove, click to edit), the ADD key's picker (every previous
              stamp + upload), and the LIBRARY strip — every stamp added
              prior, one click adds it right away. ONE settings cluster
              follows the slots (shared by every stamp): the color window
              button + the settings button, shown once a stamp exists. */}
          <div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">
              STAMPS ({stamps.length})
            </div>
            {/* 0.40.0 — THE STRIP WRAPS AND THE WINDOW GROWS ("for some
                reason the stamp area is clipping ion the left , and the
                container isnt expanding below, it should expand like usual
                no need for the scrollwheel or anything"): the one-line
                scroll-lane experiment is over — the slots + ADD + PASTE +
                the settings cluster flow as a WRAPPING strip that grows the
                window downward, exactly like the stamps gallery below it.
                No side scroll, no clipped first chip, no squeezed rows. */}
            {/* 0.40.0 — THE STRIP WRAPS AND THE WINDOW GROWS. 0.41.0 — ONE
                FLOW, NO FORCED NEW LINES: the slots, ADD, PASTE and the
                shared settings cluster ride the SAME wrapping container
                (StampSlots renders its children inside .gd-stamp-slots), so
                the tiles fill each row's leftover room exactly like a stamp
                would — adding a stamp never shoves ADD + PASTE onto a line of
                their own ("dont make the stamp settings paste and add
                magically move into a newline after the 7th stamp") and the
                settings cluster never takes ANOTHER new line. */}
            <StampSlots
              stamps={stamps}
              imagesPath={imagesPath}
              onRemove={removeStamp}
              onPromote={promoteStamp}
              onReorder={reorderStamps}
              onRename={renameStamp}
            >
              <StampAddButton
                stampLibrary={stampLibrary}
                imagesPath={imagesPath}
                attachedImages={stamps.map((s) => s.image)}
                greyAttached
                onPick={attachFromLibrary}
                onUpload={(records) => naming.push(records)}
                onPaste={(records) => naming.push(records)}
              />
              {/* 0.38.0 — THE STAMP PASTE TILE ("add a paste area for the stamp
                  too when creating a new card just like the image one"):
                  beside the ADD key, same footprint as an empty slot; the
                  clipboard's image rides the very same naming queue. */}
              <StampPasteTile onPaste={(records) => naming.push(records)} />
              {/* 0.22.0 — THE shared settings cluster: the hue and the
                  placement / transform — one set for every stamp on the card.
                  1.3.4 — the cluster speaks the tower law everywhere now
                  (see .gd-stamp-settings-cluster in index.css): the color
                  key rides ABOVE the settings key, two options on top of
                  each other, one flow child.
                  1.4.3 — THE CLUSTER STAYS WITHOUT A STAMP ("let the hue
                  color and stamp options appear in the card creation
                  window/right panel even if there is no stamp present, but
                  of course grey out the stamp settings option when its not
                  present"): the stamps.length gate left — the cluster
                  renders from the window's first frame. The COLOR key stays
                  live (the picked hue paints the card with no stamp at all —
                  the 1.4.5 law); the SETTINGS key alone takes the locked
                  seat — greyed, blind to the pointer, its tooltip saying
                  "This option requires a stamp".
                  1.4.5 — THE CLASSIC FACE ("while the rest should be the old
                  one and stack them above each other"): the CREATION window
                  speaks the CLASSIC keys — the anonymous 20px squares on the
                  tower — the shape this window was born with. */}
              <span className="gd-stamp-settings-cluster is-tower">
                <StampColorControls
                  variant="classic"
                  color={stampSettings.color}
                  colorAlpha={stampSettings.colorAlpha}
                  autoColor={autoColor}
                  showHelp={showHelp}
                  onColor={(hexOrNull) => patchSettings({ color: hexOrNull })}
                  onAlpha={(v) => patchSettings({ colorAlpha: v })}
                  hueOverTrim={stampSettings.hueOverTrim === true}
                  onHueOverTrim={(v) => patchSettings({ hueOverTrim: v })}
                />
                <span
                  className={clsx(!stamps.length && 'gd-locked-key')}
                  title={stamps.length ? undefined : 'This option requires a stamp'}
                >
                  <StampPosControls
                    variant="classic"
                    settings={stampSettings}
                    stampAspect={topStampAspect}
                    cardAspect={ratio && ratio.w > 0 && ratio.h > 0 ? ratio.w / ratio.h : null}
                    showHelp={showHelp}
                    onPatch={patchSettings}
                  />
                </span>
              </span>
            </StampSlots>

            {/* 0.24.0 — THE STAMPS GALLERY: every stamp in the library,
                right below the slots — a stamp saved through the window joins
                it immediately. 0.26.0 — stamps already on THIS card are shown
                GREYED OUT instead of hidden ("it should just greyout the
                stamps applied into the card" — the creation window keeps the
                whole gallery visible so you always know what exists; the
                card panel's editor keeps hiding them). The TRASH key
                (confirm first) removes one from the gallery. */}
            {(() => {
              if (stampLibrary.length === 0) return null;
              const attached = (tpl) => stamps.some((s) => s.image === tpl.image);
              return (
                <div className="mt-2">
                  {/* 1.1.6 — the gallery's label row. 1.1.9 — THE FOLD LEFT
                      THE WINDOW ("remove the expand and retract feature from
                      stamps in card creation window"): the COLLAPSE/EXPAND
                      key is gone — the gallery always shows every row it
                      has; the window itself scrolls when a long library
                      grows it past the screen. */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="text-[8px] font-bold tracking-[0.18em] uppercase text-gd-mute">
                      STAMPS GALLERY ({stampLibrary.length})
                    </div>
                  </div>
                  <div className="gd-stamp-lib">
                    {stampLibrary.map((tpl) => {
                      const onCard = attached(tpl);
                      return (
                        <span key={tpl.id} className="gd-stamp-lib-chip-wrap">
                          <button
                            type="button"
                            className={clsx('gd-stamp-lib-chip', onCard && 'is-attached')}
                            disabled={onCard}
                            title={
                              onCard
                                ? `${tpl.name}: already on this card`
                                : `${tpl.name}: click to add this stamp to the card`
                            }
                            onClick={() => attachFromLibrary(tpl)}
                          >
                            <img src={buildImageUrl(imagesPath, tpl.image)} alt="" draggable={false} />
                          </button>
                          {!onCard && (
                            <button
                              type="button"
                              className="gd-stamp-lib-del"
                              title={`Remove "${tpl.name}" from the stamps gallery`}
                              onClick={() => onDeleteFromGallery?.(tpl, { keepFile: false })}
                            >
                              <Trash2 size={8} strokeWidth={2.6} />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {stamps.length > 0 && showHelp && (
              <p className="mt-1.5 text-[9px] leading-relaxed text-gd-mute">
                One setting for every stamp: the swatch opens the color window: pick the hue and tune its
                transparency; the settings button places, resizes, rotates and sets the stamp&rsquo;s own
                transparency, even hanging past the card&rsquo;s borders; BAND puts it back. The values always
                reflect where the band is showing the stamp right now, so the first change starts from its
                current look instead of a default.
              </p>
            )}
            {showHelp && (
              <p className="mt-2 text-[9px] leading-relaxed text-gd-mute">
                A stamp shows faded over the bottom of the card&rsquo;s art, dissolving toward its middle. Only the top
                stamp is visible; the others sit behind it. Drag the slots to order them, star one to make it the top,
                click a slot to edit its name. Uploaded stamps join your stamp library automatically: every stamp is
                pickable from any card.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT — the first version */}
        <div className="space-y-4 min-w-0">
          <div className="gd-rule">FIRST VERSION</div>
          <div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">LABEL</div>
            {/* 1.0.5 — the same 35-character cap the edit window's label
                wears ("35 character limit for the version name too"). */}
            <RichInput
              value={vLabel}
              maxLength={35}
              placeholder="V1, alt outfit…"
              onChange={setVLabel}
              /* 1.5.4 — the same missing-field rim the name wears (the
                 create gate's second tooth). */
              className={clsx(needFlash?.vLabel && !stripRichText(vLabel).trim() && 'gd-field-need')}
            />
          </div>

          <div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">CHIP COLOR</div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                className={clsx(
                  'w-6 h-6 rounded border-2 flex items-center justify-center text-[10px] font-bold',
                  !vColor ? 'gd-btn-accent' : 'text-gd-chrome'
                )}
                style={{ borderColor: 'var(--gd-line)' }}
                title="Theme default"
                onClick={() => setVColor(null)}
              >
                ∅
              </button>
              {CHIP_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border-2 flex items-center justify-center"
                  style={{
                    background: color,
                    borderColor: vColor === color ? 'var(--gd-chrome)' : 'var(--gd-ink)',
                    outline: vColor === color ? '2px solid var(--gd-accent)' : 'none',
                    outlineOffset: 1,
                  }}
                  title={color}
                  onClick={() => setVColor(color)}
                />
              ))}
              {/* Custom color — the in-app PICKER (0.24.0: the native wheel is
                  gone; the popover opens the hue selection right away and
                  carries the HEX area). Same 24px square as the presets so the
                  row stays perfectly aligned, walled off by a hairline. */}
              <span className="gd-swatch-divider" aria-hidden />
              <ColorPickerButton
                color={vColor}
                onColor={setVColor}
                // 1.6.3 — the picker's reset unsets the chip's color (null
                // = the strip's own default tint).
                onReset={() => setVColor(null)}
                dashed
                active={!!vColor && !CHIP_COLORS.includes(vColor)}
                title="Open the color picker: any color you like"
              />
            </div>
          </div>

          <div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">ICON</div>
            <div className="flex items-center gap-2 mb-2 min-w-0">
              {/* 1.0.6 — THE PREVIEW KEEPS ITS SEAT ("fix the issue where the
                  preview clips out of the window, fix that so it stops"): the
                  chip is capped and its label ellipsizes at the cap — a
                  35-character label can never push the chip (or the window
                  itself) out over the right edge again; the full name rides
                  the chip's title tooltip. */}
              <span
                /* 1.0.7 — FLAT (the version-label law): the preview chip
                    stands straight like the strip it previews. What you
                    frame here is exactly what ships there. */
                className="gd-chip gd-chip-flat min-w-0"
                style={chipStyle}
                title={stripRichText(vLabel) || 'V1'}
                /* 1.0.8 — a NAME-LABEL tooltip: two lines and no more. */
                data-gd-tip-name="1"
              >
                {vIcon && <ChipGlyph name={vIcon} size={13} />}
                <RichText text={stripRichText(vLabel) ? vLabel : 'V1'} className="gd-chip-label-cap" />
              </span>
              <span className="text-[9px] text-gd-mute flex-shrink-0">live preview</span>
            </div>
            <LucideIconPicker value={vIcon} onSelect={setVIcon} />
          </div>

          {/* 0.38.0 — CARD COLOR ("in card creation also add the option to
              color the card itself"); 0.39.0 — BELOW THE EMOJI PICKER on the
              right ("make card colors on the right side below the emojie
              picker"): presets + picker + none, the same swatch language the
              class colors use. What you pick is what the card's FOOT wears. */}
          <div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">CARD COLOR</div>
            <div className="gd-cls-presets">
              <button
                type="button"
                className={clsx(
                  'w-6 h-6 rounded border-2 flex items-center justify-center text-[10px] font-bold',
                  !cardColor ? 'gd-btn-accent' : 'text-gd-chrome'
                )}
                style={{ borderColor: 'var(--gd-line)' }}
                title="Theme default: no card color"
                onClick={() => setCardColor(null)}
              >
                ∅
              </button>
              {CLASS_COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={clsx('gd-cls-preset', cardColor === color && 'is-active')}
                  style={{
                    background: color,
                    borderColor: cardColor === color ? 'var(--gd-chrome)' : 'var(--gd-ink)',
                  }}
                  title={color}
                  onClick={() => setCardColor(color)}
                />
              ))}
              <span className="gd-swatch-divider" aria-hidden />
              <ColorPickerButton
                color={cardColor}
                onColor={setCardColor}
                // 1.6.3 — the picker's reset unsets the plate (null = the
                // theme's own foot).
                onReset={() => setCardColor(null)}
                dashed
                active={!!cardColor && !CLASS_COLOR_PRESETS.includes(cardColor)}
                title="Open the color picker: any color you like"
              />
            </div>
          </div>

          {/* 1.3.8 — THE CARD'S OWN LOOKS ("below card color option in edit
              card and card creation windows"): the finish (+
              affect-the-image) — one shared section, one voice with the
              EDIT CARD window (see CardStyleControls). 1.3.9 — the
              secondary color row and the pattern dropdown left with the
              retired feature. */}
          <CardStyleControls
            finish={finish}
            finishOnImage={finishOnImage}
            /* 1.9.5 — THE COAT'S OWN VOLUME: the knob threads from the
               draft into the shared section (the creation window's seat
               of the family's slider). */
            finishTransparency={finishTransparency}
            onFinishTransparency={setFinishTransparency}
            /* 1.9.6 — the split volume's own threads (the checkbox + the
               image knob — the creation window's seat of the family). */
            finishSplitImage={finishSplitImage}
            onFinishSplitImage={setFinishSplitImage}
            finishImageTransparency={finishImageTransparency}
            onFinishImageTransparency={setFinishImageTransparency}
            onFinish={setFinish}
            onFinishOnImage={setFinishOnImage}
            finishOnTrim={finishOnTrim}
            onFinishOnTrim={setFinishOnTrim}
            imageMotion={imageMotion}
            onImageMotion={setImageMotion}
            /* 1.4.7 — STAMP MOTION rides the family (the grey law gates it
               on its own subject — a stamp — + its engine, image motion
               on; the gates speak the window's own live drafts). */
            stampMotion={stampMotion}
            onStampMotion={setStampMotion}
            /* 1.4.6 — THE SUBJECT TRUTH (the grey-out law's second axis):
               the gates speak the window's own live drafts — an image
               pasted or a stamp attached wakes its switch in the same
               breath, no stale seat. */
            hasImage={!!cover}
            hasStamp={stamps.length > 0}
            showHelp={showHelp}
            /* 1.5.8 — the experimental gate rides the creation window's
               finish row (see finishesHidden's prop note). */
            finishesHidden={finishesHidden}
          />
        </div>
      </div>

      {filesOver && (
        <div
          className="rounded border-2 border-dashed mt-4 py-3 text-center text-[10px] font-bold tracking-[0.18em]"
          style={{ borderColor: 'var(--gd-accent)', color: 'var(--gd-accent)' }}
        >
          DROP TO ADD IMAGES
        </div>
      )}

      {/* 0.23.0 — the upload naming queue's window (one per picked file).
          Escape / CANCEL closes IT ONLY — the creation dialog stays. */}
      {naming.modal}

      {/* 1.1.5 — THE NAME-FORMATTING PARAGRAPH IS RETIRED ("remove this
          text in the help text area: 'Name formatting: select part of the
          name, then use the buttons that grow out of the box — bold, italic,
          underline, sizes, outline. Formats can be mixed.'"): the RichInput
          fields already speak their own affordances (the placeholder itself
          says "select text for formatting"), so the closing paragraph said
          what the box already says — it is gone. */}
    </Modal>
  );
}
