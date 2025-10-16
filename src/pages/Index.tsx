import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FileUploadZone } from "@/components/FileUploadZone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileCheck2, ArrowRight, Copy, LogOut } from "lucide-react";
import { parseCSV, findCommonUsers, generateCSV, generateUserFormat, downloadCSV } from "@/utils/csvProcessor";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [resultUsernames, setResultUsernames] = useState<string>("");
  const [resultFullNames, setResultFullNames] = useState<string>("");
  const [resultFormatted, setResultFormatted] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logout realizado com sucesso!");
    navigate("/login");
  };

  const handleFile1 = (file: File) => {
    setFile1(file);
    setResultUsernames("");
    setResultFullNames("");
    setResultFormatted("");
  };

  const handleFile2 = (file: File) => {
    setFile2(file);
    setResultUsernames("");
    setResultFullNames("");
    setResultFormatted("");
  };

  const processFiles = async () => {
    if (!file1 || !file2) {
      toast.error("Por favor, selecione ambos os arquivos");
      return;
    }

    setIsProcessing(true);

    try {
      const text1 = await file1.text();
      const text2 = await file2.text();

      const users1 = parseCSV(text1);
      const users2 = parseCSV(text2);

      const commonUsers = findCommonUsers(users1, users2);

      if (commonUsers.length === 0) {
        toast.warning("Nenhum username comum encontrado");
        setResultUsernames("");
        setResultFullNames("");
        setResultFormatted("");
      } else {
        const usernames = commonUsers.map(u => u.username);
        const fullNames = commonUsers.map(u => u.fullName);
        
      const csvUsernames = generateCSV(usernames);
      const csvFullNames = generateCSV(fullNames);
      const formattedList = generateUserFormat(commonUsers);
      
      setResultUsernames(csvUsernames);
      setResultFullNames(csvFullNames);
      setResultFormatted(formattedList);
        toast.success(`${commonUsers.length} usuários comuns encontrados!`);
      }
    } catch (error) {
      toast.error("Erro ao processar arquivos. Verifique o formato.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadUsernames = () => {
    if (resultUsernames) {
      downloadCSV(resultUsernames, "usernames_comuns.csv");
      toast.success("Usernames baixados com sucesso!");
    }
  };

  const handleDownloadFullNames = () => {
    if (resultFullNames) {
      downloadCSV(resultFullNames, "nomes_completos.csv");
      toast.success("Nomes completos baixados com sucesso!");
    }
  };

  const handleCopyUsernames = async () => {
    if (resultUsernames) {
      try {
        await navigator.clipboard.writeText(resultUsernames);
        toast.success("Usernames copiados para área de transferência!");
      } catch (error) {
        toast.error("Erro ao copiar para área de transferência");
        console.error(error);
      }
    }
  };

  const handleCopyFullNames = async () => {
    if (resultFullNames) {
      try {
        await navigator.clipboard.writeText(resultFullNames);
        toast.success("Nomes completos copiados para área de transferência!");
      } catch (error) {
        toast.error("Erro ao copiar para área de transferência");
        console.error(error);
      }
    }
  };

  const handleDownloadFormatted = () => {
    if (resultFormatted) {
      downloadCSV(resultFormatted, "usuarios_formatados.txt");
      toast.success("Lista formatada baixada com sucesso!");
    }
  };

  const handleCopyFormatted = async () => {
    if (resultFormatted) {
      try {
        await navigator.clipboard.writeText(resultFormatted);
        toast.success("Lista formatada copiada para área de transferência!");
      } catch (error) {
        toast.error("Erro ao copiar para área de transferência");
        console.error(error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end gap-2 mb-4">
          <Link to="/instagram">
            <Button variant="secondary">
              Instagram Scraper
            </Button>
          </Link>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
          >
            <LogOut className="mr-2 w-4 h-4" />
            Sair
          </Button>
        </div>
        
        <header className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 rounded-full">
            <FileCheck2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">CSV Processor</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Cruzamento de Dados CSV
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Faça upload de dois arquivos CSV e encontre os usernames presentes em ambos
          </p>
        </header>

        <Card className="p-8 mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <FileUploadZone
              label="Arquivo 1"
              fileName={file1?.name}
              onFileSelect={handleFile1}
            />
            <FileUploadZone
              label="Arquivo 2"
              fileName={file2?.name}
              onFileSelect={handleFile2}
            />
          </div>

          <div className="flex justify-center">
            <Button
              onClick={processFiles}
              disabled={!file1 || !file2 || isProcessing}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              {isProcessing ? (
                "Processando..."
              ) : (
                <>
                  Processar Arquivos
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </Card>

        {resultUsernames && (
          <div className="space-y-6">
            <Card className="p-8 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Usernames</h2>
                  <p className="text-muted-foreground">
                    Usernames encontrados em ambos os arquivos
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCopyUsernames} variant="outline" className="hover:bg-primary/10">
                    <Copy className="mr-2 w-4 h-4" />
                    Copiar
                  </Button>
                  <Button onClick={handleDownloadUsernames} className="bg-primary hover:bg-primary/90">
                    <Download className="mr-2 w-4 h-4" />
                    Baixar CSV
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-6 mt-4">
                <p className="text-sm font-mono break-all text-foreground">{resultUsernames}</p>
              </div>
            </Card>

            <Card className="p-8 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Nomes Completos</h2>
                  <p className="text-muted-foreground">
                    Nomes dos perfis do Instagram na mesma ordem
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCopyFullNames} variant="outline" className="hover:bg-primary/10">
                    <Copy className="mr-2 w-4 h-4" />
                    Copiar
                  </Button>
                  <Button onClick={handleDownloadFullNames} className="bg-primary hover:bg-primary/90">
                    <Download className="mr-2 w-4 h-4" />
                    Baixar CSV
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-6 mt-4">
                <p className="text-sm font-mono break-all text-foreground">{resultFullNames}</p>
              </div>
            </Card>

            <Card className="p-8 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Lista Formatada</h2>
                  <p className="text-muted-foreground">
                    Formato username:Nome (uma por linha)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCopyFormatted} variant="outline" className="hover:bg-primary/10">
                    <Copy className="mr-2 w-4 h-4" />
                    Copiar
                  </Button>
                  <Button onClick={handleDownloadFormatted} className="bg-primary hover:bg-primary/90">
                    <Download className="mr-2 w-4 h-4" />
                    Baixar TXT
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-6 mt-4 max-h-80 overflow-y-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap text-foreground">{resultFormatted}</pre>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
