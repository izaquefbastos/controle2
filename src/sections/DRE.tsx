import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  CreditCard,
  Smartphone,
  Banknote,
  FileText,
  ArrowLeftRight,
  MoreHorizontal,
  Trash2,
  BarChart3,
  Percent,
  Wallet,
  Repeat,
  Layers
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { 
  FaturamentoDiario, 
  ReceitaDRE, 
  DespesaDRE,
  FormaPagamento,
  CategoriaDRE,
  TipoDespesa
} from '@/types/dre';
import { FORMAS_PAGAMENTO, TIPOS_DESPESA } from '@/types/dre';

interface DREProps {
  faturamentos: FaturamentoDiario[];
  receitas: ReceitaDRE[];
  despesas: DespesaDRE[];
  todasDespesas: DespesaDRE[];
  categoriasReceita: CategoriaDRE[];
  categoriasDespesa: CategoriaDRE[];
  mesSelecionado: { mes: number; ano: number };
  nomeMesAtual: string;
  diasDoMes: { data: string; dia: number; faturamento: number }[];
  resumo: {
    totalFaturamento: number;
    faturamentoPorForma: Record<FormaPagamento, number>;
    faturamentoPorDia: { data: string; valor: number }[];
    totalReceitas: number;
    receitasPorCategoria: Record<string, number>;
    totalDespesas: number;
    despesasPorCategoria: Record<string, number>;
    receitaBruta: number;
    receitaLiquida: number;
    lucroBruto: number;
    lucroLiquido: number;
    margemLucro: number;
    faturamentoMesAnterior: number;
    variacaoFaturamento: number;
  };
  navegarMes: (direcao: 'anterior' | 'proximo') => void;
  adicionarFaturamento: (dados: Omit<FaturamentoDiario, 'id' | 'createdAt'>) => string;
  removerFaturamento: (id: string) => void;
  adicionarReceita: (dados: Omit<ReceitaDRE, 'id' | 'createdAt'>) => string;
  removerReceita: (id: string) => void;
  adicionarDespesa: (dados: Omit<DespesaDRE, 'id' | 'createdAt' | 'parcelaAtual' | 'despesaPaiId'>) => string;
  removerDespesa: (id: string) => void;
  adicionarCategoriaReceita: (nome: string, cor: string) => void;
  adicionarCategoriaDespesa: (nome: string, cor: string) => void;
}

const getIconeFormaPagamento = (forma: FormaPagamento) => {
  switch (forma) {
    case 'dinheiro': return <Banknote className="h-4 w-4" />;
    case 'pix': return <Smartphone className="h-4 w-4" />;
    case 'cartao_credito': return <CreditCard className="h-4 w-4" />;
    case 'cartao_debito': return <CreditCard className="h-4 w-4" />;
    case 'parcelado': return <Calendar className="h-4 w-4" />;
    case 'boleto': return <FileText className="h-4 w-4" />;
    case 'transferencia': return <ArrowLeftRight className="h-4 w-4" />;
    default: return <MoreHorizontal className="h-4 w-4" />;
  }
};

const getLabelFormaPagamento = (forma: FormaPagamento) => {
  return FORMAS_PAGAMENTO.find(f => f.value === forma)?.label || forma;
};

const getIconeTipoDespesa = (tipo: TipoDespesa) => {
  switch (tipo) {
    case 'recorrente': return <Repeat className="h-4 w-4" />;
    case 'parcelada': return <Layers className="h-4 w-4" />;
    default: return <DollarSign className="h-4 w-4" />;
  }
};

const coresDisponiveis = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#64748b', '#94a3b8', '#f97316',
];

export function DRE({
  faturamentos,
  receitas,
  despesas,
  todasDespesas: _todasDespesas,
  categoriasReceita,
  categoriasDespesa,
  mesSelecionado,
  nomeMesAtual,
  diasDoMes,
  resumo,
  navegarMes,
  adicionarFaturamento,
  removerFaturamento,
  adicionarReceita,
  removerReceita,
  adicionarDespesa,
  removerDespesa,
  adicionarCategoriaReceita,
  adicionarCategoriaDespesa,
}: DREProps) {
  const [dialogFaturamento, setDialogFaturamento] = useState(false);
  const [dialogReceita, setDialogReceita] = useState(false);
  const [dialogDespesa, setDialogDespesa] = useState(false);
  const [dialogCategoria, setDialogCategoria] = useState<'receita' | 'despesa' | null>(null);
  const [dialogDetalhesDia, setDialogDetalhesDia] = useState<string | null>(null);

  const [formFaturamento, setFormFaturamento] = useState({
    data: new Date().toISOString().split('T')[0],
    valor: '',
    formaPagamento: 'dinheiro' as FormaPagamento,
    descricao: '',
    cliente: '',
    parcelas: '1',
  });

  const [formReceita, setFormReceita] = useState({
    nome: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    categoria: '',
    descricao: '',
    recorrente: false,
  });

  const [formDespesa, setFormDespesa] = useState({
    nome: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    categoria: '',
    descricao: '',
    tipo: 'unica' as TipoDespesa,
    parcelas: '2',
    percentualFaturamento: '',
    usarPercentual: false,
  });

  const [novaCategoria, setNovaCategoria] = useState({ nome: '', cor: '#22c55e' });

  const handleAddFaturamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFaturamento.valor || !formFaturamento.data) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    adicionarFaturamento({
      data: formFaturamento.data,
      valor: parseFloat(formFaturamento.valor),
      formaPagamento: formFaturamento.formaPagamento,
      descricao: formFaturamento.descricao,
      cliente: formFaturamento.cliente,
      parcelas: parseInt(formFaturamento.parcelas) || 1,
    });

    toast.success('Faturamento adicionado!');
    setDialogFaturamento(false);
    setFormFaturamento({
      data: new Date().toISOString().split('T')[0],
      valor: '',
      formaPagamento: 'dinheiro',
      descricao: '',
      cliente: '',
      parcelas: '1',
    });
  };

  const handleAddReceita = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReceita.nome || !formReceita.valor || !formReceita.categoria) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    adicionarReceita({
      nome: formReceita.nome,
      valor: parseFloat(formReceita.valor),
      data: formReceita.data,
      categoria: formReceita.categoria,
      descricao: formReceita.descricao,
      recorrente: formReceita.recorrente,
    });

    toast.success('Receita adicionada!');
    setDialogReceita(false);
    setFormReceita({
      nome: '',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      categoria: '',
      descricao: '',
      recorrente: false,
    });
  };

  const handleAddDespesa = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formDespesa.nome || !formDespesa.categoria) {
      toast.error('Preencha o nome e categoria');
      return;
    }

    // Se usar percentual, não precisa de valor fixo
    if (formDespesa.usarPercentual) {
      if (!formDespesa.percentualFaturamento) {
        toast.error('Informe o percentual do faturamento');
        return;
      }
    } else {
      if (!formDespesa.valor) {
        toast.error('Informe o valor ou use percentual');
        return;
      }
    }

    const dadosDespesa: Omit<DespesaDRE, 'id' | 'createdAt' | 'parcelaAtual' | 'despesaPaiId'> = {
      nome: formDespesa.nome,
      valor: formDespesa.usarPercentual ? 0 : parseFloat(formDespesa.valor),
      data: formDespesa.data,
      categoria: formDespesa.categoria,
      descricao: formDespesa.descricao,
      tipo: formDespesa.tipo,
      parcelas: formDespesa.tipo === 'parcelada' ? parseInt(formDespesa.parcelas) : undefined,
      percentualFaturamento: formDespesa.usarPercentual ? parseFloat(formDespesa.percentualFaturamento) : undefined,
    };

    adicionarDespesa(dadosDespesa);

    toast.success(formDespesa.tipo === 'parcelada' 
      ? `Despesa parcelada em ${formDespesa.parcelas}x adicionada!` 
      : 'Despesa adicionada!');
    
    setDialogDespesa(false);
    setFormDespesa({
      nome: '',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      categoria: '',
      descricao: '',
      tipo: 'unica',
      parcelas: '2',
      percentualFaturamento: '',
      usarPercentual: false,
    });
  };

  const handleAddCategoria = () => {
    if (!novaCategoria.nome) {
      toast.error('Digite um nome para a categoria');
      return;
    }

    if (dialogCategoria === 'receita') {
      adicionarCategoriaReceita(novaCategoria.nome, novaCategoria.cor);
    } else {
      adicionarCategoriaDespesa(novaCategoria.nome, novaCategoria.cor);
    }

    toast.success('Categoria adicionada!');
    setDialogCategoria(null);
    setNovaCategoria({ nome: '', cor: '#22c55e' });
  };

  const faturamentosDoDia = (data: string) => {
    return faturamentos.filter(f => f.data === data);
  };

  // Calcular valor de despesa percentual
  const calcularValorDespesa = (despesa: DespesaDRE) => {
    if (despesa.percentualFaturamento && despesa.percentualFaturamento > 0) {
      return (resumo.totalFaturamento * despesa.percentualFaturamento) / 100;
    }
    return despesa.valor;
  };

  return (
    <div className="space-y-6">
      {/* Header com navegação de mês */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => navegarMes('anterior')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <h2 className="text-2xl font-bold">{nomeMesAtual} {mesSelecionado.ano}</h2>
              <p className="text-sm text-muted-foreground">Demonstração do Resultado do Exercício</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => navegarMes('proximo')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo DRE */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumo.receitaBruta)}</div>
            <p className="text-xs text-muted-foreground">
              Faturamento + Outras Receitas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumo.totalDespesas)}</div>
            <p className="text-xs text-muted-foreground">
              {despesas.length} despesa(s) no mês
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${resumo.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(resumo.lucroLiquido)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
            <Percent className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${resumo.margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {resumo.margemLucro.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Lucro / Receita Bruta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comparativo com mês anterior */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Comparativo com mês anterior</p>
              <div className="flex items-center gap-4 mt-1">
                <div>
                  <span className="text-2xl font-bold">{formatCurrency(resumo.totalFaturamento)}</span>
                  <span className="text-sm text-muted-foreground ml-2">Este mês</span>
                </div>
                <div className="text-muted-foreground">vs</div>
                <div>
                  <span className="text-xl font-medium">{formatCurrency(resumo.faturamentoMesAnterior)}</span>
                  <span className="text-sm text-muted-foreground ml-2">Mês anterior</span>
                </div>
              </div>
            </div>
            <div className={`text-right ${resumo.variacaoFaturamento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <p className="text-3xl font-bold">
                {resumo.variacaoFaturamento >= 0 ? '+' : ''}{resumo.variacaoFaturamento.toFixed(1)}%
              </p>
              <p className="text-sm">
                {resumo.variacaoFaturamento >= 0 ? 'Crescimento' : 'Queda'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs principais */}
      <Tabs defaultValue="faturamento" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faturamento" className="gap-2">
            <Wallet className="h-4 w-4" />
            Faturamento
          </TabsTrigger>
          <TabsTrigger value="receitas" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Receitas
          </TabsTrigger>
          <TabsTrigger value="despesas" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Despesas
          </TabsTrigger>
          <TabsTrigger value="analise" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Análise
          </TabsTrigger>
        </TabsList>

        {/* Aba Faturamento */}
        <TabsContent value="faturamento" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tabela de Faturamento Diário</CardTitle>
              <Button onClick={() => setDialogFaturamento(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Faturamento
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dia</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                      <TableHead className="text-right">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diasDoMes.map(({ dia, data, faturamento }) => {
                      const temFaturamento = faturamento > 0;
                      const faturamentosDia = faturamentosDoDia(data);
                      
                      return (
                        <TableRow 
                          key={data} 
                          className={temFaturamento ? 'bg-green-50/50' : ''}
                        >
                          <TableCell className="font-medium">{dia}</TableCell>
                          <TableCell>{formatDate(data)}</TableCell>
                          <TableCell className={`text-right font-semibold ${temFaturamento ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {temFaturamento ? formatCurrency(faturamento) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {temFaturamento && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setDialogDetalhesDia(data)}
                              >
                                {faturamentosDia.length} venda(s)
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Resumo por Forma de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {FORMAS_PAGAMENTO.map((forma) => {
                  const valor = resumo.faturamentoPorForma[forma.value];
                  if (valor === 0) return null;
                  
                  return (
                    <div key={forma.value} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        {getIconeFormaPagamento(forma.value)}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{forma.label}</p>
                        <p className="font-semibold">{formatCurrency(valor)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Receitas */}
        <TabsContent value="receitas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Outras Receitas</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialogCategoria('receita')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Categoria
                </Button>
                <Button onClick={() => setDialogReceita(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Receita
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {receitas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma receita cadastrada neste mês</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receitas.map((receita) => (
                      <div 
                        key={receita.id} 
                        className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{receita.nome}</p>
                            {receita.recorrente && (
                              <Badge variant="outline" className="text-xs">Recorrente</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(receita.data)} • {receita.categoria}
                          </p>
                          {receita.descricao && (
                            <p className="text-sm text-muted-foreground">{receita.descricao}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-bold text-green-600">{formatCurrency(receita.valor)}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500"
                            onClick={() => removerReceita(receita.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categorias de Receita */}
          <Card>
            <CardHeader>
              <CardTitle>Categorias de Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categoriasReceita.map((cat) => (
                  <Badge 
                    key={cat.id} 
                    style={{ backgroundColor: cat.cor }}
                    className="text-white px-3 py-1"
                  >
                    {cat.nome}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Despesas */}
        <TabsContent value="despesas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Despesas</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialogCategoria('despesa')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Categoria
                </Button>
                <Button onClick={() => setDialogDespesa(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Despesa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {despesas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma despesa cadastrada neste mês</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {despesas.map((despesa) => {
                    const valorCalculado = calcularValorDespesa(despesa);
                    return (
                      <div 
                        key={despesa.id} 
                        className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{despesa.nome}</p>
                            {despesa.tipo === 'recorrente' && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Repeat className="h-3 w-3" />
                                Recorrente
                              </Badge>
                            )}
                            {despesa.tipo === 'parcelada' && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                {despesa.parcelaAtual}/{despesa.parcelas}
                              </Badge>
                            )}
                            {despesa.percentualFaturamento && despesa.percentualFaturamento > 0 && (
                              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">
                                <Percent className="h-3 w-3 mr-1" />
                                {despesa.percentualFaturamento}% do faturamento
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(despesa.data)} • {despesa.categoria}
                          </p>
                          {despesa.descricao && (
                            <p className="text-sm text-muted-foreground">{despesa.descricao}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(valorCalculado)}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500"
                            onClick={() => removerDespesa(despesa.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categorias de Despesa */}
          <Card>
            <CardHeader>
              <CardTitle>Categorias de Despesa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categoriasDespesa.map((cat) => (
                  <Badge 
                    key={cat.id} 
                    style={{ backgroundColor: cat.cor }}
                    className="text-white px-3 py-1"
                  >
                    {cat.nome}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Análise */}
        <TabsContent value="analise" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receitas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(resumo.receitasPorCategoria).length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Sem dados</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(resumo.receitasPorCategoria)
                      .sort((a, b) => b[1] - a[1])
                      .map(([categoria, valor]) => {
                        const cat = categoriasReceita.find(c => c.nome === categoria);
                        return (
                          <div key={categoria} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: cat?.cor || '#94a3b8' }}
                              />
                              <span>{categoria}</span>
                            </div>
                            <span className="font-semibold">{formatCurrency(valor)}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(resumo.despesasPorCategoria).length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Sem dados</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(resumo.despesasPorCategoria)
                      .sort((a, b) => b[1] - a[1])
                      .map(([categoria, valor]) => {
                        const cat = categoriasDespesa.find(c => c.nome === categoria);
                        return (
                          <div key={categoria} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: cat?.cor || '#94a3b8' }}
                              />
                              <span>{categoria}</span>
                            </div>
                            <span className="font-semibold">{formatCurrency(valor)}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Novo Faturamento */}
      <Dialog open={dialogFaturamento} onOpenChange={setDialogFaturamento}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Faturamento</DialogTitle>
            <DialogDescription>
              Registre uma nova venda ou recebimento
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddFaturamento} className="space-y-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={formFaturamento.data}
                onChange={(e) => setFormFaturamento(prev => ({ ...prev, data: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formFaturamento.valor}
                onChange={(e) => setFormFaturamento(prev => ({ ...prev, valor: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select 
                value={formFaturamento.formaPagamento}
                onValueChange={(v) => setFormFaturamento(prev => ({ ...prev, formaPagamento: v as FormaPagamento }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((forma) => (
                    <SelectItem key={forma.value} value={forma.value}>
                      <span className="flex items-center gap-2">
                        {getIconeFormaPagamento(forma.value)}
                        {forma.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formFaturamento.formaPagamento === 'parcelado' && (
              <div className="space-y-2">
                <Label>Número de Parcelas</Label>
                <Input
                  type="number"
                  min="2"
                  max="24"
                  value={formFaturamento.parcelas}
                  onChange={(e) => setFormFaturamento(prev => ({ ...prev, parcelas: e.target.value }))}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Cliente (opcional)</Label>
              <Input
                placeholder="Nome do cliente"
                value={formFaturamento.cliente}
                onChange={(e) => setFormFaturamento(prev => ({ ...prev, cliente: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                placeholder="Descrição da venda"
                value={formFaturamento.descricao}
                onChange={(e) => setFormFaturamento(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogFaturamento(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Nova Receita */}
      <Dialog open={dialogReceita} onOpenChange={setDialogReceita}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Receita</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddReceita} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Aluguel recebido"
                value={formReceita.nome}
                onChange={(e) => setFormReceita(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formReceita.valor}
                  onChange={(e) => setFormReceita(prev => ({ ...prev, valor: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formReceita.data}
                  onChange={(e) => setFormReceita(prev => ({ ...prev, data: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select 
                value={formReceita.categoria}
                onValueChange={(v) => setFormReceita(prev => ({ ...prev, categoria: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categoriasReceita.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                placeholder="Descrição adicional"
                value={formReceita.descricao}
                onChange={(e) => setFormReceita(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogReceita(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Nova Despesa */}
      <Dialog open={dialogDespesa} onOpenChange={setDialogDespesa}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Despesa</DialogTitle>
            <DialogDescription>
              Configure o tipo de despesa desejado
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddDespesa} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Aluguel do escritório"
                value={formDespesa.nome}
                onChange={(e) => setFormDespesa(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Despesa</Label>
              <Select 
                value={formDespesa.tipo}
                onValueChange={(v) => setFormDespesa(prev => ({ ...prev, tipo: v as TipoDespesa }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DESPESA.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <span className="flex items-center gap-2">
                        {getIconeTipoDespesa(tipo.value)}
                        {tipo.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formDespesa.tipo === 'parcelada' && (
              <div className="space-y-2">
                <Label>Número de Parcelas</Label>
                <Input
                  type="number"
                  min="2"
                  max="48"
                  value={formDespesa.parcelas}
                  onChange={(e) => setFormDespesa(prev => ({ ...prev, parcelas: e.target.value }))}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="usarPercentual"
                checked={formDespesa.usarPercentual}
                onCheckedChange={(checked) => 
                  setFormDespesa(prev => ({ ...prev, usarPercentual: checked as boolean }))
                }
              />
              <Label htmlFor="usarPercentual" className="cursor-pointer">
                Usar percentual do faturamento (ex: Custo de Produto)
              </Label>
            </div>

            {formDespesa.usarPercentual ? (
              <div className="space-y-2">
                <Label>Percentual do Faturamento (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Ex: 30"
                  value={formDespesa.percentualFaturamento}
                  onChange={(e) => setFormDespesa(prev => ({ ...prev, percentualFaturamento: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  A despesa será calculada automaticamente com base no faturamento do mês
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formDespesa.valor}
                    onChange={(e) => setFormDespesa(prev => ({ ...prev, valor: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formDespesa.data}
                    onChange={(e) => setFormDespesa(prev => ({ ...prev, data: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select 
                value={formDespesa.categoria}
                onValueChange={(v) => setFormDespesa(prev => ({ ...prev, categoria: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categoriasDespesa.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                placeholder="Descrição adicional"
                value={formDespesa.descricao}
                onChange={(e) => setFormDespesa(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogDespesa(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Nova Categoria */}
      <Dialog open={!!dialogCategoria} onOpenChange={() => setDialogCategoria(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Nova Categoria de {dialogCategoria === 'receita' ? 'Receita' : 'Despesa'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Nome da categoria"
                value={novaCategoria.nome}
                onChange={(e) => setNovaCategoria(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {coresDisponiveis.map((cor) => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setNovaCategoria(prev => ({ ...prev, cor }))}
                    className={`w-8 h-8 rounded-full ${novaCategoria.cor === cor ? 'ring-2 ring-offset-2 ring-gray-900' : ''}`}
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogCategoria(null)}>
                Cancelar
              </Button>
              <Button onClick={handleAddCategoria}>Salvar</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes do Dia */}
      <Dialog open={!!dialogDetalhesDia} onOpenChange={() => setDialogDetalhesDia(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Faturamentos de {dialogDetalhesDia && formatDate(dialogDetalhesDia)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {dialogDetalhesDia && faturamentosDoDia(dialogDetalhesDia).map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    {getIconeFormaPagamento(f.formaPagamento)}
                    <span className="font-medium">{getLabelFormaPagamento(f.formaPagamento)}</span>
                    {f.parcelas && f.parcelas > 1 && (
                      <Badge variant="outline">{f.parcelas}x</Badge>
                    )}
                  </div>
                  {f.cliente && <p className="text-sm text-muted-foreground">Cliente: {f.cliente}</p>}
                  {f.descricao && <p className="text-sm text-muted-foreground">{f.descricao}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatCurrency(f.valor)}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500"
                    onClick={() => {
                      removerFaturamento(f.id);
                      if (faturamentosDoDia(dialogDetalhesDia).length <= 1) {
                        setDialogDetalhesDia(null);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
