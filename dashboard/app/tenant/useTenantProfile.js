'use client';

import { useContext } from "react";
import { TenantProfileContext } from "./profile-context";

export function useTenantProfile() {
  return useContext(TenantProfileContext);
}
