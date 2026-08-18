import {
  IconActivity,
  IconDashboard,
  IconInventory,
  IconRegister,
  IconReports,
  IconSales,
  IconSettings,
  IconTools,
  IconUsers,
} from './components/Icons'

/**
 * `roles` is the page's own guest list, and the only place access is decided:
 * the sidebar builds itself from it, and the router checks against it before
 * rendering, so a page cannot be reachable in one and closed in the other.
 *
 * A cashier's list is the till and their own shift — the screens a day at the
 * counter needs. Everything that shapes the catalogue, the accounts or the
 * numbers is the back office's, and stays with the admin.
 */
const ALL = ['admin', 'cashier']
const ADMIN = ['admin']

export const NAV_SECTIONS = [
  {
    titleKey: 'nav.section.overview',
    items: [{ id: 'dashboard', labelKey: 'nav.dashboard', Icon: IconDashboard, roles: ADMIN }],
  },
  {
    titleKey: 'nav.section.operations',
    items: [
      { id: 'sales', labelKey: 'nav.sales', Icon: IconSales, roles: ALL },
      { id: 'register', labelKey: 'nav.register', Icon: IconRegister, roles: ALL },
      { id: 'inventory', labelKey: 'nav.inventory', Icon: IconInventory, roles: ADMIN },
    ],
  },
  {
    titleKey: 'nav.section.backoffice',
    items: [
      { id: 'reports', labelKey: 'nav.reports', Icon: IconReports, roles: ADMIN },
      { id: 'activity', labelKey: 'nav.activity', Icon: IconActivity, roles: ADMIN },
      { id: 'users', labelKey: 'nav.users', Icon: IconUsers, roles: ADMIN },
      { id: 'tools', labelKey: 'nav.tools', Icon: IconTools, roles: ADMIN },
    ],
  },
]

/** Settings live in the sidebar's footer rather than in a section, but they
 * are a page like any other and carry the same guest list: what a shop is
 * priced in and when it opens is the back office's to set, not the till's. */
export const SETTINGS_ITEM = {
  id: 'settings',
  labelKey: 'nav.settings',
  Icon: IconSettings,
  roles: ADMIN,
}

export const NAV_ITEMS = [...NAV_SECTIONS.flatMap((section) => section.items), SETTINGS_ITEM]

/** What this role is allowed to open, in sidebar order. The first of them is
 * where a sign-in lands, so a cashier starts on the till. */
export function pagesFor(role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

export function canOpen(id, role) {
  return NAV_ITEMS.some((item) => item.id === id && item.roles.includes(role))
}
