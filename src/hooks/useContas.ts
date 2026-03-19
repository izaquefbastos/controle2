import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Conta, Categoria, ResumoFinanceiro, FiltroStatus, FiltroPeriodo, Orcamento } from '@/types';

const CONTAS_KEY = 'contas-a-pagar-dados';
const CATEGORIAS_KEY = 'contas-a-pagar-categorias';
const ORCAMENTO_KEY = 'contas-a-pagar-orcamento';

const categoriasPadrao: Categoria[] = [
  { id: '1', nome: 'Moradia', cor: '#3b82f6', icone: 'home' },
  { id: '2', nome: 'Alimentação', cor: '#22c55e', icone: 'utensils' },
  { id: '3', nome: 'Transporte', cor: '#f59e0b', icone: 'car' },
  { id: '4', nome: 'Saúde', cor: '#ef4444', icone: 'heart' },
  { id: '5', nome: 'Educação', cor: '#8b5cf6', icone: 'graduation-cap' },
  { id: '6', nome: 'Lazer', cor: '#ec4899', icone: 'gamepad-2' },
  { id: '7', nome: 'Serviços', cor: '#06b6d4', icone: 'zap' },
  { id: '8', nome: 'Impostos', cor: '#64748b', icone: 'file-text' },
  { id: '9', nome: 'Outros', cor: '#94a3b8', icone: 'more-horizontal' },
];

// Função para verificar se uma conta está atrasada
const verificarAtrasado = (dataVencimento: string): boolean => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(dataVencimento + 'T00:00:00');
  return vencimento < hoje;
};

export function useContas() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasPadrao);
  const [orcamento, setOrcamento] = useState<Orcamento>({ valor: 0 });
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('todos');
  const [busca, setBusca] = useState('');

  // Carregar dados do localStorage
  useEffect(() => {
    const contasSalvas = localStorage.getItem(CONTAS_KEY);
    const categoriasSalvas = localStorage.getItem(CATEGORIAS_KEY);
    const orcamentoSalvo = localStorage.getItem(ORCAMENTO_KEY);
    
    if (contasSalvas) {
      try {
        setContas(JSON.parse(contasSalvas));
      } catch (e) {
        console.error('Erro ao carregar contas:', e);
      }
    }
    
    if (categoriasSalvas) {
      try {
        setCategorias(JSON.parse(categoriasSalvas));
      } catch (e) {
        console.error('Erro ao carregar categorias:', e);
      }
    }

    if (orcamentoSalvo) {
      try {
        setOrcamento(JSON.parse(orcamentoSalvo));
      } catch (e) {
        console.error('Erro ao carregar orçamento:', e);
      }
    }
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    localStorage.setItem(CONTAS_KEY, JSON.stringify(contas));
  }, [contas]);

  useEffect(() => {
    localStorage.setItem(CATEGORIAS_KEY, JSON.stringify(categorias));
  }, [categorias]);

  useEffect(() => {
    localStorage.setItem(ORCAMENTO_KEY, JSON.stringify(orcamento));
  }, [orcamento]);

  // Verificar contas atrasadas automaticamente a cada minuto
  useEffect(() => {
    const verificarAtrasados = () => {
      setContas(prev => prev.map(conta => {
        if (conta.status === 'pendente' && verificarAtrasado(conta.dataVencimento)) {
          return { ...conta, status: 'atrasado' as const };
        }
        return conta;
      }));
    };

    // Verificar imediatamente
    verificarAtrasados();

    // Verificar a cada minuto
    const interval = setInterval(verificarAtrasados, 60000);
    return () => clearInterval(interval);
  }, []);

  const adicionarConta = useCallback((novaConta: Omit<Conta, 'id' | 'createdAt'>) => {
    // Verifica se a conta já está atrasada na hora de criar
    const statusInicial = novaConta.status === 'pendente' && verificarAtrasado(novaConta.dataVencimento) 
      ? 'atrasado' 
      : novaConta.status;

    const conta: Conta = {
      ...novaConta,
      status: statusInicial as 'pendente' | 'pago' | 'atrasado',
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setContas(prev => [...prev, conta]);
    return conta.id;
  }, []);

  const atualizarConta = useCallback((id: string, dados: Partial<Conta>) => {
    setContas(prev => prev.map(conta => {
      if (conta.id !== id) return conta;
      
      // Se atualizou a data de vencimento e está pendente, verifica se ficou atrasado
      let novoStatus = dados.status || conta.status;
      if (dados.dataVencimento && novoStatus === 'pendente') {
        if (verificarAtrasado(dados.dataVencimento)) {
          novoStatus = 'atrasado';
        }
      }
      
      return { ...conta, ...dados, status: novoStatus };
    }));
  }, []);

  const removerConta = useCallback((id: string) => {
    setContas(prev => prev.filter(conta => conta.id !== id));
  }, []);

  const marcarComoPago = useCallback((id: string) => {
    const hoje = new Date().toISOString().split('T')[0];
    setContas(prev => prev.map(conta => 
      conta.id === id 
        ? { ...conta, status: 'pago' as const, dataPagamento: hoje } 
        : conta
    ));
  }, []);

  const marcarComoPendente = useCallback((id: string) => {
    setContas(prev => prev.map(conta => {
      if (conta.id !== id) return conta;
      
      // Verifica se está atrasado ao voltar para pendente
      const novoStatus = verificarAtrasado(conta.dataVencimento) ? 'atrasado' : 'pendente';
      
      return { 
        ...conta, 
        status: novoStatus as 'pendente' | 'atrasado', 
        dataPagamento: undefined 
      };
    }));
  }, []);

  const adicionarCategoria = useCallback((categoria: Omit<Categoria, 'id'>) => {
    const novaCategoria: Categoria = {
      ...categoria,
      id: Date.now().toString(),
    };
    setCategorias(prev => [...prev, novaCategoria]);
  }, []);

  const removerCategoria = useCallback((id: string) => {
    setCategorias(prev => prev.filter(cat => cat.id !== id));
  }, []);

  const atualizarOrcamento = useCallback((valor: number) => {
    setOrcamento({ valor });
  }, []);

  const contasFiltradas = useMemo(() => {
    let resultado = [...contas];
    const hoje = new Date().toISOString().split('T')[0];
    const hojeDate = new Date();
    const mesAtual = hojeDate.getMonth();
    const anoAtual = hojeDate.getFullYear();

    // Filtro de status
    if (filtroStatus !== 'todos') {
      resultado = resultado.filter(c => c.status === filtroStatus);
    }

    // Filtro de categoria
    if (filtroCategoria !== 'todas') {
      resultado = resultado.filter(c => c.categoria === filtroCategoria);
    }

    // Filtro de período
    if (filtroPeriodo !== 'todos') {
      resultado = resultado.filter(c => {
        const dataVenc = new Date(c.dataVencimento);
        const mesVenc = dataVenc.getMonth();
        const anoVenc = dataVenc.getFullYear();

        switch (filtroPeriodo) {
          case 'este-mes':
            return mesVenc === mesAtual && anoVenc === anoAtual;
          case 'proximo-mes':
            const proxMes = mesAtual === 11 ? 0 : mesAtual + 1;
            const proxAno = mesAtual === 11 ? anoAtual + 1 : anoAtual;
            return mesVenc === proxMes && anoVenc === proxAno;
          case 'este-ano':
            return anoVenc === anoAtual;
          case 'atrasados':
            return c.status === 'atrasado' || (c.status === 'pendente' && c.dataVencimento < hoje);
          default:
            return true;
        }
      });
    }

    // Filtro de busca
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(c => 
        c.nome.toLowerCase().includes(termo) ||
        c.categoria.toLowerCase().includes(termo) ||
        c.observacao?.toLowerCase().includes(termo)
      );
    }

    // Ordenar por data de vencimento
    return resultado.sort((a, b) => 
      new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()
    );
  }, [contas, filtroStatus, filtroCategoria, filtroPeriodo, busca]);

  const resumo: ResumoFinanceiro = useMemo(() => {
    const totalPendente = contas
      .filter(c => c.status === 'pendente')
      .reduce((sum, c) => sum + c.valor, 0);
    
    const totalPago = contas
      .filter(c => c.status === 'pago')
      .reduce((sum, c) => sum + c.valor, 0);
    
    const totalAtrasado = contas
      .filter(c => c.status === 'atrasado')
      .reduce((sum, c) => sum + c.valor, 0);

    const totalDespesas = totalPendente + totalAtrasado + totalPago;
    const saldoRestante = orcamento.valor - totalDespesas;
    const percentualUsado = orcamento.valor > 0 ? (totalDespesas / orcamento.valor) * 100 : 0;

    return {
      totalPendente,
      totalPago,
      totalAtrasado,
      totalGeral: totalPendente + totalPago + totalAtrasado,
      contasPendentes: contas.filter(c => c.status === 'pendente').length,
      contasPagas: contas.filter(c => c.status === 'pago').length,
      contasAtrasadas: contas.filter(c => c.status === 'atrasado').length,
      orcamento: orcamento.valor,
      saldoRestante,
      percentualUsado,
    };
  }, [contas, orcamento]);

  const gastosPorCategoria = useMemo(() => {
    const gastos: Record<string, number> = {};
    contas.forEach(conta => {
      // Inclui todas as contas não pagas (pendentes + atrasadas)
      if (conta.status !== 'pago') {
        gastos[conta.categoria] = (gastos[conta.categoria] || 0) + conta.valor;
      }
    });
    return Object.entries(gastos)
      .map(([categoria, valor]) => ({
        categoria,
        valor,
        cor: categorias.find(c => c.nome === categoria)?.cor || '#94a3b8',
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [contas, categorias]);

  // Dados para o gráfico de pizza (todas as despesas)
  const gastosPorCategoriaTotal = useMemo(() => {
    const gastos: Record<string, number> = {};
    contas.forEach(conta => {
      if (conta.status !== 'pago') {
        gastos[conta.categoria] = (gastos[conta.categoria] || 0) + conta.valor;
      }
    });
    return Object.entries(gastos)
      .map(([categoria, valor]) => ({
        name: categoria,
        value: valor,
        color: categorias.find(c => c.nome === categoria)?.cor || '#94a3b8',
      }))
      .sort((a, b) => b.value - a.value);
  }, [contas, categorias]);

  const contasProximasVencimento = useMemo(() => {
    const hoje = new Date();
    const tresDias = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    return contas.filter(c => {
      if (c.status !== 'pendente') return false;
      const venc = new Date(c.dataVencimento + 'T00:00:00');
      return venc <= tresDias && venc >= hoje;
    }).sort((a, b) => 
      new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()
    );
  }, [contas]);


  // Gera um grupo de contas recorrentes (mensais)
  const adicionarContaRecorrente = useCallback((
    novaConta: Omit<Conta, 'id' | 'createdAt' | 'recorrente' | 'recorrenteTotal' | 'recorrenteParcela' | 'recorrenteGrupoId'>,
    numParcelas: number
  ) => {
    const grupoId = Date.now().toString() + Math.random().toString(36).slice(2);
    const novasContas: Conta[] = [];

    for (let i = 0; i < numParcelas; i++) {
      // Avança o vencimento mês a mês
      const dataBase = new Date(novaConta.dataVencimento + 'T00:00:00');
      dataBase.setMonth(dataBase.getMonth() + i);
      const dataVencimento = dataBase.toISOString().split('T')[0];

      const statusInicial: Conta['status'] =
        novaConta.status === 'pendente' && verificarAtrasado(dataVencimento)
          ? 'atrasado'
          : novaConta.status === 'pendente'
          ? 'pendente'
          : novaConta.status;

      novasContas.push({
        ...novaConta,
        id: Date.now().toString() + '_' + i,
        createdAt: new Date().toISOString(),
        dataVencimento,
        status: statusInicial,
        nome: numParcelas > 1 ? `${novaConta.nome} (${i + 1}/${numParcelas})` : novaConta.nome,
        recorrente: true,
        recorrenteTotal: numParcelas,
        recorrenteParcela: i + 1,
        recorrenteGrupoId: grupoId,
      });
    }

    setContas(prev => [...prev, ...novasContas]);
    return grupoId;
  }, []);

  return {
    contas,
    contasFiltradas,
    categorias,
    orcamento,
    resumo,
    gastosPorCategoria,
    gastosPorCategoriaTotal,
    contasProximasVencimento,
    filtros: {
      status: filtroStatus,
      categoria: filtroCategoria,
      periodo: filtroPeriodo,
      busca,
    },
    setFiltroStatus,
    setFiltroCategoria,
    setFiltroPeriodo,
    setBusca,
    adicionarConta,
    adicionarContaRecorrente,
    atualizarConta,
    removerConta,
    marcarComoPago,
    marcarComoPendente,
    adicionarCategoria,
    removerCategoria,
    atualizarOrcamento,
  };
}
