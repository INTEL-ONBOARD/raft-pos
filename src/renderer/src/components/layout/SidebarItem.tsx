import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface SidebarItemProps {
  to: string
  icon: LucideIcon
  label: string
}

export function SidebarItem({ to, icon: Icon, label }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      aria-current={undefined}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  )
}
