"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Calendar,
  User,
  Sparkles,
  Paperclip,
  CheckCheck,
  Check,
  MessageCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeArabicTime, formatArabicTime } from "@/lib/date";
import { Conversation, Message } from "@/types";
import { useApp } from "@/context/app-context";

const CLINIC_QUICK_REPLIES = [
  { label: "ترحيب واستقبال 🌸", text: "أهلاً بكِ في عياداتنا للتجميل والليزر! كيف نقدر نخدمكِ اليوم؟ ✨" },
  { label: "🌿 تعليمات بعد الجلسة", text: "تعليمات ما بعد الجلسة: يُرجى تجنب الماء الحار والساونا لمدة 24 ساعة، واستخدام كريم مرطب مهدئ 3 مرات يومياً، والالتزام بواقي شمس. فريقنا دائماً بخدمتكِ 🌸" },
  { label: "💉 حجز موعد استشارة", text: "يسعدنا تأكيد موعد جلستكِ القادمة. هل يناسبكِ الحضور يوم غد الساعة 5:00 عصراً؟" },
  { label: "⭐ استطلاع الرأي والتقييم", text: "رأيكِ يسعدنا ويهمنا جداً! نرجو التكرم بمشاركتنا تقييم زيارتكِ اليوم لضمان أفضل تجربة ✨" },
];

const REAL_ESTATE_QUICK_REPLIES = [
  { label: "كتالوج ومخطط المشروع 🏢", text: "أهلاً بك أستاذنا، مرفق لك كتالوج ومخططات الوحدات السكنية المتاحة وتفاصيل خطط التقسيط السنوي." },
  { label: "تأكيد معاينة ميدانية 📍", text: "يسرنا تأكيد موعد معاينتك الميدانية للمشروع يوم غد الساعة 5:00 عصراً. سيكون مستشارك العقاري في استقبالك." },
  { label: "قفل حجز وحدة حصرياً 🔒", text: "تم قفل حجز الوحدة باسمكم حصرياً لمدة 48 ساعة لمنع أي حجز آخر. نرجو استكمال توقيع العقد النهائي." },
  { label: "متابعة اهتمام عقاري 💬", text: "أهلاً بك، نود متابعة انطباعكم عن العرض الذي ناقشناه بخصوص الوحدات. هل تود أن نقوم بزيارة للمشروع هذا الأسبوع؟" },
];

function ConversationsContent() {
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("id");
  const { currentIndustry, currentUser, isAdmin, users } = useApp();
  const isStaff = currentUser.role === "sales" || currentUser.role === "receptionist";
  const replies = currentIndustry === "real_estate" ? REAL_ESTATE_QUICK_REPLIES : CLINIC_QUICK_REPLIES;

  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(initialConvId);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputText, setInputText] = React.useState("");
  const [loadingConv, setLoadingConv] = React.useState(true);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [channelFilter, setChannelFilter] = React.useState<string>("all");
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [assigning, setAssigning] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // 1. Fetch conversations with silent background refresh
  const fetchConversations = React.useCallback(async (isBackground = false) => {
    if (!isBackground) setLoadingConv(true);
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      const list: Conversation[] = data.conversations || [];

      // Sort by newest activity date
      const sorted = [...list].sort(
        (a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
      );

      setConversations(sorted);

      if (!selectedId && sorted.length > 0) {
        setSelectedId(sorted[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoadingConv(false);
    }
  }, [selectedId]);

  // Initial fetch + Polling every 6s for conversations list
  React.useEffect(() => {
    fetchConversations(false);
    const interval = setInterval(() => {
      fetchConversations(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // 2. Fetch messages with silent background refresh
  const fetchMessages = React.useCallback(async (convId: string, isBackground = false) => {
    if (!convId) return;
    if (!isBackground) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
      if (!isBackground) {
        setTimeout(() => scrollToBottom(false), 50);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoadingMessages(false);
    }
  }, []);

  // When selected conversation changes
  React.useEffect(() => {
    if (!selectedId) return;
    fetchMessages(selectedId, false);
    setSendError(null);

    // Live auto-poll for new messages every 3.5 seconds
    const msgInterval = setInterval(() => {
      fetchMessages(selectedId, true);
    }, 3500);
    return () => clearInterval(msgInterval);
  }, [selectedId, fetchMessages]);

  const selectedConv = conversations.find((c) => c.id === selectedId);

  // Check if any message failed due to insufficient funds
  const hasInsufficientFunds = messages.some(
    (m) => m.status === "failed" && m.errorMessage?.includes("insufficient funds")
  );

  // Handle Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !selectedId || sending) return;

    setSending(true);
    setSendError(null);

    const payload = {
      body: text,
      contactId: selectedConv?.contactId,
    };

    try {
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setInputText("");
        setTimeout(() => scrollToBottom(true), 50);

        // Immediately move active conversation to the very top of the list!
        setConversations((prev) => {
          const target = prev.find((c) => c.id === selectedId);
          if (!target) return prev;
          const updatedTarget: Conversation = {
            ...target,
            lastMessageBody: text,
            lastMessageDate: new Date().toISOString(),
          };
          const others = prev.filter((c) => c.id !== selectedId);
          return [updatedTarget, ...others];
        });

        // Trigger message refetch after 1.5s to capture actual delivery status from HighLevel
        setTimeout(() => {
          fetchMessages(selectedId, true);
        }, 1500);
      } else {
        setSendError(data.error || data.details || "تعذر إرسال الرسالة عبر خادم المحادثات");
      }
    } catch (e: unknown) {
      const err = e as Error;
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = React.useMemo(() => {
    if (channelFilter === "all") return conversations;
    return conversations.filter((c) => c.channel === channelFilter);
  }, [conversations, channelFilter]);

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-soft">
      <div className="flex flex-1 h-full min-h-0">
        {/* Right side in RTL: Conversations List */}
        <div className="w-full sm:w-80 md:w-96 border-l border-slate-200 flex flex-col bg-slate-50/50 shrink-0">
          {/* Header & Filter */}
          <div className="p-3.5 border-b border-slate-200 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">المحادثات</h2>
                <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>مباشر لحظياً</span>
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {isStaff ? `${conversations.length} مسندة لكِ` : `${conversations.length} نشطة`}
              </span>
            </div>

            {/* Channel filter pills (Without SMS) */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                { id: "all", label: "الكل" },
                { id: "whatsapp", label: "واتساب" },
                { id: "instagram", label: "إنستغرام" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setChannelFilter(f.id)}
                  className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    channelFilter === f.id
                      ? "bg-brand-700 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConv ? (
              <div className="p-8 text-center text-xs text-slate-400">جاري تحميل المحادثات...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">
                  {isStaff ? "لا توجد محادثات مسندة لحسابكِ حالياً" : "لا توجد محادثات هنا"}
                </p>
                {isStaff && (
                  <p className="text-[11px] text-slate-400">
                    تظهر هنا فقط المحادثات الخاصة بالعملاء المسندين لكِ في BeatApp.
                  </p>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full text-right p-3.5 transition-colors flex items-start gap-3 ${
                      isSelected
                        ? "bg-teal-50/70 border-r-4 border-brand-700"
                        : "hover:bg-slate-100/60"
                    }`}
                  >
                    <Avatar name={conv.contactName} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {conv.contactName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {formatRelativeArabicTime(conv.lastMessageDate)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mb-1.5 font-normal">
                        {conv.lastMessageBody || "بدون رسائل سابقة"}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            واتساب
                          </span>
                          {conv.opportunityStage && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {conv.opportunityStage}
                            </span>
                          )}
                        </div>

                        {conv.unreadCount > 0 && (
                          <span className="h-4 min-w-4 px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center/Left: Active Conversation Chat View */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
            {/* Top Active Chat Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <Avatar name={selectedConv.contactName} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedConv.contactName}
                    </h3>
                    <Badge variant="brand" className="text-[10px] py-0 font-bold">
                      واتساب
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono" dir="ltr">
                    {selectedConv.contactPhone || "بدون رقم مسجل"}
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl text-xs">
                    <span className="text-[10px] text-slate-500 font-semibold">إسناد لموظف:</span>
                    <select
                      value={selectedConv.assignedTo || ""}
                      disabled={assigning}
                      onChange={async (e) => {
                        const newUserId = e.target.value || null;
                        setAssigning(true);
                        try {
                          await fetch("/api/contacts", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              contactIds: [selectedConv.contactId],
                              userId: newUserId,
                            }),
                          });
                          fetchConversations(true);
                        } catch (err) {
                          console.error("Failed to assign", err);
                        } finally {
                          setAssigning(false);
                        }
                      }}
                      className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-1.5 py-0.5 text-slate-800 focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">(غير مسند)</option>
                      {users
                        .filter((u) => u.role !== "super_admin")
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <Link href={`/contacts/${selectedConv.contactId}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <User className="h-3.5 w-3.5 ml-1" />
                    <span>ملف العميل</span>
                  </Button>
                </Link>
                <Link href={`/appointments?contactId=${selectedConv.contactId}&name=${encodeURIComponent(selectedConv.contactName)}&phone=${encodeURIComponent(selectedConv.contactPhone || "")}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <Calendar className="h-3.5 w-3.5 ml-1" />
                    <span>حجز موعد</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Insufficient Funds Warning Alert if applicable */}
            {hasInsufficientFunds && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">تنبيه رصيد الرسائل: </span>
                  <span>
                    محفظة الرسائل بحاجة للشحن. يتم تسجيل الرسائل ويمكنك المراسلة عبر واتساب بنقرة واحدة من قوالب الواتساب.
                  </span>
                </div>
              </div>
            )}

            {/* Messages Scrollable Timeline */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/40">
              {loadingMessages ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  جاري تحميل المحادثة...
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  لا توجد رسائل سابقة. أرسل رسالة للبدء!
                </div>
              ) : (
                messages.map((msg) => {
                  const isOutbound = msg.direction === "outbound";
                  const isFailed = msg.status === "failed";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOutbound ? "items-start" : "items-end"}`}
                    >
                      <div
                        className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-xs shadow-soft ${
                          isOutbound
                            ? isFailed
                              ? "bg-rose-700 text-white rounded-tr-none"
                              : "bg-brand-700 text-white rounded-tr-none"
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                        
                        {/* Delivery status indicator */}
                        <div
                          className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${
                            isOutbound ? (isFailed ? "text-rose-200" : "text-brand-200") : "text-slate-400"
                          }`}
                        >
                          <span>{formatArabicTime(msg.createdAt)}</span>
                          {isOutbound && (
                            <>
                              {isFailed ? (
                                <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                                  <span>فشل التسليم للواتساب</span>
                                  <AlertCircle className="h-3 w-3" />
                                </span>
                              ) : (
                                <CheckCheck className="h-3 w-3" />
                              )}
                            </>
                          )}
                        </div>

                        {/* Error reason tooltip text */}
                        {isFailed && msg.errorMessage && (
                          <div className="mt-1 pt-1 border-t border-rose-600/50 text-[10px] text-rose-100 font-sans">
                            {msg.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error banner if send failed */}
            {sendError && (
              <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span className="truncate">{sendError}</span>
              </div>
            )}

            {/* Quick Replies Carousel */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[11px] font-medium text-slate-500 shrink-0 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                قوالب سريعة:
              </span>
              {replies.map((reply, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInputText(reply.text)}
                  className="bg-white border border-slate-200 hover:border-brand-500 hover:text-brand-800 px-2.5 py-1 rounded-lg text-[11px] text-slate-700 whitespace-nowrap shadow-xs transition-colors shrink-0"
                  title="إدراج القالب في الرسالة"
                >
                  {reply.label}
                </button>
              ))}
              <Link
                href="/templates"
                className="text-[11px] text-brand-700 hover:underline shrink-0 mr-auto font-semibold px-2"
              >
                المزيد من القوالب ↗
              </Link>
            </div>

            {/* Composer */}
            <div className="p-3.5 border-t border-slate-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="اكتب رسالتك هنا..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="h-10 px-5 gap-1.5 font-semibold"
                  disabled={!inputText.trim() || sending}
                  isLoading={sending}
                >
                  <span>إرسال</span>
                  <Send className="h-4 w-4 rotate-180" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <MessageCircle className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {isStaff ? `أهلاً بكِ ${currentUser.name}` : "اختر محادثة للبدء"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {isStaff
                ? "هذه الواجهة مخصصة لمحادثاتكِ مع عملائكِ المسندين لكِ في BeatApp. عند إسناد عميل لكِ من قِبل الإدارة ستظهر رسائله هنا فوراً."
                : "انقر على أي محادثة في القائمة لعرض تفاصيلها ومتابعة العميل"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConversationsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-[calc(100vh-8.5rem)] flex items-center justify-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
          جاري تحميل المحادثات...
        </div>
      }
    >
      <ConversationsContent />
    </React.Suspense>
  );
}
