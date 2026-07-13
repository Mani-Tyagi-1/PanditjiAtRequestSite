import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

/** Shared inline section header: bold title · orange icon · divider · subtitle · optional "View All". */
export default function SectionHeader({
    title,
    icon: Icon,
    subtitle,
    onViewAll,
}: {
    title: string;
    icon: LucideIcon;
    subtitle?: string;
    onViewAll?: () => void;
}) {
    return (
        <div className="flex items-center gap-2 md:gap-3">
            <h2 className="text-[22px] font-bold text-stone-900 shrink-0 md:text-3xl lg:text-4xl md:tracking-tight">{title}</h2>
            <Icon className="w-5 h-5 text-orange-500 shrink-0 md:w-6 md:h-6" />
            <span className="h-px w-6 bg-orange-300 shrink-0 md:w-10" />
            {subtitle && (
                <span className="text-[12.5px] text-stone-500 font-medium truncate md:text-sm">{subtitle}</span>
            )}
            {onViewAll && (
                <button
                    onClick={onViewAll}
                    className="ml-auto flex items-center gap-0.5 text-[14px] font-bold text-orange-600 active:scale-95 transition-transform shrink-0 cursor-pointer md:text-[15px] md:transition-all md:hover:text-orange-700"
                >
                    View All <ChevronRight className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
