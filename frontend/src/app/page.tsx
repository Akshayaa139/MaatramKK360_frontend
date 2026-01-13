"use client";

import { useLanguage } from "@/app/providers";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  BookOpen,
  GraduationCap,
  ArrowRight,
  FileText,
  Phone,
  UserCheck,
  Calendar,
  CheckCircle,
  TrendingUp,
  MessageSquare,
} from "lucide-react";

export default function HomePage() {
  const { language, setLanguage } = useLanguage();

  const content = {
    en: {
      navHome: "Home",
      navWhatWeDo: "What We Do",
      navAdmissions: "Admissions",
      description:
        "A comprehensive selection and tutoring program designed to identify and nurture talented students from diverse backgrounds.",
      navNews: "News & Events",
      navGallery: "Gallery",
      navContact: "Contact Us",
      title: "Karpom Karpippom (KK) Program",
      heroTitleKK: "Karpom Karpippom",
      heroTitleEmpower: "Empowering Students",
      heroIntro: "KK begins with empowering students — providing access, guidance, and rigorous support so every learner can thrive. Our comprehensive selection and tutoring program identifies talent and nurtures it with care.",
      heroOfferBullets: [
        "Graded assignments",
        "Monthly tests",
        "Model exams",
        "Intensive revision sessions",
      ],
      heroOfferTitle: "To ensure strong results, we offer:",
      heroDevTitle: "Beyond Academics",
      heroDevBullets: [
        "Motivational talks by our alumni",
        "Career awareness sessions",
        "Life skills training",
        "Communication skill development",
        "One-on-one mentoring",
      ],
      heroSince: "Since 2020, we’ve supported",
      heroSinceTrail: "students across Tamil Nadu, with over",
      heroScholarTrail:
        "pursuing higher education through Maatram’s scholarship.",
      admissionsBannerTitle: "KK 2025 Admissions",
      admissionsBannerText: "KK Admissions open for the academic year 2025.",
      applyNow: "Apply Now",

      // Selection Process
      selectionProcess: "Selection Process",
      selectionProcessSubtitle: "4-Step Selection Process",
      step1: "Step 1: Application",
      step1Desc: "Fill out the application form with required documents",
      step2: "Step 2: Tele-verification",
      step2Desc: "Phone screening by our trained volunteers",
      step3: "Step 3: Panel Interview",
      step3Desc: "Online interview with our expert panel",
      step4: "Step 4: Final Selection",
      step4Desc: "Selected students join our program",

      // Features
      featuresTitle: "Why Choose KK Program?",
      feature1: "Free Quality Education",
      feature1Desc: "Comprehensive tutoring at no cost to deserving students",
      feature2: "Expert Tutors",
      feature2Desc:
        "Learn from experienced educators and subject matter experts",
      feature3: "Personalized Learning",
      feature3Desc: "Tailored study plans based on individual needs",
      feature4: "Career Guidance",
      feature4Desc: "Mentorship and career counseling support",

      // Requirements
      requirements: "Application Requirements",
      requirementsTitle: "Application Requirements",
      req1: "Students currently studying in Class 9-12",
      req2: "Family income below ₹5 lakhs per annum",
      req3: "Strong academic performance and dedication",
      req4: "Willingness to learn and grow",

      // Documents Required
      documentsTitle: "Required Documents",
      doc1: "Recent passport size photograph",
      doc2: "Latest marksheet",
      doc3: "Family income certificate",
      doc4: "Student ID proof (Aadhaar/School ID)",

      ctaTitle: "Ready to Transform Your Future?",
      ctaDesc: "Join hundreds of students who have benefited from our program",

      // Footer
      footerTitle: "Karpom Karpippom (KK) Program",
      footerDesc:
        "Empowering education through selection and personalized learning.",
      quickLinks: "Quick Links",
      faq: "FAQ",
      tutors: "Tutors",
      volunteers: "Volunteers",
      admin: "Admin",
      support: "Support",
      helpCenter: "Help Center",
      contact: "Contact Us",
    },
    ta: {
      navHome: "முகப்பு",
      navWhatWeDo: "நாங்கள் என்ன செய்கிறோம்",
      navAdmissions: "சேர்க்கை",
      description:
        "பல்வேறு பின்னணிகளைக் கொண்ட திறமையான மாணவர்களை அடையாளம் காணவும், வளர்க்கவும் வடிவமைக்கப்பட்ட விரிவான தேர்வு மற்றும் டியூட்டரிங் திட்டம்.",
      navNews: "செய்தி & நிகழ்வுகள்",
      navGallery: "கேலரி",
      navContact: "தொடர்பு",
      title: "கற்போம் கற்பிப்போம் (கே.கே) திட்டம்",
      heroTitleKK: "கற்போம் கற்பிப்போம்",
      heroTitleEmpower: "மாணவர்களை வலுப்படுத்துதல்",
      heroIntro: "கே.கே திட்டம் மாணவர்களை வலுப்படுத்துவதிலிருந்து தொடங்குகிறது — அணுகல், வழிகாட்டல் மற்றும் உறுதியான ஆதரவுடன் ஒவ்வொரு கற்றவரும் வளரத் தயாராக. எங்கள் விரிவான தேர்வு மற்றும் டியூட்டரிங் திட்டம் திறமையை அடையாளம் கண்டு பராமரிக்கிறது.",
      heroOfferBullets: [
        "தரமதிப்பிடப்பட்ட பணிகள்",
        "மாதாந்திர தேர்வுகள்",
        "மாதிரித் தேர்வுகள்",
        "தீவிர மறுபயிற்சி அமர்வுகள்",
      ],
      heroOfferTitle: "வலுவான முடிவுகளுக்காக, நாங்கள் வழங்குவது:",
      heroDevTitle: "கல்விக்கு அப்பால்",
      heroDevBullets: [
        "எங்கள் பழைய மாணவர்கள் வழங்கும் ஊக்கம் தரும் உரைகள்",
        "தொழில் விழிப்புணர்வு அமர்வுகள்",
        "வாழ்க்கைத் திறன் பயிற்சி",
        "தொடர்பு திறன் மேம்பாடு",
        "ஒருவருக்கு ஒருவர் வழிகாட்டுதல்",
      ],
      heroSince: "2020 முதல், நாங்கள் ",
      heroSinceTrail:
        "மாணவர்களுக்கு தமிழ்நாடு முழுவதும் ஆதரவு அளித்துள்ளோம்; மேலும்",
      heroScholarTrail:
        "மாணவர்கள் மாற்றத்தின் கல்வி உதவித்தொகையின் மூலம் உயர் கல்வியை தொடர்ந்து வருகின்றனர்.",
      admissionsBannerTitle: "கே.கே 2025 சேர்க்கை",
      admissionsBannerText:
        "கல்வி ஆண்டு 2025-க்கு கே.கே சேர்க்கை தொடங்கியுள்ளது.",
      applyNow: "இப்போதே விண்ணப்பிக்கவும்",

      // Selection Process
      selectionProcess: "தேர்வு செயல்முறை",
      selectionProcessSubtitle: "4 படிகள் தேர்வு செயல்முறை",
      step1: "படி 1: விண்ணப்பம்",
      step1Desc: "தேவையான ஆவணங்களுடன் விண்ணப்ப படிவத்தை நிரப்பவும்",
      step2: "படி 2: தொலைபேசி சரிபார்ப்பு",
      step2Desc: "எங்கள் பயிற்சி பெற்ற தன்னார்வலர்களால் தொலைபேசி திரையிடல்",
      step3: "படி 3: குழு நேர்காணல்",
      step3Desc: "எங்கள் நிபுணர் குழுவுடன் ஆன்லைன் நேர்காணல்",
      step4: "படி 4: இறுதி தேர்வு",
      step4Desc:
        "தேர்ந்தெடுக்கப்பட்ட மாணவர்கள் எங்கள் திட்டத்தில் சேர்கிறார்கள்",

      // Features
      featuresTitle: "கே.கே திட்டத்தை ஏன் தேர்வு செய்ய வேண்டும்?",
      feature1: "இலவச தரமான கல்வி",
      feature1Desc: "தகுதியான மாணவர்களுக்கு செலவில்லாமல் விரிவான டியூட்டரிங்",
      feature2: "நிபுணர் டியூட்டர்கள்",
      feature2Desc:
        "அனுபவமிக்க கல்வியாளர்கள் மற்றும் பாடத்திட்ட நிபுணர்களிடமிருந்து கற்றுக்கொள்ளுங்கள்",
      feature3: "தனிப்பயனாக்கப்பட்ட கற்றல்",
      feature3Desc:
        "தனிநபர் தேவைகளின் அடிப்படையில் தனிப்பயனாக்கப்பட்ட கற்றல் திட்டங்கள்",
      feature4: "வாழ்க்கை வழிகாட்டுதல்",
      feature4Desc: "மென்டார்ஷிப் மற்றும் வாழ்க்கை வழிகாட்டுதல் ஆதரவு",

      // Requirements
      requirements: "விண்ணப்ப தேவைகள்",
      requirementsTitle: "விண்ணப்ப தேவைகள்",
      req1: "தற்போது 9-12ஆம் வகுப்புகளில் படிக்கும் மாணவர்கள்",
      req2: "குடும்ப வருமானம் ஆண்டுக்கு ₹5 லட்சங்களுக்கும் குறைவாக",
      req3: "வலுவான கல்வி செயல்திறன் மற்றும் அர்ப்பணிப்பு",
      req4: "கற்றுக்கொள்ள விருப்பம் மற்றும் வளர விருப்பம்",

      // Documents Required
      documentsTitle: "தேவையான ஆவணங்கள்",
      doc1: "சமீபத்திய பாஸ்போர்ட் அளவு புகைப்படம்",
      doc2: "சமீபத்திய மதிப்பெண் பட்டியல்",
      doc3: "குடும்ப வருமான சான்றிதழ்",
      doc4: "மாணவர் அடையாள ஆதாரம் (ஆதார்/பள்ளி ஐடி)",

      ctaTitle: "உங்கள் எதிர்காலத்தை மாற்ற தயாரா?",
      ctaDesc:
        "எங்கள் திட்டத்திலிருந்து பயனடைந்த நூற்றுக்கணக்கான மாணவர்களில் சேரவும்",

      // Footer
      footerTitle: "கற்போம் கற்பிப்போம் (கே.கே) திட்டம்",
      footerDesc:
        "தேர்வு மற்றும் தனிப்பயனாக்கப்பட்ட கற்றல் மூலம் கல்வியை வலுப்படுத்துதல்.",
      quickLinks: "விரைவு இணைப்புகள்",
      faq: "அடிக்கடி கேட்கப்படும் கேள்விகள்",
      tutors: "டியூட்டர்கள்",
      volunteers: "தன்னார்வலர்கள்",
      admin: "நிர்வாகம்",
      support: "ஆதரவு",
      helpCenter: "உதவி மையம்",
      contact: "தொடர்பு",
    },
  };

  const currentContent = content[language]; // Cast to any to avoid type errors if needed, but here structure is consistent

  return (
    <div className="bg-white">
      {/* Navigation */}
      <div className="bg-[#000000] text-white py-3 sticky top-0 z-50 shadow-blue-glow">
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo or Title Placeholer */}
            <span className="text-xl font-heading font-bold tracking-tight text-white hover:text-maatram-blue transition-colors">
              Maatram KK
            </span>
          </div>
          <div className="hidden md:flex gap-8 items-center font-heading font-medium">
            <Link
              href="/"
              className="hover:text-maatram-blue transition-colors"
            >
              {currentContent.navHome}
            </Link>
            <Link
              href="#features"
              className="hover:text-maatram-blue transition-colors"
            >
              {currentContent.navWhatWeDo}
            </Link>
            <a
              href="https://maatramfoundation.com/admissions/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-maatram-blue transition-colors"
            >
              {currentContent.navAdmissions}
            </a>
            <a
              href="https://maatramfoundation.com/maatram-events/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-maatram-blue transition-colors"
            >
              {currentContent.navNews}
            </a>
            <a
              href="https://maatramfoundation.com/maatram-gallery/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-maatram-blue transition-colors"
            >
              {currentContent.navGallery}
            </a>
            <Link
              href="#contact"
              className="hover:text-maatram-blue transition-colors"
            >
              {currentContent.navContact}
            </Link>

            <Button
              variant={language === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("en")}
              className={
                language === "en"
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-transparent border-white text-white hover:bg-white/20 hover:text-white"
              }
            >
              EN
            </Button>
            <Button
              variant={language === "ta" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("ta")}
              className={
                language === "ta"
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-transparent border-white text-white hover:bg-white/20 hover:text-white"
              }
            >
              TA
            </Button>

            <Link href="/login">
              <Button
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/20 hover:text-maatram-yellow transition-all"
              >
                {language === "en" ? "Sign In" : "உள்நுழைய"}
              </Button>
            </Link>
            <Link href="/register/volunteer">
              <Button
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/20 hover:text-maatram-yellow transition-all"
              >
                {language === "en" ? "Volunteer Register" : "தன்னார்வலர் பதிவு"}
              </Button>
            </Link>
            <Link href="/apply">
              <Button className="bg-[#FEC312] hover:bg-[#FFC10E] text-black font-bold">
                {currentContent.applyNow}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main>
        <div className="bg-gradient-to-r from-[#000000] via-[#111111] to-[#1A1A1A] text-[#FEC312]">
          <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-center gap-2">
            <span className="text-xs md:text-sm tracking-widest uppercase">
              KK starts with
            </span>
            <span className="text-sm md:text-base font-heading font-bold">
              Empowering Students
            </span>
          </div>
        </div>
        {/* Hero Section */}
        <div className="relative isolate px-6 pt-14 lg:px-8 bg-gradient-to-b from-[#FFF8DB] via-white to-[#FFECA6] overflow-hidden">
          <div className="absolute -z-10 left-1/2 -translate-x-1/2 top-[-120px] w-[720px] h-[720px] rounded-full bg-[#FFE77A] blur-[120px] opacity-30"></div>
          <div className="mx-auto max-w-7xl py-12 sm:py-24 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <div className="space-y-3">
                <div className="text-5xl sm:text-6xl font-heading font-black tracking-tight bg-gradient-to-r from-[#FEC312] via-[#FFC10E] to-[#1A1A1A] bg-clip-text text-transparent">
                  {currentContent.heroTitleKK}
                </div>
                <div className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-gray-900">
                  {currentContent.heroTitleEmpower}
                </div>
                <span className="mx-auto block h-1 w-24 bg-[#FEC312] rounded-full"></span>
              </div>
              <p className="mt-6 text-xl leading-8 text-gray-600 font-medium">{currentContent.heroIntro}</p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/apply">
                  <Button
                    size="lg"
                    className="bg-[#000000] text-[#FEC312] hover:bg-[#1A1A1A] px-8 py-6 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all"
                  >
                    {currentContent.applyNow}
                  </Button>
                </Link>
                <Link href="#process">
                  <Button
                    variant="outline"
                    className="border-[#FEC312] text-[#1A1A1A] hover:bg-[#FFF6CC]"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mx-auto mt-12 max-w-7xl">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-thick-yellow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Users className="h-5 w-5 text-maatram-blue" />
                      Empower
                    </CardTitle>
                    <CardDescription>
                      Access, mentorship, and a community that believes in you.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card className="border-thick-yellow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BookOpen className="h-5 w-5 text-maatram-blue" />
                      Educate
                    </CardTitle>
                    <CardDescription>
                      Structured learning with assignments, tests, and model
                      exams.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card className="border-thick-yellow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <TrendingUp className="h-5 w-5 text-maatram-blue" />
                      Elevate
                    </CardTitle>
                    <CardDescription>
                      Career guidance and life skills to shape your future.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
            <div className="mx-auto mt-12 max-w-3xl text-gray-700 bg-white/40 backdrop-blur-sm p-8 rounded-3xl border-thick-yellow shadow-sm">
              <p className="mb-4 text-lg">{currentContent.description}</p>
              <div className="mb-4 font-heading font-bold text-gray-900 text-xl flex items-center gap-2">
                <div className="h-6 w-1 bg-maatram-blue rounded-full"></div>
                {currentContent.heroOfferTitle}
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-2 list-none">
                {currentContent.heroOfferBullets.map((b: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-md">
                    <CheckCircle className="h-5 w-5 text-maatram-blue flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8 mb-4 font-heading font-bold text-gray-900 text-xl flex items-center gap-2">
                <div className="h-6 w-1 bg-maatram-blue rounded-full"></div>
                {currentContent.heroDevTitle}
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-2 list-none">
                {currentContent.heroDevBullets.map((b: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-md">
                    <CheckCircle className="h-5 w-5 text-maatram-blue flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <p className="mt-8 pt-6 border-t border-gray-200 text-gray-500 italic">
                {currentContent.heroSince}{" "}
                <span className="font-bold text-gray-900 not-italic">272</span>{" "}
                {currentContent.heroSinceTrail}{" "}
                <span className="font-bold text-gray-900 not-italic">100</span>{" "}
                {currentContent.heroScholarTrail}
              </p>
            </div>
          </div>
        </div>

        {/* Admissions Banner */}
        <div className="bg-maatram-wash px-6 py-16 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 md:grid-cols-2 items-center bg-white/60 backdrop-blur-md p-8 md:p-12 rounded-[2.5rem] border-thick-yellow shadow-xl">
              <div>
                <span className="text-3xl md:text-4xl font-heading font-black text-maatram-blue text-center px-6 leading-tight mb-4 block">
                  {currentContent.admissionsBannerTitle}
                </span>
                <p className="text-2xl font-heading font-bold">
                  {currentContent.admissionsBannerText}
                </p>
              </div>
              <div className="space-y-6">
                <Link href="/apply">
                  <Button
                    size="lg"
                    className="bg-maatram-blue hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-2xl shadow-lg transform transition active:scale-95"
                  >
                    {currentContent.applyNow}{" "}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Process */}
        <div className="bg-white py-24 sm:py-32" id="process">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-bold leading-7 text-maatram-blue uppercase tracking-widest">
                {currentContent.selectionProcess}
              </h2>
              <p className="mt-2 text-4xl font-heading font-bold tracking-tight text-gray-900 sm:text-5xl">
                {currentContent.selectionProcessSubtitle}
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    step: currentContent.step1,
                    desc: currentContent.step1Desc,
                    num: "1",
                  },
                  {
                    step: currentContent.step2,
                    desc: currentContent.step2Desc,
                    num: "2",
                  },
                  {
                    step: currentContent.step3,
                    desc: currentContent.step3Desc,
                    num: "3",
                  },
                  {
                    step: currentContent.step4,
                    desc: currentContent.step4Desc,
                    num: "4",
                  },
                ].map((item, i) => (
                  <Card
                    key={i}
                    className="text-center group border-thick-yellow hover:border-maatram-blue transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <CardHeader>
                      <div className="mx-auto h-16 w-16 bg-[#FEC312] group-hover:bg-maatram-blue rounded-full flex items-center justify-center transition-colors">
                        <span className="text-3xl font-heading font-bold text-gray-900 group-hover:text-white">
                          {item.num}
                        </span>
                      </div>
                      <CardTitle className="mt-6 text-xl">
                        {item.step}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-maatram-wash py-24 sm:py-32" id="features">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center mb-16">
              <h2 className="text-base font-bold leading-7 text-maatram-blue uppercase tracking-widest">
                {currentContent.requirements}
              </h2>
              <p className="mt-2 text-4xl font-heading font-bold tracking-tight text-gray-900 sm:text-5xl">
                {currentContent.requirementsTitle}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
              {[
                currentContent.req1,
                currentContent.req2,
                currentContent.req3,
                currentContent.req4,
              ].map((req, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-maatram-blue/20 transition-colors"
                >
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-maatram-blue">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-gray-800">{req}</span>
                </div>
              ))}
            </div>

            <div className="mx-auto max-w-2xl lg:text-center mt-20 mb-10">
              <p className="mt-2 text-4xl font-heading font-bold tracking-tight text-gray-900 sm:text-5xl">
                {currentContent.documentsTitle}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
              {[
                currentContent.doc1,
                currentContent.doc2,
                currentContent.doc3,
                currentContent.doc4,
              ].map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-maatram-blue/20 transition-colors"
                >
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-maatram-blue">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-gray-800">{doc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="bg-[#000000] text-white shadow-blue-glow-top border-t border-gray-800"
        id="contact"
      >
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <h2 className="text-2xl font-heading font-bold text-[#FEC312] mb-4">
                Maatram KK
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                {currentContent.footerDesc}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold mb-6 text-white border-b border-maatram-blue pb-2 inline-block">
                {currentContent.quickLinks}
              </h3>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li>
                  <Link
                    href="/"
                    className="hover:text-maatram-blue transition-colors"
                  >
                    {currentContent.navHome}
                  </Link>
                </li>
                <li>
                  <a
                    href="https://maatramfoundation.com/admissions/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-maatram-blue transition-colors"
                  >
                    {currentContent.navAdmissions}
                  </a>
                </li>
                <li>
                  <a
                    href="https://maatramfoundation.com/maatram-events/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-maatram-blue transition-colors"
                  >
                    {language === "en" ? "Events" : "நிகழ்வுகள்"}
                  </a>
                </li>
                <li>
                  <a
                    href="https://maatramfoundation.com/maatram-gallery/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-maatram-blue transition-colors"
                  >
                    {currentContent.navGallery}
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-maatram-blue transition-colors"
                  >
                    {currentContent.navContact}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold mb-6 text-white border-b border-maatram-blue pb-2 inline-block">
                {language === "en" ? "Reach Us" : "எங்களை தொடர்பு கொள்ள"}
              </h3>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li className="flex gap-3">
                  <Phone className="h-5 w-5 text-maatram-blue shrink-0" />
                  <div className="flex flex-col">
                    <span>+91 9561014389 / 8925927943</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Users className="h-5 w-5 text-maatram-blue shrink-0" />
                  <div className="flex flex-col">
                    <span>
                      No. 47, 7th cross street, Neelankarai, Chennai – 600115
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <MessageSquare className="h-5 w-5 text-maatram-blue shrink-0" />
                  <span>enquiry@maatramfoundation.com</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold mb-6 text-white border-b border-maatram-blue pb-2 inline-block">
                {language === "en" ? "Follow Up" : "தொடர்ந்து பின்தொடர்வு"}
              </h3>
              <div className="flex gap-4">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-maatram-blue transition-all border border-gray-800"
                >
                  <div className="h-5 w-5 bg-white mask-facebook" />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-maatram-blue transition-all border border-gray-800"
                >
                  <div className="h-5 w-5 bg-white mask-instagram" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-gray-900 text-center text-xs text-gray-500">
            &copy; 2024 Karpom Karpippom (KK) - Maatram Foundation. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
