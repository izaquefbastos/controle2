export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'parcelado' | 'boleto' | 'transferencia' | 'outros';

export type TipoDespesa = 'unica' | 'recorrente' | 'parcelada';

export interface FaturamentoDiario {
  id: string;
  data: string; // YYYY-MM-DD
  valor: number;
  formaPagamento: FormaPagamento;
  descricao?: string;
  cliente?: string;
  parcelas?: number; // para pagamento parcelado
  createdAt: string;
}

export interface ReceitaDRE {
  id: string;
  nome: string;
  valor: number;
  data: string;
  categoria: string;
  descricao?: string;
  recorrente: boolean;
  createdAt: string;
}

export interface DespesaDRE {
  id: string;
  nome: string;
  valor: number;
  data: string;
  categoria: string;
  descricao?: string;
  tipo: TipoDespesa;
  parcelas?: number;
  parcelaAtual?: number;
  despesaPaiId?: string; // ID da despesa original (para parcelas)
  percentualFaturamento?: number; // Se for despesa baseada em % do faturamento
  createdAt: string;
}

export interface CategoriaDRE {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
}

export interface ResumoDRE {
  // Faturamento
  totalFaturamento: number;
  faturamentoPorForma: Record<FormaPagamento, number>;
  faturamentoPorDia: { data: string; valor: number }[];
  
  // Receitas
  totalReceitas: number;
  receitasPorCategoria: Record<string, number>;
  
  // Despesas
  totalDespesas: number;
  despesasPorCategoria: Record<string, number>;
  
  // Resultado
  receitaBruta: number;
  receitaLiquida: number;
  lucroBruto: number;
  lucroLiquido: number;
  margemLucro: number;
  
  // Comparativo
  faturamentoMesAnterior: number;
  variacaoFaturamento: number;
}

export interface MesAno {
  mes: number; // 0-11
  ano: number;
}

export const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string; icone: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro', icone: 'banknote' },
  { value: 'pix', label: 'PIX', icone: 'smartphone' },
  { value: 'cartao_credito', label: 'Cartão de Crédito', icone: 'credit-card' },
  { value: 'cartao_debito', label: 'Cartão de Débito', icone: 'credit-card' },
  { value: 'parcelado', label: 'Parcelado', icone: 'calendar' },
  { value: 'boleto', label: 'Boleto', icone: 'file-text' },
  { value: 'transferencia', label: 'Transferência', icone: 'arrow-left-right' },
  { value: 'outros', label: 'Outros', icone: 'more-horizontal' },
];

export const TIPOS_DESPESA: { value: TipoDespesa; label: string }[] = [
  { value: 'unica', label: 'Única' },
  { value: 'recorrente', label: 'Recorrente (Mensal)' },
  { value: 'parcelada', label: 'Parcelada' },
];

export const CATEGORIAS_RECEITA_PADRAO: CategoriaDRE[] = [
  { id: '1', nome: 'Vendas', tipo: 'receita', cor: '#22c55e' },
  { id: '2', nome: 'Serviços', tipo: 'receita', cor: '#3b82f6' },
  { id: '3', nome: 'Juros', tipo: 'receita', cor: '#8b5cf6' },
  { id: '4', nome: 'Aluguéis', tipo: 'receita', cor: '#f59e0b' },
  { id: '5', nome: 'Outras Receitas', tipo: 'receita', cor: '#94a3b8' },
];

export const CATEGORIAS_DESPESA_PADRAO: CategoriaDRE[] = [
  { id: '6', nome: 'Custo das Mercadorias', tipo: 'despesa', cor: '#ef4444' },
  { id: '7', nome: 'Salários', tipo: 'despesa', cor: '#f97316' },
  { id: '8', nome: 'Aluguel', tipo: 'despesa', cor: '#ec4899' },
  { id: '9', nome: 'Impostos', tipo: 'despesa', cor: '#64748b' },
  { id: '10', nome: 'Marketing', tipo: 'despesa', cor: '#06b6d4' },
  { id: '11', nome: 'Despesas Administrativas', tipo: 'despesa', cor: '#94a3b8' },
  { id: '12', nome: 'Outras Despesas', tipo: 'despesa', cor: '#71717a' },
];
