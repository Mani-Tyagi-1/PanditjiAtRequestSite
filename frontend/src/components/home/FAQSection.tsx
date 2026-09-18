import { useState } from "react";
import { HelpCircle, ChevronUp, ChevronDown } from "lucide-react";
import SectionHeader from "./SectionHeader";

interface FAQ {
    id: number;
    question: string;
    answer: string;
}

const FAQS: FAQ[] = [
    {
        id: 1,
        question: "Will the priest bring the materials if I have booked an offline priest?",
        answer: "Yes, the priest will bring the materials when booked offline."
    },
    {
        id: 2,
        question: "Do you provide puja samagri (materials) along with the priest?",
        answer: "Yes. If your booking includes samagri, our team will arrange it and the priest will bring it."
    },
    {
        id: 3,
        question: "What are the payment options available?",
        answer: "We accept various payment methods including UPI, credit/debit cards, net banking, and cash on delivery."
    },
    {
        id: 4,
        question: "How much advance notice is required for booking?",
        answer: "We recommend booking at least 24-48 hours in advance to ensure availability of priests and materials."
    },
    {
        id: 5,
        question: "Can I reschedule my booking?",
        answer: "Yes, you can reschedule your booking up to 6 hours before the scheduled time without any additional charges."
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
                            key={faq.id}
                            className="bg-white border border-orange-100 rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(255,109,4,0.02)] transition-all duration-200"
                        >
                            <button
                                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                className="w-full flex items-center justify-between text-left px-5 py-4.5 active:bg-orange-50/20 transition-colors"
                            >
                                <span className="text-[13.5px] font-bold text-stone-800 leading-snug">
                                    {faq.question}
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
                                        {faq.answer}
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
