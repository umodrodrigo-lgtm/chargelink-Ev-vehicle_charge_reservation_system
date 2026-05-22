import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/usersApi'
import { Card } from '@/components/UI/Card'
import { Input } from '@/components/UI/Input'
import { Button } from '@/components/UI/Button'
import { Badge } from '@/components/UI/Badge'
import { Spinner } from '@/components/UI/Spinner'
import { Search, UserCheck, UserX } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

export function AdminUsersPage() {
  const qc = useQueryClient()
  const [query, setQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', query],
    queryFn: () => usersApi.getAll({ query, size: 50 }),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id),
    onSuccess: () => {
      toast.success('User status updated')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Update failed'),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{data?.totalElements ?? 0} total</span>
      </div>

      <div className="w-72">
        <Input placeholder="Search users…" value={query} onChange={e => setQuery(e.target.value)}
          icon={<Search className="w-4 h-4" />} />
      </div>

      <Card padding={false}>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {data?.content.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={user.role}
                        className={clsx(
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        )}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={user.active ? 'Active' : 'Inactive'}
                        className={user.active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant={user.active ? 'danger' : 'secondary'}
                        size="sm"
                        loading={toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate(user.id)}
                      >
                        {user.active
                          ? <><UserX className="w-3.5 h-3.5" /> Deactivate</>
                          : <><UserCheck className="w-3.5 h-3.5" /> Activate</>
                        }
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.content.length === 0 && (
              <div className="text-center py-12 text-gray-400">No users found</div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
