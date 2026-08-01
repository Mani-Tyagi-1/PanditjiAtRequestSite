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

/**
 * Selectable Banke Bihari package cards, shared by the detail page and the
 * booking page so both show an identical, easy-to-scan comparison.
 *
 * Each card is a SUMMARY plus an on-demand detail panel, and the two never say
 * the same thing twice — that duplication is what made an earlier version of
 * this card a wall of text. The split:
 *
 *   • base tier   — summary lists the core seva; the panel adds only the
 *                   Sankalp allowance and the prasad-box contents.
 *   • higher tiers — summary is an "Everything in <cheaper tier>" chip plus the
 *                   two or three lines this tier adds; the panel is where that
 *                   chip gets unpacked into the full inherited list.
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

    return (
        <div className="space-y-2.5">
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
    const core = packageCore(pkg);
    const allOfferings = packageOfferings(pkg);

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
                    <div className="text-right shrink-0">
                        <p className="text-[18px] font-extrabold leading-none text-[#D63D72]">
                            ₹{pkg.price.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[8px] uppercase tracking-wide mt-0.5 text-[#8A8A8A]">one-time</p>
                    </div>
                </div>

                {/* Every card spells out its own contents in full. An
                    "Everything in <cheaper tier>" chip was shorter, but it made
                    the reader hold the ₹1100 card in their head to understand
                    the ₹11000 one — and it forced a second block lower down just
                    to explain what the chip stood for. Offerings are therefore
                    CUMULATIVE here, not just this tier's additions: with no chip
                    implying inheritance, listing only the new ones would read as
                    the higher tier dropping the cheaper tier's offerings. */}
                <div className={`mt-2 pt-2 border-t space-y-1 ${selected ? "border-[#F8B5CB]" : "border-[#F4DFC2]"}`}>
                    {core.map((c) => (
                        <Line key={c}>{c}</Line>
                    ))}
                    {pkg.freeFamilyMembers > 0 && (
                        <Line icon={<Users className="w-3.5 h-3.5 shrink-0 mt-px text-[#2E8B57]" />}>
                            <b className="text-[#5C1A34]">
                                {pkg.freeFamilyMembers} family Sankalp
                                {pkg.freeFamilyMembers > 1 ? "s" : ""} free
                            </b>{" "}
                            in total
                        </Line>
                    )}
                </div>

                {/* Offerings as pictures, not a comma list — seven item names in
                    a row is exactly what made the ₹11000 card unreadable. */}
                {allOfferings.length > 0 && (
                    <div className="mt-2">
                        <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wide text-[#D63D72] mb-1.5">
                            <Sparkles className="w-3 h-3 text-[#E7B63A]" />
                            Offered to Bihari Ji in your name
                        </p>
                        <ItemTileRow items={allOfferings} tone="pink" />
                    </div>
                )}
            </button>

            {/* ── Prasad box, decided right here ── */}
            <div className="px-3 pb-2">
                {freeBox ? (
                    <p className="flex items-center gap-1.5 rounded-xl bg-[#EDF9F0] border border-[#A7D8B6] px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-[#1F7A50]">
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
                        className={`w-full flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#D63D72] cursor-pointer transition-colors ${
                            boxOn
                                ? "border-[#D63D72] bg-white"
                                : "border-dashed border-[#E0CDB4] bg-[#FFF8F0] hover:border-[#F8A9C4]"
                        }`}
                    >
                        <span
                            className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
                                boxOn ? "border-[#D63D72] bg-[#D63D72]" : "border-[#E0CDB4] bg-white"
                            }`}
                        >
                            {boxOn ? (
                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                            ) : (
                                <Plus className="w-2.5 h-2.5 text-[#8A5A12]" strokeWidth={3} />
                            )}
                        </span>
                        <span className="flex-1 min-w-0 text-[11px] font-semibold leading-snug text-[#5C1A34]">
                            {boxOn ? "Prasad Box added" : "Add Prasad Box"}
                            <span className="font-normal text-[#8A8A8A]"> · optional</span>
                        </span>
                        <span className={`shrink-0 text-[11.5px] font-bold ${boxOn ? "text-[#D63D72]" : "text-[#8A5A12]"}`}>
                            +₹{PRASAD_BOX_PRICE}
                        </span>
                    </button>
                )}
            </div>

            {/* ── Detail disclosure ── independent of selection, so choosing a
                package never dumps a long panel onto the page unasked. */}
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-expanded={open}
                className={`w-full flex items-center justify-center gap-1 pb-2.5 text-[10.5px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#D63D72] rounded-b-2xl cursor-pointer ${
                    open ? "text-[#D63D72]" : "text-[#8A8A8A] hover:text-[#D63D72]"
                }`}
            >
                {open ? "Hide box contents" : "See what's in the box"}
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

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
                                title={freeBox ? `${freeBox.name} — free` : `Prasad Box — optional, ₹${PRASAD_BOX_PRICE}`}
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

