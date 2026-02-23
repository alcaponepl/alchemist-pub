import { useState } from 'react'
import { TopBar } from '../components/layout/TopBar'
import {
  User, Bell, Shield, Palette, Link as LinkIcon,
  Check, Phone, Briefcase, Mail
} from 'lucide-react'

type SettingsTab = 'profile' | 'notifications' | 'security' | 'appearance' | 'integrations'

const SIDEBAR_ITEMS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { id: 'security', label: 'Security', icon: <Shield size={18} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
  { id: 'integrations', label: 'Integrations', icon: <LinkIcon size={18} /> },
]

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <div className={`toggle ${on ? 'toggle--on' : 'toggle--off'}`} onClick={onToggle}>
    <div className="toggle__knob" />
  </div>
)

export const Settings = () => {
  const [tab, setTab] = useState<SettingsTab>('profile')
  const [notifs, setNotifs] = useState({ critical: true, weekly: true, email: false, updates: true })
  const [twoFa, setTwoFa] = useState(true)

  return (
    <div className="settings">
      <TopBar variant="settings" />

      <div className="settings__body">
        <aside className="settings__sidebar">
          <span className="settings__sidebar-label">// USER_SETTINGS</span>
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.id}
              className={`settings__sidebar-item ${tab === item.id ? 'settings__sidebar-item--active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </aside>

        <main className="settings__main">
          {/* Page Header */}
          <div className="settings__page-header">
            <h1 className="settings__page-title">Profile Settings</h1>
            <p className="settings__page-subtitle">Manage your personal information and account preferences.</p>
          </div>

          <div className="settings__divider" />

          {/* Avatar Section */}
          <div className="settings__avatar-section">
            <div className="settings__avatar-circle" />
            <div className="settings__avatar-info">
              <div>
                <div className="settings__avatar-name">Marek Kowalski</div>
                <div className="settings__avatar-email">CTO at Baltic Wind Energy</div>
              </div>
              <div className="settings__avatar-actions">
                <button className="btn btn--ghost btn--small">Upload</button>
                <button className="btn btn--ghost btn--small" style={{ color: 'var(--red-critical)', borderColor: 'var(--red-critical)' }}>Remove</button>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 className="settings__card-title">Personal Information</h2>

            <div className="settings__form-row">
              <div className="form-field">
                <label className="form-field__label">FIRST NAME</label>
                <div className="form-field__input-wrap">
                  <User size={18} />
                  <input className="form-field__input" defaultValue="Marek" />
                </div>
              </div>
              <div className="form-field">
                <label className="form-field__label">LAST NAME</label>
                <div className="form-field__input-wrap">
                  <User size={18} />
                  <input className="form-field__input" defaultValue="Kowalski" />
                </div>
              </div>
            </div>

            <div className="form-field">
              <label className="form-field__label">EMAIL</label>
              <div className="form-field__input-wrap">
                <Mail size={18} />
                <input className="form-field__input" defaultValue="m.kowalski@balticwind.eu" />
              </div>
            </div>

            <div className="form-field">
              <label className="form-field__label">PHONE</label>
              <div className="form-field__input-wrap">
                <Phone size={18} />
                <input className="form-field__input" defaultValue="+48 600 123 456" />
              </div>
            </div>

            <div className="form-field">
              <label className="form-field__label">POSITION</label>
              <div className="form-field__input-wrap">
                <Briefcase size={18} />
                <input className="form-field__input" defaultValue="CTO, Baltic Wind Energy" />
              </div>
            </div>

            <div className="settings__form-actions">
              <button className="btn btn--ghost btn--small">Cancel</button>
              <button className="btn btn--primary btn--small">
                <Check size={16} /> Save changes
              </button>
            </div>
          </div>

          <div className="settings__divider" />

          {/* Notifications */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 className="settings__card-title">Notifications</h2>
            <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: -16 }}>
              Choose which notifications you want to receive.
            </p>

            <div className="settings__notif-row">
              <div className="settings__notif-info">
                <span className="settings__notif-label">Critical alerts</span>
                <span className="settings__notif-desc">Notifications about failures and critical events</span>
              </div>
              <Toggle on={notifs.critical} onToggle={() => setNotifs(p => ({ ...p, critical: !p.critical }))} />
            </div>

            <div className="settings__notif-row">
              <div className="settings__notif-info">
                <span className="settings__notif-label">Weekly reports</span>
                <span className="settings__notif-desc">Farm performance summary every week</span>
              </div>
              <Toggle on={notifs.weekly} onToggle={() => setNotifs(p => ({ ...p, weekly: !p.weekly }))} />
            </div>

            <div className="settings__notif-row">
              <div className="settings__notif-info">
                <span className="settings__notif-label">Email notifications</span>
                <span className="settings__notif-desc">Receive notifications to your email inbox</span>
              </div>
              <Toggle on={notifs.email} onToggle={() => setNotifs(p => ({ ...p, email: !p.email }))} />
            </div>

            <div className="settings__notif-row">
              <div className="settings__notif-info">
                <span className="settings__notif-label">System updates</span>
                <span className="settings__notif-desc">Information about new versions and updates</span>
              </div>
              <Toggle on={notifs.updates} onToggle={() => setNotifs(p => ({ ...p, updates: !p.updates }))} />
            </div>
          </div>

          <div className="settings__divider" />

          {/* Security */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 className="settings__card-title">Security</h2>

            <div className="settings__sec-row">
              <div className="settings__sec-info">
                <span className="settings__sec-label">Password</span>
                <span className="settings__sec-desc">Last changed: 15 days ago</span>
              </div>
              <button className="btn btn--ghost btn--small">Change password</button>
            </div>

            <div className="settings__sec-row">
              <div className="settings__sec-info">
                <span className="settings__sec-label">Two-factor authentication (2FA)</span>
                <span className="settings__sec-desc">Additional layer of security for your account</span>
              </div>
              <Toggle on={twoFa} onToggle={() => setTwoFa(p => !p)} />
            </div>

            <div className="settings__sec-row">
              <div className="settings__sec-info">
                <span className="settings__sec-label">Active sessions</span>
                <span className="settings__sec-desc">3 active devices</span>
              </div>
              <button className="btn btn--danger-ghost">Log out all</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
