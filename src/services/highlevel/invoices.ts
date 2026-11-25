import { Invoice } from "@/types";
import { getHighLevelConfig, highLevelRequest } from "./client";
import { mockStore } from "./mock-store";

export const InvoicesService = {
  async getInvoices(params?: { filter?: string; locationId?: string }): Promise<Invoice[]> {
    const config = getHighLevelConfig(params?.locationId);

    if (config.isDemoMode) {
      return mockStore.getInvoices(params?.filter);
    }

    try {
      const res = await highLevelRequest<{ invoices: any[] }>(
        `/invoices/?locationId=${config.locationId}&limit=50`,
        {},
        config.locationId
      );

      if (res?.invoices && Array.isArray(res.invoices)) {
        return res.invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber || `INV-${inv.id.slice(-4)}`,
          contactId: inv.contactId || "",
          contactName: inv.contact?.name || "عميل غير معروف",
          contactPhone: inv.contact?.phone || "",
          amount: inv.amount || 0,
          currency: "ر.س",
          status: inv.status || "pending",
          items: (inv.items || []).map((it: any) => ({
            id: it.id || String(Math.random()),
            description: it.name || it.description || "خدمة تجميلية",
            quantity: it.quantity || 1,
            unitPrice: it.price || 0,
            total: (it.quantity || 1) * (it.price || 0),
          })),
          paymentLink: inv.paymentLink || `https://pay.beatapp.med/${inv.id}`,
          paidAt: inv.paidAt,
          dueDate: inv.dueDate || new Date().toISOString(),
          createdAt: inv.createdAt || new Date().toISOString(),
          notes: inv.notes || "",
        }));
      }

      return mockStore.getInvoices(params?.filter);
    } catch {
      // Graceful fallback to mockStore
      return mockStore.getInvoices(params?.filter);
    }
  },

  async createInvoice(data: Partial<Invoice>, locationId?: string): Promise<Invoice> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.createInvoice(data);
    }

    try {
      const res = await highLevelRequest<{ invoice: any }>(
        "/invoices/",
        {
          method: "POST",
          body: JSON.stringify({
            locationId: config.locationId,
            contactId: data.contactId,
            name: data.contactName,
            items: data.items,
            dueDate: data.dueDate,
          }),
        },
        locationId
      );
      if (res?.invoice) {
        return {
          id: res.invoice.id,
          invoiceNumber: res.invoice.invoiceNumber || `INV-${res.invoice.id.slice(-4)}`,
          contactId: data.contactId || "",
          contactName: data.contactName || "",
          contactPhone: data.contactPhone || "",
          amount: data.amount || 0,
          currency: "ر.س",
          status: "pending",
          items: data.items || [],
          paymentLink: res.invoice.paymentLink || `https://pay.beatapp.med/${res.invoice.id}`,
          dueDate: data.dueDate || new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
      }
      return mockStore.createInvoice(data);
    } catch {
      return mockStore.createInvoice(data);
    }
  },

  async updateInvoiceStatus(id: string, status: Invoice["status"]): Promise<Invoice | undefined> {
    return mockStore.updateInvoiceStatus(id, status);
  },

  async sendInvoicePaymentLink(id: string, channel: "whatsapp" | "sms" = "whatsapp"): Promise<{ success: boolean; message: string }> {
    return mockStore.sendInvoicePaymentLink(id, channel);
  },
};
