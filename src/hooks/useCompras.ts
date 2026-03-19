import { useState, useEffect, useCallback } from 'react';
import type { CompraMercadoria, ResumoCompras } from '@/types/compras';

const COMPRAS_KEY = 'dre-compras-mercadoria';

export function useCompras() {
  const [compras, setCompras] = useState<CompraMercadoria[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    const comprasSalvas = localStorage.getItem(COMPRAS_KEY);
    if (comprasSalvas) {
      try {
        setCompras(JSON.parse(comprasSalvas));
      } catch (e) {
        console.error('Erro ao carregar compras:', e);
      }
    }
  }, []);

  // Salvar no localStorage
  useEffect(() => {
    localStorage.setItem(COMPRAS_KEY, JSON.stringify(compras));
  }, [compras]);

  const adicionarCompra = useCallback((dados: Omit<CompraMercadoria, 'id' | 'createdAt'>) => {
    const nova: CompraMercadoria = {
      ...dados,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setCompras(prev => [...prev, nova]);
    return nova.id;
  }, []);

  const atualizarCompra = useCallback((id: string, dados: Partial<CompraMercadoria>) => {
    setCompras(prev => prev.map(c => c.id === id ? { ...c, ...dados } : c));
  }, []);

  const removerCompra = useCallback((id: string) => {
    setCompras(prev => prev.filter(c => c.id !== id));
  }, []);

  const marcarComoPago = useCallback((id: string) => {
    const hoje = new Date().toISOString().split('T')[0];
    setCompras(prev => prev.map(c => 
      c.id === id ? { ...c, pago: true, dataPagamento: hoje } : c
    ));
  }, []);

  // Filtrar por mês
  const getComprasPorMes = useCallback((mes: number, ano: number) => {
    return compras.filter(c => {
      const data = new Date(c.data + 'T00:00:00');
      return data.getMonth() === mes && data.getFullYear() === ano;
    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [compras]);

  // Resumo
  const getResumoPorMes = useCallback((mes: number, ano: number): ResumoCompras => {
    const comprasMes = getComprasPorMes(mes, ano);
    
    const totalCompras = comprasMes.reduce((sum, c) => sum + c.valor, 0);
    const totalPago = comprasMes.filter(c => c.pago).reduce((sum, c) => sum + c.valor, 0);
    const totalPendente = comprasMes.filter(c => !c.pago).reduce((sum, c) => sum + c.valor, 0);
    
    const comprasPorFornecedor = comprasMes.reduce((acc, c) => {
      acc[c.fornecedor] = (acc[c.fornecedor] || 0) + c.valor;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCompras,
      totalPago,
      totalPendente,
      comprasPorFornecedor,
      comprasPorMes: [],
    };
  }, [getComprasPorMes]);

  // Total de compras até uma data
  const getTotalAteData = useCallback((dataLimite: string) => {
    return compras
      .filter(c => c.data <= dataLimite)
      .reduce((sum, c) => sum + c.valor, 0);
  }, [compras]);

  // Top fornecedores
  const getTopFornecedores = useCallback((limite: number = 5) => {
    const fornecedores = compras.reduce((acc, c) => {
      acc[c.fornecedor] = (acc[c.fornecedor] || 0) + c.valor;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(fornecedores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limite);
  }, [compras]);

  return {
    compras,
    adicionarCompra,
    atualizarCompra,
    removerCompra,
    marcarComoPago,
    getComprasPorMes,
    getResumoPorMes,
    getTotalAteData,
    getTopFornecedores,
  };
}
