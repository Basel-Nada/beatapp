"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Heart,
  AlertCircle,
  Send,
  User,
  Sun,
  Smile,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientConsultationPage() {
  const params = useParams();
  const contactId = params.id as string;

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [contactName, setContactName] = React.useState<string>("عزيزتي العميلة");
  const [clinicName, setClinicName] = React.useState<string>("عيادات التجميل والليزر");

  // Form State
  const [skinType, setSkinType] = React.useState<string>("combination");
  const [fitzpatrickScale, setFitzpatrickScale] = React.useState<string>("III");
  const [targetAreas, setTargetAreas] = React.useState<string[]>(["الوجه والرقبة"]);
  const [allergies, setAllergies] = React.useState<string[]>(["لا يوجد تحسس معروف"]);
  const [customAllergy, setCustomAllergy] = React.useState<string>("");
  const [contraindications, setContraindications] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState<string>("");

  React.useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/intake/${contactId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.contact?.name) setContactName(data.contact.name);
          if (data.clinicName) setClinicName(data.clinicName);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [contactId]);

  const toggleTargetArea = (area: string) => {
    setTargetAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const toggleAllergy = (al: string) => {
    setAllergies((prev) => {
      if (al === "لا يوجد تحسس معروف") {
        return prev.includes("لا يوجد تحسس معروف") ? [] : ["لا يوجد تحسس معروف"];
      }
      const filtered = prev.filter((item) => item !== "لا يوجد تحسس معروف");
      return filtered.includes(al) ? filtered.filter((item) => item !== al) : [...filtered, al];
    });
  };

  const toggleContraindication = (c: string) => {
    setContraindications((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const finalAllergies = [...allergies];
    if (customAllergy.trim() && !finalAllergies.includes(customAllergy.trim())) {
      finalAllergies.push(customAllergy.trim());
    }

    try {
      const res = await fetch(`/api/intake/${contactId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skinType,
          fitzpatrickScale,
          targetAreas,
          allergies: finalAllergies,
          contraindications,
          notes,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setErrorMsg("حدث خطأ أثناء إرسال البيانات، يرجى المحاولة مرة أخرى.");
      }
    } catch {
      setErrorMsg("تعذر الاتصال بالخادم، يرجى التحقق من اتصالك.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">جاري تحميل الاستبيان...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50/50 via-white to-slate-50 flex items-center justify-center p-4 text-right" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-brand-100/80 text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">تم استلام إجاباتكِ بنجاح!</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              شكراً لكِ <strong className="text-brand-700">{contactName}</strong>. تم تحديث ملفكِ الإكلينيكي لدى{" "}
              {clinicName}، وسيقوم الفريق الطبي بمراجعته لضمان تقديم الرعاية الأمثل لكِ في موعدكِ القادم ✨
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>بياناتكِ الطبية سرية ومحفوظة وفق أعلى معايير الخصوصية.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 py-8 px-4 sm:px-6 text-right" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider block">
              {clinicName}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              استبيان تقييم البشرة والتاريخ الطبي
            </h1>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-lg mx-auto">
            مرحباً بكِ <strong className="text-slate-800">{contactName}</strong> 🌸 نرجو التكرم بالإجابة على
            هذه الأسئلة البسيطة لمساعدة أطبائنا وأخصائياتنا في تقديم خطة العلاج الأكثر أماناً وملاءمة لبشرتكِ.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question 1: Skin Type */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-brand-600">السؤال 1</span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                ما هو نوع بشرتكِ في الغالب؟
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {[
                { id: "combination", title: "بشرة مختلطة", desc: "دهنية في الجبهة والأنف (منطقة T) وجافة في الخدين" },
                { id: "dry", title: "بشرة جافة", desc: "شديدة الجفاف، باهتة، أو مشدودة تحتاج لترطيب دائم" },
                { id: "oily", title: "بشرة دهنية", desc: "لمعان واضح ومسام واسعة ومعرضة للحبوب" },
                { id: "sensitive", title: "بشرة حساسة", desc: "سريعة الاحمرار والتهيج من الشمس أو المنتجات" },
                { id: "normal", title: "بشرة عادية", desc: "متوازنة بدون إفرازات دهنية أو جفاف شديد" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSkinType(item.id)}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                    skinType === item.id
                      ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      skinType === item.id ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"
                    }`}
                  >
                    {skinType === item.id && <Check className="h-3 w-3" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Fitzpatrick Scale */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-brand-600">السؤال 2</span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                كيف تتفاعل بشرتكِ مع أشعة الشمس (مقياس لون البشرة)؟
              </h3>
            </div>

            <div className="space-y-2 pt-1">
              {[
                { id: "II", title: "بشرة فاتحة / بيضاء", desc: "تحترق بسهولة عند التعرض للشمس ونادراً ما تكتسب سمرة (Type I - II)" },
                { id: "III", title: "بشرة حنطية فاتحة أو متوسطة", desc: "تحترق باعتدال وتكتسب سمرة تدريجياً (Type III)" },
                { id: "IV", title: "بشرة حنطية مائلة للسمار", desc: "نادراً ما تحترق وتكتسب سمرة برونزية بسهولة (Type IV)" },
                { id: "V", title: "بشرة سمراء أو داكنة", desc: "لا تحترق تقريباً وتكتسب سمرة داكنة فوراً (Type V - VI)" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setFitzpatrickScale(item.id)}
                  className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between ${
                    fitzpatrickScale === item.id
                      ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                        fitzpatrickScale === item.id ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"
                      }`}
                    >
                      {fitzpatrickScale === item.id && <Check className="h-3 w-3" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: Target Areas */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-brand-600">السؤال 3</span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                ما هي المناطق التي تودين التركيز عليها ومعالجتها؟ (يمكن اختيار أكثر من منطقة)
              </h3>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {[
                "الوجه والرقبة",
                "نضارة وتنظيف البشرة (هيدرافاشيل)",
                "إزالة شعر الجسم كامل بالليزر",
                "منطقة الشفاه وتحديد الابتسامة",
                "محيط العينين والهالات",
                "تجديد ونضارة اليدين",
                "تفتيح وتوحيد لون الجسم",
                "علاج آثار وحبوب البشرة",
              ].map((area) => {
                const isSelected = targetAreas.includes(area);
                return (
                  <button
                    type="button"
                    key={area}
                    onClick={() => toggleTargetArea(area)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all border ${
                      isSelected
                        ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected ? `✓ ${area}` : `+ ${area}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 4: Allergies */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-brand-600">السؤال 4</span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                هل لديكِ أي حساسية دوائية أو جلدية معروفة؟
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {[
                "لا يوجد تحسس معروف",
                "حساسية من اللاتكس (القفازات الطبية)",
                "حساسية من مخدر الليدوكائين (كريم التخدير)",
                "حساسية من البنسلين أو المضادات الحيوية",
                "حساسية من أحماض التقشير أو العطور",
              ].map((al) => {
                const isChecked = allergies.includes(al);
                return (
                  <button
                    type="button"
                    key={al}
                    onClick={() => toggleAllergy(al)}
                    className={`p-3 rounded-xl border text-right text-xs transition-colors flex items-center gap-2.5 ${
                      isChecked
                        ? "bg-rose-50 border-rose-300 text-rose-900 font-semibold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked ? "bg-rose-600 border-rose-600 text-white" : "border-slate-300"
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3" />}
                    </div>
                    <span>{al}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                هل توجد حساسية أخرى لم تُذكر؟
              </label>
              <input
                type="text"
                placeholder="اكتبي نوع الحساسية إن وجد..."
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Question 5: Contraindications */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-brand-600">السؤال 5</span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                موانع وظروف صحية خاصة (لأمان الجلسة)
              </h3>
            </div>

            <div className="space-y-2 pt-1">
              {[
                "حمل أو رضاعة حالية",
                "استخدام حبوب روأكوتان (أيزوتريتينوين) خلال الـ 6 أشهر الماضية",
                "استخدام أدوية سيولة الدم",
                "عمل تسمير بشرة (تان) خلال الأسبوعين الماضيين",
              ].map((c) => {
                const isChecked = contraindications.includes(c);
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleContraindication(c)}
                    className={`w-full p-3 rounded-xl border text-right text-xs transition-colors flex items-center gap-2.5 ${
                      isChecked
                        ? "bg-amber-50 border-amber-300 text-amber-900 font-semibold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked ? "bg-amber-600 border-amber-600 text-white" : "border-slate-300"
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3" />}
                    </div>
                    <span>{c}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 6: Notes */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              أي استفسارات أو ملاحظات ترغبين في إخبار الطبيب / الأخصائية بها قبل الجلسة؟
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: أفضل استخدام كريم تخدير قبل الجلسة بنصف ساعة، لدي استفسار حول عدد الجلسات المتوقعة..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-4 text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-2xl shadow-lg shadow-brand-500/20 gap-2 h-auto"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? "جاري إرسال البيانات..." : "إرسال الاستبيان واعتماد البيانات"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
