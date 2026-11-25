"use client";

import * as React from "react";
import {
  Star,
  Send,
  MessageSquare,
  CheckCircle2,
  ThumbsUp,
  Share2,
  TrendingUp,
  Globe,
  Filter,
  Reply,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatArabicDate } from "@/lib/date";
import { Review, ReviewStats, Contact } from "@/types";

export default function ReviewsPage() {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [stats, setStats] = React.useState<ReviewStats | null>(null);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [ratingFilter, setRatingFilter] = React.useState<number | undefined>(undefined);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  // Send Review Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);
  const [selectedContactId, setSelectedContactId] = React.useState<string>("");
  const [requestChannel, setRequestChannel] = React.useState<"whatsapp" | "sms">("whatsapp");
  const [sendingRequest, setSendingRequest] = React.useState(false);

  // Reply Modal State
  const [replyingReview, setReplyingReview] = React.useState<Review | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [sendingReply, setSendingReply] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = ratingFilter ? `?rating=${ratingFilter}` : "";
      const [revRes, cntRes] = await Promise.all([
        fetch(`/api/reviews${q}`).then((r) => r.json()),
        fetch("/api/contacts").then((r) => r.json()),
      ]);
      setReviews(revRes.reviews || []);
      setStats(revRes.stats || null);
      setContacts(cntRes.contacts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [ratingFilter]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) return;

    setSendingRequest(true);
    try {
      const res = await fetch("/api/reviews/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedContactId,
          channel: requestChannel,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsRequestModalOpen(false);
        setActionSuccess(data.message || "تم إرسال طلب التقييم بنجاح");
        setTimeout(() => setActionSuccess(null), 4000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingRequest(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: replyingReview.id,
          replyText: replyText.trim(),
        }),
      });
      if (res.ok) {
        setReplyingReview(null);
        setReplyText("");
        setActionSuccess("تم نشر رد العيادة على التقييم بنجاح");
        setTimeout(() => setActionSuccess(null), 4000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">التقييمات وإدارة السمعة</h1>
            <Badge variant="warning" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              إدارة السمعة والتقييمات الذكية
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            متابعة تقييمات العملاء لعيادات التجميل، الرد الرسمي، وإرسال روابط طلب تقييمات Google عبر الواتساب.
          </p>
        </div>

        <Button
          onClick={() => {
            if (contacts.length > 0 && !selectedContactId) {
              setSelectedContactId(contacts[0].id);
            }
            setIsRequestModalOpen(true);
          }}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white"
        >
          <Send className="h-4 w-4" />
          <span>إرسال طلب تقييم Google</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">متوسط التقييم العام</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">{stats?.averageRating || 4.9}</span>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">تقييم موثق ممتاز</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Star className="h-6 w-6 fill-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">إجمالي التقييمات المكتوبة</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalReviews || 128}</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">+14 هذا الشهر</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Globe className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">طلبات التقييم المرسلة</p>
              <h3 className="text-2xl font-bold text-brand-600 mt-1">{stats?.requestsSentThisMonth || 86}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">خلال 30 يوماً</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <Send className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">نسبة الاستجابة والتحويل</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats?.conversionRate || 68.5}%</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">من الطلب إلى تقييم إيجابي</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
        <button
          onClick={() => setRatingFilter(undefined)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
            ratingFilter === undefined
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          جميع التقييمات
        </button>
        {[5, 4, 3].map((star) => (
          <button
            key={star}
            onClick={() => setRatingFilter(star)}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
              ratingFilter === star
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>{star}</span>
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          </button>
        ))}
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">جاري تحميل التقييمات...</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">لا توجد تقييمات مطابقة</div>
        ) : (
          reviews.map((rev) => (
            <Card key={rev.id} className="border-slate-200/80 shadow-sm hover:border-slate-300 transition-colors">
              <CardContent className="p-5 sm:p-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-brand-800 flex items-center justify-center font-bold text-sm">
                      {rev.contactName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{rev.contactName}</h4>
                        <span className="text-[11px] text-slate-400">• {formatArabicDate(rev.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {rev.platform === "google" && (
                      <Badge variant="info" className="text-[11px] gap-1">
                        <Globe className="h-3 w-3" />
                        <span>Google Reviews</span>
                      </Badge>
                    )}
                    {rev.platform === "whatsapp" && (
                      <Badge variant="success" className="text-[11px] gap-1">
                        <span>واتساب مباشر</span>
                      </Badge>
                    )}
                    {rev.treatmentName && (
                      <Badge variant="neutral" className="text-[11px]">
                        {rev.treatmentName}
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {rev.comment}
                </p>

                {/* Reply Section */}
                {rev.reply ? (
                  <div className="mr-6 p-3 bg-brand-50/50 border border-brand-100 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-brand-900 font-semibold">
                      <Reply className="h-3.5 w-3.5 text-brand-600" />
                      <span>رد العيادة الرسمي:</span>
                      {rev.replyDate && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({formatArabicDate(rev.replyDate)})
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700">{rev.reply}</p>
                  </div>
                ) : (
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyingReview(rev);
                        setReplyText("");
                      }}
                      className="text-xs text-brand-700 hover:bg-brand-50 gap-1 h-8"
                    >
                      <Reply className="h-3.5 w-3.5" />
                      <span>الرد على التقييم</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Send Review Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="إرسال طلب تقييم Google للعميل"
        maxWidth="md"
      >
        <form onSubmit={handleSendRequest} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اختر العميل</label>
            <select
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800"
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - {c.serviceInterest || "زيارة العيادة"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">وسيلة الإرسال</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRequestChannel("whatsapp")}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                  requestChannel === "whatsapp"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                رسالة واتساب (موصى بها)
              </button>
              <button
                type="button"
                onClick={() => setRequestChannel("sms")}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                  requestChannel === "sms"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                رسالة نصية SMS
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>معاينة الرسالة للعميل:</span>
            </p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              &quot;عزيزتي [الاسم]، يسعدنا دائماً استقبالكِ وخدمتكِ ✨ رأيكِ يهمنا ويسهم في تطوير خدماتنا. نرجو التكرم بمشاركتنا تقييمكِ السريع عبر Google: https://g.page/r/beatapp-review/review&quot;
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRequestModalOpen(false)}
              className="text-xs"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={sendingRequest}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1.5"
            >
              {sendingRequest ? "جاري الإرسال..." : "إرسال الرابط الآن"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reply Modal */}
      <Modal
        isOpen={!!replyingReview}
        onClose={() => setReplyingReview(null)}
        title={`الرد على تقييم: ${replyingReview?.contactName || ""}`}
        maxWidth="md"
      >
        <form onSubmit={handleSendReply} className="space-y-4 text-right">
          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            &quot;{replyingReview?.comment}&quot;
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">نص الرد الرسمي</label>
            <textarea
              required
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="شكراً لك أستاذ/ة على التقييم الجميل، يسعدنا دائماً رضاكِ..."
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReplyingReview(null)}
              className="text-xs"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={sendingReply}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1.5"
            >
              {sendingReply ? "جاري النشر..." : "نشر الرد"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
