import { BadgeCheck, Star, MapPin, Languages, BookOpen, Award, CheckCircle } from "lucide-react";

interface PanditProfile {
  name: string;
  photo: string;
  specialization: string;
  experience: number;
  education: string;
  certification: string;
  ceremoniesCount: number;
  languages: string[];
  cities: string[];
  badge: string;
}

const SPECIALISTS: Record<string, PanditProfile> = {
  "death-rituals": {
    name: "Pandit Acharya Gireesh Shastri",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=top",
    specialization: "Specialist in Pitra Shanti, Garuda Purana Katha & Shradh",
    experience: 20,
    education: "Kashi Sanskrit Gurukul Vidyapeeth",
    certification: "Preta Karma & Pitra Tarpan Acharya",
    ceremoniesCount: 1200,
    languages: ["Sanskrit", "Hindi"],
    cities: ["Kashi", "Haridwar", "Prayagraj", "Delhi"],
    badge: "Senior Pitra Karma Acharya",
  },
  "griha-pravesh": {
    name: "Pandit Rajesh Shastri",
    photo: "https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?w=400&h=400&fit=crop&crop=top",
    specialization: "Specialist in Vastu Shanti & Griha Pravesh",
    experience: 14,
    education: "Sampurnanand Sanskrit University, Varanasi",
    certification: "Jyotishacharya & Vastu Specialist Certified",
    ceremoniesCount: 650,
    languages: ["Sanskrit", "Hindi", "English"],
    cities: ["Delhi", "Noida", "Gurgaon"],
    badge: "Senior Griha Pravesh Specialist",
  },
  "rudrabhishek": {
    name: "Pandit Dinesh Dwivedi",
    photo: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&h=400&fit=crop&crop=top",
    specialization: "Specialist in Rudrabhishek, Havan & Shiv Aradhana",
    experience: 12,
    education: "Haridwar Gurukul Vidyapeeth",
    certification: "Karmakand Bhushan Certified",
    ceremoniesCount: 480,
    languages: ["Sanskrit", "Hindi"],
    cities: ["Mumbai", "Pune", "Delhi", "Gurgaon"],
    badge: "Rudrabhishek & Shiv Kripa Vidhi Specialist",
  },
  "satyanarayan": {
    name: "Pandit Ramakant Tiwari",
    photo: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop&crop=top",
    specialization: "Specialist in Shri Satyanarayan Katha & Ganesha Puja",
    experience: 16,
    education: "Lal Bahadur Shastri National Sanskrit Vidyapeetha, Delhi",
    certification: "Jyotish & Vedic Rituals Gold Medalist",
    ceremoniesCount: 820,
    languages: ["Sanskrit", "Hindi", "Punjabi"],
    cities: ["Chandigarh", "Mohali", "Panchkula", "Delhi"],
    badge: "Satyanarayan Katha Specialist",
  },
};

const DEFAULT_SPECIALIST: PanditProfile = {
  name: "Pandit Rajesh Shastri",
  photo: "https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?w=400&h=400&fit=crop&crop=top",
  specialization: "Specialist in Vedic Rituals, Havan & Shanti Path",
  experience: 12,
  education: "Gurukul Trained & Sanskrit University Varanasi Graduate",
  certification: "Jyotishacharya Certified",
  ceremoniesCount: 520,
  languages: ["Sanskrit", "Hindi", "English"],
  cities: ["Delhi", "Noida", "Gurgaon", "Mumbai", "Chandigarh"],
  badge: "Vedic Ritual Specialist",
};

interface PanditProfileCardProps {
  pujaId?: string;
  pujaName?: string;
}

export function PanditProfileCard({ pujaId, pujaName }: PanditProfileCardProps) {
  let spec = DEFAULT_SPECIALIST;
  const normalizedName = (pujaName || "").toLowerCase();

  if (pujaId === "death-rituals" || normalizedName.includes("death") || normalizedName.includes("pitra") || normalizedName.includes("antyesti") || normalizedName.includes("garud")) {
    spec = SPECIALISTS["death-rituals"];
  } else if (normalizedName.includes("pravesh") || normalizedName.includes("vastu") || normalizedName.includes("home entering")) {
    spec = SPECIALISTS["griha-pravesh"];
  } else if (normalizedName.includes("rudra") || normalizedName.includes("abhishek") || normalizedName.includes("shiva")) {
    spec = SPECIALISTS["rudrabhishek"];
  } else if (normalizedName.includes("satya") || normalizedName.includes("katha") || normalizedName.includes("narayan")) {
    spec = SPECIALISTS["satyanarayan"];
  }

  return (
    <div className="bg-white rounded-3xl border border-orange-100 p-4 shadow-sm space-y-4 relative overflow-hidden my-4 max-w-sm mx-auto">
      {/* Specialist tag badge */}
      <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-red-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-2xl uppercase tracking-wider">
        Specialist Assigned
      </div>

      <div className="flex items-start gap-4 pt-2">
        {/* Avatar */}
        <div className="relative w-16 h-16 rounded-full border-2 border-orange-100 overflow-hidden shrink-0 shadow-sm bg-orange-50 flex items-center justify-center">
          <img src={spec.photo} alt={spec.name} className="w-full h-full object-cover object-top" />
          <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow">
            <BadgeCheck className="w-3.5 h-3.5 text-orange-600 fill-orange-50" />
          </div>
        </div>

        {/* Name & Title */}
        <div className="flex-1 min-w-0 pr-12">
          <h3 className="font-bold text-stone-800 text-base leading-tight truncate">
            {spec.name}
          </h3>
          <p className="text-[11px] text-orange-600 font-semibold mt-0.5 leading-snug">
            {spec.badge}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex items-center text-amber-500 text-[11px] font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
              4.9
            </div>
            <span className="text-stone-300 text-xs">|</span>
            <span className="text-[10px] text-stone-500 font-semibold bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
              {spec.experience}+ Yrs Exp
            </span>
          </div>
        </div>
      </div>

      {/* Description / Credentials */}
      <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100 space-y-2">
        <p className="text-[11.5px] text-stone-700 font-medium leading-relaxed italic">
          "{spec.specialization}"
        </p>

        <div className="h-px bg-stone-200/50" />

        <div className="space-y-1.5">
          <div className="flex items-start gap-2 text-[10.5px] text-stone-600">
            <BookOpen className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
            <span>
              <strong>Gurukul:</strong> {spec.education}
            </span>
          </div>

          <div className="flex items-start gap-2 text-[10.5px] text-stone-600">
            <Award className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
            <span>
              <strong>Credentials:</strong> {spec.certification}
            </span>
          </div>

          <div className="flex items-start gap-2 text-[10.5px] text-stone-600">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
            <span>
              <strong>Ceremonies Done:</strong> {spec.ceremoniesCount}+ Times Checked & Approved
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] font-semibold text-stone-500 px-1 pt-1 border-t border-stone-100">
        <div className="flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5 text-stone-400" />
          <span>{spec.languages.join(", ")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-stone-400" />
          <span className="truncate max-w-[120px]">{spec.cities.join(", ")}</span>
        </div>
      </div>
    </div>
  );
}