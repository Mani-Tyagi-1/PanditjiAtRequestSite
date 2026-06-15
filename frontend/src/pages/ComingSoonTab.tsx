import { Helmet } from "react-helmet-async";

/**
 * Lightweight placeholder for tab screens not built yet, so the bottom-nav
 * shell is fully navigable. Each tab will be replaced with its real screen.
 */
export default function ComingSoonTab({ title, emoji = "🛕" }: { title: string; emoji?: string }) {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-8">
            <Helmet>
                <title>{title} | Pandit Ji At Request</title>
            </Helmet>
            <span className="text-5xl">{emoji}</span>
            <h1 className="mt-4 text-xl font-bold text-stone-800">{title}</h1>
            <p className="mt-2 text-[13px] text-stone-500 max-w-[260px]">
                This screen is coming soon. We're crafting it to match your new app experience.
            </p>
        </div>
    );
}
