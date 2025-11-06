import React, { useState, useEffect } from "react";
import { Package, Tag, Palette, Ruler } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  categoriaService,
  corService,
  tamanhoService,
  produtoService,
} from "../../services/productService";
import "../products/products.css";
import { CategoriaFormComponent } from "../products/CategoriaForm";
import { CorFormComponent } from "../products/CorForm";
import { TamanhoFormComponent } from "../products/TamanhoForm";
import { ProdutoFormComponent } from "../products/ProdutoForm";
import type {
  Categoria,
  Cor,
  Tamanho,
  Produto,
  CategoriaForm,
  CorForm,
  TamanhoForm,
  ProdutoForm,
} from "../../types/product";
import toast from "react-hot-toast";

type ProductTabType = "produtos" | "categorias" | "cores" | "tamanhos";

export const ProdutoTab: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProductTabType>("produtos");
  const [loading, setLoading] = useState(true);

  // Estados para os dados
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cores, setCores] = useState<Cor[]>([]);
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // Carregar dados do Firebase
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [categoriasData, coresData, tamanhosData, produtosData] =
        await Promise.all([
          categoriaService.getCategorias(user.uid),
          corService.getCores(user.uid),
          tamanhoService.getTamanhos(user.uid),
          produtoService.getProdutos(user.uid),
        ]);

      setCategorias(categoriasData);
      setCores(coresData);
      setTamanhos(tamanhosData);

      // Reconstruir produtos com objetos completos
      const produtosCompletos = produtosData.map((produto) => {
        const categoria = categoriasData.find(
          (c) => c.id === produto.categoriaId
        );
        const coresProduto = coresData.filter((c) =>
          produto.coresIds?.includes(c.id)
        );
        const tamanhosProduto = tamanhosData.filter((t) =>
          produto.tamanhosIds?.includes(t.id)
        );

        return {
          ...produto,
          categoria: categoria || produto.categoria,
          cores: coresProduto.length > 0 ? coresProduto : produto.cores || [],
          tamanhos:
            tamanhosProduto.length > 0
              ? tamanhosProduto
              : produto.tamanhos || [],
        };
      });

      setProdutos(produtosCompletos);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Funções para gerenciar categorias
  const handleAddCategoria = async (categoriaForm: CategoriaForm) => {
    if (!user) return;

    try {
      await categoriaService.createCategoria(user.uid, categoriaForm);
      await loadAllData(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
      alert("Erro ao adicionar categoria");
    }
  };

  const handleEditCategoria = async (
    id: string,
    categoriaForm: CategoriaForm
  ) => {
    try {
      await categoriaService.updateCategoria(id, categoriaForm);
      await loadAllData(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao editar categoria:", error);
      alert("Erro ao editar categoria");
    }
  };

  const handleDeleteCategoria = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
      await categoriaService.deleteCategoria(id);
      await loadAllData(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      alert("Erro ao excluir categoria");
    }
  };

  // Funções para gerenciar cores
  const handleAddCor = async (corForm: CorForm) => {
    if (!user) return;

    try {
      await corService.createCor(user.uid, corForm);
      await loadAllData(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao adicionar cor:", error);
      alert("Erro ao adicionar cor");
    }
  };

  const handleEditCor = async (id: string, corForm: CorForm) => {
    try {
      await corService.updateCor(id, corForm);
      await loadAllData(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao editar cor:", error);
      alert("Erro ao editar cor");
    }
  };

  const handleDeleteCor = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta cor?")) return;

    try {
      await corService.deleteCor(id);
      await loadAllData(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao excluir cor:", error);
      alert("Erro ao excluir cor");
    }
  };

  // Funções para gerenciar tamanhos
  const handleAddTamanho = async (tamanhoForm: TamanhoForm) => {
    if (!user) return;

    try {
      await tamanhoService.createTamanho(user.uid, tamanhoForm);
      await loadAllData(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao adicionar tamanho:", error);
      alert("Erro ao adicionar tamanho");
    }
  };

  const handleEditTamanho = async (id: string, tamanhoForm: TamanhoForm) => {
    try {
      await tamanhoService.updateTamanho(id, tamanhoForm);
      await loadAllData(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao editar tamanho:", error);
      alert("Erro ao editar tamanho");
    }
  };

  const handleDeleteTamanho = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este tamanho?")) return;

    try {
      await tamanhoService.deleteTamanho(id);
      await loadAllData(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao excluir tamanho:", error);
      alert("Erro ao excluir tamanho");
    }
  };

  // Funções para gerenciar produtos
  const handleAddProduto = async (produtoForm: ProdutoForm) => {
    if (!user) return;

    try {
      await produtoService.createProduto(user.uid, produtoForm);
      await loadAllData(); // Recarregar dados
      toast.success("Produto criado com sucesso!", {
        icon: "🎉",
      });
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao criar produto. Tente novamente.";
      toast.error(errorMessage);
    }
  };

  const handleEditProduto = async (id: string, produtoForm: ProdutoForm) => {
    try {
      await produtoService.updateProduto(id, produtoForm);
      await loadAllData(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao editar produto:", error);
      alert("Erro ao editar produto");
    }
  };

  const handleDeleteProduto = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      await produtoService.deleteProduto(id);
      await loadAllData(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto");
    }
  };

  const tabs = [
    { key: "produtos", label: "Produtos", icon: Package },
    { key: "categorias", label: "Categorias", icon: Tag },
    { key: "cores", label: "Cores", icon: Palette },
    { key: "tamanhos", label: "Tamanhos", icon: Ruler },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "produtos":
        return (
          <ProdutoFormComponent
            produtos={produtos}
            categorias={categorias}
            cores={cores}
            tamanhos={tamanhos}
            onAdd={handleAddProduto}
            onEdit={handleEditProduto}
            onDelete={handleDeleteProduto}
          />
        );
      case "categorias":
        return (
          <CategoriaFormComponent
            categorias={categorias}
            onAdd={handleAddCategoria}
            onEdit={handleEditCategoria}
            onDelete={handleDeleteCategoria}
          />
        );
      case "cores":
        return (
          <CorFormComponent
            cores={cores}
            onAdd={handleAddCor}
            onEdit={handleEditCor}
            onDelete={handleDeleteCor}
          />
        );
      case "tamanhos":
        return (
          <TamanhoFormComponent
            tamanhos={tamanhos}
            onAdd={handleAddTamanho}
            onEdit={handleEditTamanho}
            onDelete={handleDeleteTamanho}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">Produtos</h2>
        <p className="tab-subtitle">
          Gerencie produtos, categorias, cores e tamanhos
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <p>Carregando dados...</p>
        </div>
      ) : (
        <div className="product-tabs">
          <div className="product-tab-nav">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ProductTabType)}
                className={`product-tab-button ${
                  activeTab === tab.key ? "active" : ""
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="product-tab-content">{renderTabContent()}</div>
        </div>
      )}
    </div>
  );
};
