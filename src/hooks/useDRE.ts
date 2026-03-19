import { useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  FaturamentoDiario, 
  ReceitaDRE, 
  DespesaDRE, 
  CategoriaDRE, 
  ResumoDRE,
  MesAno,
  FormaPagamento
} from '@/types/dre';
import { 
  CATEGORIAS_RECEITA_PADRAO, 
  CATEGORIAS_DESPESA_PADRAO,
  FORMAS_PAGAMENTO 
} from '@/types/dre';

const FATURAMENTO_KEY = 'dre-faturamento';
const RECEITAS_KEY = 'dre-receitas';
const DESPESAS_KEY = 'dre-despesas-v2';
const CATEGORIAS_RECEITA_KEY = 'dre-categorias-receita';
const CATEGORIAS_DESPESA_KEY = 'dre-categorias-despesa';

export function useDRE() {
  const [faturamentos, setFaturamentos] = useState<FaturamentoDiario[]>([]);
  const [receitas, setReceitas] = useState<ReceitaDRE[]>([]);
  const [despesas, setDespesas] = useState<DespesaDRE[]>([]);
  const [categoriasReceita, setCategoriasReceita] = useState<CategoriaDRE[]>(CATEGORIAS_RECEITA_PADRAO);
  const [categoriasDespesa, setCategoriasDespesa] = useState<CategoriaDRE[]>(CATEGORIAS_DESPESA_PADRAO);
  const [mesSelecionado, setMesSelecionado] = useState<MesAno>({
    mes: new Date().getMonth(),
    ano: new Date().getFullYear(),
  });

  // Carregar dados do localStorage
  useEffect(() => {
    const faturamentosSalvos = localStorage.getItem(FATURAMENTO_KEY);
    const receitasSalvas = localStorage.getItem(RECEITAS_KEY);
    const despesasSalvas = localStorage.getItem(DESPESAS_KEY);
    const catReceitaSalvas = localStorage.getItem(CATEGORIAS_RECEITA_KEY);
    const catDespesaSalvas = localStorage.getItem(CATEGORIAS_DESPESA_KEY);

    if (faturamentosSalvos) {
      try { setFaturamentos(JSON.parse(faturamentosSalvos)); } catch (e) {}
    }
    if (receitasSalvas) {
      try { setReceitas(JSON.parse(receitasSalvas)); } catch (e) {}
    }
    if (despesasSalvas) {
      try { setDespesas(JSON.parse(despesasSalvas)); } catch (e) {}
    }
    if (catReceitaSalvas) {
      try { setCategoriasReceita(JSON.parse(catReceitaSalvas)); } catch (e) {}
    }
    if (catDespesaSalvas) {
      try { setCategoriasDespesa(JSON.parse(catDespesaSalvas)); } catch (e) {}
    }
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    localStorage.setItem(FATURAMENTO_KEY, JSON.stringify(faturamentos));
  }, [faturamentos]);

  useEffect(() => {
    localStorage.setItem(RECEITAS_KEY, JSON.stringify(receitas));
  }, [receitas]);

  useEffect(() => {
    localStorage.setItem(DESPESAS_KEY, JSON.stringify(despesas));
  }, [despesas]);

  useEffect(() => {
    localStorage.setItem(CATEGORIAS_RECEITA_KEY, JSON.stringify(categoriasReceita));
  }, [categoriasReceita]);

  useEffect(() => {
    localStorage.setItem(CATEGORIAS_DESPESA_KEY, JSON.stringify(categoriasDespesa));
  }, [categoriasDespesa]);

  // Filtrar por mês selecionado
  const faturamentosDoMes = useMemo(() => {
    return faturamentos.filter(f => {
      const data = new Date(f.data + 'T00:00:00');
      return data.getMonth() === mesSelecionado.mes && 
             data.getFullYear() === mesSelecionado.ano;
    }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [faturamentos, mesSelecionado]);

  const receitasDoMes = useMemo(() => {
    return receitas.filter(r => {
      const data = new Date(r.data + 'T00:00:00');
      return data.getMonth() === mesSelecionado.mes && 
             data.getFullYear() === mesSelecionado.ano;
    });
  }, [receitas, mesSelecionado]);

  const despesasDoMes = useMemo(() => {
    return despesas.filter(d => {
      const data = new Date(d.data + 'T00:00:00');
      return data.getMonth() === mesSelecionado.mes && 
             data.getFullYear() === mesSelecionado.ano;
    });
  }, [despesas, mesSelecionado]);

  // CRUD Faturamento
  const adicionarFaturamento = useCallback((dados: Omit<FaturamentoDiario, 'id' | 'createdAt'>) => {
    const novo: FaturamentoDiario = {
      ...dados,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setFaturamentos(prev => [...prev, novo]);
    return novo.id;
  }, []);

  const atualizarFaturamento = useCallback((id: string, dados: Partial<FaturamentoDiario>) => {
    setFaturamentos(prev => prev.map(f => f.id === id ? { ...f, ...dados } : f));
  }, []);

  const removerFaturamento = useCallback((id: string) => {
    setFaturamentos(prev => prev.filter(f => f.id !== id));
  }, []);

  // CRUD Receitas
  const adicionarReceita = useCallback((dados: Omit<ReceitaDRE, 'id' | 'createdAt'>) => {
    const nova: ReceitaDRE = {
      ...dados,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setReceitas(prev => [...prev, nova]);
    return nova.id;
  }, []);

  const atualizarReceita = useCallback((id: string, dados: Partial<ReceitaDRE>) => {
    setReceitas(prev => prev.map(r => r.id === id ? { ...r, ...dados } : r));
  }, []);

  const removerReceita = useCallback((id: string) => {
    setReceitas(prev => prev.filter(r => r.id !== id));
  }, []);

  // CRUD Despesas com suporte a parcelas
  const adicionarDespesa = useCallback((dados: Omit<DespesaDRE, 'id' | 'createdAt' | 'parcelaAtual' | 'despesaPaiId'>) => {
    const despesaPaiId = Date.now().toString();
    
    // Se for parcelada, criar múltiplas despesas
    if (dados.tipo === 'parcelada' && dados.parcelas && dados.parcelas > 1) {
      const valorParcela = dados.valor / dados.parcelas;
      const dataBase = new Date(dados.data + 'T00:00:00');
      
      const novasDespesas: DespesaDRE[] = [];
      
      for (let i = 0; i < dados.parcelas; i++) {
        const dataParcela = new Date(dataBase);
        dataParcela.setMonth(dataBase.getMonth() + i);
        
        const novaDespesa: DespesaDRE = {
          ...dados,
          id: i === 0 ? despesaPaiId : `${despesaPaiId}_${i}`,
          valor: valorParcela,
          data: dataParcela.toISOString().split('T')[0],
          parcelaAtual: i + 1,
          despesaPaiId: i === 0 ? undefined : despesaPaiId,
          createdAt: new Date().toISOString(),
        };
        
        novasDespesas.push(novaDespesa);
      }
      
      setDespesas(prev => [...prev, ...novasDespesas]);
      return despesaPaiId;
    }
    
    // Despesa única ou recorrente
    const nova: DespesaDRE = {
      ...dados,
      id: despesaPaiId,
      parcelaAtual: 1,
      createdAt: new Date().toISOString(),
    };
    setDespesas(prev => [...prev, nova]);
    return nova.id;
  }, []);

  const atualizarDespesa = useCallback((id: string, dados: Partial<DespesaDRE>) => {
    setDespesas(prev => prev.map(d => d.id === id ? { ...d, ...dados } : d));
  }, []);

  const removerDespesa = useCallback((id: string) => {
    // Se for parcela de uma despesa parcelada, remove todas as parcelas
    const despesa = despesas.find(d => d.id === id);
    if (despesa?.despesaPaiId) {
      setDespesas(prev => prev.filter(d => d.id !== id && d.despesaPaiId !== despesa.despesaPaiId && d.id !== despesa.despesaPaiId));
    } else {
      // Remove a despesa e suas parcelas
      setDespesas(prev => prev.filter(d => d.id !== id && d.despesaPaiId !== id));
    }
  }, [despesas]);

  // CRUD Categorias
  const adicionarCategoriaReceita = useCallback((nome: string, cor: string) => {
    const nova: CategoriaDRE = {
      id: Date.now().toString(),
      nome,
      tipo: 'receita',
      cor,
    };
    setCategoriasReceita(prev => [...prev, nova]);
  }, []);

  const adicionarCategoriaDespesa = useCallback((nome: string, cor: string) => {
    const nova: CategoriaDRE = {
      id: Date.now().toString(),
      nome,
      tipo: 'despesa',
      cor,
    };
    setCategoriasDespesa(prev => [...prev, nova]);
  }, []);

  const removerCategoriaReceita = useCallback((id: string) => {
    setCategoriasReceita(prev => prev.filter(c => c.id !== id));
  }, []);

  const removerCategoriaDespesa = useCallback((id: string) => {
    setCategoriasDespesa(prev => prev.filter(c => c.id !== id));
  }, []);

  // Calcular despesa percentual baseada no faturamento
  const calcularDespesaPercentual = useCallback((percentual: number, mes: number, ano: number): number => {
    const faturamentoMes = faturamentos
      .filter(f => {
        const data = new Date(f.data + 'T00:00:00');
        return data.getMonth() === mes && data.getFullYear() === ano;
      })
      .reduce((sum, f) => sum + f.valor, 0);
    
    return (faturamentoMes * percentual) / 100;
  }, [faturamentos]);

  // Resumo DRE
  const resumo: ResumoDRE = useMemo(() => {
    // Faturamento
    const totalFaturamento = faturamentosDoMes.reduce((sum, f) => sum + f.valor, 0);
    
    const faturamentoPorForma = FORMAS_PAGAMENTO.reduce((acc, forma) => {
      acc[forma.value] = faturamentosDoMes
        .filter(f => f.formaPagamento === forma.value)
        .reduce((sum, f) => sum + f.valor, 0);
      return acc;
    }, {} as Record<FormaPagamento, number>);

    // Agrupar faturamento por dia
    const faturamentoPorDiaMap = new Map<string, number>();
    faturamentosDoMes.forEach(f => {
      const atual = faturamentoPorDiaMap.get(f.data) || 0;
      faturamentoPorDiaMap.set(f.data, atual + f.valor);
    });
    const faturamentoPorDia = Array.from(faturamentoPorDiaMap.entries())
      .map(([data, valor]) => ({ data, valor }))
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    // Receitas
    const totalReceitas = receitasDoMes.reduce((sum, r) => sum + r.valor, 0);
    const receitasPorCategoria = receitasDoMes.reduce((acc, r) => {
      acc[r.categoria] = (acc[r.categoria] || 0) + r.valor;
      return acc;
    }, {} as Record<string, number>);

    // Despesas (incluindo percentuais)
    let totalDespesas = despesasDoMes.reduce((sum, d) => sum + d.valor, 0);
    
    // Adicionar despesas percentuais
    const despesasPercentuais = despesas.filter(d => 
      d.percentualFaturamento && d.percentualFaturamento > 0
    );
    
    despesasPercentuais.forEach(d => {
      if (d.percentualFaturamento) {
        const valorPercentual = (totalFaturamento * d.percentualFaturamento) / 100;
        totalDespesas += valorPercentual;
      }
    });
    
    const despesasPorCategoria = despesasDoMes.reduce((acc, d) => {
      acc[d.categoria] = (acc[d.categoria] || 0) + d.valor;
      return acc;
    }, {} as Record<string, number>);

    // Cálculos DRE
    const receitaBruta = totalFaturamento + totalReceitas;
    const receitaLiquida = receitaBruta;
    const lucroBruto = receitaLiquida - totalDespesas;
    const lucroLiquido = lucroBruto;
    const margemLucro = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

    // Comparativo com mês anterior
    const mesAnterior = mesSelecionado.mes === 0 ? 11 : mesSelecionado.mes - 1;
    const anoAnterior = mesSelecionado.mes === 0 ? mesSelecionado.ano - 1 : mesSelecionado.ano;
    
    const faturamentoMesAnterior = faturamentos
      .filter(f => {
        const data = new Date(f.data + 'T00:00:00');
        return data.getMonth() === mesAnterior && data.getFullYear() === anoAnterior;
      })
      .reduce((sum, f) => sum + f.valor, 0);
    
    const variacaoFaturamento = faturamentoMesAnterior > 0 
      ? ((totalFaturamento - faturamentoMesAnterior) / faturamentoMesAnterior) * 100 
      : 0;

    return {
      totalFaturamento,
      faturamentoPorForma,
      faturamentoPorDia,
      totalReceitas,
      receitasPorCategoria,
      totalDespesas,
      despesasPorCategoria,
      receitaBruta,
      receitaLiquida,
      lucroBruto,
      lucroLiquido,
      margemLucro,
      faturamentoMesAnterior,
      variacaoFaturamento,
    };
  }, [faturamentosDoMes, receitasDoMes, despesasDoMes, despesas, mesSelecionado, faturamentos]);

  // Faturamento até a data atual
  const getFaturamentoAteData = useCallback((data: string) => {
    return faturamentos
      .filter(f => f.data <= data)
      .reduce((sum, f) => sum + f.valor, 0);
  }, [faturamentos]);

  // Comparativo com ano anterior
  const getComparativoAnoAnterior = useCallback((mes: number, ano: number) => {
    const anoAnt = ano - 1;
    
    const faturamentoAtual = faturamentos
      .filter(f => {
        const data = new Date(f.data + 'T00:00:00');
        return data.getMonth() === mes && data.getFullYear() === ano;
      })
      .reduce((sum, f) => sum + f.valor, 0);
    
    const faturamentoAnoAnterior = faturamentos
      .filter(f => {
        const data = new Date(f.data + 'T00:00:00');
        return data.getMonth() === mes && data.getFullYear() === anoAnt;
      })
      .reduce((sum, f) => sum + f.valor, 0);
    
    const variacao = faturamentoAnoAnterior > 0 
      ? ((faturamentoAtual - faturamentoAnoAnterior) / faturamentoAnoAnterior) * 100 
      : 0;
    
    return {
      faturamentoAtual,
      faturamentoAnoAnterior,
      variacao,
    };
  }, [faturamentos]);

  // Gerar dias do mês para tabela
  const diasDoMes = useMemo(() => {
    const dias: { data: string; dia: number; faturamento: number }[] = [];
    const ultimoDia = new Date(mesSelecionado.ano, mesSelecionado.mes + 1, 0).getDate();
    
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const data = `${mesSelecionado.ano}-${String(mesSelecionado.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const faturamentoDia = faturamentosDoMes
        .filter(f => f.data === data)
        .reduce((sum, f) => sum + f.valor, 0);
      
      dias.push({ data, dia, faturamento: faturamentoDia });
    }
    
    return dias;
  }, [mesSelecionado, faturamentosDoMes]);

  const navegarMes = useCallback((direcao: 'anterior' | 'proximo') => {
    setMesSelecionado(prev => {
      let novoMes = prev.mes + (direcao === 'anterior' ? -1 : 1);
      let novoAno = prev.ano;
      
      if (novoMes < 0) {
        novoMes = 11;
        novoAno--;
      } else if (novoMes > 11) {
        novoMes = 0;
        novoAno++;
      }
      
      return { mes: novoMes, ano: novoAno };
    });
  }, []);

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return {
    // Dados
    faturamentos,
    faturamentosDoMes,
    receitas: receitasDoMes,
    despesas: despesasDoMes,
    todasDespesas: despesas,
    categoriasReceita,
    categoriasDespesa,
    mesSelecionado,
    nomeMesAtual: nomesMeses[mesSelecionado.mes],
    diasDoMes,
    resumo,
    
    // Ações
    setMesSelecionado,
    navegarMes,
    
    // Faturamento
    adicionarFaturamento,
    atualizarFaturamento,
    removerFaturamento,
    getFaturamentoAteData,
    getComparativoAnoAnterior,
    
    // Receitas
    adicionarReceita,
    atualizarReceita,
    removerReceita,
    
    // Despesas
    adicionarDespesa,
    atualizarDespesa,
    removerDespesa,
    calcularDespesaPercentual,
    
    // Categorias
    adicionarCategoriaReceita,
    adicionarCategoriaDespesa,
    removerCategoriaReceita,
    removerCategoriaDespesa,
  };
}
