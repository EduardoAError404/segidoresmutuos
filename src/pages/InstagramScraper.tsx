import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, Copy, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const InstagramScraper = () => {
  const [username, setUsername] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleScrape = async (type: 'followers' | 'following') => {
    if (!username.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome de usuário do Instagram",
        variant: "destructive",
      });
      return;
    }

    if (!sessionId.trim()) {
      toast({
        title: "Erro",
        description: "Digite seu Session ID do Instagram",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult("");

    try {
      const { data, error } = await supabase.functions.invoke('instagram-scraper', {
        body: { username, type, sessionId }
      });

      if (error) throw error;

      if (data.success) {
        setResult(data.csv);
        toast({
          title: "Sucesso!",
          description: `${data.count} usuários extraídos`,
        });
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Erro ao extrair dados",
        description: error.message || "Verifique seu Session ID e tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `instagram_${username}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast({
      title: "Copiado!",
      description: "Lista copiada para a área de transferência",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Instagram Scraper</h1>
            <p className="text-muted-foreground mt-2">Extraia seguidores e seguindo de perfis do Instagram</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ AVISO:</strong> Web scraping viola os Termos de Serviço do Instagram e pode resultar em bloqueio de conta.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Username do Instagram</label>
              <Input
                placeholder="exemplo: cristiano"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Session ID do Instagram</label>
              <Input
                type="password"
                placeholder="Seu sessionid cookie"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Para obter: 1) Abra Instagram no navegador, 2) Abra DevTools (F12), 3) Vá em Application/Storage, 4) Copie o cookie "sessionid"
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleScrape('followers')}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Extrair Seguidores
              </Button>
              <Button
                onClick={() => handleScrape('following')}
                disabled={isLoading}
                variant="secondary"
                className="flex-1"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Extrair Seguindo
              </Button>
            </div>
          </div>
        </Card>

        {result && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Resultado</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                  <Button size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Baixar CSV
                  </Button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">{result}</pre>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InstagramScraper;
