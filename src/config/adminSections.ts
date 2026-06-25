// Centralized list of admin sections used by sidebar, route guard and permissions UI.
export const ADMIN_SECTIONS: { key: string; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "painel", label: "Painel" },
  { key: "crm", label: "CRM" },
  { key: "vendas", label: "Vendas" },
  { key: "clientes", label: "Clientes" },
  { key: "planos", label: "Planos" },
  { key: "analytics", label: "Analytics" },
  { key: "blog", label: "Blog" },
  { key: "anuncios", label: "Anúncios" },
  { key: "paginas", label: "Páginas" },
  { key: "cobertura", label: "Cobertura" },
  { key: "usuarios", label: "Usuários" },
  { key: "geofeed", label: "GEOFEED" },
  { key: "vagas", label: "Vagas" },
  { key: "curriculos", label: "Currículos" },
  { key: "personalizacao", label: "Personalização" },
  { key: "configuracoes", label: "Configurações" },
  { key: "esim", label: "MVNO" },
  { key: "propostas", label: "Propostas" },
  { key: "checkout_pedidos", label: "Pedidos Checkout" },
  { key: "banco_dados", label: "Banco de Dados" },
];

// Tailwind color classes for the role badges (slug-agnostic palette)
export const ROLE_COLORS: Record<string, string> = {
  red: "bg-red-500/15 text-red-600 border-red-200",
  yellow: "bg-yellow-500/15 text-yellow-700 border-yellow-200",
  blue: "bg-blue-500/15 text-blue-600 border-blue-200",
  green: "bg-green-500/15 text-green-700 border-green-200",
  purple: "bg-purple-500/15 text-purple-700 border-purple-200",
  pink: "bg-pink-500/15 text-pink-700 border-pink-200",
  orange: "bg-orange-500/15 text-orange-700 border-orange-200",
  gray: "bg-gray-500/15 text-gray-700 border-gray-200",
};

export const ROLE_COLOR_OPTIONS = Object.keys(ROLE_COLORS);
