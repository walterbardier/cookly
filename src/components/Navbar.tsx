type Tab = 'home' | 'discover' | 'add' | 'friends' | 'profile';

type NavbarProps = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#FF6B35' : 'none'} stroke={active ? '#FF6B35' : '#343434'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const DiscoverIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#343434'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const FriendsIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#343434'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#343434'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: '24px', // Despegado del fondo para que flote
        left: '50%', // Centrado horizontal
        transform: 'translateX(-50%)', // Compensación del centrado
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(7px) saturate(180%)', // Efecto cristal típico de iOS
        WebkitBackdropFilter: 'blur(25px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.46)', // Borde sutil brillante
        borderRadius: '9999px', // Bordes completamente redondeados
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.20)', // Sombra para dar profundidad
        width: 'calc(100% - 50px)', // Ancho responsivo con márgenes laterales
        maxWidth: '420px', // Ancho máximo para que no se estire en pantallas grandes
        padding: '8px 7px',
        height: '70px',
      }}
    >
      <div className="flex items-center justify-between w-full h-full">
        {/* Home */}
        <button onClick={() => onTabChange('home')} className="flex flex-col items-center gap-0.5 px-3 py-1 flex-1">
          <HomeIcon active={activeTab === 'home'} />
          {/* <span style={{ fontSize: 10, fontWeight: 600, color: activeTab === 'home' ? '#FF6B35' : '#343434', letterSpacing: 0.2 }}>
            Home
          </span> */}
        </button>

        {/* Discover */}
        <button onClick={() => onTabChange('discover')} className="flex flex-col items-center gap-0.5 px-3 py-1 flex-1">
          <DiscoverIcon active={activeTab === 'discover'} />
          {/* <span style={{ fontSize: 10, fontWeight: 600, color: activeTab === 'discover' ? '#FF6B35' : '#343434', letterSpacing: 0.2 }}>
            Discover
          </span> */}
        </button>

        {/* Add — center button adaptado al nuevo tamaño */}
        <div className="flex justify-center flex-1">
          <button
            onClick={() => onTabChange('add')}
            style={{
              width: 52, // Ligeramente ajustado para encajar mejor en la píldora
              height: 52,
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF9A5C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(255, 107, 53, 0.50)',
              transform: activeTab === 'add' ? 'scale(0.94)' : 'scale(1)',
              transition: 'transform 0.15s ease',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Friends */}
        <button onClick={() => onTabChange('friends')} className="flex flex-col items-center gap-0.5 px-3 py-1 flex-1">
          <FriendsIcon active={activeTab === 'friends'} />
          {/* <span style={{ fontSize: 10, fontWeight: 600, color: activeTab === 'friends' ? '#FF6B35' : '#343434', letterSpacing: 0.2 }}>
            Friends
          </span> */}
        </button>

        {/* Profile */}
        <button onClick={() => onTabChange('profile')} className="flex flex-col items-center gap-0.5 px-3 py-1 flex-1">
          <ProfileIcon active={activeTab === 'profile'} />
          {/* <span style={{ fontSize: 10, fontWeight: 600, color: activeTab === 'profile' ? '#FF6B35' : '#343434', letterSpacing: 0.2 }}>
            Profile
          </span> */}
        </button>
      </div>
    </nav>
  );
}