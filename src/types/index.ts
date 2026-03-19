export interface Conta {
  id: string;
  nome: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado';
  categoria: string;
  pdfUrl?: string;
  pdfName?: string;
  observacao?: string;
  recorrente?: boolean;
  recorrenteTotal?: number;    // quantas parcelas no total
  recorrenteParcela?: number;  // número desta parcela (1, 2, 3...)
  recorrenteGrupoId?: string;  // ID do grupo de recorrência
  createdAt: string;
}

export interface Categoria {
  id: string;
  nome: string;
  cor: string;
  icone: string;
}

export interface Orcamento {
  valor: number;
}

export interface ResumoFinanceiro {
  totalPendente: number;
  totalPago: number;
  totalAtrasado: number;
  totalGeral: number;
  contasPendentes: number;
  contasPagas: number;
  contasAtrasadas: number;
  orcamento: number;
  saldoRestante: number;
  percentualUsado: number;
}

export interface GraficoDado {
  name: string;
  value: number;
  color: string;
}

export type FiltroStatus = 'todos' | 'pendente' | 'pago' | 'atrasado';
export type FiltroPeriodo = 'todos' | 'este-mes' | 'proximo-mes' | 'este-ano' | 'atrasados';
