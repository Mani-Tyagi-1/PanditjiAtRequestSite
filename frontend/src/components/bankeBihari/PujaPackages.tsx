import { useState } from "react";
import { Check, Gift, Users, Sparkles, PackageOpen, ChevronDown, Plus } from "lucide-react";
import {
    BANKE_BIHARI_PACKAGES,
    PRASAD_BOXES,
    PRASAD_BOX_PRICE,
    packageCore,
    packageOfferings,
    prasadBoxContents,
    type PujaPackage,
    type PujaPackageId,
} from "../../data/bankeBihariPuja";
import { ItemTileRow } from "./ItemTiles";
import { shipsPrasad, useMoney } from "../../utils/currency";

/**
 * Selectable Banke Bihari package cards, shared by the detail page and the
 * booking page so both show an identical, easy-to-scan comparison.
 *
 * Each card is a SUMMARY plus an on-demand detail panel, and the two never say
 * the same thing twice — that duplication is what made an earlier version of
 * this card a wall of text.
 *
 * The same rule now applies ACROSS the cards: anything true of all four is
 * stated once above them and never repeated inside one. A card therefore
 * carries only what makes it different from the card below it — its offerings,
 * its Sankalp allowance and its prasad box.
 *
 * Only one panel is open at a time (`openId` lives in the parent), so the four
 * cards stay scannable on a phone instead of unrolling into a long column.
 *
 * The prasad box is chosen INSIDE the card rather than in a section below it,
 * so the package and its box are one decision in one place. That means the card
 * can't be a single <button> — a nested button is invalid HTML and swallows the
 * inner control's accessible name — so selection, the prasad toggle and the
 * detail disclosure are three sibling buttons sharing one bordered wrapper.
 */
/**
 * DOM id of the card list, so the page can scroll the first package card to the
 * top. Exported rather than typed out in both files, because a scroll target
 * that silently stops matching just quietly does nothing.
 */
export const PACKAGE_CARDS_ANCHOR_ID = "package-cards";

export default function PujaPackages({
    selectedId,
    onSelect,
    prasadBoxAdded,
    onTogglePrasadBox,
}: {
    selectedId: PujaPackageId;
    onSelect: (id: PujaPackageId) => void;
    prasadBoxAdded: boolean;
    onTogglePrasadBox: (next: boolean) => void;
}) {
    // Starts on the pre-selected package, so the recommended seva arrives with
    // its details already showing rather than as a closed box.
    const [openId, setOpenId] = useState<PujaPackageId | null>(selectedId);

    /**
     * Choosing a package also opens its details, and closes whichever card was
     * open before — picking a seva and reading what it contains are the same
     * intent, so it shouldn't take two taps. Tapping the already-open card
     * collapses it again, which is the only way back to a compact list.
     */
    const choose = (id: PujaPackageId) => {
        onSelect(id);
        setOpenId((cur) => (cur === id ? null : id));
    };

    // Identical in all four packages, so it is stated here instead of on every
    // card: repeated per card it was twelve identical lines inside a four-card
    // list — the largest block of text on the page — and it padded each card
    // with promises that could never help anyone choose between them.
    const sharedCore = packageCore(BANKE_BIHARI_PACKAGES[0]);

    return (
        <div className="space-y-2.5">
            <div className="rounded-2xl border border-[#F4DFC2] bg-[#FFF8F0] px-3 py-2.5">
                <p className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wide text-[#D63D72]">
                    <Sparkles className="w-3 h-3 text-[#E7B63A]" />
                    In every seva
                </p>
                <div className="space-y-1">
                    {sharedCore.map((c) => (
                        <Line key={c}>{c}</Line>
                    ))}
                </div>
            </div>

            {/* Scroll anchor. The page's one-time autoscroll parks the FIRST
                CARD under the header, not the section heading — so it needs a
                handle on the cards alone, below the "In every seva" strip. */}
            <div id={PACKAGE_CARDS_ANCHOR_ID} className="space-y-2.5">
                {BANKE_BIHARI_PACKAGES.map((pkg) => (
                    <PackageCard
                        key={pkg.id}
                        pkg={pkg}
                        selected={pkg.id === selectedId}
                        open={openId === pkg.id}
                        onOpenChange={(next) => setOpenId(next ? pkg.id : null)}
                        onChoose={choose}
                        onSelect={onSelect}
                        prasadBoxAdded={prasadBoxAdded}
                        onTogglePrasadBox={onTogglePrasadBox}
                    />
                ))}
            </div>
        </div>
    );
}

function PackageCard({
    pkg,
    selected,
    open,
    onOpenChange,
    onChoose,
    onSelect,
    prasadBoxAdded,
    onTogglePrasadBox,
}: {
    pkg: PujaPackage;
    selected: boolean;
    open: boolean;
    onOpenChange: (next: boolean) => void;
    /** Pick this package AND reveal its details — the card's main tap. */
    onChoose: (id: PujaPackageId) => void;
    /** Pick it without touching the panel — used by the prasad-box toggle. */
    onSelect: (id: PujaPackageId) => void;
    prasadBoxAdded: boolean;
    onTogglePrasadBox: (next: boolean) => void;
}) {
    const freeBox = pkg.freePrasadBox ? PRASAD_BOXES[pkg.freePrasadBox] : null;
    const allOfferings = packageOfferings(pkg);
    // Prices stay INR in the data layer; only what is drawn changes.
    const { country, money } = useMoney();
    // Blessed prasad is couriered within India only — see `shipsPrasad`. Both
    // the toggle and the "what's in the box" disclosure come off the card
    // abroad: the disclosure has nothing left to disclose once the parcel is
    // not on offer, and a card that still pictures it is selling a promise the
    // checkout will not keep.
    const prasadShippable = shipsPrasad(country);

    // The box add-on only ever reflects THIS card when it is the chosen one —
    // an unticked box on the other three is the honest state, since adding it
    // there means switching package too.
    const boxOn = selected && prasadBoxAdded;

    return (
        <div
            className={`relative rounded-2xl border transition-all ${
                selected
                    ? "border-[#D63D72] bg-[#FFF1F5] ring-1 ring-[#F8B5CB] shadow-md"
                    : "border-[#F4DFC2] bg-white shadow-sm hover:border-[#F8A9C4]"
            }`}
        >
            {/* Corner badge (Most Popular / Best Value) */}
            {pkg.badge && (
                <span className="absolute -top-2 left-3 z-10 rounded-full bg-gradient-to-r from-[#D63D72] to-[#E7B63A] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                    {pkg.badge}
                </span>
            )}

            {/* ── Selection: header + the short summary ── */}
            <button
                type="button"
                onClick={() => onChoose(pkg.id)}
                aria-pressed={selected}
                aria-expanded={open}
                className="w-full text-left rounded-2xl px-3 pt-3.5 pb-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#D63D72] cursor-pointer active:scale-[0.995] transition-transform"
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                        <span
                            className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                selected ? "border-[#D63D72] bg-[#D63D72]" : "border-[#E0CDB4]"
                            }`}
                        >
                            {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                        </span>
                        <div className="min-w-0">
                            <p className="text-[14px] font-bold leading-tight text-[#5C1A34]">{pkg.name}</p>
                            <p className="text-[10.5px] leading-tight mt-0.5 text-[#7A3E55]">{pkg.tagline}</p>
                        </div>
                    </div>
                    <p className="shrink-0 text-[18px] font-extrabold leading-none text-[#D63D72]">
                        {money(pkg.price)}
                    </p>
                </div>

                {/* What this tier adds over the one below it — the only reason
                    to read a card at all, now that the core seva is stated once
                    above the list.

                    Offerings are CUMULATIVE, not just this tier's additions:
                    there is no "Everything in <cheaper tier>" chip implying
                    inheritance, so listing only the new ones would read as the
                    higher tier dropping the cheaper tier's offerings. Pictures,
                    not a comma list — seven item names in a row is exactly what
                    made the ₹11000 card unreadable. */}
                <div className={`mt-2 pt-2 border-t ${selected ? "border-[#F8B5CB]" : "border-[#F4DFC2]"}`}>
                    {pkg.freeFamilyMembers > 0 && (
                        <Line icon={<Users className="w-3.5 h-3.5 shrink-0 mt-px text-[#2E8B57]" />}>
                            <b className="text-[#5C1A34]">
                                {pkg.freeFamilyMembers} family Sankalp
                                {pkg.freeFamilyMembers > 1 ? "s" : ""} free
                            </b>
                        </Line>
                    )}
                    {allOfferings.length > 0 && (
                        <div className={pkg.freeFamilyMembers > 0 ? "mt-2" : ""}>
                            <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wide text-[#D63D72] mb-1.5">
                                <Sparkles className="w-3 h-3 text-[#E7B63A]" />
                                Offered in your name
                            </p>
                            <ItemTileRow items={allOfferings} tone="pink" />
                        </div>
                    )}
                </div>
            </button>

            {prasadShippable && (<>
            {/* ── Prasad box, decided right here ── with the detail disclosure
                sitting at its right edge, so the box and "what's in it" are one
                row instead of two. They are SIBLINGS, never nested: the paid
                variant is itself a <button>, and a button inside a button is
                invalid HTML that swallows the inner control's accessible name. */}
            <div className="px-3 pb-3 flex items-center gap-2">
                {freeBox ? (
                    <p className="flex-1 min-w-0 flex items-center gap-1.5 rounded-xl bg-[#EDF9F0] border border-[#A7D8B6] px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-[#1F7A50]">
                        <Gift className="w-3.5 h-3.5 shrink-0 text-[#2E8B57]" />
                        <span>
                            <b>FREE {freeBox.name}</b> couriered home
                        </span>
                    </p>
                ) : (
                    // Tapping this on an unselected card picks the package too —
                    // otherwise the tick would apply to whichever card happened
                    // to be selected, silently pricing the wrong package.
                    <button
                        type="button"
                        onClick={() => {
                            if (!selected) onSelect(pkg.id);
                            onTogglePrasadBox(!boxOn);
                        }}
                        aria-pressed={boxOn}
                        // Gold and solid when unticked, NOT the dashed sand
                        // outline it used to wear. A dashed border on a cream
                        // card is the visual language of a placeholder or a
                        // disabled field — precisely the wrong signal for the
                        // one optional thing on this page we want noticed.
                        className={`relative flex-1 min-w-0 flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#D63D72] cursor-pointer transition-colors ${
                            boxOn
                                ? "border-[#D63D72] bg-white"
                                : "border-[#E7B63A] bg-gradient-to-r from-[#FFF6E3] to-[#FFEAD0] shadow-[0_2px_10px_rgba(231,182,58,.28)] hover:border-[#D63D72]"
                        }`}
                    >
                        {/* A slow breathing ring, and ONLY on the selected card:
                            every package without a free box would otherwise
                            pulse at once, which reads as a page-wide error
                            state rather than a suggestion. Stops for anyone who
                            has asked for reduced motion. */}
                        {selected && !boxOn && (
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute -inset-px rounded-xl ring-2 ring-[#E7B63A]/50 animate-pulse motion-reduce:animate-none"
                            />
                        )}
                        <span
                            className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
                                boxOn ? "border-[#D63D72] bg-[#D63D72]" : "border-[#E7B63A] bg-[#F7C547]"
                            }`}
                        >
                            {boxOn ? (
                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                            ) : (
                                <Plus className="w-2.5 h-2.5 text-[#5A3600]" strokeWidth={3.5} />
                            )}
                        </span>
                        <span className="flex-1 min-w-0 text-[11px] font-bold leading-snug text-[#5C1A34]">
                            {boxOn ? "Prasad Box added" : "Add Prasad Box"}
                            <span className={`font-normal ${boxOn ? "text-[#8A8A8A]" : "text-[#8A5A12]"}`}>
                                {" "}
                                · couriered home
                            </span>
                        </span>
                        {boxOn ? (
                            <span className="shrink-0 text-[11.5px] font-bold text-[#D63D72]">
                                +{money(PRASAD_BOX_PRICE)}
                            </span>
                        ) : (
                            // A filled chip, not loose text — it has to look like
                            // the price OF something addable, not a surcharge.
                            <span className="shrink-0 rounded-full bg-[#F7C547] px-2 py-0.5 text-[11px] font-extrabold text-[#5A3600]">
                                +{money(PRASAD_BOX_PRICE)}
                            </span>
                        )}
                    </button>
                )}

                {/* Detail disclosure — independent of selection, so choosing a
                    package never dumps a long panel onto the page unasked.

                    A bare chevron: the label it used to carry ("See what's in
                    the box" / "Hide box contents") was a line of copy on every
                    one of the four cards saying what the arrow already says. The
                    aria-label keeps it announced properly, since a screen reader
                    cannot read a rotation. */}
                <button
                    type="button"
                    onClick={() => onOpenChange(!open)}
                    aria-expanded={open}
                    aria-label={open ? "Hide box contents" : `See what's in the ${freeBox ? freeBox.name : "Prasad Box"}`}
                    className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#D63D72] cursor-pointer ${
                        open
                            ? "border-[#F8B5CB] bg-[#FFF1F5] text-[#D63D72]"
                            : "border-[#F4DFC2] bg-white text-[#8A8A8A] hover:border-[#F8A9C4] hover:text-[#D63D72]"
                    }`}
                >
                    <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
            </div>

            {/* grid-rows 0fr→1fr animates the height without measuring; the inner
                wrapper clips the overflow. */}
            <div
                className={`grid transition-all duration-300 ease-out ${
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
            >
                <div className="overflow-hidden">
                    <div className="px-3 pb-3">
                        {/* Box contents only. The Sankalp allowance is already a
                            summary line above, and the ₹151-per-extra-name rule
                            is stated once under the whole package list — saying
                            either again here was pure repetition. */}
                        <div className="pt-2.5 border-t border-[#F8B5CB]">
                            <Block
                                title={freeBox ? `${freeBox.name} — free` : `Prasad Box — ${money(PRASAD_BOX_PRICE)}`}
                            >
                                <ItemTileRow
                                    items={prasadBoxContents(freeBox ? freeBox.tier : "standard")}
                                    tone={freeBox ? "green" : "sand"}
                                />
                            </Block>
                        </div>
                    </div>
                </div>
            </div>
            </>)}
        </div>
    );
}

/** A green-ticked line — the page's standard "you get this" row. */
function Line({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-1.5">
            {icon ?? <Check className="w-3.5 h-3.5 shrink-0 mt-px text-[#2E8B57]" strokeWidth={3} />}
            <span className="text-[11.5px] leading-snug text-[#555555]">{children}</span>
        </div>
    );
}

/** A small titled group inside the detail panel. */
function Block({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wide text-[#D63D72] mb-1">
                <PackageOpen className="w-3 h-3 text-[#E7B63A]" />
                {title}
            </p>
            <div className="space-y-1">{children}</div>
        </div>
    );
}

