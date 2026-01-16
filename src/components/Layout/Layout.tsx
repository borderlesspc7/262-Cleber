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
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { authService } from "../../services/authService";
import { companyService } from "../../services/companyService";
import type { Company } from "../../types/company";
import "./Layout.css";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab = "dashboard",
  onTabChange,
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [companyInfo, setCompanyInfo] = React.useState<Company | null>(null);
  const navigate = useNavigate();
  React.useEffect(() => {
    loadCompanyInfo();

    // Listener para atualizar quando as informações forem salvas
    const handleCompanyUpdate = () => {
      loadCompanyInfo();
    };

    window.addEventListener("companyInfoUpdated", handleCompanyUpdate);

    return () => {
      window.removeEventListener("companyInfoUpdated", handleCompanyUpdate);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logOut();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  const loadCompanyInfo = async () => {
    try {
      const data = await companyService.getCompanyInfo();
      setCompanyInfo(data);
    } catch (error) {
      console.error("Erro ao carregar informações da empresa:", error);
    }
  };

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
    { icon: BarChart3, label: "Relatórios", key: "relatorios" },
  ];

  const handleTabClick = (tabKey: string) => {
    if (onTabChange) {
      onTabChange(tabKey);
    }
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            {companyInfo?.logoUrl ? (
              <img
                src={companyInfo.logoUrl}
                alt={companyInfo.nome || "Logo"}
                className="company-logo-img"
              />
            ) : (
              <LayoutDashboard className="logo-icon" />
            )}
            <div className="company-info">
              <span className="logo-text">
                {companyInfo?.nome || "Nome da empresa"}
              </span>
              {companyInfo?.endereco && (
                <span className="company-address">{companyInfo.endereco}</span>
              )}
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={toggleSidebar}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item, index) => (
              <li key={index} className="nav-item">
                <button
                  onClick={() => handleTabClick(item.key)}
                  className={`nav-link ${
                    activeTab === item.key ? "nav-link-active" : ""
                  }`}
                >
                  <item.icon size={20} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
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
            <button className="menu-toggle" onClick={toggleSidebar}>
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
        <main className="page-content">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}
    </div>
  );
};
