
function Icon({ children, className = 'h-5 w-5', ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconDashboard = (p) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7.5" height="8.5" rx="1.5" />
    <rect x="13.5" y="3" width="7.5" height="5" rx="1.5" />
    <rect x="13.5" y="11" width="7.5" height="10" rx="1.5" />
    <rect x="3" y="14.5" width="7.5" height="6.5" rx="1.5" />
  </Icon>
)

export const IconSales = (p) => (
  <Icon {...p}>
    <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20.5 7H6" />
    <circle cx="9.5" cy="19.5" r="1.3" />
    <circle cx="17.5" cy="19.5" r="1.3" />
  </Icon>
)

export const IconInventory = (p) => (
  <Icon {...p}>
    <path d="M12 3 20.5 7.5v9L12 21l-8.5-4.5v-9z" />
    <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
  </Icon>
)

export const IconReports = (p) => (
  <Icon {...p}>
    <path d="M3 20.5h18" />
    <path d="M6.5 20.5v-6M11.5 20.5V7M16.5 20.5v-9" />
  </Icon>
)

export const IconActivity = (p) => (
  <Icon {...p}>
    <circle cx="5" cy="6" r="1.5" />
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="5" cy="18" r="1.5" />
    <path d="M9.5 6h10M9.5 12h10M9.5 18h6" />
  </Icon>
)

export const IconSettings = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
  </Icon>
)

export const IconUsers = (p) => (
  <Icon {...p}>
    <circle cx="9.5" cy="8" r="3.5" />
    <path d="M3 20c0-3.4 2.9-5.5 6.5-5.5S16 16.6 16 20" />
    <path d="M16.5 5.2a3.5 3.5 0 0 1 0 6.6M18 15c2.1.8 3 2.6 3 5" />
  </Icon>
)

export const IconEye = (p) => (
  <Icon {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

export const IconEyeOff = (p) => (
  <Icon {...p}>
    <path d="M10 6a9.6 9.6 0 0 1 2-.2c6 0 9.5 6.2 9.5 6.2a17.7 17.7 0 0 1-3.4 4.1" />
    <path d="M6.6 7.8A17.4 17.4 0 0 0 2.5 12S6 18.2 12 18.2c1.4 0 2.7-.3 3.9-.9" />
    <path d="M10 10a2.8 2.8 0 0 0 4 4" />
    <path d="m3.5 3.5 17 17" />
  </Icon>
)

export const IconSearch = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.3-4.3" />
  </Icon>
)

export const IconBell = (p) => (
  <Icon {...p}>
    <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z" />
    <path d="M13.7 19a2 2 0 0 1-3.4 0" />
  </Icon>
)

export const IconMenu = (p) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
)

export const IconClose = (p) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)

export const IconChevronDown = (p) => (
  <Icon {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Icon>
)

export const IconChevronLeft = (p) => (
  <Icon {...p}>
    <path d="M14.5 6 8.5 12l6 6" />
  </Icon>
)

export const IconChevronRight = (p) => (
  <Icon {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Icon>
)

export const IconCalendar = (p) => (
  <Icon {...p}>
    <rect x="3.25" y="5" width="17.5" height="16" rx="2.5" />
    <path d="M3.25 9.75h17.5M8 3v4M16 3v4" />
  </Icon>
)

const Page = () => <path d="M14 2.75H7A2.25 2.25 0 0 0 4.75 5v14A2.25 2.25 0 0 0 7 21.25h10A2.25 2.25 0 0 0 19.25 19V8zM14 2.75V8h5.25" />

export const IconFilePdf = (p) => (
  <Icon {...p}>
    <Page />
    <path d="M8.5 17c2.5-1 3.75-3.25 3.75-5 0-1-.5-1.5-1-1.5s-1.25.75-.5 2.75c.75 2 2 3.5 3.75 3.5" />
  </Icon>
)

export const IconFileSheet = (p) => (
  <Icon {...p}>
    <Page />
    <path d="M8.25 12.5h7.5v6h-7.5zM12 12.5v6M8.25 15.5h7.5" />
  </Icon>
)

export const IconSun = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.4 5.6 17 7M7 17l-1.4 1.4M18.4 18.4 17 17M7 7 5.6 5.6" />
  </Icon>
)

export const IconMoon = (p) => (
  <Icon {...p}>
    <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z" />
  </Icon>
)

export const IconArrowUp = (p) => (
  <Icon {...p}>
    <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />
  </Icon>
)

export const IconArrowDown = (p) => (
  <Icon {...p}>
    <path d="M12 5v14M17.5 13.5 12 19l-5.5-5.5" />
  </Icon>
)

export const IconPlus = (p) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const IconMinus = (p) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
)

export const IconEdit = (p) => (
  <Icon {...p}>
    <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    <path d="M14.5 6.5l3 3" />
  </Icon>
)

export const IconPrint = (p) => (
  <Icon {...p}>
    <path d="M7 8.5V3.5h10v5" />
    <path d="M7 17H5a2 2 0 0 1-2-2v-4.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2V15a2 2 0 0 1-2 2h-2" />
    <rect x="7" y="13.5" width="10" height="7" rx="1" />
  </Icon>
)

export const IconDownload = (p) => (
  <Icon {...p}>
    <path d="M12 3.5v11M7.5 10 12 14.5 16.5 10M4.5 19.5h15" />
  </Icon>
)

export const IconCheck = (p) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Icon>
)

export const IconAlert = (p) => (
  <Icon {...p}>
    <path d="M12 4.5 21 19.5H3z" />
    <path d="M12 10v4M12 16.8v.2" />
  </Icon>
)

export const IconGlobe = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5s-1.2 6.2-3.4 8.5c-2.2-2.3-3.4-5.3-3.4-8.5S9.8 5.8 12 3.5Z" />
  </Icon>
)

export const IconTrash = (p) => (
  <Icon {...p}>
    <path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
    <path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
    <path d="M10.5 10v6.5M13.5 10v6.5" />
  </Icon>
)

export const IconReturn = (p) => (
  <Icon {...p}>
    <path d="M9 5.5 4.5 10 9 14.5" />
    <path d="M4.5 10h9.5a5.5 5.5 0 0 1 0 11H8" />
  </Icon>
)

export const IconTools = (p) => (
  <Icon {...p}>
    <path d="M17.9 3.1a4.6 4.6 0 0 0-5.6 6.2l-8.1 8.1a2.1 2.1 0 0 0 3 3l8.1-8.1a4.6 4.6 0 0 0 6.2-5.6l-2.9 2.9-2.7-.7-.7-2.7z" />
  </Icon>
)

export const IconTag = (p) => (
  <Icon {...p}>
    <path d="M3.5 10.2V5.5a2 2 0 0 1 2-2h4.7c.5 0 1 .2 1.4.6l8 8a2 2 0 0 1 0 2.8l-4.7 4.7a2 2 0 0 1-2.8 0l-8-8a2 2 0 0 1-.6-1.4Z" />
    <circle cx="7.9" cy="7.9" r="1.3" />
  </Icon>
)

export const IconAlignLeft = (p) => (
  <Icon {...p}>
    <path d="M4 6h16M4 10h10M4 14h16M4 18h10" />
  </Icon>
)

export const IconAlignCenter = (p) => (
  <Icon {...p}>
    <path d="M4 6h16M7 10h10M4 14h16M7 18h10" />
  </Icon>
)

export const IconAlignRight = (p) => (
  <Icon {...p}>
    <path d="M4 6h16M10 10h10M4 14h16M10 18h10" />
  </Icon>
)

export const IconAlignTop = (p) => (
  <Icon {...p}>
    <path d="M6 4v16M10 4v10M14 4v16M18 4v10" />
  </Icon>
)

export const IconAlignMiddle = (p) => (
  <Icon {...p}>
    <path d="M6 4v16M10 7v10M14 4v16M18 7v10" />
  </Icon>
)

export const IconAlignBottom = (p) => (
  <Icon {...p}>
    <path d="M6 4v16M10 10v10M14 4v16M18 10v10" />
  </Icon>
)

export const IconRegister = (p) => (
  <Icon {...p}>
    <rect x="2.5" y="9" width="19" height="11.5" rx="2" />
    <path d="M6.5 9V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3" />
    <path d="M9.5 13.5h5M12 13.5v3.5" />
  </Icon>
)

export const IconClock = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9.25" />
    <path d="M12 6.75V12l3.5 2.25" />
  </Icon>
)

export const IconKey = (p) => (
  <Icon {...p}>
    <circle cx="8" cy="15.5" r="4.25" />
    <path d="M11.25 12.75 19.5 4.5M17 7l2.25 2.25M14.75 9.25 17 11.5" />
  </Icon>
)

export const IconSignOut = (p) => (
  <Icon {...p}>
    <path d="M15 4.5h2.5A2 2 0 0 1 19.5 6.5v11a2 2 0 0 1-2 2H15" />
    <path d="M11 8.5 14.5 12 11 15.5M14.5 12h-10" />
  </Icon>
)

export const IconTable = (p) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="M3 9.5h18M9.5 9.5v10" />
  </Icon>
)

export const IconChart = (p) => (
  <Icon {...p}>
    <path d="M3.5 16.5 9 10.5l4 3.5 7.5-8" />
    <path d="M20.5 6v4.5H16" />
  </Icon>
)

export const IconCash = (p) => (
  <Icon {...p}>
    <rect x="2.5" y="6.5" width="19" height="11" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 12h.01M18 12h.01" />
  </Icon>
)

export const IconCard = (p) => (
  <Icon {...p}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2.2" />
    <path d="M2.5 10h19" />
    <path d="M6 14.5h4" />
  </Icon>
)
