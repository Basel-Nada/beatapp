"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, User, MessageSquare, Calendar, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Contact, Conversation, Appointment } from "@/types";

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }

    const fetchInitial = async () => {
      setLoading(true);
      try {
        const [cRes, convRes] = await Promise.all([
          fetch("/api/contacts").then(r => r.json()),
          fetch("/api/conversations").then(r => r.json()),
        ]);
        setContacts(cRes.contacts || []);
        setConversations(convRes.conversations || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [isOpen]);

  const filteredContacts = React.useMemo(() => {
    if (!query) return contacts.slice(0, 3);
    const q = query.toLowerCase();
    return contacts.filter(
      c => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [contacts, query]);

  const filteredConversations = React.useMemo(() => {
    if (!query) return conversations.slice(0, 3);
    const q = query.toLowerCase();
    return conversations.filter(
      c => c.contactName.toLowerCase().includes(q) || c.lastMessageBody.toLowerCase().includes(q)
    );
  }, [conversations, query]);

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="البحث السريع في العيادة" maxWidth="md">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث بالاسم، رقم الجوال، أو الرسالة..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            autoFocus
          />
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">جاري البحث...</div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-4 pr-1">
            {/* Contacts result */}
            {filteredContacts.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5 px-2">العملاء</div>
                <div className="space-y-1">
                  {filteredContacts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(`/contacts/${c.id}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-right transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-800">{c.name}</div>
                          <div className="text-[11px] text-slate-400">{c.phone} • {c.serviceInterest}</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-brand-600 group-hover:-translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversations result */}
            {filteredConversations.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5 px-2">المحادثات</div>
                <div className="space-y-1">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelect(`/conversations?id=${conv.id}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-right transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="max-w-[260px] truncate">
                          <div className="text-xs font-semibold text-slate-800">{conv.contactName}</div>
                          <div className="text-[11px] text-slate-400 truncate">{conv.lastMessageBody}</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-brand-600 group-hover:-translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredContacts.length === 0 && filteredConversations.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">
                لم يتم العثور على نتائج تطابق &quot;{query}&quot;
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
