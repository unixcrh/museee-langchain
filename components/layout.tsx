import { Icon } from '@iconify/react';

interface LayoutProps {
  tabIndex: number;
  children?: React.ReactNode;
}

export default function Layout({ children, tabIndex }: LayoutProps) {
  const tabs = [
    { name: 'Chats', icon: 'material-symbols:chat-bubble-rounded', href: '/' },
    { name: 'Agents', icon: 'bxs:bot', href: '/agents' },
    {
      name: 'Knowledge',
      icon: 'ic:baseline-sticky-note-2',
      href: '/knowledge',
    },
    {
      name: 'Community',
      icon: 'fluent:people-community-16-filled',
      href: '/community',
    },
    {
      name: 'Dashboard',
      icon: 'material-symbols:dashboard-customize',
      href: '/dashboard',
    },
  ];

  return (
    <div className="mx-auto">
      <div className="nav">
        <nav className="nav-items w-28 bg-gray-800 border-r border-gray-200 items-center">
          {tabs.map((tab, index) => (
            <a
              key={index}
              href={tab.href}
              className={`text-white w-full ${
                tabIndex === index ? 'bg-gray-900' : 'bg-gray-800'
              } hover:bg-gray-900 cursor-pointer flex flex-col items-center py-4 px-8`}
            >
              <Icon className="text-3xl text-white" icon={tab.icon} />
              <span className="mt-1 text-sm">{tab.name}</span>
            </a>
          ))}
        </nav>

        <main className="flex flex-1 flex-col overflow-hidden min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
