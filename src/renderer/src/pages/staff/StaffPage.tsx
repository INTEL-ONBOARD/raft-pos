import { useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import {
  UsersIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import UsersTab from '../users/UsersPage'
import RolesTab from '../roles/RolesPage'
import { useAuth } from '../../hooks/useAuth'
import { PERMISSIONS } from '@shared/types/permissions'

type Tab = 'users' | 'roles'

export default function StaffPage() {
  const { hasPermission } = useAuth()
  
  const canManageUsers = hasPermission(PERMISSIONS.CAN_MANAGE_USERS)
  const canManageRoles = hasPermission(PERMISSIONS.CAN_MANAGE_ROLES)
  
  // If no permission for either, block navigation (though ProtectedRoute should catch it first)
  if (!canManageUsers && !canManageRoles) {
    return <Navigate to="/dashboard" replace />
  }

  // Default active tab based on what they can see first
  const [activeTab, setActiveTab] = useState<Tab>(canManageUsers ? 'users' : 'roles')

  const TABS = useMemo(() => {
    const tabs = []
    if (canManageUsers) {
      tabs.push({ 
         key: 'users' as Tab, 
         label: 'Staff Directory', 
         desc: 'Manage POS accounts and track activity logs', 
         icon: UsersIcon 
      })
    }
    if (canManageRoles) {
      tabs.push({ 
         key: 'roles' as Tab, 
         label: 'Roles & Permissions', 
         desc: 'Create access levels securely', 
         icon: ShieldCheckIcon 
      })
    }
    return tabs
  }, [canManageUsers, canManageRoles])

  return (
    <div style={{ background: '#080810', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 800px 500px at 20% 0%, rgba(99,102,241,0.06) 0%, transparent 60%)' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Page header */}
        <div style={{ padding: '28px 36px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserGroupIcon style={{ width: 20, height: 20, color: '#818cf8' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>Staff & Roles</h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', margin: '2px 0 0 0' }}>Manage access policies, shifts, and cashiers</p>
            </div>
          </div>
        </div>

        {/* Layout Row */}
        <div style={{ display: 'flex', flex: 1, padding: '0 16px 0 36px', overflow: 'hidden' }}>
           
          {/* Vertical Sidebar */}
          <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px', borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: '24px', paddingTop: '24px', overflowY: 'auto', paddingBottom: '24px' }}>
             {TABS.map(tab => {
                const active = activeTab === tab.key
                const Icon = tab.icon
                return (
                   <button key={tab.key} onClick={() => setActiveTab(tab.key)} 
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', borderRadius: '12px', background: active ? 'rgba(99,102,241,0.1)' : 'transparent', border: '1px solid', borderColor: active ? 'rgba(99,102,241,0.2)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                      <Icon style={{ width: 18, height: 18, color: active ? '#818cf8' : 'rgba(255,255,255,0.4)', marginTop: '2px' }} />
                      <div>
                         <p style={{ fontSize: '13px', fontWeight: 600, color: active ? '#a5b4fc' : '#dedede', margin: '0 0 2px' }}>{tab.label}</p>
                         <p style={{ fontSize: '11px', color: active ? 'rgba(165,180,252,0.7)' : 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.3 }}>{tab.desc}</p>
                      </div>
                   </button>
                )
             })}
          </div>

          {/* Context Panel right side */}
          <div style={{ flex: 1, borderTopLeftRadius: '16px', overflow: 'hidden' }}>
             {activeTab === 'users' && <UsersTab />}
             {activeTab === 'roles' && <RolesTab />}
          </div>
        </div>
      </div>
    </div>
  )
}
