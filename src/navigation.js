import {
  IconActivity,
  IconDashboard,
  IconInventory,
  IconReports,
  IconSales,
  IconSettings,
  IconUsers,
} from './components/Icons'

export const NAV_SECTIONS = [
  {
    titleKey: 'nav.section.overview',
    items: [{ id: 'dashboard', labelKey: 'nav.dashboard', Icon: IconDashboard }],
  },
  {
    titleKey: 'nav.section.operations',
    items: [
      { id: 'sales', labelKey: 'nav.sales', Icon: IconSales },
      { id: 'inventory', labelKey: 'nav.inventory', Icon: IconInventory },
    ],
  },
  {
    titleKey: 'nav.section.backoffice',
    items: [
      { id: 'reports', labelKey: 'nav.reports', Icon: IconReports },
      { id: 'activity', labelKey: 'nav.activity', Icon: IconActivity },
      { id: 'users', labelKey: 'nav.users', Icon: IconUsers },
    ],
  },
]

export const SETTINGS_ITEM = { id: 'settings', labelKey: 'nav.settings', Icon: IconSettings }

export const NAV_ITEMS = [...NAV_SECTIONS.flatMap((section) => section.items), SETTINGS_ITEM]
