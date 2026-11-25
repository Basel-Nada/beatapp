import { User, UserRole } from "@/types";
import { getHighLevelConfig, highLevelRequest } from "./client";
import { mockStore } from "./mock-store";

interface GhlUserResponse {
  users: Array<{
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    roles?: {
      type?: string;
      role?: string;
    };
  }>;
}

export const UsersService = {
  async getUsers(locationId?: string): Promise<User[]> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.getUsers();
    }

    try {
      const res = await highLevelRequest<GhlUserResponse>(
        `/users/?locationId=${config.locationId}`,
        { cacheTtlMs: 5 * 60 * 1000 },
        config.locationId
      );

      if (!res.users || res.users.length === 0) {
        return mockStore.getUsers();
      }

      const ghlUsers = res.users.map((ghl) => {
        const name =
          ghl.name ||
          `${ghl.firstName || ""} ${ghl.lastName || ""}`.trim() ||
          ghl.email ||
          "موظف";

        const isGhlAdmin = ghl.roles?.role === "admin";
        const role: UserRole = isGhlAdmin ? "admin" : "sales";

        return {
          id: ghl.id,
          name,
          email: ghl.email || "",
          role,
          title: isGhlAdmin ? "مدير النظام" : "مستشار مبيعات",
          phone: ghl.phone || "",
          locationId: config.locationId || "9m3VyK57t1Ah7Pmen0gA",
          tenantId: "tenant-beatapp-live",
        };
      });

      // Merge with non-live custom tenant users (like Faisal in Eamar AlOma)
      const nonLiveUsers = mockStore
        .getUsers()
        .filter((u) => u.tenantId !== "tenant-beatapp-live");

      return [...ghlUsers, ...nonLiveUsers];
    } catch (e) {
      console.warn("Failed to fetch live users from BeatApp API, falling back to local users:", e);
      return mockStore.getUsers();
    }
  },

  async createUser(data: Partial<User>, locationId?: string): Promise<User> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.createUser(data);
    }

    try {
      const names = (data.name || "موظف").split(" ");
      const firstName = names[0] || "موظف";
      const lastName = names.slice(1).join(" ") || "جديد";

      const res = await highLevelRequest<{ user: { id: string } }>(
        "/users/",
        {
          method: "POST",
          body: JSON.stringify({
            firstName,
            lastName,
            email: data.email,
            phone: data.phone,
            type: "account",
            role: data.role === "admin" ? "admin" : "user",
            locationIds: [config.locationId],
          }),
        },
        config.locationId
      );

      const created: User = {
        id: res.user?.id || `user-${Date.now()}`,
        name: data.name || `${firstName} ${lastName}`,
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "sales",
        locationId: config.locationId || "9m3VyK57t1Ah7Pmen0gA",
        tenantId: data.tenantId,
        title: data.title || "مستشار مبيعات",
        department: data.department || "المبيعات",
        status: "active",
      };

      // Also track in mock store for instant UI reactivity
      mockStore.createUser(created);
      return created;
    } catch (err) {
      console.warn("Failed to create user in HighLevel, storing locally in BeatApp:", err);
      return mockStore.createUser(data);
    }
  },

  async updateUser(id: string, data: Partial<User>, locationId?: string): Promise<User | undefined> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.updateUser(id, data);
    }

    try {
      const names = (data.name || "").split(" ");
      const body: Record<string, unknown> = {};
      if (data.name) {
        body.firstName = names[0];
        body.lastName = names.slice(1).join(" ");
      }
      if (data.email) body.email = data.email;
      if (data.phone) body.phone = data.phone;
      if (data.role) body.role = data.role === "admin" ? "admin" : "user";

      await highLevelRequest(
        `/users/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        },
        config.locationId
      );
      return mockStore.updateUser(id, data);
    } catch (err) {
      console.warn("Failed to update user in HighLevel, updating locally:", err);
      return mockStore.updateUser(id, data);
    }
  },

  async deleteUser(id: string, locationId?: string): Promise<boolean> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.deleteUser(id);
    }

    try {
      await highLevelRequest(
        `/users/${id}`,
        {
          method: "DELETE",
        },
        config.locationId
      );
      return mockStore.deleteUser(id);
    } catch (err) {
      console.warn("Failed to delete user in HighLevel, deleting locally:", err);
      return mockStore.deleteUser(id);
    }
  },
};
