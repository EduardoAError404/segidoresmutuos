import { useState } from "react";
import { FileUploadZone } from "@/components/FileUploadZone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileCheck2, ArrowRight, Copy } from "lucide-react";
import { parseCSV, findCommonUsernames, generateCSV, downloadCSV } from "@/utils/csvProcessor";
import { toast } from "sonner";

const Index = () => {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile1 = (file: File) => {
    setFile1(file);
    setResult("");
  };

  const handleFile2 = (file: File) => {
    setFile2(file);
    setResult("");
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

      const commonUsers = findCommonUsernames(users1, users2);

      if (commonUsers.length === 0) {
        toast.warning("Nenhum username comum encontrado");
        setResult("");
      } else {
        const csv = generateCSV(commonUsers);
        setResult(csv);
        toast.success(`${commonUsers.length} usernames comuns encontrados!`);
      }
    } catch (error) {
      toast.error("Erro ao processar arquivos. Verifique o formato.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      downloadCSV(result, "usernames_comuns.csv");
      toast.success("Arquivo baixado com sucesso!");
    }
  };

  const handleCopy = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result);
        toast.success("Lista copiada para área de transferência!");
      } catch (error) {
        toast.error("Erro ao copiar para área de transferência");
        console.error(error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
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

        {result && (
          <Card className="p-8 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Resultado</h2>
                <p className="text-muted-foreground">
                  Usernames encontrados em ambos os arquivos
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" className="hover:bg-primary/10">
                  <Copy className="mr-2 w-4 h-4" />
                  Copiar
                </Button>
                <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90">
                  <Download className="mr-2 w-4 h-4" />
                  Baixar CSV
                </Button>
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-6 mt-4">
              <p className="text-sm font-mono break-all text-foreground">{result}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
