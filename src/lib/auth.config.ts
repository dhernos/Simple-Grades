// Copyright (C) 2025 github.com/dhernos
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Eine Konfigurationsdatei, die die geschützten Routen und ihre Rollen definiert.
export const protectedRoutes = [
  { path: "/admin", roles: ["ADMIN"] },
  { path: "/editor", roles: ["ADMIN", "EDITOR"] },
];