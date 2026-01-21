import { NavLink } from 'react-router-dom'
import { MessageSquare, Library, Settings, LogOut, Brain } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { useLocalUser } from '../../hooks/useLocalUser'

const navItems = [
  { icon: MessageSquare, label: 'Chat', path: '/' },
  { icon: Library, label: 'Library', path: '/library' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export function Sidebar() {
  const { logout } = useLocalUser()

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">AI Assistant</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
