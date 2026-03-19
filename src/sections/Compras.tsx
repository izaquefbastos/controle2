import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  ShoppingCart, 
  Trash2, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Package,
  Search
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { CompraMercadoria } from '@/types/compras';

interface ComprasProps {
  compras: CompraMercadoria[];
  mesSelecionado: { mes: number; ano: number };
  nomeMesAtual: string;
  resumo: {
    totalCompras: number;
    totalPago: number;
    totalPendente: number;
    comprasPorFornecedor: Record<string, number>;
  };
  adicionarCompra: (dados: Omit<CompraMercadoria, 'id' | 'createdAt'>) => string;
  removerCompra: (id: string) => void;
  marcarComoPago: (id: string) => void;
}

export function Compras({
  compras,
  mesSelecionado: _mesSelecionado,
  nomeMesAtual,
  resumo,
  adicionarCompra,
  removerCompra,
  marcarComoPago,
}: ComprasProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busca, setBusca] = useState('');

  const [formData, setFormData] = useState({
    fornecedor: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    notaFiscal: '',
    pago: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fornecedor || !formData.valor || !formData.data) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    adicionarCompra({
      fornecedor: formData.fornecedor,
      valor: parseFloat(formData.valor),
      data: formData.data,
      descricao: formData.descricao,
      notaFiscal: formData.notaFiscal,
      pago: formData.pago,
      dataPagamento: formData.pago ? new Date().toISOString().split('T')[0] : undefined,
    });

    toast.success('Compra registrada com sucesso!');
    setDialogOpen(false);
    setFormData({
      fornecedor: '',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      notaFiscal: '',
      pago: false,
    });
  };

  const comprasFiltradas = compras.filter(c => 
    c.fornecedor.toLowerCase().includes(busca.toLowerCase()) ||
    c.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
    c.notaFiscal?.toLowerCase().includes(busca.toLowerCase())
  );

  const topFornecedores = Object.entries(resumo.comprasPorFornecedor)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Compras</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumo.totalCompras)}</div>
            <p className="text-xs text-muted-foreground">
              {compras.length} compra(s) em {nomeMesAtual}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(resumo.totalPago)}</div>
            <p className="text-xs text-muted-foreground">
              {compras.filter(c => c.pago).length} paga(s)
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(resumo.totalPendente)}</div>
            <p className="text-xs text-muted-foreground">
              {compras.filter(c => !c.pago).length} pendente(s)
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Compra</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {compras.length > 0 
                ? formatCurrency(resumo.totalCompras / compras.length) 
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Lista de Compras */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Compras de {nomeMesAtual}
              </CardTitle>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Compra
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por fornecedor, descrição ou NF..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="flex-1"
                />
              </div>

              {comprasFiltradas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma compra registrada</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comprasFiltradas.map((compra) => (
                        <TableRow key={compra.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{compra.fornecedor}</p>
                              {compra.descricao && (
                                <p className="text-xs text-muted-foreground">{compra.descricao}</p>
                              )}
                              {compra.notaFiscal && (
                                <p className="text-xs text-muted-foreground">NF: {compra.notaFiscal}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(compra.data)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(compra.valor)}
                          </TableCell>
                          <TableCell>
                            {compra.pago ? (
                              <Badge className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Pago
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!compra.pago && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => marcarComoPago(compra.id)}
                                className="text-green-600"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Pagar
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removerCompra(compra.id)}
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com estatísticas */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              {topFornecedores.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sem dados
                </p>
              ) : (
                <div className="space-y-3">
                  {topFornecedores.map(([fornecedor, valor], index) => (
                    <div key={fornecedor} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm truncate max-w-[120px]">{fornecedor}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(valor)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resumo do Mês</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Compras</span>
                <span className="font-semibold">{formatCurrency(resumo.totalCompras)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pago</span>
                <span className="font-semibold text-green-600">{formatCurrency(resumo.totalPago)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pendente</span>
                <span className="font-semibold text-yellow-600">{formatCurrency(resumo.totalPendente)}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Fornecedores</span>
                  <span className="font-semibold">{Object.keys(resumo.comprasPorFornecedor).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Nova Compra */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Compra de Mercadoria</DialogTitle>
            <DialogDescription>
              Registre uma nova compra de fornecedor
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor *</Label>
              <Input
                id="fornecedor"
                placeholder="Nome do fornecedor"
                value={formData.fornecedor}
                onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notaFiscal">Nota Fiscal (opcional)</Label>
              <Input
                id="notaFiscal"
                placeholder="Número da NF"
                value={formData.notaFiscal}
                onChange={(e) => setFormData(prev => ({ ...prev, notaFiscal: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Input
                id="descricao"
                placeholder="Descrição dos produtos"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pago"
                checked={formData.pago}
                onChange={(e) => setFormData(prev => ({ ...prev, pago: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="pago" className="cursor-pointer">Já está pago</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Compra</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
