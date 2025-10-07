import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  label: string;
  fileName?: string;
}

export const FileUploadZone = ({ onFileSelect, label, fileName }: FileUploadZoneProps) => {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      onFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-8 transition-all duration-300",
        "hover:border-primary hover:bg-primary/5 cursor-pointer",
        "bg-card",
        fileName ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <div className={cn(
          "p-4 rounded-full transition-colors",
          fileName ? "bg-primary/20" : "bg-muted"
        )}>
          <Upload className={cn(
            "w-6 h-6",
            fileName ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">{label}</p>
          {fileName ? (
            <p className="text-sm text-primary mt-1">{fileName}</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              Arraste um arquivo CSV ou clique para selecionar
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
