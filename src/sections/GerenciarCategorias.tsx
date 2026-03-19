import { useState } from 'react';
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
  Plus, 
  Trash2, 
  Palette,
  Home,
  Utensils,
  Car,
  Heart,
  GraduationCap,
  Gamepad2,
  Zap,
  FileText,
  MoreHorizontal,
  Tag
} from 'lucide-react';
import type { Categoria } from '@/types';
import { toast } from 'sonner';

interface GerenciarCategoriasProps {
  categorias: Categoria[];
  adicionarCategoria: (categoria: Omit<Categoria, 'id'>) => void;
  removerCategoria: (id: string) => void;
}

const iconesDisponiveis = [
  { nome: 'home', icone: Home, label: 'Casa' },
  { nome: 'utensils', icone: Utensils, label: 'Alimentação' },
  { nome: 'car', icone: Car, label: 'Transporte' },
  { nome: 'heart', icone: Heart, label: 'Saúde' },
  { nome: 'graduation-cap', icone: GraduationCap, label: 'Educação' },
  { nome: 'gamepad-2', icone: Gamepad2, label: 'Lazer' },
  { nome: 'zap', icone: Zap, label: 'Serviços' },
  { nome: 'file-text', icone: FileText, label: 'Documentos' },
  { nome: 'more-horizontal', icone: MoreHorizontal, label: 'Outros' },
];

const coresDisponiveis = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#64748b', // slate
  '#94a3b8', // gray
  '#f97316', // orange
  '#14b8a6', // teal
  '#d946ef', // fuchsia
];

export function GerenciarCategorias({
  categorias,
  adicionarCategoria,
  removerCategoria,
}: GerenciarCategoriasProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState({
    nome: '',
    cor: '#3b82f6',
    icone: 'home',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novaCategoria.nome.trim()) {
      toast.error('Digite um nome para a categoria');
      return;
    }

    if (categorias.some(c => c.nome.toLowerCase() === novaCategoria.nome.toLowerCase())) {
      toast.error('Já existe uma categoria com este nome');
      return;
    }

    adicionarCategoria({
      nome: novaCategoria.nome.trim(),
      cor: novaCategoria.cor,
      icone: novaCategoria.icone,
    });

    toast.success('Categoria adicionada com sucesso!');
    setDialogOpen(false);
    setNovaCategoria({ nome: '', cor: '#3b82f6', icone: 'home' });
  };

  const handleDelete = (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir a categoria "${nome}"?`)) {
      removerCategoria(id);
      toast.success('Categoria removida com sucesso!');
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconObj = iconesDisponiveis.find(i => i.nome === iconName);
    return iconObj ? iconObj.icone : Tag;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Categorias de Despesas
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Categoria</DialogTitle>
                <DialogDescription>
                  Crie uma nova categoria para organizar suas despesas.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Categoria</Label>
                  <Input
                    id="nome"
                    value={novaCategoria.nome}
                    onChange={(e) => setNovaCategoria(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Viagens"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {coresDisponiveis.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        onClick={() => setNovaCategoria(prev => ({ ...prev, cor }))}
                        className={`w-10 h-10 rounded-lg transition-all ${
                          novaCategoria.cor === cor 
                            ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' 
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: cor }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {iconesDisponiveis.map((item) => {
                      const Icon = item.icone;
                      return (
                        <button
                          key={item.nome}
                          type="button"
                          onClick={() => setNovaCategoria(prev => ({ ...prev, icone: item.nome }))}
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                            novaCategoria.icone === item.nome
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-sm">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Adicionar Categoria</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categorias.map((categoria) => {
              const Icon = getIconComponent(categoria.icone);
              return (
                <div
                  key={categoria.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${categoria.cor}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: categoria.cor }} />
                    </div>
                    <div>
                      <p className="font-medium">{categoria.nome}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: categoria.cor }}
                        />
                        <span className="text-xs text-muted-foreground">{categoria.cor}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(categoria.id, categoria.nome)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dicas de Organização</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Crie categorias específicas para facilitar o controle (ex: "Energia" em vez de apenas "Contas")</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span>Use cores diferentes para cada categoria para identificação visual rápida</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span>Evite criar muitas categorias - entre 5 e 10 é ideal para a maioria das pessoas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>Revise suas categorias periodicamente e ajuste conforme necessário</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
