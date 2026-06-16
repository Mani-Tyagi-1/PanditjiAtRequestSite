import { useState } from "react";
import { HelpCircle, ChevronUp, ChevronDown } from "lucide-react";
import SectionHeader from "./SectionHeader";

interface FAQ {
    q: string;
    a: string;
}

const FAQS: FAQ[] = [
    {
        q: "How do I book a pandit or pooja?",
        a: "Booking is simple! Select your desired Pooja category, select the date, time, and mode (online/offline), and complete your booking. A verified Pandit Ji will be assigned for your ritual."
    },
    {
        q: "How are pandits verified on the platform?",
        a: "Yes, all Pandit Jis on our platform are verified, certified from recognized Vedic Gurukuls, and possess 5+ years of ritual experience. We do detailed background checks before onboarding them."
    },
    {
        q: "Can I customise my pooja as per my needs?",
        a: "Absolutely! We understand your unique ritual requirements. You can add specific additions, specify names & gotra, or write direct requirements when making a booking."
    },
    {
        q: "What if I need to reschedule or cancel my booking?",
        a: "You can easily reschedule or cancel your Pooja booking from your 'My Bookings' tab, or reach out to our 24/7 customer support for assistance."
    }
];

export default function FAQSection() {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    return (
        <section className="px-4 pt-6">
            <SectionHeader 
                title="Frequently Asked Questions" 
                icon={HelpCircle} 
                subtitle="Have queries? We have answers" 
            />

            <div className="mt-3 space-y-3">
                {FAQS.map((faq, index) => {
                    const isExpanded = expandedIndex === index;
                    return (
                        <div 
                            key={index} 
                            className="bg-white border border-orange-100 rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(255,109,4,0.02)] transition-all duration-200"
                        >
                            <button
                                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                className="w-full flex items-center justify-between text-left px-5 py-4.5 active:bg-orange-50/20 transition-colors"
                            >
                                <span className="text-[13.5px] font-bold text-stone-800 leading-snug">
                                    {faq.q}
                                </span>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-stone-500 shrink-0 ml-2" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-stone-500 shrink-0 ml-2" />
                                )}
                            </button>
                            
                            {isExpanded && (
                                <div className="px-5 pb-4.5 pt-0 border-t border-orange-50/20">
                                    <p className="text-[12.5px] text-stone-500 leading-relaxed mt-2.5">
                                        {faq.a}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
