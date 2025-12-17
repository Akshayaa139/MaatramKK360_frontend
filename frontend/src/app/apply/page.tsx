"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/providers";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import dynamic from "next/dynamic";
const IndicTransliterate = dynamic(() => import("@ai4bharat/indic-transliterate").then(m => m.IndicTransliterate), { ssr: false });
const getTransliterateSuggestionsDynamic = () => import("@ai4bharat/indic-transliterate").then(m => m.getTransliterateSuggestions);

interface FormData {
  // Personal Information
  fullName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  whatsappNumber: string;

  // Address
  address: string;
  city: string;
  state: string;
  pincode: string;

  // Academic Information
  currentClass: string;
  schoolName: string;
  board: string;
  medium: string;
  subjects: string[];

  // Family Information
  fatherName: string;
  motherName: string;
  fatherOccupation: string;
  motherOccupation: string;
  annualIncome: string;

  // Academic Performance
  tenthPercentage: string;
  currentPercentage: string;

  // Documents
  photoFile: File | null;
  marksheetFile: File | null;
  incomeCertificateFile: File | null;
  idProofFile: File | null;

  // Additional Information
  whyKK: string;
  goals: string;
  challenges: string;

  // Agreement
  agreeTerms: boolean;
}

export default function ApplyPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  type SuggestionResponse = { result: string[] };
  // Matched to library signature (v1.3.8)
  type GetSuggestFn = (word: string, customApiURL: string, apiKey: string, config?: any) => Promise<string[] | undefined>;
  const [getSuggestFn, setGetSuggestFn] = useState<GetSuggestFn | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    currentClass: '',
    schoolName: '',
    board: '',
    medium: '',
    subjects: [],
    fatherName: '',
    motherName: '',
    fatherOccupation: '',
    motherOccupation: '',
    annualIncome: '',
    tenthPercentage: '',
    currentPercentage: '',
    photoFile: null,
    marksheetFile: null,
    incomeCertificateFile: null,
    idProofFile: null,
    whyKK: '',
    goals: '',
    challenges: '',
    agreeTerms: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getTransliterateSuggestionsDynamic().then(setGetSuggestFn).catch(() => { });
  }, []);

  const content = {
    en: {
      title: "Student Application Form",
      subtitle: "Apply for Karpom Karpippom (KK) Program",
      personalInfo: "Personal Information",
      academicInfo: "Academic Information",
      familyInfo: "Family Information",
      documents: "Required Documents",
      additionalInfo: "Additional Information",
      agreement: "Declaration",
      submit: "Submit Application",

      // Fields
      fullName: "Full Name (as per school records)",
      dateOfBirth: "Date of Birth",
      gender: "Gender",
      email: "Email Address",
      phone: "Phone Number",
      whatsappNumber: "WhatsApp Number",
      address: "Complete Address",
      city: "City/Town",
      state: "State",
      pincode: "PIN Code",
      currentClass: "Current Class/Grade",
      schoolName: "School Name",
      board: "Board (CBSE/State/Matriculation)",
      medium: "Medium of Instruction",
      subjects: "Subjects you need help with",
      fatherName: "Father's Name",
      motherName: "Mother's Name",
      fatherOccupation: "Father's Occupation",
      motherOccupation: "Mother's Occupation",
      annualIncome: "Annual Family Income",
      tenthPercentage: "10th Standard Percentage (if applicable)",
      currentPercentage: "Current Academic Year Percentage",
      photo: "Recent Passport Size Photo",
      marksheet: "Latest Marksheet",
      incomeCertificate: "Family Income Certificate",
      idProof: "Student ID Proof (Aadhaar/School ID)",
      whyKK: "Why do you want to join KK program?",
      goals: "What are your academic and career goals?",
      challenges: "What challenges do you face in your studies?",
      agreeText: "I hereby declare that all the information provided above is true and correct to the best of my knowledge.",

      // Validation messages
      requiredField: "This field is required",
      invalidEmail: "Please enter a valid email address",
      invalidPhone: "Please enter a valid phone number",
      selectAtLeastOneSubject: "Please select at least one subject",
      agreeRequired: "You must agree to the declaration",

      // Success
      applicationSubmitted: "Application submitted successfully!",
      applicationNumberGenerated: "Your application number is:",
      applicationNumberHint: "Will be generated after submission",
      checkEmail: "Please check your email for further instructions.",
    },
    ta: {
      title: "மாணவர் விண்ணப்ப படிவம்",
      subtitle: "கற்போம் கற்பிப்போம் (கே.கே) திட்டத்திற்கு விண்ணப்பிக்கவும்",
      personalInfo: "தனிப்பட்ட தகவல்",
      academicInfo: "கல்வி தகவல்",
      familyInfo: "குடும்ப தகவல்",
      documents: "தேவையான ஆவணங்கள்",
      additionalInfo: "கூடுதல் தகவல்",
      agreement: "அறிவிப்பு",
      submit: "விண்ணப்பத்தை சமர்ப்பிக்கவும்",

      // Fields
      fullName: "முழுப் பெயர் (பள்ளி பதிவுகளின்படி)",
      dateOfBirth: "பிறந்த தேதி",
      gender: "பாலினம்",
      email: "மின்னஞ்சல் முகவரி",
      phone: "தொலைபேசி எண்",
      whatsappNumber: "வாட்ஸ்அப் எண்",
      address: "முழு முகவரி",
      city: "நகரம்/பட்டணம்",
      state: "மாநிலம்",
      pincode: "பின் குறியீடு",
      currentClass: "தற்போதைய வகுப்பு/தரம்",
      schoolName: "பள்ளியின் பெயர்",
      board: "வாரியம் (சிபிஎஸ்இ/மாநில/மெட்ரிகுலேஷன்)",
      medium: "கற்றல் ஊடகம்",
      subjects: "உங்களுக்கு உதவி தேவைப்படும் பாடங்கள்",
      fatherName: "தந்தையின் பெயர்",
      motherName: "தாயின் பெயர்",
      fatherOccupation: "தந்தையின் தொழில்",
      motherOccupation: "தாயின் தொழில்",
      annualIncome: "ஆண்டு குடும்ப வருமானம்",
      tenthPercentage: "10ஆம் வகுப்பு சதவீதம் (பொருந்தினால்)",
      currentPercentage: "தற்போதைய கல்வி ஆண்டு சதவீதம்",
      photo: "சமீபத்திய பாஸ்போர்ட் அளவு புகைப்படம்",
      marksheet: "சமீபத்திய மதிப்பெண் பட்டியல்",
      incomeCertificate: "குடும்ப வருமான சான்றிதழ்",
      idProof: "மாணவர் அடையாள ஆதாரம் (ஆதார்/பள்ளி ஐடி)",
      whyKK: "நீங்கள் கே.கே திட்டத்தில் சேர விரும்புவது ஏன்?",
      goals: "உங்கள் கல்வி மற்றும் வாழ்க்கை இலக்குகள் என்ன?",
      challenges: "உங்கள் படிப்பில் என்ன சவால்களை எதிர்கொள்கிறீர்கள்?",
      agreeText: "மேலே வழங்கப்பட்ட அனைத்து தகவல்களும் என் அறிவுக்கு ஏற்ப உண்மையானவை மற்றும் சரியானவை என்று நான் இங்கு அறிவிக்கிறேன்.",

      // Validation messages
      requiredField: "இந்த புலம் தேவையானது",
      invalidEmail: "தயவுசெய்து சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்",
      invalidPhone: "தயவுசெய்து சரியான தொலைபேசி எண்ணை உள்ளிடவும்",
      selectAtLeastOneSubject: "குறைந்தது ஒரு பாடத்தை தேர்ந்தெடுக்கவும்",
      agreeRequired: "நீங்கள் அறிவிப்பை ஒப்புக்கொள்ள வேண்டும்",

      // Success
      applicationSubmitted: "விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!",
      applicationNumberGenerated: "உங்கள் விண்ணப்ப எண்:",
      applicationNumberHint: "சமர்ப்பித்த பிறகு உருவாக்கப்படும்",
      checkEmail: "மேலதிக வழிமுறைகளுக்காக உங்கள் மின்னஞ்சலை சரிபார்க்கவும்.",
    }
  };

  const currentContent = content[language];

  // Application number will be generated by backend after submission

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const taFields = new Set([
      "fullName", "address", "city", "state", "schoolName",
      "fatherName", "motherName", "fatherOccupation", "motherOccupation",
      "whyKK", "goals", "challenges"
    ]);
    if (language === "ta" && taFields.has(name) && getSuggestFn) {
      const parts = value.split(/\s+/).filter(Boolean);
      const out: string[] = [];
      for (const p of parts) {
        try {
          const s = await getSuggestFn(p, "google", "", { lang: "ta", numOptions: 1, showCurrentWordAsLastSuggestion: true });
          const r = Array.isArray(s) && s.length ? s[0] : p;
          out.push(r);
        } catch {
          out.push(p);
        }
      }
      const t = out.join(" ");
      setFormData((prev) => ({ ...prev, [name]: t }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, [fieldName]: file }));
  };

  const handleSubjectChange = (subject: string, checked: boolean) => {
    setFormData((prev) => {
      const subjects = checked
        ? [...prev.subjects, subject]
        : prev.subjects.filter(s => s !== subject);
      return { ...prev, subjects };
    });
  };

  const validateForm = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    const pinRegex = /^\d{6}$/;

    if (!formData.fullName.trim()) { setError(currentContent.requiredField); return false; }
    if (!formData.dateOfBirth.trim()) { setError(currentContent.requiredField); return false; }
    if (!['male', 'female', 'other'].includes(formData.gender)) { setError(currentContent.requiredField); return false; }
    if (!emailRegex.test(formData.email)) { setError(currentContent.invalidEmail); return false; }
    if (!phoneRegex.test(formData.phone)) { setError(currentContent.invalidPhone); return false; }
    if (!formData.address.trim() || !formData.city.trim() || !formData.state.trim()) { setError(currentContent.requiredField); return false; }
    if (!pinRegex.test(formData.pincode)) { setError(currentContent.requiredField); return false; }
    if (!formData.currentClass.trim() || !formData.schoolName.trim() || !formData.board.trim() || !formData.medium.trim()) { setError(currentContent.requiredField); return false; }
    if (formData.subjects.length === 0) { setError(currentContent.selectAtLeastOneSubject); return false; }
    const toNumber = (v: string) => v === '' ? null : Number(v);
    const tenth = toNumber(formData.tenthPercentage);
    const current = toNumber(formData.currentPercentage);
    if (tenth !== null && (isNaN(tenth) || tenth < 0 || tenth > 100)) { setError(currentContent.requiredField); return false; }
    if (current !== null && (isNaN(current) || current < 0 || current > 100)) { setError(currentContent.requiredField); return false; }
    if (!formData.agreeTerms) { setError(currentContent.agreeRequired); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const toTamilIfNeeded = async (s: string) => {
        if (language !== 'ta') return s;
        const text = String(s || '');
        const hasLatin = /[A-Za-z]/.test(text);
        if (!hasLatin) return text;
        try {
          if (getSuggestFn) {
            const suggestions = await getSuggestFn(text, "google", "", { lang: 'ta' });
            if (Array.isArray(suggestions) && suggestions.length > 0) {
              const first = suggestions[0] as unknown;
              if (typeof first === 'string') return first;
              if (first && typeof first === 'object' && 'text' in first) {
                return (first as { text: string }).text;
              }
              if (first && typeof first === 'object' && 'tgt' in first) {
                return (first as { tgt: string }).tgt;
              }
            }
          }
        } catch { }
        return text;
      };

      const normalized = { ...formData };
      if (language === 'ta') {
        normalized.fullName = await toTamilIfNeeded(normalized.fullName);
        normalized.address = await toTamilIfNeeded(normalized.address);
        normalized.city = await toTamilIfNeeded(normalized.city);
        normalized.state = await toTamilIfNeeded(normalized.state);
        normalized.schoolName = await toTamilIfNeeded(normalized.schoolName);
        normalized.fatherName = await toTamilIfNeeded(normalized.fatherName);
        normalized.motherName = await toTamilIfNeeded(normalized.motherName);
        normalized.fatherOccupation = await toTamilIfNeeded(normalized.fatherOccupation);
        normalized.motherOccupation = await toTamilIfNeeded(normalized.motherOccupation);
        normalized.whyKK = await toTamilIfNeeded(normalized.whyKK);
        normalized.goals = await toTamilIfNeeded(normalized.goals);
        normalized.challenges = await toTamilIfNeeded(normalized.challenges);
      }

      const formDataToSend = new FormData();

      // Add all form fields (excluding files)
      Object.keys(normalized).forEach(key => {
        const value = normalized[key as keyof FormData];
        if (key.includes('File')) {
          // Skip file fields, they'll be added separately
          return;
        }
        if (Array.isArray(value)) {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, value as string);
        }
      });

      // Add files
      if (normalized.photoFile) {
        formDataToSend.append('photoFile', normalized.photoFile);
      }
      if (normalized.marksheetFile) {
        formDataToSend.append('marksheetFile', normalized.marksheetFile);
      }
      if (normalized.incomeCertificateFile) {
        formDataToSend.append('incomeCertificateFile', normalized.incomeCertificateFile);
      }
      if (normalized.idProofFile) {
        formDataToSend.append('idProofFile', normalized.idProofFile);
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/applications/submit`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Application submission failed");
      }

      // Redirect to success page with application number from backend
      if (data.applicationId) {
        router.push(`/application-success?applicationNumber=${data.applicationId}`);
      } else {
        router.push(`/application-success`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Application submission failed";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Language Switcher */}
      <div className="mx-auto max-w-4xl px-4 mb-6">
        <div className="flex justify-end gap-2">
          <Button
            variant={language === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('en')}
            className={language === 'en' ? 'bg-black text-yellow-400' : 'bg-transparent'}
          >
            English
          </Button>
          <Button
            variant={language === 'ta' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('ta')}
            className={language === 'ta' ? 'bg-black text-yellow-400' : 'bg-transparent'}
          >
            தமிழ்
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4">
        <Card className="shadow-lg">
          <CardHeader className="text-center bg-black text-white">
            <CardTitle className="text-2xl">{currentContent.title}</CardTitle>
            <CardDescription className="text-yellow-400">
              {currentContent.subtitle}
            </CardDescription>
            <div className="mt-4 p-3 bg-yellow-500 text-black rounded-lg">
              <p className="text-sm font-medium">📝 {currentContent.applicationNumberGenerated} <span className="font-bold text-lg">{currentContent.applicationNumberHint}</span></p>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8 p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{currentContent.personalInfo}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{currentContent.fullName} *</Label>
                    {language === 'ta' ? (
                      <IndicTransliterate
                        renderComponent={(props: React.ComponentProps<typeof Input>) => <Input {...props} />}
                        id="fullName"
                        value={formData.fullName}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, fullName: text }))}
                        lang="ta"
                      />
                    ) : (
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">{currentContent.dateOfBirth} *</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">{currentContent.gender} *</Label>
                    <Select name="gender" value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))} required>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select gender' : 'பாலினத்தை தேர்ந்தெடுக்கவும்'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{language === 'en' ? 'Male' : 'ஆண்'}</SelectItem>
                        <SelectItem value="female">{language === 'en' ? 'Female' : 'பெண்'}</SelectItem>
                        <SelectItem value="other">{language === 'en' ? 'Other' : 'மற்றவை'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{currentContent.email} *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{currentContent.phone} *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber">{currentContent.whatsappNumber}</Label>
                    <Input
                      id="whatsappNumber"
                      name="whatsappNumber"
                      type="tel"
                      value={formData.whatsappNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{currentContent.address} *</Label>
                  {language === 'ta' ? (
                    <IndicTransliterate
                      renderComponent={(props: React.ComponentProps<typeof Textarea>) => <Textarea {...props} />}
                      id="address"
                      value={formData.address}
                      onChangeText={(text: string) => setFormData(prev => ({ ...prev, address: text }))}
                      lang="ta"
                    />
                  ) : (
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{currentContent.city} *</Label>
                    {language === 'ta' ? (
                      <IndicTransliterate
                        renderComponent={(props: React.ComponentProps<typeof Input>) => <Input {...props} />}
                        id="city"
                        value={formData.city}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, city: text }))}
                        lang="ta"
                      />
                    ) : (
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">{currentContent.state} *</Label>
                    {language === 'ta' ? (
                      <IndicTransliterate
                        renderComponent={(props: React.ComponentProps<typeof Input>) => <Input {...props} />}
                        id="state"
                        value={formData.state}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, state: text }))}
                        lang="ta"
                      />
                    ) : (
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pincode">{currentContent.pincode} *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{currentContent.academicInfo}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentClass">{currentContent.currentClass} *</Label>
                    <Select name="currentClass" value={formData.currentClass} onValueChange={(value) => setFormData(prev => ({ ...prev, currentClass: value }))} required>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select class' : 'வகுப்பை தேர்ந்தெடுக்கவும்'} />
                      </SelectTrigger>
                      <SelectContent>
                        {[9, 10, 11, 12].map(cls => (
                          <SelectItem key={cls} value={cls.toString()}>
                            {language === 'en' ? `Class ${cls}` : `${cls}ஆம் வகுப்பு`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolName">{currentContent.schoolName} *</Label>
                    {language === 'ta' ? (
                      <IndicTransliterate
                        renderComponent={(props: React.ComponentProps<typeof Input>) => <Input {...props} />}
                        id="schoolName"
                        value={formData.schoolName}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, schoolName: text }))}
                        lang="ta"
                      />
                    ) : (
                      <Input
                        id="schoolName"
                        name="schoolName"
                        value={formData.schoolName}
                        onChange={handleInputChange}
                        required
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="board">{currentContent.board} *</Label>
                    <Select name="board" value={formData.board} onValueChange={(value) => setFormData(prev => ({ ...prev, board: value }))} required>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select board' : 'வாரியத்தை தேர்ந்தெடுக்கவும்'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CBSE">CBSE</SelectItem>
                        <SelectItem value="State">{language === 'en' ? 'State Board' : 'மாநில வாரியம்'}</SelectItem>
                        <SelectItem value="Matriculation">{language === 'en' ? 'Matriculation' : 'மெட்ரிகுலேஷன்'}</SelectItem>
                        <SelectItem value="Other">{language === 'en' ? 'Other' : 'மற்றவை'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medium">{currentContent.medium} *</Label>
                    <Select name="medium" value={formData.medium} onValueChange={(value) => setFormData(prev => ({ ...prev, medium: value }))} required>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select medium' : 'ஊடகத்தை தேர்ந்தெடுக்கவும்'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">{language === 'en' ? 'English' : 'ஆங்கிலம்'}</SelectItem>
                        <SelectItem value="Tamil">{language === 'en' ? 'Tamil' : 'தமிழ்'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{currentContent.subjects} *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Accountancy', 'Economics', 'Business Studies'].map(subject => (
                      <div key={subject} className="flex items-center space-x-2">
                        <Checkbox
                          id={subject}
                          checked={formData.subjects.includes(subject)}
                          onCheckedChange={(checked) => handleSubjectChange(subject, checked as boolean)}
                        />
                        <Label htmlFor={subject} className="text-sm">
                          {language === 'ta' ?
                            (subject === 'Mathematics' ? 'கணிதம்' :
                              subject === 'Physics' ? 'இயற்பியல்' :
                                subject === 'Chemistry' ? 'வேதியியல்' :
                                  subject === 'Biology' ? 'உயிரியல்' :
                                    subject === 'Computer Science' ? 'கணினி அறிவியல்' :
                                      subject === 'Accountancy' ? 'கணக்கியல்' :
                                        subject === 'Economics' ? 'பொருளாதாரம்' :
                                          'வணிக ஆய்வுகள்') : subject
                          }
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenthPercentage">{currentContent.tenthPercentage}</Label>
                    <Input
                      id="tenthPercentage"
                      name="tenthPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.tenthPercentage}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentPercentage">{currentContent.currentPercentage}</Label>
                    <Input
                      id="currentPercentage"
                      name="currentPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.currentPercentage}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Family Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{currentContent.familyInfo}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">{currentContent.fatherName}</Label>
                    {language === 'ta' ? (
                      <IndicTransliterate
                        renderComponent={(props: React.ComponentProps<typeof Input>) => <Input {...props} />}
                        id="fatherName"
                        value={formData.fatherName}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, fatherName: text }))}
                        lang="ta"
                      />
                    ) : (
                      <Input
                        id="fatherName"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleInputChange}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motherName">{currentContent.motherName}</Label>
                    {language === 'ta' ? (
                      <IndicTransliterate
                        renderComponent={(props: React.ComponentProps<typeof Input>) => <Input {...props} />}
                        id="motherName"
                        value={formData.motherName}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, motherName: text }))}
                        lang="ta"
                      />
                    ) : (
                      <Input
                        id="motherName"
                        name="motherName"
                        value={formData.motherName}
                        onChange={handleInputChange}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fatherOccupation">{currentContent.fatherOccupation}</Label>
                    {language === 'ta' ? (
                      <IndicTransliterate
                        renderComponent={(props: React.ComponentProps<typeof Input>) => <Input {...props} />}
                        id="fatherOccupation"
                        value={formData.fatherOccupation}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, fatherOccupation: text }))}
                        lang="ta"
                      />
                    ) : (
                      <Input
                        id="fatherOccupation"
                        name="fatherOccupation"
                        value={formData.fatherOccupation}
                        onChange={handleInputChange}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motherOccupation">{currentContent.motherOccupation}</Label>
                    {language === 'ta' ? (
                      <IndicTransliterate
                        renderComponent={(props: React.ComponentProps<typeof Input>) => <Input {...props} />}
                        id="motherOccupation"
                        value={formData.motherOccupation}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, motherOccupation: text }))}
                        lang="ta"
                      />
                    ) : (
                      <Input
                        id="motherOccupation"
                        name="motherOccupation"
                        value={formData.motherOccupation}
                        onChange={handleInputChange}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="annualIncome">{currentContent.annualIncome}</Label>
                    <Select name="annualIncome" value={formData.annualIncome} onValueChange={(value) => setFormData(prev => ({ ...prev, annualIncome: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select income range' : 'வருமான வரம்பை தேர்ந்தெடுக்கவும்'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<1L">{language === 'en' ? 'Less than ₹1 Lakh' : '₹1 லட்சத்திற்கும் குறைவாக'}</SelectItem>
                        <SelectItem value="1-3L">{language === 'en' ? '₹1-3 Lakhs' : '₹1-3 லட்சங்கள்'}</SelectItem>
                        <SelectItem value="3-5L">{language === 'en' ? '₹3-5 Lakhs' : '₹3-5 லட்சங்கள்'}</SelectItem>
                        <SelectItem value="5-10L">{language === 'en' ? '₹5-10 Lakhs' : '₹5-10 லட்சங்கள்'}</SelectItem>
                        <SelectItem value=">10L">{language === 'en' ? 'More than ₹10 Lakhs' : '₹10 லட்சங்களுக்கும் மேல்'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{currentContent.documents}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="photoFile">{currentContent.photo}</Label>
                    <Input
                      id="photoFile"
                      name="photoFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'photoFile')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="marksheetFile">{currentContent.marksheet}</Label>
                    <Input
                      id="marksheetFile"
                      name="marksheetFile"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'marksheetFile')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incomeCertificateFile">{currentContent.incomeCertificate}</Label>
                    <Input
                      id="incomeCertificateFile"
                      name="incomeCertificateFile"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'incomeCertificateFile')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idProofFile">{currentContent.idProof}</Label>
                    <Input
                      id="idProofFile"
                      name="idProofFile"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'idProofFile')}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{currentContent.additionalInfo}</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="whyKK">{currentContent.whyKK} *</Label>
                    {language === 'ta' ? (
                      <IndicTransliterate
                        renderComponent={(props: React.ComponentProps<typeof Textarea>) => <Textarea {...props} rows={4} />}
                        id="whyKK"
                        value={formData.whyKK}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, whyKK: text }))}
                        lang="ta"
                      />
                    ) : (
                      <Textarea
                        id="whyKK"
                        name="whyKK"
                        value={formData.whyKK}
                        onChange={handleInputChange}
                        required
                        rows={4}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goals">{currentContent.goals} *</Label>
                    {language === 'ta' ? (
                      <IndicTransliterate
                        renderComponent={(props: React.ComponentProps<typeof Textarea>) => <Textarea {...props} rows={4} />}
                        id="goals"
                        value={formData.goals}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, goals: text }))}
                        lang="ta"
                      />
                    ) : (
                      <Textarea
                        id="goals"
                        name="goals"
                        value={formData.goals}
                        onChange={handleInputChange}
                        required
                        rows={4}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="challenges">{currentContent.challenges} *</Label>
                    {language === 'ta' ? (
                      <IndicTransliterate
                        renderComponent={(props: React.ComponentProps<typeof Textarea>) => <Textarea {...props} rows={4} />}
                        id="challenges"
                        value={formData.challenges}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, challenges: text }))}
                        lang="ta"
                      />
                    ) : (
                      <Textarea
                        id="challenges"
                        name="challenges"
                        value={formData.challenges}
                        onChange={handleInputChange}
                        required
                        rows={4}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Agreement */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{currentContent.agreement}</h3>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agreeTerms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeTerms: checked as boolean }))}
                    required
                  />
                  <Label htmlFor="agreeTerms" className="text-sm text-gray-600">
                    {currentContent.agreeText}
                  </Label>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-center">
              <Button
                type="submit"
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-3 text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>{language === 'en' ? 'Submitting...' : 'சமர்ப்பிக்கிறது...'}</>
                ) : (
                  <>{currentContent.submit}</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
