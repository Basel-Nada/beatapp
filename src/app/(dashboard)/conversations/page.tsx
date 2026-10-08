"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Phone,
  Calendar,
  User,
  Plus,
  Sparkles,
  Paperclip,
  Clock,
  CheckCheck,
  Check,
  ExternalLink,
  MessageCircle,
  Instagram,
  Mail,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeArabicTime, formatArabicTime } from "@/lib/date";
import { Conversation, Message } from "@/types";

const QUICK_REPLIES = [
  "أهلاً بك في عيادات لومينا! كيف نقدر نخدمك اليوم؟ 🌸",
  "باقات الليزر لدينا تشمل جلسة رتوش مجانية بعد 10 أيام بأجهزة جنتل برو ✨",
  "موقعنا: طريق الملك فهد، العليا، الرياض. يسعدنا استقبالكم!",
  "هل يناسبك موعد اليوم الساعة 5:00 مساءً؟",
];

function ConversationsContent() {
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("id");

  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(initialConvId);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputText, setInputText] = React.useState("");
  const [loadingConv, setLoadingConv] = React.useState(true);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [channelFilter, setChannelFilter] = React.useState<string>("all");

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch conversations
  React.useEffect(() => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        setConversations(data.conversations || []);
        if (!selectedId && data.conversations?.length > 0) {
          setSelectedId(data.conversations[0].id);
        }
        setLoadingConv(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingConv(false);
      });
  }, []);

  // 2. Fetch messages for selected conversation
  React.useEffect(() => {
    if (!selectedId) return;

    setLoadingMessages(true);
    fetch(`/api/conversations/${selectedId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages || []);
        setLoadingMessages(false);
        setTimeout(scrollToBottom, 50);
      })
      .catch((err) => {
        console.error(err);
        setLoadingMessages(false);
      });
  }, [selectedId]);

  // Handle Send
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !selectedId || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setInputText("");
        setTimeout(scrollToBottom, 50);

        // Update list snippet
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedId
              ? { ...c, lastMessageBody: text, lastMessageDate: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedId);

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
              <h2 className="text-base font-bold text-slate-900">المحادثات</h2>
              <span className="text-xs text-slate-500 font-medium">
                {conversations.length} نشطة
              </span>
            </div>

            {/* Channel filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                { id: "all", label: "الكل" },
                { id: "whatsapp", label: "واتساب" },
                { id: "instagram", label: "إنستغرام" },
                { id: "sms", label: "SMS" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setChannelFilter(f.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    channelFilter === f.id
                      ? "bg-brand-700 text-white"
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
              <div className="p-8 text-center text-xs text-slate-400">لا توجد محادثات هنا</div>
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
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatRelativeArabicTime(conv.lastMessageDate)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mb-1.5">
                        {conv.lastMessageBody || "بدون رسائل سابقة"}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {conv.channel === "whatsapp" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              واتساب
                            </span>
                          )}
                          {conv.channel === "instagram" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                              إنستغرام
                            </span>
                          )}
                          {conv.channel === "sms" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                              SMS
                            </span>
                          )}
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
                    <Badge variant="brand" className="text-[10px] py-0">
                      {selectedConv.channel === "whatsapp" ? "واتساب" : "إنستغرام"}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {selectedConv.contactPhone || "بدون رقم مسجل"}
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex items-center gap-2">
                <Link href={`/contacts/${selectedConv.contactId}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <User className="h-3.5 w-3.5 ml-1" />
                    <span>ملف العميل</span>
                  </Button>
                </Link>
                <Link href={`/appointments?contactId=${selectedConv.contactId}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <Calendar className="h-3.5 w-3.5 ml-1" />
                    <span>حجز موعد</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Messages Scrollable Timeline */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/40">
              {loadingMessages ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  جاري تحميل المحادثة...
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  ابدأ المحادثة الآن بإرسال رسالة
                </div>
              ) : (
                messages.map((msg) => {
                  const isOutbound = msg.direction === "outbound";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOutbound ? "items-start" : "items-end"}`}
                    >
                      <div
                        className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-xs shadow-soft ${
                          isOutbound
                            ? "bg-brand-700 text-white rounded-tr-none"
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                        }`}
                      >
                        {msg.senderName && (
                          <div
                            className={`text-[10px] font-semibold mb-1 ${
                              isOutbound ? "text-brand-200" : "text-brand-800"
                            }`}
                          >
                            {msg.senderName}
                          </div>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                            isOutbound ? "text-brand-200" : "text-slate-400"
                          }`}
                        >
                          <span>{formatArabicTime(msg.createdAt)}</span>
                          {isOutbound && <CheckCheck className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies Carousel */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[11px] font-medium text-slate-500 shrink-0 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                ردود سريعة:
              </span>
              {QUICK_REPLIES.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(reply)}
                  className="bg-white border border-slate-200 hover:border-brand-500 hover:text-brand-800 px-2.5 py-1 rounded-lg text-[11px] text-slate-700 whitespace-nowrap shadow-xs transition-colors shrink-0"
                >
                  {reply.length > 30 ? reply.substring(0, 30) + "..." : reply}
                </button>
              ))}
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
                <button
                  type="button"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="إرفاق ملف أو صورة"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
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
                  className="h-10 px-4 gap-1.5"
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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <MessageCircle className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">اختر محادثة للبدء</h3>
            <p className="text-xs text-slate-400 mt-1">انقر على أي محادثة في القائمة لعرض تفاصيلها والرد على العميل</p>
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
