import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  FileText,
  Calendar,
  Tag,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  Eye,
  Download,
  Filter,
  Upload,
  Clock,
  AlertCircle,
  Repeat,
} from 'lucide-react';
import type { Conta, Categoria, FiltroStatus, FiltroPeriodo } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface ListaContasProps {
  contas: Conta[];
  categorias: Categoria[];
  filtros: {
    status: FiltroStatus;
    categoria: string;
    periodo: FiltroPeriodo;
    busca: string;
  };
  setFiltroStatus: (status: FiltroStatus) => void;
  setFiltroCategoria: (categoria: string) => void;
  setFiltroPeriodo: (periodo: FiltroPeriodo) => void;
  setBusca: (busca: string) => void;
  adicionarConta: (conta: Omit<Conta, 'id' | 'createdAt'>) => string;
  adicionarContaRecorrente: (
    conta: Omit<Conta, 'id' | 'createdAt' | 'recorrente' | 'recorrenteTotal' | 'recorrenteParcela' | 'recorrenteGrupoId'>,
    numParcelas: number
  ) => string;
  atualizarConta: (id: string, dados: Partial<Conta>) => void;
  removerConta: (id: string) => void;
  marcarComoPago: (id: string) => void;
  marcarComoPendente: (id: string) => void;
}

export function ListaContas({
  contas,
  categorias,
  filtros,
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
}: ListaContasProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<Conta | null>(null);
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    dataVencimento: '',
    categoria: '',
    observacao: '',
    pdfUrl: '',
    pdfName: '',
    recorrente: false,
    numParcelas: '1',
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      valor: '',
      dataVencimento: '',
      categoria: categorias[0]?.nome || '',
      observacao: '',
      pdfUrl: '',
      pdfName: '',
      recorrente: false,
      numParcelas: '1',
    });
    setEditingConta(null);
  };

  const handleOpenDialog = (conta?: Conta) => {
    if (conta) {
      setEditingConta(conta);
      setFormData({
        nome: conta.nome,
        valor: conta.valor.toString(),
        dataVencimento: conta.dataVencimento,
        categoria: conta.categoria,
        observacao: conta.observacao || '',
        pdfUrl: conta.pdfUrl || '',
        pdfName: conta.pdfName || '',
        recorrente: false,
        numParcelas: '1',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.valor || !formData.dataVencimento || !formData.categoria) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const valorNum = parseFloat(formData.valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    const contaBase = {
      nome: formData.nome,
      valor: valorNum,
      dataVencimento: formData.dataVencimento,
      status: 'pendente' as const,
      categoria: formData.categoria,
      observacao: formData.observacao,
      pdfUrl: formData.pdfUrl,
      pdfName: formData.pdfName,
    };

    if (editingConta) {
      atualizarConta(editingConta.id, contaBase);
      toast.success('Conta atualizada com sucesso!');
    } else if (formData.recorrente) {
      const parcelas = Math.max(1, Math.min(60, parseInt(formData.numParcelas) || 1));
      adicionarContaRecorrente(contaBase, parcelas);
      toast.success(`${parcelas} parcela${parcelas > 1 ? 's' : ''} adicionada${parcelas > 1 ? 's' : ''} com sucesso!`);
    } else {
      adicionarConta({ ...contaBase, recorrente: false });
      toast.success('Conta adicionada com sucesso!');
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione um arquivo PDF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('O arquivo PDF deve ter no máximo 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({ ...prev, pdfUrl: base64, pdfName: file.name }));
      toast.success(`PDF "${file.name}" carregado com sucesso!`);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      removerConta(deleteId);
      toast.success('Conta removida com sucesso!');
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Pago</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'atrasado':
        return <Badge className="bg-red-500 hover:bg-red-600"><AlertCircle className="h-3 w-3 mr-1" /> Atrasado</Badge>;
      default:
        return null;
    }
  };

  const getCategoriaCor = (nomeCategoria: string) =>
    categorias.find((c) => c.nome === nomeCategoria)?.cor || '#94a3b8';

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contas..."
                value={filtros.busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filtros.status} onValueChange={(v) => setFiltroStatus(v as FiltroStatus)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtros.categoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtros.periodo} onValueChange={(v) => setFiltroPeriodo(v as FiltroPeriodo)}>
              <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Períodos</SelectItem>
                <SelectItem value="este-mes">Este Mês</SelectItem>
                <SelectItem value="proximo-mes">Próximo Mês</SelectItem>
                <SelectItem value="este-ano">Este Ano</SelectItem>
                <SelectItem value="atrasados">Atrasados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Contas ({contas.length})</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingConta ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
                <DialogDescription>
                  Preencha os dados da conta. O PDF é opcional.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Conta *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))}
                    placeholder="Ex: Conta de Luz"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor (R$) *</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData((p) => ({ ...p, valor: e.target.value }))}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vencimento">Data de Vencimento *</Label>
                    <Input
                      id="vencimento"
                      type="date"
                      value={formData.dataVencimento}
                      onChange={(e) => setFormData((p) => ({ ...p, dataVencimento: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(v) => setFormData((p) => ({ ...p, categoria: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Despesa Recorrente */}
                {!editingConta && (
                  <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="recorrente"
                        checked={formData.recorrente}
                        onChange={(e) => setFormData((p) => ({ ...p, recorrente: e.target.checked }))}
                        className="h-4 w-4 accent-blue-600"
                      />
                      <Label htmlFor="recorrente" className="flex items-center gap-2 cursor-pointer font-medium text-blue-800">
                        <Repeat className="h-4 w-4" />
                        Despesa Recorrente (parcelada)
                      </Label>
                    </div>
                    {formData.recorrente && (
                      <div className="space-y-2">
                        <Label htmlFor="numParcelas" className="text-blue-700 text-sm">
                          Número de vezes (meses)
                        </Label>
                        <Input
                          id="numParcelas"
                          type="number"
                          min="2"
                          max="60"
                          value={formData.numParcelas}
                          onChange={(e) => setFormData((p) => ({ ...p, numParcelas: e.target.value }))}
                          className="bg-white border-blue-300 focus:border-blue-500"
                          placeholder="Ex: 12"
                        />
                        <p className="text-xs text-blue-600">
                          Serão criadas {formData.numParcelas || 0} contas com vencimento mensal a partir da data escolhida.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Input
                    id="observacao"
                    value={formData.observacao}
                    onChange={(e) => setFormData((p) => ({ ...p, observacao: e.target.value }))}
                    placeholder="Observações opcionais..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Comprovante / Boleto (PDF)</Label>
                  <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.pdfName ? 'Trocar PDF' : 'Anexar PDF'}
                  </Button>
                  {formData.pdfName && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="flex-1 truncate">{formData.pdfName}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewPdf(formData.pdfUrl)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingConta
                      ? 'Salvar Alterações'
                      : formData.recorrente
                      ? `Adicionar ${formData.numParcelas || 1}x`
                      : 'Adicionar Conta'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {contas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Nenhuma conta encontrada</p>
              <p>Adicione uma nova conta ou ajuste os filtros</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contas.map((conta) => (
                <div
                  key={conta.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${
                    conta.status === 'atrasado'
                      ? 'bg-red-50 border-red-200'
                      : conta.status === 'pago'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {conta.pdfUrl ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                        onClick={() => conta.pdfUrl && setPreviewPdf(conta.pdfUrl)}
                      >
                        <FileText className="h-5 w-5" />
                      </Button>
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center shrink-0">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCategoriaCor(conta.categoria) }}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{conta.nome}</p>
                        {getStatusBadge(conta.status)}
                        {conta.recorrente && (
                          <Badge variant="outline" className="text-blue-600 border-blue-300 gap-1 text-xs">
                            <Repeat className="h-3 w-3" />
                            {conta.recorrenteParcela}/{conta.recorrenteTotal}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap mt-1">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" style={{ color: getCategoriaCor(conta.categoria) }} />
                          {conta.categoria}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Venc: {formatDate(conta.dataVencimento)}
                        </span>
                        {conta.dataPagamento && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Pago em: {formatDate(conta.dataPagamento)}
                          </span>
                        )}
                      </div>
                      {conta.observacao && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">{conta.observacao}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          conta.status === 'atrasado'
                            ? 'text-red-600'
                            : conta.status === 'pago'
                            ? 'text-green-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {formatCurrency(conta.valor)}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {conta.status !== 'pago' ? (
                          <DropdownMenuItem onClick={() => marcarComoPago(conta.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                            Marcar como Pago
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => marcarComoPendente(conta.id)}>
                            <XCircle className="h-4 w-4 mr-2 text-yellow-500" />
                            Marcar como Pendente
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleOpenDialog(conta)}>
                          <Edit3 className="h-4 w-4 mr-2 text-blue-500" />
                          Editar
                        </DropdownMenuItem>
                        {conta.pdfUrl && (
                          <DropdownMenuItem onClick={() => conta.pdfUrl && setPreviewPdf(conta.pdfUrl)}>
                            <Eye className="h-4 w-4 mr-2 text-purple-500" />
                            Visualizar PDF
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(conta.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Preview */}
      <Dialog open={!!previewPdf} onOpenChange={() => setPreviewPdf(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visualizar PDF</DialogTitle>
          </DialogHeader>
          {previewPdf && (
            <div className="w-full h-[70vh]">
              <iframe src={previewPdf} className="w-full h-full rounded-lg border" title="PDF Preview" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewPdf(null)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                if (previewPdf) {
                  const link = document.createElement('a');
                  link.href = previewPdf;
                  link.download = 'comprovante.pdf';
                  link.click();
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
