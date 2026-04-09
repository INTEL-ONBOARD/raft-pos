import { useState } from 'react'
import { PencilSquareIcon, MinusCircleIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { useBranches } from '../../hooks/useBranches'
import type { IBranch } from '../../hooks/useBranches'
import { BranchFormModal } from './BranchFormModal'

export function BranchesTab() {
  const { branchesQuery, createMutation, updateMutation, deactivateMutation } = useBranches()
  const [editBranch, setEditBranch] = useState<IBranch | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const branches = branchesQuery.data ?? []
  const isLoading = createMutation.isPending || updateMutation.isPending

  async function handleCreate(data: any) {
    try {
      await createMutation.mutateAsync(data)
      setShowCreate(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleUpdate(data: any) {
    if (!editBranch) return
    try {
      await updateMutation.mutateAsync({ id: editBranch._id, input: data })
      setEditBranch(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDeactivate(b: IBranch) {
    if (
      !confirm(
        `Deactivate "${b.name}"? Users assigned to this branch will still exist but the branch will be hidden from new assignments.`
      )
    )
      return
    try {
      await deactivateMutation.mutateAsync(b._id)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <>
      {/* Add button row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={() => {
            setShowCreate(true)
            setError('')
          }}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1, marginTop: '-1px' }}>+</span> Add Branch
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px',
            fontSize: '13px',
            borderRadius: '12px',
            background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.15)',
            color: '#dc2626',
            marginBottom: '16px'
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#dc2626',
              flexShrink: 0
            }}
          />
          {error}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
      >
        {branchesQuery.isError ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '64px 0',
              gap: '12px'
            }}
          >
            <p style={{ fontSize: '14px', color: '#f87171', margin: 0 }}>
              {(branchesQuery.error as Error)?.message ?? 'Failed to load branches'}
            </p>
            <button
              onClick={() => branchesQuery.refetch()}
              style={{
                fontSize: '13px',
                color: '#6366f1',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Try again
            </button>
          </div>
        ) : branchesQuery.isLoading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name', 'Code', 'Address', 'Status', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      color: 'rgba(255,255,255,0.28)',
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '10px 16px',
                      textAlign: i === 4 ? 'right' : 'left',
                      borderBottom: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} style={{ height: '56px' }}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td
                      key={j}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <div
                        className="animate-pulse"
                        style={{
                          height: '13px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.06)',
                          width: j === 0 ? '120px' : j === 1 ? '60px' : j === 2 ? '140px' : '70px'
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : branches.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '64px 0',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BuildingOffice2Icon
                style={{ width: '22px', height: '22px', color: 'rgba(255,255,255,0.28)' }}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                No branches yet
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', marginTop: '4px' }}>
                Add your first branch to get started.
              </p>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name', 'Code', 'Address', 'Status', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      color: 'rgba(255,255,255,0.28)',
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '10px 16px',
                      textAlign: i === 4 ? 'right' : 'left',
                      borderBottom: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branches.map((b, idx) => {
                const isLast = idx === branches.length - 1
                return (
                  <tr
                    key={b._id}
                    onMouseEnter={() => setHoveredRow(b._id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      height: '56px',
                      background: hoveredRow === b._id ? 'rgba(255,255,255,0.03)' : 'transparent'
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 16px',
                        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                        fontSize: '13px'
                      }}
                    >
                      <span style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>
                        {b.name}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                        fontSize: '13px'
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(99,102,241,0.10)',
                          color: '#818cf8',
                          border: '1px solid rgba(99,102,241,0.18)'
                        }}
                      >
                        {b.code}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.50)'
                      }}
                    >
                      {b.address || '—'}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      {b.isActive ? (
                        <span className="badge-green">Active</span>
                      ) : (
                        <span className="badge-gray">Inactive</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '4px'
                        }}
                      >
                        <button
                          onClick={() => {
                            setEditBranch(b)
                            setError('')
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'rgba(255,255,255,0.35)',
                            background: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#7c3aed'
                            e.currentTarget.style.background = 'rgba(124,58,237,0.08)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
                            e.currentTarget.style.background = 'transparent'
                          }}
                          title="Edit branch"
                        >
                          <PencilSquareIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                        {b.isActive && (
                          <button
                            onClick={() => handleDeactivate(b)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'rgba(255,255,255,0.35)',
                              background: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#dc2626'
                              e.currentTarget.style.background = 'rgba(220,38,38,0.08)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
                              e.currentTarget.style.background = 'transparent'
                            }}
                            title="Deactivate branch"
                          >
                            <MinusCircleIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {(showCreate || editBranch) && (
        <BranchFormModal
          branch={editBranch}
          onConfirm={editBranch ? handleUpdate : handleCreate}
          onClose={() => {
            setShowCreate(false)
            setEditBranch(null)
          }}
          isLoading={isLoading}
        />
      )}
    </>
  )
}
