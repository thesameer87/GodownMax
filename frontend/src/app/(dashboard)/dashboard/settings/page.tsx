'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { User, Shield, Bell, Palette, Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const qc = useQueryClient();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.put('/auth/profile', data),
    onSuccess: (res) => { updateUser(res.data.data); toast.success('Profile updated!'); },
  });

  const changePassMutation = useMutation({
    mutationFn: (data: any) => api.put('/auth/change-password', data),
    onSuccess: () => { toast.success('Password changed!'); setPassForm({ currentPassword: '', newPassword: '', confirm: '' }); },
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data),
    enabled: user?.role === 'ADMIN' && activeTab === 'users',
  });

  const toggleUserMutation = useMutation({
    mutationFn: ({ id, isActive }: any) => api.put(`/users/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const inputClass = "w-full px-3 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition";

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'appearance', label: 'Appearance', icon: Palette },
    ...(user?.role === 'ADMIN' ? [{ key: 'users', label: 'User Management', icon: Shield }] : []),
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and system preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-52 flex lg:flex-col gap-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={cn('flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left',
                activeTab === key ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground')}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-card rounded-2xl border p-6 space-y-5">
              <h2 className="font-semibold">Profile Information</h2>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary">
                  {user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                    {user?.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Full Name</label>
                  <input className={inputClass} value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Phone</label>
                  <input className={inputClass} value={profileForm.phone} placeholder="+1 555 000 0000"
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Email (read-only)</label>
                  <input className={inputClass} value={user?.email || ''} disabled />
                </div>
              </div>

              <button onClick={() => updateProfileMutation.mutate(profileForm)}
                disabled={updateProfileMutation.isPending}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-card rounded-2xl border p-6 space-y-5">
              <h2 className="font-semibold">Change Password</h2>
              <div className="space-y-4 max-w-md">
                {[
                  { label: 'Current Password', key: 'currentPassword' },
                  { label: 'New Password', key: 'newPassword' },
                  { label: 'Confirm New Password', key: 'confirm' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-sm font-medium block mb-1.5">{label}</label>
                    <input type="password" className={inputClass} value={(passForm as any)[key]}
                      onChange={e => setPassForm({ ...passForm, [key]: e.target.value })} />
                  </div>
                ))}
                <button
                  onClick={() => {
                    if (passForm.newPassword !== passForm.confirm) { toast.error('Passwords do not match'); return; }
                    changePassMutation.mutate({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
                  }}
                  disabled={changePassMutation.isPending}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {changePassMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update Password
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-card rounded-2xl border p-6 space-y-5">
              <h2 className="font-semibold">Appearance</h2>
              <div>
                <p className="text-sm font-medium mb-3">Theme</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'light', label: 'Light', preview: 'bg-white border-2' },
                    { key: 'dark', label: 'Dark', preview: 'bg-gray-900 border-2' },
                    { key: 'system', label: 'System', preview: 'bg-gradient-to-br from-white to-gray-900 border-2' },
                  ].map(({ key, label, preview }) => (
                    <button key={key} onClick={() => setTheme(key)}
                      className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        theme === key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}>
                      <div className={cn('w-12 h-8 rounded-lg', preview)} />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && user?.role === 'ADMIN' && (
            <div className="bg-card rounded-2xl border overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h2 className="font-semibold">User Management</h2>
                <p className="text-sm text-muted-foreground">Manage system users and roles</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">User</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Role</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Last Login</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {usersData?.map((u: any) => (
                      <tr key={u.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">{u.role}</span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                            u.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30')}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {u.id !== user?.id && (
                            <button onClick={() => toggleUserMutation.mutate({ id: u.id, isActive: !u.isActive })}
                              className={cn('p-1.5 rounded-lg transition', u.isActive ? 'hover:bg-red-100 text-red-500' : 'hover:bg-green-100 text-green-500')}>
                              {u.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
