import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Wallet, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  List,
  ArrowRight,
  Target,
  Settings,
  BarChart3,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Package
} from 'lucide-react';
import type { ResumoFinanceiro, Conta, GraficoDado } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

// Componente de Gráfico de Pizza Simples
function GraficoPizza({ dados }: { dados: GraficoDado[] }) {
  if (dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <p>Sem dados para exibir</p>
      </div>
    );
  }

  const total = dados.reduce((sum, item) => sum + item.value, 0);
  let acumulado = 0;

  return (
    <div className="flex items-center gap-6">
      {/* Gráfico SVG */}
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {dados.map((item, index) => {
            const percentual = (item.value / total) * 100;
            const dashArray = `${percentual} ${100 - percentual}`;
            const offset = 100 - acumulado;
            acumulado += percentual;
            
            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={item.color}
                strokeWidth="20"
                strokeDasharray={dashArray}
                strokeDashoffset={offset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        {/* Centro do donut */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-bold">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex-1 space-y-2">
        {dados.map((item, index) => {
          const percentual = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate max-w-[100px]">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{formatCurrency(item.value)}</span>
                <span className="text-xs text-muted-foreground ml-1">({percentual}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DashboardProps {
  resumo: ResumoFinanceiro;
  contasProximasVencimento: Conta[];
  gastosPorCategoriaTotal: GraficoDado[];
  onIrParaContas: () => void;
  onIrParaDRE: () => void;
  orcamento: number;
  onAtualizarOrcamento: (valor: number) => void;
  // Dados do DRE para o Dashboard
  faturamentoMesAtual: number;
  faturamentoMesAnterior: number;
  faturamentoAnoAnterior: number;
  variacaoMesAnterior: number;
  variacaoAnoAnterior: number;
  totalCompras: number;
}

export function Dashboard({ 
  resumo, 
  contasProximasVencimento, 
  gastosPorCategoriaTotal,
  onIrParaContas,
  onIrParaDRE,
  orcamento,
  onAtualizarOrcamento,
  faturamentoMesAtual,
  faturamentoMesAnterior,
  faturamentoAnoAnterior,
  variacaoMesAnterior,
  variacaoAnoAnterior,
  totalCompras,
}: DashboardProps) {
  const [orcamentoDialogOpen, setOrcamentoDialogOpen] = useState(false);
  const [novoOrcamento, setNovoOrcamento] = useState(orcamento.toString());

  const handleSalvarOrcamento = () => {
    const valor = parseFloat(novoOrcamento);
    if (isNaN(valor) || valor < 0) {
      toast.error('Digite um valor válido');
      return;
    }
    onAtualizarOrcamento(valor);
    setOrcamentoDialogOpen(false);
    toast.success('Orçamento atualizado com sucesso!');
  };

  const saudeFinanceira = () => {
    if (orcamento <= 0) {
      return { 
        label: 'Sem Orçamento', 
        cor: 'text-gray-500', 
        bg: 'bg-gray-100',
        barColor: 'bg-gray-400',
        percentual: 0,
        descricao: 'Defina um orçamento para acompanhar sua saúde financeira'
      };
    }

    const percentualUsado = resumo.percentualUsado;
    const saldoRestante = resumo.saldoRestante;

    if (percentualUsado > 100) {
      return { 
        label: 'Crítica', 
        cor: 'text-red-600', 
        bg: 'bg-red-100',
        barColor: 'bg-red-500',
        percentual: 100,
        descricao: `Você ultrapassou o orçamento em ${formatCurrency(Math.abs(saldoRestante))}`
      };
    } else if (percentualUsado > 90) {
      return { 
        label: 'Atenção', 
        cor: 'text-orange-600', 
        bg: 'bg-orange-100',
        barColor: 'bg-orange-500',
        percentual: percentualUsado,
        descricao: `Você usou ${percentualUsado.toFixed(1)}% do orçamento`
      };
    } else if (percentualUsado > 70) {
      return { 
        label: 'Regular', 
        cor: 'text-yellow-600', 
        bg: 'bg-yellow-100',
        barColor: 'bg-yellow-500',
        percentual: percentualUsado,
        descricao: `Você usou ${percentualUsado.toFixed(1)}% do orçamento`
      };
    } else if (percentualUsado > 40) {
      return { 
        label: 'Boa', 
        cor: 'text-blue-600', 
        bg: 'bg-blue-100',
        barColor: 'bg-blue-500',
        percentual: percentualUsado,
        descricao: `Você usou ${percentualUsado.toFixed(1)}% do orçamento`
      };
    } else {
      return { 
        label: 'Excelente', 
        cor: 'text-green-600', 
        bg: 'bg-green-100',
        barColor: 'bg-green-500',
        percentual: percentualUsado,
        descricao: `Você usou apenas ${percentualUsado.toFixed(1)}% do orçamento`
      };
    }
  };

  const saude = saudeFinanceira();

  // Data atual para cálculos
  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Botões de Acesso Rápido */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Botão Contas a Pagar */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <List className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Contas a Pagar</h2>
                  <p className="text-white/80 text-sm">
                    {resumo.contasPendentes + resumo.contasAtrasadas} contas em aberto
                  </p>
                </div>
              </div>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={onIrParaContas}
                className="gap-2"
              >
                Acessar
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Botão DRE */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">DRE</h2>
                  <p className="text-white/80 text-sm">
                    Faturamento: {formatCurrency(faturamentoMesAtual)}
                  </p>
                </div>
              </div>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={onIrParaDRE}
                className="gap-2"
              >
                Acessar
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Resumo Contas a Pagar */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Aberto</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumo.totalPendente + resumo.totalAtrasado)}</div>
            <p className="text-xs text-muted-foreground">
              {(resumo.contasPendentes + resumo.contasAtrasadas)} conta{(resumo.contasPendentes + resumo.contasAtrasadas) !== 1 ? 's' : ''} a pagar
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumo.totalPago)}</div>
            <p className="text-xs text-muted-foreground">
              {resumo.contasPagas} conta{resumo.contasPagas !== 1 ? 's' : ''} paga{resumo.contasPagas !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Atrasado</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumo.totalAtrasado)}</div>
            <p className="text-xs text-muted-foreground">
              {resumo.contasAtrasadas} conta{resumo.contasAtrasadas !== 1 ? 's' : ''} atrasada{resumo.contasAtrasadas !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(orcamento)}</div>
            <Dialog open={orcamentoDialogOpen} onOpenChange={setOrcamentoDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Configurar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configurar Orçamento</DialogTitle>
                  <DialogDescription>
                    Defina seu orçamento mensal para acompanhar seus gastos.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="orcamento">Valor do Orçamento (R$)</Label>
                    <Input
                      id="orcamento"
                      type="number"
                      step="0.01"
                      min="0"
                      value={novoOrcamento}
                      onChange={(e) => setNovoOrcamento(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOrcamentoDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSalvarOrcamento}>
                    Salvar Orçamento
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Faturamento DRE */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <TrendingUpIcon className="h-5 w-5" />
            Resumo de Faturamento - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Faturamento Atual */}
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">Faturamento Atual</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(faturamentoMesAtual)}</p>
              <p className="text-xs text-muted-foreground mt-1">Até {formatDate(hoje)}</p>
            </div>

            {/* Comparativo Mês Anterior */}
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">vs Mês Anterior</p>
              <p className="text-2xl font-bold">{formatCurrency(faturamentoMesAnterior)}</p>
              <div className={`flex items-center justify-center gap-1 mt-1 ${variacaoMesAnterior >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {variacaoMesAnterior >= 0 ? <TrendingUpIcon className="h-4 w-4" /> : <TrendingDownIcon className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {variacaoMesAnterior >= 0 ? '+' : ''}{variacaoMesAnterior.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Comparativo Ano Anterior */}
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">vs {new Date().getFullYear() - 1}</p>
              <p className="text-2xl font-bold">{formatCurrency(faturamentoAnoAnterior)}</p>
              <div className={`flex items-center justify-center gap-1 mt-1 ${variacaoAnoAnterior >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {variacaoAnoAnterior >= 0 ? <TrendingUpIcon className="h-4 w-4" /> : <TrendingDownIcon className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {variacaoAnoAnterior >= 0 ? '+' : ''}{variacaoAnoAnterior.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Total de Compras */}
          <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-800">Total em Compras de Mercadoria</span>
              </div>
              <span className="text-xl font-bold text-orange-600">{formatCurrency(totalCompras)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saúde Financeira */}
      <Card className={saude.bg}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${saude.cor}`}>
            <TrendingUp className="h-5 w-5" />
            Saúde Financeira: {saude.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Orçamento</p>
                <p className="text-lg font-semibold">{formatCurrency(orcamento)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Usado</p>
                <p className={`text-lg font-semibold ${resumo.percentualUsado > 100 ? 'text-red-600' : ''}`}>
                  {resumo.percentualUsado.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Saldo Restante</p>
                <p className={`text-lg font-semibold ${resumo.saldoRestante < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(resumo.saldoRestante)}
                </p>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${saude.barColor}`}
                style={{ width: `${Math.min(saude.percentual, 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {saude.descricao}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Detalhes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-500" />
              Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoPizza dados={gastosPorCategoriaTotal} />
          </CardContent>
        </Card>

        {/* Contas Próximas do Vencimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Próximas do Vencimento (3 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contasProximasVencimento.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                <p>Nenhuma conta próxima do vencimento!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contasProximasVencimento.slice(0, 5).map((conta) => (
                  <div 
                    key={conta.id} 
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{conta.nome}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Vence em {formatDate(conta.dataVencimento)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600">{formatCurrency(conta.valor)}</p>
                    </div>
                  </div>
                ))}
                {contasProximasVencimento.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground">
                    +{contasProximasVencimento.length - 5} conta(s) adicional(is)
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Geral das Contas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">
                {resumo.contasPendentes + resumo.contasPagas + resumo.contasAtrasadas}
              </p>
              <p className="text-sm text-muted-foreground">Total de Contas</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {resumo.contasPagas}
              </p>
              <p className="text-sm text-muted-foreground">Contas Pagas</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">
                {resumo.contasPendentes}
              </p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">
                {resumo.contasAtrasadas}
              </p>
              <p className="text-sm text-muted-foreground">Atrasadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
