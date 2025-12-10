'use client';

import { createContext } from "react";

export const TenantProfileContext = createContext({
  profile: null,
  profileError: null,
});
