import { useState, useEffect, useCallback } from "react";
import { Layout } from "../../components/Layout/Layout";
import { DashboardTab } from "../../components/tabs/DashboardTab";
import { CadastrosTab } from "../Cadastros/CadastrosTab";
import { FaccoesTab } from "../../components/tabs/FaccoesTab";
import { EtapasTab } from "../../components/tabs/EtapasTab";
import { ProdutoTab } from "../../components/tabs/ProdutoTab";
import { OrdemProducoesTab } from "../../components/tabs/OrdemProducoesTab";
import { GestaoProducoesTab } from "../../components/tabs/GestaoProducoesTab";
import { FinanceiroTab } from "../../components/tabs/FinanceiroTab";
import toast from "react-hot-toast";
import "./Dashboard.css";

type TabType =
  | "dashboard"
  | "cadastros"
  | "faccoes"
  | "etapas"
  | "produto"
  | "ordemProducoes"
  | "gestaoProducoes"
  | "financeiro";

export const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isFirstRender, setIsFirstRender] = useState(true);

  const getTabName = useCallback((tab: TabType): string => {
    const tabNames: Record<TabType, string> = {
      dashboard: "Dashboard",
      cadastros: "Cadastros",
      faccoes: "Faccoes",
      etapas: "Etapas",
      produto: "Produto",
      ordemProducoes: "Ordem de Produções",
      gestaoProducoes: "Gestão de Produções",
      financeiro: "Financeiro",
    };
    return tabNames[tab] || "Dashboard";
  }, []);

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    if (activeTab) {
      toast.success(`Aba ${getTabName(activeTab)} aberta`, {
        icon: "✅",
        duration: 2000,
      });
    }
  }, [activeTab, isFirstRender, getTabName]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />;
      case "cadastros":
        return <CadastrosTab onTabChange={handleTabChange} />;
      case "faccoes":
        return <FaccoesTab />;
      case "etapas":
        return <EtapasTab />;
      case "produto":
        return <ProdutoTab />;
      case "ordemProducoes":
        return <OrdemProducoesTab />;
      case "gestaoProducoes":
        return <GestaoProducoesTab />;
      case "financeiro":
        return <FinanceiroTab />;
      default:
        return <DashboardTab />;
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      <div className="dashboard-container">{renderTabContent()}</div>
    </Layout>
  );
};
