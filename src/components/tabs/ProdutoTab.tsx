import React, { useState } from "react";
import { 
  Package, 
  Tag, 
  Palette, 
  Ruler
} from "lucide-react";
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
  ProdutoForm
} from "../../types/product";

type ProductTabType = 'produtos' | 'categorias' | 'cores' | 'tamanhos';

export const ProdutoTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProductTabType>('produtos');
  
  // Estados para os dados (em produção real, viriam de uma API)
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cores, setCores] = useState<Cor[]>([]);
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // Funções para gerenciar categorias
  const handleAddCategoria = (categoriaForm: CategoriaForm) => {
    const novaCategoria: Categoria = {
      id: Date.now().toString(),
      nome: categoriaForm.nome,
      descricao: categoriaForm.descricao,
      ativo: true,
      createdAt: new Date(),
    };
    setCategorias([...categorias, novaCategoria]);
  };

  const handleEditCategoria = (id: string, categoriaForm: CategoriaForm) => {
    setCategorias(categorias.map(c => 
      c.id === id 
        ? { ...c, nome: categoriaForm.nome, descricao: categoriaForm.descricao }
        : c
    ));
  };

  const handleDeleteCategoria = (id: string) => {
    setCategorias(categorias.filter(c => c.id !== id));
  };

  // Funções para gerenciar cores
  const handleAddCor = (corForm: CorForm) => {
    const novaCor: Cor = {
      id: Date.now().toString(),
      nome: corForm.nome,
      codigo: corForm.codigo,
      ativo: true,
      createdAt: new Date(),
    };
    setCores([...cores, novaCor]);
  };

  const handleEditCor = (id: string, corForm: CorForm) => {
    setCores(cores.map(c => 
      c.id === id 
        ? { ...c, nome: corForm.nome, codigo: corForm.codigo }
        : c
    ));
  };

  const handleDeleteCor = (id: string) => {
    setCores(cores.filter(c => c.id !== id));
  };

  // Funções para gerenciar tamanhos
  const handleAddTamanho = (tamanhoForm: TamanhoForm) => {
    const novoTamanho: Tamanho = {
      id: Date.now().toString(),
      nome: tamanhoForm.nome,
      ordem: tamanhoForm.ordem,
      ativo: true,
      createdAt: new Date(),
    };
    setTamanhos([...tamanhos, novoTamanho]);
  };

  const handleEditTamanho = (id: string, tamanhoForm: TamanhoForm) => {
    setTamanhos(tamanhos.map(t => 
      t.id === id 
        ? { ...t, nome: tamanhoForm.nome, ordem: tamanhoForm.ordem }
        : t
    ));
  };

  const handleDeleteTamanho = (id: string) => {
    setTamanhos(tamanhos.filter(t => t.id !== id));
  };


  // Funções para gerenciar produtos
  const handleAddProduto = (produtoForm: ProdutoForm) => {
    const categoria = categorias.find(c => c.id === produtoForm.categoriaId);
    const coresSelecionadas = cores.filter(c => produtoForm.coresIds.includes(c.id));
    const tamanhosSelecionados = tamanhos.filter(t => produtoForm.tamanhosIds.includes(t.id));

    if (!categoria) return;

    const novoProduto: Produto = {
      id: Date.now().toString(),
      refCodigo: produtoForm.refCodigo,
      descricao: produtoForm.descricao,
      categoria,
      cores: coresSelecionadas,
      tamanhos: tamanhosSelecionados,
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProdutos([...produtos, novoProduto]);
  };

  const handleEditProduto = (id: string, produtoForm: ProdutoForm) => {
    const categoria = categorias.find(c => c.id === produtoForm.categoriaId);
    const coresSelecionadas = cores.filter(c => produtoForm.coresIds.includes(c.id));
    const tamanhosSelecionados = tamanhos.filter(t => produtoForm.tamanhosIds.includes(t.id));

    if (!categoria) return;

    setProdutos(produtos.map(p => 
      p.id === id 
        ? { 
            ...p, 
            refCodigo: produtoForm.refCodigo,
            descricao: produtoForm.descricao,
            categoria,
            cores: coresSelecionadas,
            tamanhos: tamanhosSelecionados,
            updatedAt: new Date()
          }
        : p
    ));
  };

  const handleDeleteProduto = (id: string) => {
    setProdutos(produtos.filter(p => p.id !== id));
  };

  const tabs = [
    { key: 'produtos', label: 'Produtos', icon: Package },
    { key: 'categorias', label: 'Categorias', icon: Tag },
    { key: 'cores', label: 'Cores', icon: Palette },
    { key: 'tamanhos', label: 'Tamanhos', icon: Ruler },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'produtos':
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
      case 'categorias':
        return (
          <CategoriaFormComponent
            categorias={categorias}
            onAdd={handleAddCategoria}
            onEdit={handleEditCategoria}
            onDelete={handleDeleteCategoria}
          />
        );
      case 'cores':
        return (
          <CorFormComponent
            cores={cores}
            onAdd={handleAddCor}
            onEdit={handleEditCor}
            onDelete={handleDeleteCor}
          />
        );
      case 'tamanhos':
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

      <div className="product-tabs">
        <div className="product-tab-nav">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ProductTabType)}
              className={`product-tab-button ${activeTab === tab.key ? 'active' : ''}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="product-tab-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
