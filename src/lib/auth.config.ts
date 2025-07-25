// Eine Konfigurationsdatei, die die geschützten Routen und ihre Rollen definiert.
export const protectedRoutes = [
  { path: "/admin", roles: ["ADMIN"] },
  { path: "/editor", roles: ["ADMIN", "EDITOR"] },
];