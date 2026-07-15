export const PUBLIC_PRODUCT_LINKS = [
  { id: "cosa-cambia", label: "Cosa cambia", href: "/#cosa-cambia" },
  { id: "controllo", label: "Controllo", href: "/#controllo" },
  { id: "meno-attrito", label: "Meno attrito", href: "/#meno-attrito" },
  { id: "team", label: "Team", href: "/#team" },
  { id: "prezzi", label: "Prezzi", href: "/#prezzi" },
  { id: "faq", label: "FAQ", href: "/#faq" },
] as const;

export type PublicSectionId = (typeof PUBLIC_PRODUCT_LINKS)[number]["id"];
