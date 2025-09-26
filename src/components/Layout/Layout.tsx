import React from "react";
import { 
  LayoutDashboard, 
  UserPlus, 
  Factory, 
  GitBranch, 
  Package, 
  ClipboardList, 
  Cog, 
  DollarSign, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab = 'dashboard', onTabChange }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", key: "dashboard" },
    { icon: UserPlus, label: "Cadastros", key: "cadastros" },
    { icon: Factory, label: "Facções", key: "faccoes" },
    { icon: GitBranch, label: "Etapas", key: "etapas" },
    { icon: Package, label: "Produto", key: "produto" },
    { icon: ClipboardList, label: "Ordem de Produções", key: "ordemProducoes" },
    { icon: Cog, label: "Gestão de Produções", key: "gestaoProducoes" },
    { icon: DollarSign, label: "Financeiro", key: "financeiro" },
  ];

  const handleTabClick = (tabKey: string) => {
    if (onTabChange) {
      onTabChange(tabKey);
    }
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <LayoutDashboard className="logo-icon" />
            <span className="logo-text">Nome da empresa</span>
          </div>
          <button 
            className="sidebar-close-btn"
            onClick={toggleSidebar}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item, index) => (
              <li key={index} className="nav-item">
                <button 
                  onClick={() => handleTabClick(item.key)}
                  className={`nav-link ${activeTab === item.key ? 'nav-link-active' : ''}`}
                >
                  <item.icon size={20} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button 
              className="menu-toggle"
              onClick={toggleSidebar}
            >
              <Menu size={24} />
            </button>
            <h1 className="header-title">
              Sistema de Gestão de Produção Têxtil
            </h1>
          </div>
          <div className="header-right">
            {/* User info or other header elements can go here */}
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};
