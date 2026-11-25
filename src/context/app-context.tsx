"use client";

import * as React from "react";
import { IndustryType, Tenant, User } from "@/types";
import { DEFAULT_MOCK_USER, MOCK_USERS, MOCK_TENANTS, DEFAULT_MOCK_TENANT } from "@/lib/mock-data";

interface AppContextType {
  currentIndustry: IndustryType;
  setIndustry: (industry: IndustryType) => void;
  currentTenant: Tenant;
  tenants: Tenant[];
  switchTenant: (tenantId: string) => void;
  refreshTenants: () => Promise<void>;
  currentUser: User;
  users: User[];
  tenantUsers: User[];
  switchUser: (userId: string) => void;
  returnToAdmin: () => void;
  isImpersonating: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AppContext = React.createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = React.useState<Tenant[]>(MOCK_TENANTS);
  const [currentTenantId, setCurrentTenantId] = React.useState<string>("tenant-beatapp-live");
  const [currentIndustry, setCurrentIndustryState] = React.useState<IndustryType>("clinic");
  const [users, setUsers] = React.useState<User[]>(MOCK_USERS);
  const [currentUserId, setCurrentUserId] = React.useState<string>("user-super-admin");

  const refreshTenants = React.useCallback(async () => {
    try {
      const res = await fetch("/api/tenants");
      const data = await res.json();
      if (data.tenants && data.tenants.length > 0) {
        setTenants(data.tenants);
        const savedTenantId =
          typeof window !== "undefined"
            ? localStorage.getItem("beatapp_active_tenant_id")
            : null;
        const targetId = savedTenantId || "tenant-beatapp-live";
        const found = data.tenants.find((t: Tenant) => t.id === targetId);
        if (found) {
          setCurrentTenantId(found.id);
          setCurrentIndustryState(found.industry);
          if (found.locationId && typeof window !== "undefined") {
            localStorage.setItem("beatapp_active_location_id", found.locationId);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to refresh tenants", e);
    }
  }, []);

  // Load saved preferences on client mount & install API header interceptor
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // Monkey-patch window.fetch to automatically include multi-tenant headers
      if (!(window as unknown as { __beatappFetchPatched?: boolean }).__beatappFetchPatched) {
        const originalFetch = window.fetch;
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          try {
            const activeUserId = localStorage.getItem("beatapp_active_user_id");
            const activeTenantId = localStorage.getItem("beatapp_active_tenant_id");
            const activeLocationId = localStorage.getItem("beatapp_active_location_id");
            init = init || {};
            const headers = new Headers(init.headers || {});
            if (activeUserId && !headers.has("x-beatapp-user-id")) {
              headers.set("x-beatapp-user-id", activeUserId);
            }
            if (activeTenantId && !headers.has("x-beatapp-tenant-id")) {
              headers.set("x-beatapp-tenant-id", activeTenantId);
            }
            if (activeLocationId && !headers.has("x-beatapp-location-id")) {
              headers.set("x-beatapp-location-id", activeLocationId);
            }
            init.headers = headers;
          } catch {}
          return originalFetch(input, init);
        };
        (window as unknown as { __beatappFetchPatched?: boolean }).__beatappFetchPatched = true;
      }

      try {
        let savedTenantId = localStorage.getItem("beatapp_active_tenant_id");
        // Migrate away from any legacy mock tenant
        if (
          !savedTenantId ||
          savedTenantId === "tenant-sorouh-re" ||
          savedTenantId === "tenant-lumina-medspa" ||
          savedTenantId === "tenant-alfursan-re"
        ) {
          savedTenantId = "tenant-beatapp-live";
          localStorage.setItem("beatapp_active_tenant_id", "tenant-beatapp-live");
        }

        if (savedTenantId) {
          setCurrentTenantId(savedTenantId);
          const found = MOCK_TENANTS.find((t) => t.id === savedTenantId);
          if (found) {
            setCurrentIndustryState(found.industry);
            if (found.locationId) {
              localStorage.setItem("beatapp_active_location_id", found.locationId);
            }
          }
        } else {
          const savedIndustry = localStorage.getItem("beatapp_active_industry") as IndustryType;
          if (savedIndustry === "clinic" || savedIndustry === "real_estate") {
            setCurrentIndustryState(savedIndustry);
          }
        }

        let savedUserId = localStorage.getItem("beatapp_active_user_id");
        if (
          !savedUserId ||
          savedUserId.startsWith("user-sorouh") ||
          savedUserId === "user-2" ||
          savedUserId === "user-3" ||
          savedUserId === "user-4" ||
          savedUserId === "user-5"
        ) {
          savedUserId = "user-super-admin";
          localStorage.setItem("beatapp_active_user_id", "user-super-admin");
        }
        if (savedUserId) {
          setCurrentUserId(savedUserId);
        }
      } catch (e) {
        console.error("Failed to load local storage state", e);
      }
    }

    refreshTenants();

    // Refresh users from API
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.users && data.users.length > 0) {
          const hasSuper = data.users.some(
            (u: User) => u.role === "super_admin" || u.id === "user-super-admin"
          );
          const merged = hasSuper ? data.users : [DEFAULT_MOCK_USER, ...data.users];
          setUsers(merged);
        }
      })
      .catch((e) => console.warn("Failed to load users from API", e));
  }, [refreshTenants]);

  const currentTenant = React.useMemo(() => {
    return tenants.find((t) => t.id === currentTenantId) || tenants[0] || DEFAULT_MOCK_TENANT;
  }, [tenants, currentTenantId]);

  const switchTenant = React.useCallback(
    (tenantId: string) => {
      const target = tenants.find((t) => t.id === tenantId);
      if (!target) return;

      setCurrentTenantId(target.id);
      setCurrentIndustryState(target.industry);

      // When switching to a tenant, find the tenant's admin user or first user
      const targetUser =
        users.find((u) => u.tenantId === target.id && (u.role === "admin" || u.role === "manager")) ||
        users.find((u) => u.tenantId === target.id) ||
        DEFAULT_MOCK_USER;

      setCurrentUserId(targetUser.id);

      if (typeof window !== "undefined") {
        localStorage.setItem("beatapp_active_tenant_id", target.id);
        localStorage.setItem("beatapp_active_industry", target.industry);
        localStorage.setItem("beatapp_active_user_id", targetUser.id);
        if (target.locationId) {
          localStorage.setItem("beatapp_active_location_id", target.locationId);
        } else {
          localStorage.removeItem("beatapp_active_location_id");
        }
      }
    },
    [tenants, users]
  );

  const setIndustry = React.useCallback((industry: IndustryType) => {
    setCurrentIndustryState(industry);
    if (typeof window !== "undefined") {
      localStorage.setItem("beatapp_active_industry", industry);
    }
  }, []);

  const switchUser = React.useCallback((userId: string) => {
    setCurrentUserId(userId);
    if (typeof window !== "undefined") {
      localStorage.setItem("beatapp_active_user_id", userId);
    }
  }, []);

  const returnToAdmin = React.useCallback(() => {
    switchUser("user-super-admin");
  }, [switchUser]);

  const currentUser = React.useMemo(() => {
    return users.find((u) => u.id === currentUserId) || DEFAULT_MOCK_USER;
  }, [users, currentUserId]);

  // Tenant-scoped users: Strictly users that belong to this company
  const tenantUsers = React.useMemo(() => {
    const filtered = users.filter((u) => u.tenantId === currentTenant.id);
    if (filtered.length > 0) return filtered;

    // Fallback: tenant's primary admin
    return [
      {
        id: `user-${currentTenant.id}-admin`,
        tenantId: currentTenant.id,
        name: currentTenant.adminName || "مدير الشركة",
        email: currentTenant.adminEmail || `admin@${currentTenant.slug || "company"}.sa`,
        role: "admin" as const,
        locationId: currentTenant.locationId || "loc_default",
        title: `مدير عام (${currentTenant.name})`,
        department: "الإدارة العامة",
        status: "active" as const,
      },
    ];
  }, [users, currentTenant]);

  const isSuperAdmin = currentUser.role === "super_admin";
  const isAdmin = currentUser.role === "admin" || isSuperAdmin || currentUser.role === "manager";
  const isImpersonating = currentUser.id !== "user-super-admin";

  return (
    <AppContext.Provider
      value={{
        currentIndustry,
        setIndustry,
        currentTenant,
        tenants,
        switchTenant,
        refreshTenants,
        currentUser,
        users,
        tenantUsers,
        switchUser,
        returnToAdmin,
        isImpersonating,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
