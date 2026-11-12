import clsx from 'clsx';
import { CARD_FINISHES, normalizeFinishTransparency } from '../constants/index.js';

// 1.3.8 — THE CARD'S OWN LOOKS, THE EDITING HALF ("below card color option
// in edit card and card creation windows"): the shared section both
// windows seat under their CARD COLOR rows — the FINISH (numeix /
// foil / holographic / prismatic / nuri, six seats with none among them),
// a surface coat over the card + a checkbox that lets it affect the IMAGE
// too.
// 1.3.9 — THE SECONDARY COLOR AND THE PATTERN ARE RETIRED ("remove
// secondary color and pattern option"): the pattern's ink row and the
// 12-seat dropdown left with the request — the FINISH alone keeps the
// section. One component, one voice: the creation window and the EDIT
// CARD window can never disagree (what you frame here is exactly what
// ships).
// 1.4.1 — IMAGE MOTION ("add an option next to the affect the image to
// have image motion which will make the image sway up and down (if the
// image is barley fit in the card, zoom slightly in enough to fit the
// sway motion) the sway should be slow too"): the second switch in the
// family's row — the art breathes on its own slow clock, auto-zoomed so
// the sway never shows an edge. It works with any finish (or none): the
// motion is the IMAGE's, not the coat's.
// 1.4.3 — "AFFECT THE IMAGE" RENAMES TO "IMAGE EFFECT" ("rename 'affect
// the image' to 'image effect'"), and POLYCHROME'S SEAT GOES TO
// OPALESCENT ("remove polychrome, replace it with Opalescent") — the
// pearl's own tooltip speaks its material.
// 1.4.5 — THE FAMILY GROWS TWO MORE SWITCHES + THE GREY-OUT LAW
// ("next to image effect and image motion, add trim effect, which will
// make the finish apply above the trim" + "add option to effect stamp
// too, where finishes would effect the stamp if checked, also when
// options are unavailable such as image effect and such, dont hide it,
// instead grey it out"): TRIM EFFECT lifts the coat over the trim ring,
// STAMP EFFECT lets it coat the stamps — and every switch in the family
// now STAYS SEATED while it has nothing to act on (no finish picked):
// the row renders from the first frame, the three coat-dependent
// switches take the GREYED seat (dimmed, blind, their own tooltip saying
// why) instead of leaving the section, and IMAGE MOTION keeps its live
// seat beside them — nothing jumps in or out when the finish changes.
// 1.4.6 — THE GATE SPEAKS THE CARD'S OWN TRUTH ("i can still use the
// stamp one even if there is no stamp, same with the image one, fix
// that"): the grey-out law grows a second axis — a switch also greys
// out while its SUBJECT is absent, not just while the finish is. IMAGE
// EFFECT seats the coat over the art zone: no image on the card, nothing
// to coat — it greys out with its own reason. STAMP EFFECT seats the
// coat over the stamp band: no stamp, no band — the same. TRIM EFFECT
// keeps its live seat (every card wears its trim ring). The seats stay
// (the 1.4.5 law: grey, never hidden), the tooltips say which reason
// holds the switch, and the moment the subject arrives (an image pasted,
// a stamp attached) the switch wakes live in the same breath.
// 1.4.7 — THE FAMILY GROWS ITS FIFTH SWITCH + THE ROW PACKS ("add stamp
// motion too, which when checked will move the stamp alongside the image
// with a slight delay" + "currently the image motion and other options
// occupy a whole row, fix that so if possible they would organize next
// to each other if space fits, otherwise keep it as it is" + "greyout
// the image motion button when there is no image uploaded"): STAMP
// MOTION rides beside IMAGE MOTION — the band + the placed stickers
// sway on the same clock family a beat behind the art (see
// .gd-stamp-motion in index.css). IMAGE MOTION itself joins the
// subject-truth law: no image uploaded, nothing to sway — the greyed
// seat with its own reason, exactly like image effect. And the switch
// family no longer stretches each label across a whole row: the labels
// keep their OWN width now (no flex-1, no forced min-width) so they
// organize NEXT TO EACH OTHER when the column has room and wrap
// honestly when it does not — "if space fits" is the row's own law.
// 1.4.8 — THE FIFTH SWITCH STANDS ON ITS OWN ("stamp motion should not
// depend on image motion, it can be turned on as long as there is a
// stamp, but its motion calculation should be offset to the image
// motion one incase its turned on later"): the 1.4.7 seat ALSO greyed
// the switch while image motion was off — a stamp could not sway alone.
// The gate speaks the STAMP alone now: any card with a stamp can arm
// the sway, and the flight's clock keeps the same +0.42s offset to the
// image's own sway (see .gd-stamp-motion in index.css) so the day image
// motion joins in, the two are already in step — the stamp a beat
// behind the picture, exactly the drag the law always spoke.
export default function CardStyleControls({
  finish,
  finishOnImage,
  onFinish,
  onFinishOnImage,
  // 1.4.5 — the coat's trim reach switch, threaded from the callers'
  // drafts exactly like the image one. 1.7.2 — THE STAMP EFFECT SWITCH IS
  // RETIRED ("delete the stamp effect option"): the finishOnStamp /
  // onFinishOnStamp props left with the request — the switch no longer
  // renders in any window, and the stamps' seat under the coat is the
  // image effect's own law alone (see the ladder in index.css).
  finishOnTrim = false,
  onFinishOnTrim = null,
  // 1.4.1 — the image's own sway switch.
  imageMotion = false,
  onImageMotion = null,
  // 1.4.7 — STAMP MOTION ("add stamp motion too, which when checked will
  // move the stamp alongside the image with a slight delay"): the band +
  // every placed sticker breathe on the image's own sway clock, a beat
  // behind the art — threaded from the callers' drafts exactly like the
  // image switch it follows.
  stampMotion = false,
  onStampMotion = null,
  // 1.4.6 — THE SUBJECT TRUTH: does this card actually carry an image /
  // stamps right now? The callers thread their live drafts (the creation
  // window speaks its own image + stamps states; the edit window speaks
  // the character's own), so the gates flip the moment the subject
  // arrives or leaves — no stale seat, no dead switch.
  hasImage = true,
  hasStamp = true,
  /* 1.9.5 — THE COAT'S OWN VOLUME ("finish effects are a bit too clear
     now on the cards like prismatic effects and such, you may add also
     a transparency slider for the finishes in order to control it, add
     that slider in the card creation window and card edit window"): the
     knob the whole family rides — 0 paints the full coat, 1 retires it
     to clear glass, the default 15% answering the report's "a bit too
     clear" at the source. Threaded from the callers' drafts exactly
     like the reach switches (this one section is the voice both windows
     share — the creation window AND the edit card window gain the knob
     in the same breath). */
  finishTransparency = null,
  onFinishTransparency = null,
  /* 1.9.6 — THE SPLIT VOLUME ("add a checkbox that adds another
     transparency slider, but this slider affects the transparency of teh
     finishes on the image itself, so main one would affect both normally,
     but when checked the main one will only affect the finishes over the
     trim and the card, but the second one will affect the finishes over
     images etc.."): the checkbox's own draft (seated in the switch
     family's row — it is a REACH switch, the coat's own split) and the
     second knob's draft (rendered only while the checkbox holds, exactly
     the "adds another transparency slider" the report asks). Threaded
     from the callers' drafts exactly like the main knob — this one
     section is the voice both windows share. */
  finishSplitImage = false,
  onFinishSplitImage = null,
  finishImageTransparency = null,
  onFinishImageTransparency = null,
  showHelp = false,
  // 1.5.8 — THE EXPERIMENTAL GATE ("the current living finishes option is
  // bad as in its not hiding all the finishes (for example nuri finish
  // still exists, it shouldnt)"): while true (App passes
  // settings.livingFinishes === false), the material row offers NONE
  // alone — every living coat (Numeix, Foil, Auric, Holographic,
  // Prismatic, Nuri) leaves the picker — and the row speaks its reason
  // where the coats used to sit. 1.5.9 — the SAVED coat leaves the paint
  // too: the root's .gd-finishes-still retirement (index.css) display:
  // none's every coat layer while the switch is off, so a card wearing a
  // material shows its plain face until the feature returns (the value on
  // the card is never rewritten — flip the switch and the coat paints
  // again). The coat-dependent switches below grey out on their own
  // existing noFinish law while the gate holds.
  finishesHidden = false,
}) {
  const noFinish = finish === 'none';
  const noImage = !hasImage;
  const noStamp = !hasStamp;
  // 1.6.2 — THE GATE SILENCES THE COAT'S WHOLE FAMILY ("the options for
  // the finishes must always be disabled when experimental is off, even if
  // the card has a finish by default, since currently i can still switch
  // image effect and stamp effect on and off just because the card has a
  // finish but its turned off"): a card that still WEARS a saved coat kept
  // every reach switch live under the gate — the picker said FINISHES OFF
  // while the coat's own options carried on editing a material nobody can
  // see. The three coat-dependent switches (image effect, trim effect,
  // stamp effect) now take the SAME greyed seat under the gate they would
  // take with no finish at all, each with the gate's own reason on hover;
  // image motion and stamp motion keep their seats untouched — they are
  // the image's and the stamp's own clocks, not the coat's, and never
  // depended on a finish existing.
  const coatSilent = noFinish || finishesHidden;
  const finishOptions = finishesHidden ? CARD_FINISHES.filter((f) => f.id === 'none') : CARD_FINISHES;
  // A coat-dependent switch renders when its handler exists OR its state
  // is on (a saved card with the switch on keeps its visible seat even if
  // this surface can't flip it — it reads, it just doesn't edit here).
  const seatImage = onFinishOnImage || finishOnImage;
  const seatTrim = onFinishOnTrim || finishOnTrim;
  // 1.9.6 — the split key's own seat law (the same voice): it renders
  // whenever it can speak OR is already held on a saved card.
  const seatSplit = onFinishSplitImage || finishSplitImage;
  // 1.4.7 — stamp motion's own seat law (the same voice), + the family's
  // row renders whenever ANY of the four switches can speak (1.7.2: the
  // stamp effect seat left with the option — no fifth voice anymore).
  const seatStampMotion = onStampMotion || stampMotion;
  return (
    <div className="space-y-4">
      {/* FINISH — the surface coat. */}
      <div>
        <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">FINISH</div>
        <div className="flex flex-wrap gap-1.5">
          {finishOptions.map((f) => (
            <button
              key={f.id}
              type="button"
              className={clsx('gd-btn !px-2 !py-1', finish === f.id && 'gd-btn-accent')}
              /* 1.5.9 — THE MATERIALS SPEAK FOR THEMSELVES ("remove
                 tooltips for each finish"): the long coat descriptions
                 left the picker's keys with the request — the row is a
                 quick pick, not a lecture; the materials' own story
                 lives in the help text and the coats themselves. */
              onClick={() => onFinish(f.id)}
            >
              {f.label}
            </button>
          ))}
          {/* 1.5.8 — the gate's own voice: the row is never a bare "None"
          // chip with no story — it says where the finishes went and the
          // single road back. */}
          {finishesHidden && (
            <span
              className="gd-fin-gate-note"
              title="The experimental finishes are switched off: turn EXPERIMENTAL FINISHES back on (Settings, Performance tab) to pick a material coat"
            >
              FINISHES OFF · SETTINGS → PERFORMANCE
            </span>
          )}
        </div>
        {/* 1.9.5 — THE COAT'S OWN VOLUME — the family's own knob, seated
            under the picker in BOTH windows (this shared section is the
            one voice the creation window and the edit card window
            speak). 0% paints the full coat every material word it ever
            spoke; 100% retires it to clear glass; the default is 15%.
            The grey-out law holds with the family: no finish picked (or
            the gate down), the knob takes the dimmed blind seat with its
            own reason on hover — never hidden, exactly the 1.4.5 law. */}
        {(onFinishTransparency || Number.isFinite(+finishTransparency)) && (
          <div
            className={clsx('mt-1.5 flex items-center gap-x-3', coatSilent && 'opacity-45 pointer-events-none')}
            title={
              finishesHidden
                ? 'Experimental finishes are off: the coat (and everything it reaches) is stilled until the master switch returns (Settings, Performance tab)'
                : noFinish
                  ? 'Needs a finish: pick a material above and this knob will set how clear the coat paints'
                  : 'How transparent the finish effects are — 0% paints the full coat, 100% retires it to clear glass (the default, 15%, is a touch softer than the coats have always spoken)'
            }
          >
            <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-gd-mute shrink-0">Transparency</span>
            <input
              type="range"
              className="gd-range flex-1 min-w-[110px]"
              min={0}
              max={1}
              step={0.05}
              value={normalizeFinishTransparency(finishTransparency)}
              disabled={coatSilent || !onFinishTransparency}
              aria-label="Finish transparency"
              onChange={(e) => onFinishTransparency(Number(e.target.value))}
            />
            <span className="text-[11px] text-gd-chrome w-8 text-right shrink-0 tabular-nums">
              {Math.round(normalizeFinishTransparency(finishTransparency) * 100)}%
            </span>
          </div>
        )}
        {/* 1.9.6 — THE SPLIT VOLUME'S OWN KEY (the reach family's newest
            switch — a gd-check-row in the family's own row, rendered only
            while a surface can flip it): checking it ADDS the second
            slider below and splits the coat's volume — the main knob then
            speaks the plate + trim alone while the image knob speaks the
            picture. The subject-truth law (1.4.6) holds with the family:
            no image, or IMAGE EFFECT off, and the switch greys with its
            own reason — the split only ever has something to split while
            the coat covers the art. */}
        {seatSplit && (
          <label
            className={clsx('gd-check-row', (coatSilent || noImage || !finishOnImage) && 'is-off')}
            title={
              finishesHidden
                ? 'Experimental finishes are off: the coat (and everything it reaches) is stilled until the master switch returns (Settings, Performance tab)'
                : noFinish
                  ? 'Needs a finish: pick a material above and this switch will split the coat between the card and its image'
                  : noImage
                    ? 'Needs an image: this card has no image for the split to speak to — add one and the switch wakes up'
                    : !finishOnImage
                      ? 'Needs IMAGE EFFECT on: the split gives the coat over the picture its own transparency — turn image effect on and this switch wakes up'
                      : 'While on, the TRANSPARENCY knob above speaks the card + trim alone, and the image transparency knob below speaks the coat over the picture'
            }
          >
            <input
              type="checkbox"
              disabled={coatSilent || noImage || !finishOnImage || !onFinishSplitImage}
              checked={!!finishSplitImage}
              onChange={(e) => onFinishSplitImage(e.target.checked)}
            />
            <span>separate image transparency</span>
          </label>
        )}
        {/* 1.9.6 — THE SECOND KNOB (rendered exactly while the checkbox
            holds — the "adds another transparency slider" of the report):
            the image's own volume, 0% painting the full coat over the
            picture, 100% retiring it to clear glass, born at the same 15%
            the main knob speaks. The grey-out law rides with it: the knob
            is dead exactly while the split has nothing to speak to. */}
        {finishSplitImage && (onFinishImageTransparency || Number.isFinite(+finishImageTransparency)) && (
          <div
            className={clsx('mt-1.5 flex items-center gap-x-3', (coatSilent || noImage || !finishOnImage) && 'opacity-45 pointer-events-none')}
            title={
              !finishOnImage
                ? 'Needs IMAGE EFFECT on: nothing paints over the picture while the switch is off'
                : 'How transparent the finish effects are over the IMAGE alone — 0% paints the full coat over the picture, 100% retires it to clear glass (the card + trim keep the TRANSPARENCY knob above)'
            }
          >
            <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-gd-mute shrink-0">Image transparency</span>
            <input
              type="range"
              className="gd-range flex-1 min-w-[110px]"
              min={0}
              max={1}
              step={0.05}
              value={normalizeFinishTransparency(finishImageTransparency)}
              disabled={coatSilent || noImage || !finishOnImage || !onFinishImageTransparency}
              aria-label="Finish transparency over the image"
              onChange={(e) => onFinishImageTransparency(Number(e.target.value))}
            />
            <span className="text-[11px] text-gd-chrome w-8 text-right shrink-0 tabular-nums">
              {Math.round(normalizeFinishTransparency(finishImageTransparency) * 100)}%
            </span>
          </div>
        )}
        {/* 1.4.5 — THE SWITCH FAMILY STAYS SEATED (the grey-out law): the
            row renders whenever ANY switch can speak — image effect,
            image motion, stamp motion, trim effect, stamp effect — and
            the coat-dependent switches take the .is-off greyed seat
            while they have nothing to act on, instead of leaving the
            section. What you can never use reads as dimmed and says why
            on hover; what you can use sits right beside it, live.
            1.4.7 — THE LABELS KEEP THEIR OWN WIDTH ("currently the image
            motion and other options occupy a whole row, fix that so if
            possible they would organize next to each other if space
            fits, otherwise keep it as it is"): the flex-1 + min-w-[128px]
            stretch made every label claim a whole row's share — a lone
            switch on its wrapped line grew to the full width and the
            family read as a stack of full rows. The labels are
            content-sized now: they sit NEXT TO EACH OTHER for as many as
            the column fits, and the same flex-wrap carries the honest
            wrap when it doesn't — the row packs itself, the section
            never wastes its ground. */}
        {(seatImage || onImageMotion || seatStampMotion || seatTrim) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {seatImage && (
              <label
                className={clsx('gd-check-row', (coatSilent || noImage) && 'is-off')}
                title={
                  finishesHidden
                    ? 'Experimental finishes are off: the coat (and everything it reaches) is stilled until the master switch returns (Settings, Performance tab)'
                    : noFinish
                      ? 'Needs a finish: pick a material above and this switch will seat the coat over the image area'
                      : noImage
                        ? 'Needs an image: this card has no image for the coat to cover — add one and the switch wakes up'
                        : 'While on, the finish also coats the image area — the whole card face; off, it stays on the name plate'
                }
              >
                <input
                  type="checkbox"
                  disabled={coatSilent || noImage}
                  checked={!!finishOnImage}
                  onChange={(e) => onFinishOnImage(e.target.checked)}
                />
                {/* 1.4.3 — THE SWITCH SAYS ITS OWN NAME ("rename 'affect the
                    image' to 'image effect'"). */}
                <span>image effect</span>
              </label>
            )}
            {onImageMotion && (
              <label
                className={clsx('gd-check-row', noImage && 'is-off')}
                title={
                  noImage
                    ? 'Needs an image: this card has no image to sway — add one and the switch wakes up'
                    : "While on, the card's image sways gently up and down on a slow clock, zoomed just enough that the sway never shows an edge"
                }
              >
                <input
                  type="checkbox"
                  disabled={noImage}
                  checked={!!imageMotion}
                  onChange={(e) => onImageMotion(e.target.checked)}
                />
                <span>image motion</span>
              </label>
            )}
            {/* 1.4.7 — STAMP MOTION ("add stamp motion too, which when
                checked will move the stamp alongside the image with a
                slight delay"). 1.4.8 — THE STAMP IS THE ONLY SUBJECT
                ("stamp motion should not depend on image motion"): the
                grey law's own axis — no stamp, no sticker to sway; the
                switch wakes the moment a stamp arrives, image motion or
                not. The flight keeps its +0.42s offset to the image's
                own clock (see .gd-stamp-motion in index.css) so both
                sways stay in step if the image ever joins in. */}
            {seatStampMotion && (
              <label
                className={clsx('gd-check-row', noStamp && 'is-off')}
                title={
                  noStamp
                    ? 'Needs a stamp: this card has no stamp to move — attach one and the switch wakes up'
                    : 'While on, the stamp sways gently up and down on its own slow clock, offset a slight beat behind the image\u2019s sway (so the two stay in step if image motion is ever turned on)'
                }
              >
                <input
                  type="checkbox"
                  disabled={noStamp}
                  checked={!!stampMotion}
                  onChange={(e) => onStampMotion(e.target.checked)}
                />
                <span>stamp motion</span>
              </label>
            )}
            {seatTrim && (
              <label
                className={clsx('gd-check-row', coatSilent && 'is-off')}
                title={
                  finishesHidden
                    ? 'Experimental finishes are off: the coat (and everything it reaches) is stilled until the master switch returns (Settings, Performance tab)'
                    : noFinish
                      ? 'Needs a finish: pick a material above and this switch will seat the coat over the trim ring'
                      : 'While on, the finish also coats the trim — the ink ring reads as washed material; off, the trims paint over the coat (the classic look)'
                }
              >
                <input
                  type="checkbox"
                  disabled={coatSilent}
                  checked={!!finishOnTrim}
                  onChange={(e) => onFinishOnTrim(e.target.checked)}
                />
                <span>trim effect</span>
              </label>
            )}
            {/* 1.7.2 — THE STAMP EFFECT SWITCH IS RETIRED ("delete the stamp
                effect option"): the nuclear option the owner asked for —
                the fifth seat of the switch family left every window at
                once. The stamps' relationship with the coat is no longer a
                choice: they paint above it in every state except the image
                effect's own full-face promise (see the ladder law in
                index.css — .gd-fin-on-image). The block that lived here
                (the checkbox + its subject-truth greying) is kept in the
                history books, not the render. */}
          </div>
        )}
        {showHelp && (
          <p className="mt-1 text-[8px] leading-relaxed text-gd-mute">
            The living coat: each material breathes on its own slow clock — the pour flows, the ripples rise, the
            shards shimmer, the facets turn, the embers climb. Image motion sways the picture itself; stamp motion
            follows it a beat behind; trim effect seats the coat over the card's ink ring.
          </p>
        )}
      </div>
    </div>
  );
}
