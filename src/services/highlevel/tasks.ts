import { ContactTask } from "@/types";
import { getHighLevelConfig, highLevelRequest } from "./client";
import { mockStore } from "./mock-store";

interface GhlTaskItem {
  id: string;
  title: string;
  body?: string;
  dueDate?: string;
  completed?: boolean;
  assignedTo?: string;
  contactId?: string;
  dateAdded?: string;
}

interface GhlTasksResponse {
  tasks: GhlTaskItem[];
}

export const TasksService = {
  async getTasks(contactId?: string, locationId?: string): Promise<ContactTask[]> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode || !contactId || contactId.startsWith("cnt-")) {
      return mockStore.getTasks(contactId);
    }

    try {
      const res = await highLevelRequest<GhlTasksResponse>(
        `/contacts/${contactId}/tasks`,
        { cacheTtlMs: 15000 },
        config.locationId
      );

      const list: ContactTask[] = (res.tasks || []).map((t) => ({
        id: t.id,
        contactId: t.contactId || contactId,
        title: t.title || "مهمة متابعة",
        dueDate: t.dueDate || new Date().toISOString(),
        completed: !!t.completed,
        assignedTo: t.assignedTo || "فريق العيادة",
        description: t.body || "",
        createdAt: t.dateAdded || new Date().toISOString(),
      }));

      // Combine with any local tasks in mockStore
      const local = mockStore.getTasks(contactId);
      const existingIds = new Set(list.map((item) => item.id));
      for (const lt of local) {
        if (!existingIds.has(lt.id)) {
          list.unshift(lt);
        }
      }

      return list;
    } catch {
      return mockStore.getTasks(contactId);
    }
  },

  async createTask(
    data: {
      contactId: string;
      title: string;
      dueDate?: string;
      description?: string;
      assignedTo?: string;
    },
    locationId?: string
  ): Promise<ContactTask> {
    const config = getHighLevelConfig(locationId);

    // Save in local store first for instant UI response
    const local = mockStore.createTask({
      contactId: data.contactId,
      title: data.title,
      dueDate: data.dueDate,
      description: data.description,
      assignedTo: data.assignedTo,
    });

    if (config.isDemoMode || data.contactId.startsWith("cnt-")) {
      return local;
    }

    try {
      const payload = {
        title: data.title,
        body: data.description || "",
        dueDate: data.dueDate || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        completed: false,
      };

      const res = await highLevelRequest<{ task: GhlTaskItem }>(
        `/contacts/${data.contactId}/tasks`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        config.locationId
      );

      if (res?.task) {
        return {
          id: res.task.id,
          contactId: data.contactId,
          title: res.task.title || data.title,
          dueDate: res.task.dueDate || payload.dueDate,
          completed: false,
          assignedTo: data.assignedTo || "فريق العيادة",
          description: res.task.body || data.description,
          createdAt: res.task.dateAdded || new Date().toISOString(),
        };
      }

      return local;
    } catch {
      return local;
    }
  },

  async toggleTaskCompleted(
    contactId: string,
    taskId: string,
    completed: boolean,
    locationId?: string
  ): Promise<ContactTask | null> {
    const config = getHighLevelConfig(locationId);

    const updated = mockStore.toggleTask(taskId, completed);

    if (config.isDemoMode || taskId.startsWith("tsk-")) {
      return updated || null;
    }

    try {
      await highLevelRequest(
        `/contacts/${contactId}/tasks/${taskId}/completed`,
        {
          method: "PUT",
          body: JSON.stringify({ completed }),
        },
        config.locationId
      );
      return updated || null;
    } catch {
      return updated || null;
    }
  },

  async deleteTask(contactId: string, taskId: string, locationId?: string): Promise<boolean> {
    const config = getHighLevelConfig(locationId);
    mockStore.deleteTask(taskId);

    if (config.isDemoMode || taskId.startsWith("tsk-")) {
      return true;
    }

    try {
      await highLevelRequest(
        `/contacts/${contactId}/tasks/${taskId}`,
        { method: "DELETE" },
        config.locationId
      );
      return true;
    } catch {
      return true;
    }
  },
};
