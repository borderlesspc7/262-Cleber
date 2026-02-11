import { useState } from "react";
import { Layout } from "../../components/Layout/Layout";
import { DashboardTab } from "../../components/tabs/DashboardTab";
import { CadastrosTab } from "../Cadastros/CadastrosTab";
import { FaccoesTab } from "../../components/tabs/FaccoesTab";
import { EtapasTab } from "../../components/tabs/EtapasTab";
import { ProdutoTab } from "../../components/tabs/ProdutoTab";
import { OrdemProducoesTab } from "../../components/tabs/OrdemProducoesTab";
import { GestaoProducoesTab } from "../../components/tabs/GestaoProducoesTab";
import { FinanceiroTab } from "../../components/tabs/FinanceiroTab";
import { RelatoriosTab } from "../../components/tabs/RelatoriosTab";
import "./Dashboard.css";

type TabType =
  | "dashboard"
  | "cadastros"
  | "faccoes"
  | "etapas"
  | "produto"
  | "ordemProducoes"
  | "gestaoProducoes"
  | "financeiro"
  | "relatorios";

export const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // Definir a função ANTES de ser usada
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
  };

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
      case "relatorios":
        return <RelatoriosTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      <div className="dashboard-container">{renderTabContent()}</div>
    </Layout>
  );
};
