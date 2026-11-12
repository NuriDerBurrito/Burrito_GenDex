import { useEffect, useState } from 'react';
import { ScrollText, ShieldCheck, ChevronLeft } from 'lucide-react';
import Modal from './Modal.jsx';
import { TOS_DOC, PRIVACY_DOC, TOS_VERSION } from '../constants/legal.js';
import { APP } from '../constants/index.js';

// 1.5.5 — THE LEGAL WINDOW ("i want you to also add terms of service, just
// to ensure that the app doesnt get sued, alongside data privacy etc").
// One component, two postures:
//
//   variant="gate" — the CONSENT gate App mounts after the splash whenever
//     the archive's acceptance record does not match TOS_VERSION: two
//     document cards ("allowing the user to view them by clicking on
//     them"), a full-document reader behind each, an ACKNOWLEDGE & ACCEPT
//     key that writes the record and saves, and a DECLINE key that closes
//     the app (an inline confirm first — an accidental decline would be a
//     data-hostile gesture). The gate is close-locked: no ✕, no Escape, no
//     backdrop exit; the only roads out are the labeled keys.
//
//   variant="view" — the read-only reader the About tab's LEGAL keys open,
//     for one document (doc="tos" | "privacy"). A plain window with CLOSE.
//
// The texts themselves live in constants/legal.js beside their version —
// bumping TOS_VERSION there re-asks every user on their next launch, all
// by itself.
//
// 1.5.7 — THE WINDOW BREATHES BETWEEN ITS PAGES ("update terms of service
// to 1.0.1 … just want you to make animations for the switching between
// the windows and tos and the data privacy etc.. also ensure the window
// gets bigger (with animation) when opening tos or data privacy"): every
// page flip rides a KEYED .gd-legal-page wrapper (a short fade + rise on
// arrival, the app's own entrance voice at the page's smaller stage), the
// body scroller seats itself back at the top for the page that arrives
// (Modal's scrollResetKey — reading the terms to the end then opening the
// privacy notice must not land it already scrolled), and the WINDOW ITSELF
// changes posture with the page: the gate's card face speaks w-[560px],
// each document reader speaks the roomier w-[680px] — and because
// .gd-modal-card tweens its width now (index.css), opening a document
// GROWS the window and BACK relaxes it, one motion, no hard resize. The
// gate's own face and the reader's type sizes are untouched — only the
// frame's travel and the page's breath are new.
//
// 1.5.8 — THE GROWTH GAINS ITS SECOND AXIS ("expand the window vertically
// when opening them (it works in about section, but not on startup)"):
// the width tween alone never read as growth at startup because the gate
// mounts COMPACT and the reader's long content simply capped at the
// viewport budget — the About reader was BORN tall (a fresh mount at its
// full seat), which is why it worked there and not here. The gate's
// document pages now speak Modal's tallPosture (72vh): the window grows
// VERTICALLY with the same 0.2s tween the width speaks, centered, the body
// scrolling its long text inside a frame that finally answers the report
// in both axes. AND THE ACCEPT KEY STEPS ASIDE WHILE READING ("dont show
// me the accept button when im reading one of them"): the reader's foot
// carries only DECLINE and BACK — the acknowledgment waits on the front
// face, where the choice actually lives, and a mid-document ACCEPT can
// never again fire under a finger that was aiming for the page's own
// keys. The window's strings lost their em dashes the same breath (the
// 1.0.2 text pass).

const DOC_BY_KEY = { tos: TOS_DOC, privacy: PRIVACY_DOC };

// The full-document reader — one scroll column, section headers, body
// paragraphs, bullet lists. Used by both postures.
function LegalDocBody({ doc }) {
  return (
    <div className="gd-legal-doc">
      <p className="gd-legal-intro">{doc.intro}</p>
      {doc.sections.map((sec) => (
        <section key={sec.h}>
          <div className="gd-legal-h">{sec.h}</div>
          {(sec.body || []).map((p, i) => (
            <p key={i} className="gd-legal-p">
              {p}
            </p>
          ))}
          {(sec.bullets || []).map((b, i) => (
            <div key={i} className="gd-legal-li">
              <span className="gd-legal-li-dot" aria-hidden />
              <span>{b}</span>
            </div>
          ))}
        </section>
      ))}
      <div className="gd-legal-foot">
        {doc.title} · v{doc.version} · {APP.name}
      </div>
    </div>
  );
}

// One of the gate's two document cards.
function LegalDocCard({ icon, label, version, onOpen, hint }) {
  return (
    <button type="button" className="gd-legal-card" onClick={onOpen} title={`Read the ${label}`}>
      <span className="gd-legal-card-ico">{icon}</span>
      <span className="gd-legal-card-label">{label}</span>
      <span className="gd-legal-card-ver">V{version} · {hint}</span>
      <span className="gd-legal-card-cta">READ →</span>
    </button>
  );
}

export default function LegalModal({ variant = 'view', doc = 'tos', onAccept, onDecline, onClose }) {
  const isGate = variant === 'gate';
  // 'cards' — the gate's front face; 'tos' / 'privacy' — a document reader.
  const [page, setPage] = useState(isGate ? 'cards' : doc);
  // The decline confirm rides INSIDE the gate (its own inline posture —
  // a nested ask would stack windows for a question this small).
  const [confirmingDecline, setConfirmingDecline] = useState(false);
  // Reset the posture whenever the window re-mounts with a different
  // document (the About tab's two keys share one seat).
  useEffect(() => {
    setPage(isGate ? 'cards' : doc);
    setConfirmingDecline(false);
  }, [variant, doc]);

  const activeDoc = page === 'tos' || page === 'privacy' ? DOC_BY_KEY[page] : null;
  // 1.5.7 — the window's own posture follows the page: the card face keeps
  // the compact 560px rail; a full document takes the roomier 680px — and
  // the modal's width tween turns the swap into the growth the report
  // asked for.
  // 1.5.8 — AND THE VERTICAL AXIS JOINS IT (the report's own words: "expand
  // the window vertically when opening them"): a document page also speaks
  // Modal's tallPosture at 72vh, so the frame grows DOWN and UP from its
  // centered seat with the same 0.2s tween the width rides — the growth
  // the About reader was born with, spoken at startup at last. The cards
  // face keeps its compact natural height.
  const gateWidth = page === 'cards' ? 'w-[560px]' : 'w-[680px]';
  const readerTall = page === 'cards' ? null : Math.round((typeof window !== 'undefined' ? window.innerHeight : 720) * 0.72);

  // ---- THE GATE -----------------------------------------------------------
  if (isGate) {
    return (
      <Modal
        title={`TERMS & PRIVACY · V${TOS_VERSION}`}
        onClose={onAccept}
        closeLocked
        hideClose
        width={gateWidth}
        /* 1.5.7 — the page-follow scroll reset: each arriving page starts
           at the top of its own column. */
        scrollResetKey={page}
        /* 1.5.8 — the reader's tall seat (see readerTall above). */
        tallPosture={readerTall}
        footer={
          confirmingDecline ? (
            <div className="w-full">
              <div className="gd-legal-decline-note">
                Declining closes Burrito GenDex. Nothing is deleted or changed on your disk; your library
                stays exactly where it is, and the app will ask again the next time it opens.
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button className="gd-btn" onClick={() => setConfirmingDecline(false)} title="Back to the terms window">
                  KEEP USING
                </button>
                <button className="gd-btn gd-btn-danger" onClick={onDecline} title="Close the app now; the terms will be asked again next launch">
                  DECLINE & CLOSE
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center gap-2">
              <button
                className="gd-btn"
                onClick={() => setConfirmingDecline(true)}
                title="Decline the terms: the app closes (it will ask again next launch)"
              >
                DECLINE
              </button>
              <div className="flex-1" />
              {page !== 'cards' && (
                <button className="gd-btn" onClick={() => setPage('cards')} title="Back to the overview">
                  <span className="inline-flex items-center gap-1.5">
                    <ChevronLeft size={13} />
                    BACK
                  </span>
                </button>
              )}
              {/* 1.5.8 — THE ACCEPT KEY STEPS ASIDE WHILE READING ("dont show
                  me the accept button when im reading one of them"): the
                  acknowledgment is a verdict about the DOCUMENTS, and the
                  front face is where that verdict lives — a reader
                  mid-scroll needs its foot for navigation only. The key
                  returns the moment the page comes home. */}
              {page === 'cards' && (
                <button
                  className="gd-btn gd-btn-solid"
                  onClick={onAccept}
                  title={`Accept the Terms of Service and Data Privacy Notice (v${TOS_VERSION}) and continue`}
                >
                  ACKNOWLEDGE &amp; ACCEPT
                </button>
              )}
            </div>
          )
        }
      >
        {page === 'cards' ? (
          <div key="cards" className="gd-legal-page">
            <div className="gd-legal-gate">
              {/* The headline speaks the crossing honestly: this is an
                  UPDATE notice for existing libraries (every pre-1.5.5
                  archive), and a first-day notice for fresh installs. */}
              <div className="gd-legal-head">
                The Terms of Service and the Data Privacy Notice have been <b>added / updated</b> (v{TOS_VERSION}).
                Please review them; you can read each one by pressing its card. Then acknowledge to continue
                using {APP.name}. Your library is untouched either way.
              </div>
              <div className="gd-legal-cards">
                <LegalDocCard
                  icon={<ScrollText size={20} />}
                  label="TERMS OF SERVICE"
                  version={TOS_DOC.version}
                  hint="UPDATED"
                  onOpen={() => setPage('tos')}
                />
                <LegalDocCard
                  icon={<ShieldCheck size={20} />}
                  label="DATA PRIVACY NOTICE"
                  version={PRIVACY_DOC.version}
                  hint="UPDATED"
                  onOpen={() => setPage('privacy')}
                />
              </div>
              <div className="gd-legal-sum">
                The short version: everything you make stays on your machine (no accounts, no telemetry, no
                uploads). The only network requests are an optional update check (switchable off) and links you
                open yourself.
              </div>
            </div>
          </div>
        ) : (
          <div key={page} className="gd-legal-page">
            <LegalDocBody doc={activeDoc} />
          </div>
        )}
      </Modal>
    );
  }

  // ---- THE READER (About → LEGAL) -----------------------------------------
  const viewDoc = DOC_BY_KEY[doc] || TOS_DOC;
  return (
    <Modal title={viewDoc.title} onClose={onClose} width="w-[680px]" bodyClassName="pt-0"
      footer={
        <div className="flex justify-end gap-2">
          <button className="gd-btn gd-btn-solid" onClick={onClose}>
            CLOSE
          </button>
        </div>
      }
    >
      <div className="gd-legal-page">
        <LegalDocBody doc={viewDoc} />
      </div>
    </Modal>
  );
}
