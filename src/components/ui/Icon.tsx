import { cn } from '@/lib/cn'

/**
 * The system icon set.
 *
 * Inlined rather than loaded from the Google Material Symbols CDN because the
 * app is deliberately network-free at runtime (see src/styles/fonts.css — the
 * typeface is self-hosted for the same reason). A webfont icon set would add a
 * blocking third-party request and a flash of missing glyphs on the login
 * screen, which is the first thing every user sees.
 *
 * Drawn on the Material Symbols geometry: 24×24 grid, 1.75px stroke, round
 * caps and joins, optical centre at 12,12. Everything inherits `currentColor`,
 * so an icon takes the colour of the text it sits beside without a prop.
 */

export type IconName =
  // identity + auth
  | 'user'
  | 'mail'
  | 'lock'
  | 'key'
  | 'shield'
  | 'logout'
  // org + navigation
  | 'company'
  | 'dashboard'
  | 'settings'
  | 'search'
  | 'bell'
  | 'reports'
  | 'opportunities'
  | 'document'
  | 'mentors'
  | 'calendar'
  | 'clock'
  // actions
  | 'plus'
  | 'edit'
  | 'trash'
  | 'refresh'
  | 'filter'
  | 'download'
  | 'external'
  // feedback
  | 'check'
  | 'checkCircle'
  | 'close'
  | 'alert'
  | 'info'
  // direction
  | 'chevronDown'
  | 'chevronUp'
  | 'chevronStart'
  | 'chevronEnd'

const PATHS: Record<IconName, React.ReactNode> = {
  user: (
    <>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  mail: (
    <>
      <rect x="2.75" y="4.75" width="18.5" height="14.5" rx="2.5" />
      <path d="m3.5 7.5 7.28 5.09a2 2 0 0 0 2.44 0L20.5 7.5" />
    </>
  ),
  lock: (
    <>
      <rect x="4.25" y="10.25" width="15.5" height="9.5" rx="2.5" />
      <path d="M8 10.25V7.5a4 4 0 0 1 8 0v2.75" />
      <path d="M12 14v2" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="12" r="3.25" />
      <path d="M11.25 12H20" />
      <path d="M17 12v3" />
      <path d="M20 12v2.5" />
    </>
  ),
  shield: <path d="M12 3.5 5 6.25v5c0 4.2 2.86 7.6 7 9.25 4.14-1.65 7-5.05 7-9.25v-5L12 3.5Z" />,
  logout: (
    <>
      <path d="M9.5 4.75H6a2 2 0 0 0-2 2v10.5a2 2 0 0 0 2 2h3.5" />
      <path d="M15.5 15.5 19 12l-3.5-3.5" />
      <path d="M19 12H9.5" />
    </>
  ),
  company: (
    <>
      <path d="M3.5 20h17" />
      <path d="M5.5 20V5.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1V20" />
      <path d="M13.5 20V9.5h4a1 1 0 0 1 1 1V20" />
      <path d="M8 8h3M8 11.5h3M8 15h3" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3.75" y="3.75" width="7" height="7" rx="1.5" />
      <rect x="13.25" y="3.75" width="7" height="7" rx="1.5" />
      <rect x="3.75" y="13.25" width="7" height="7" rx="1.5" />
      <rect x="13.25" y="13.25" width="7" height="7" rx="1.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.25" />
      <path d="m20 20-4.5-4.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8.5a6 6 0 0 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z" />
      <path d="M13.75 18.5a2 2 0 0 1-3.5 0" />
    </>
  ),
  reports: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20v-6.5" />
      <path d="M12 20V7.5" />
      <path d="M17 20v-9.5" />
    </>
  ),
  opportunities: (
    <>
      <circle cx="12" cy="12" r="7.75" />
      <circle cx="12" cy="12" r="3.75" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </>
  ),
  document: (
    <>
      <path d="M14 3.75H7a2 2 0 0 0-2 2v12.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.75L14 3.75Z" />
      <path d="M13.75 4v5h5" />
      <path d="M8.5 13h7M8.5 16.5h4.5" />
    </>
  ),
  mentors: (
    <>
      <path d="M9 11.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" />
      <path d="M2.75 19.5a6.25 6.25 0 0 1 12.5 0" />
      <path d="M16 5.4a3.25 3.25 0 0 1 0 6.2" />
      <path d="M17.5 13.9a6.26 6.26 0 0 1 3.75 5.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.75" y="5.25" width="16.5" height="15" rx="2.5" />
      <path d="M3.75 9.75h16.5" />
      <path d="M8.5 3.5v3.5M15.5 3.5v3.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3 1.75" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  edit: (
    <>
      <path d="M4.5 19.5h4l10-10a2.12 2.12 0 0 0-3-3l-10 10v3Z" />
      <path d="m14.5 6.5 3 3" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.5h15" />
      <path d="M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5" />
      <path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
      <path d="M10.5 10v6.5M13.5 10v6.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5V10h-5.5" />
    </>
  ),
  filter: <path d="M4.5 6h15l-5.75 6.8v5.45l-3.5 1.75V12.8L4.5 6Z" />,
  download: (
    <>
      <path d="M12 4.5v10" />
      <path d="m8 11 4 3.5 4-3.5" />
      <path d="M4.75 17.5v.75a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2v-.75" />
    </>
  ),
  external: (
    <>
      <path d="M14 4.5h5.5V10" />
      <path d="M19 5 11.5 12.5" />
      <path d="M19.5 13.5v4.75a2 2 0 0 1-2 2H6.25a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2H11" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="m8.25 12.25 2.5 2.5 5-5.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  alert: (
    <>
      <path d="M12 4.5 2.75 20.5h18.5L12 4.5Z" />
      <path d="M12 10v4" />
      <path d="M12 17.25h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 11v5.25" />
      <path d="M12 7.9h.01" />
    </>
  ),
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  chevronUp: <path d="m6 14.5 6-6 6 6" />,
  chevronStart: <path d="m14.5 6-6 6 6 6" />,
  chevronEnd: <path d="m9.5 6 6 6-6 6" />,
}

type Props = Omit<React.SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName
  /** Accessible label. Omit for decorative icons — they are hidden by default. */
  title?: string
}

export function Icon({ name, title, className, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      // `shrink-0` stops icons collapsing inside flex rows — the single most
      // common icon bug in a table cell.
      className={cn('size-5 shrink-0', className)}
      {...props}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  )
}
