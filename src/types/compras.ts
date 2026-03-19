export interface CompraMercadoria {
  id: string;
  fornecedor: string;
  valor: number;
  data: string; // YYYY-MM-DD
  descricao?: string;
  notaFiscal?: string;
  pago: boolean;
  dataPagamento?: string;
  createdAt: string;
}

export interface ResumoCompras {
  totalCompras: number;
  totalPago: number;
  totalPendente: number;
  comprasPorFornecedor: Record<string, number>;
  comprasPorMes: { mes: string; valor: number }[];
}
