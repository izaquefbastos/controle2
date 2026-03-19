import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { 
  LayoutDashboard, 
  List, 
  Settings, 
  Wallet,
  Menu,
  LogOut,
  BarChart3,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useContas } from '@/hooks/useContas';
import { useDRE } from '@/hooks/useDRE';
import { useCompras } from '@/hooks/useCompras';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/sections/Dashboard';
import { ListaContas } from '@/sections/ListaContas';
import { GerenciarCategorias } from '@/sections/GerenciarCategorias';
import { DRE } from '@/sections/DRE';
import { Compras } from '@/sections/Compras';
import { Login } from '@/sections/Login';
import { toast } from 'sonner';

// Componente principal protegido
function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { user, isAuthenticated, logout, login, loginWithGoogle, register } = useAuth();
  
  // Hook de Contas a Pagar
  const {
    contas: _contas,
    contasFiltradas,
    categorias,
    orcamento,
    resumo,
    gastosPorCategoriaTotal,
    contasProximasVencimento,
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
    adicionarCategoria,
    removerCategoria,
    atualizarOrcamento,
  } = useContas();

  // Hook de DRE
  const {
    faturamentos: _faturamentos,
    faturamentosDoMes,
    receitas,
    despesas,
    todasDespesas,
    categoriasReceita,
    categoriasDespesa,
    mesSelecionado,
    nomeMesAtual,
    diasDoMes,
    resumo: resumoDRE,
    navegarMes,
    adicionarFaturamento,
    removerFaturamento,
    adicionarReceita,
    removerReceita,
    adicionarDespesa,
    removerDespesa,
    adicionarCategoriaReceita,
    adicionarCategoriaDespesa,
    getComparativoAnoAnterior,
  } = useDRE();

  // Hook de Compras
  const {
    compras: _compras,
    adicionarCompra,
    removerCompra,
    marcarComoPago: marcarCompraComoPago,
    getComprasPorMes,
    getResumoPorMes,
  } = useCompras();

  // Dados para o Dashboard
  const hoje = new Date();
  const comparativoAnoAnterior = getComparativoAnoAnterior(hoje.getMonth(), hoje.getFullYear());
  
  const resumoCompras = getResumoPorMes(hoje.getMonth(), hoje.getFullYear());
  const comprasDoMes = getComprasPorMes(hoje.getMonth(), hoje.getFullYear());
  
  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso!');
  };

  // Se não estiver autenticado, mostra a tela de login
  if (!isAuthenticated) {
    return (
      <Login 
        onLogin={login}
        onLoginGoogle={loginWithGoogle}
        onRegister={register}
      />
    );
  }

  const NavItems = () => (
    <>
      <Button
        variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
        className="w-full justify-start gap-2"
        onClick={() => {
          setActiveTab('dashboard');
          setMobileMenuOpen(false);
        }}
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </Button>
      <Button
        variant={activeTab === 'contas' ? 'default' : 'ghost'}
        className="w-full justify-start gap-2"
        onClick={() => {
          setActiveTab('contas');
          setMobileMenuOpen(false);
        }}
      >
        <List className="h-4 w-4" />
        Contas a Pagar
      </Button>
      <Button
        variant={activeTab === 'dre' ? 'default' : 'ghost'}
        className="w-full justify-start gap-2"
        onClick={() => {
          setActiveTab('dre');
          setMobileMenuOpen(false);
        }}
      >
        <BarChart3 className="h-4 w-4" />
        DRE
      </Button>
      <Button
        variant={activeTab === 'compras' ? 'default' : 'ghost'}
        className="w-full justify-start gap-2"
        onClick={() => {
          setActiveTab('compras');
          setMobileMenuOpen(false);
        }}
      >
        <ShoppingCart className="h-4 w-4" />
        Compras
      </Button>
      <Button
        variant={activeTab === 'categorias' ? 'default' : 'ghost'}
        className="w-full justify-start gap-2"
        onClick={() => {
          setActiveTab('categorias');
          setMobileMenuOpen(false);
        }}
      >
        <Settings className="h-4 w-4" />
        Categorias
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Contas a Pagar
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Gestão Financeira Completa
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <NavItems />
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab('dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('contas')}>
                  <List className="mr-2 h-4 w-4" />
                  Contas a Pagar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('dre')}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  DRE
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('compras')}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Compras
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('categorias')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Categorias
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-2 mt-8">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="font-medium truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  <NavItems />
                  <div className="mt-auto pt-4 border-t">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-2 text-red-600"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="dashboard" className="m-0">
            <Dashboard 
              resumo={resumo}
              contasProximasVencimento={contasProximasVencimento}
              gastosPorCategoriaTotal={gastosPorCategoriaTotal}
              onIrParaContas={() => setActiveTab('contas')}
              onIrParaDRE={() => setActiveTab('dre')}
              orcamento={orcamento.valor}
              onAtualizarOrcamento={atualizarOrcamento}
              faturamentoMesAtual={resumoDRE.totalFaturamento}
              faturamentoMesAnterior={resumoDRE.faturamentoMesAnterior}
              faturamentoAnoAnterior={comparativoAnoAnterior.faturamentoAnoAnterior}
              variacaoMesAnterior={resumoDRE.variacaoFaturamento}
              variacaoAnoAnterior={comparativoAnoAnterior.variacao}
              totalCompras={resumoCompras.totalCompras}
            />
          </TabsContent>

          <TabsContent value="contas" className="m-0">
            <ListaContas
              contas={contasFiltradas}
              categorias={categorias}
              filtros={filtros}
              setFiltroStatus={setFiltroStatus}
              setFiltroCategoria={setFiltroCategoria}
              setFiltroPeriodo={setFiltroPeriodo}
              setBusca={setBusca}
              adicionarConta={adicionarConta}
              adicionarContaRecorrente={adicionarContaRecorrente}
              atualizarConta={atualizarConta}
              removerConta={removerConta}
              marcarComoPago={marcarComoPago}
              marcarComoPendente={marcarComoPendente}
            />
          </TabsContent>

          <TabsContent value="dre" className="m-0">
            <DRE
              faturamentos={faturamentosDoMes}
              receitas={receitas}
              despesas={despesas}
              todasDespesas={todasDespesas}
              categoriasReceita={categoriasReceita}
              categoriasDespesa={categoriasDespesa}
              mesSelecionado={mesSelecionado}
              nomeMesAtual={nomeMesAtual}
              diasDoMes={diasDoMes}
              resumo={resumoDRE}
              navegarMes={navegarMes}
              adicionarFaturamento={adicionarFaturamento}
              removerFaturamento={removerFaturamento}
              adicionarReceita={adicionarReceita}
              removerReceita={removerReceita}
              adicionarDespesa={adicionarDespesa}
              removerDespesa={removerDespesa}
              adicionarCategoriaReceita={adicionarCategoriaReceita}
              adicionarCategoriaDespesa={adicionarCategoriaDespesa}
            />
          </TabsContent>

          <TabsContent value="compras" className="m-0">
            <Compras
              compras={comprasDoMes}
              mesSelecionado={mesSelecionado}
              nomeMesAtual={nomeMesAtual}
              resumo={resumoCompras}
              adicionarCompra={adicionarCompra}
              removerCompra={removerCompra}
              marcarComoPago={marcarCompraComoPago}
            />
          </TabsContent>

          <TabsContent value="categorias" className="m-0">
            <GerenciarCategorias
              categorias={categorias}
              adicionarCategoria={adicionarCategoria}
              removerCategoria={removerCategoria}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Contas a Pagar - Gestão Financeira
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>Pago: {resumo.contasPagas}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Pendente: {resumo.contasPendentes}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Atrasado: {resumo.contasAtrasadas}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// App com Provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
