import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, File, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  bucket: string;
  folder?: string;
  onUploadComplete: (url: string, fileName: string, sizeBytes: number) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  currentFileUrl?: string | null;
}

const FILE_ICONS: Record<string, string> = {
  pdf: "📄",
  doc: "📝",
  docx: "📝",
  xls: "📊",
  xlsx: "📊",
  jpg: "🖼️",
  jpeg: "🖼️",
  png: "🖼️",
};

export function FileUpload({
  bucket,
  folder = "",
  onUploadComplete,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png",
  maxSizeMB = 10,
  className,
  currentFileUrl,
}: FileUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(
    currentFileUrl ? { name: getFileNameFromUrl(currentFileUrl), url: currentFileUrl } : null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  function getFileNameFromUrl(url: string): string {
    try {
      const parts = url.split("/");
      const name = parts[parts.length - 1];
      // Remove UUID prefix if present
      return decodeURIComponent(name).replace(/^[a-f0-9-]+_/, "");
    } catch {
      return "arquivo";
    }
  }

  function getFileExtension(name: string): string {
    return name.split(".").pop()?.toLowerCase() || "";
  }

  const uploadFile = useCallback(
    async (file: File) => {
      if (!user) {
        toast.error("Você precisa estar logado para fazer upload");
        return;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
        return;
      }

      const ext = getFileExtension(file.name);
      const allowedExts = accept.split(",").map((a) => a.trim().replace(".", ""));
      if (!allowedExts.includes(ext)) {
        toast.error(`Formato não permitido. Use: ${accept}`);
        return;
      }

      setUploading(true);

      try {
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = folder
          ? `${folder}/${timestamp}_${sanitizedName}`
          : `${timestamp}_${sanitizedName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;
        setUploadedFile({ name: file.name, url: publicUrl });
        onUploadComplete(publicUrl, file.name, file.size);
        toast.success("Arquivo enviado com sucesso!");
      } catch (err: any) {
        console.error("Upload error:", err);
        toast.error("Erro ao enviar arquivo: " + (err.message || "tente novamente"));
      } finally {
        setUploading(false);
      }
    },
    [bucket, folder, user, maxSizeMB, accept, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = () => {
    setUploadedFile(null);
    onUploadComplete("", "", 0);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {uploadedFile ? (
        <div className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-lg">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{uploadedFile.name}</p>
            <a
              href={uploadedFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline"
            >
              Visualizar arquivo
            </a>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-lg cursor-pointer transition-all",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/30",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Enviando arquivo...</p>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs font-medium text-foreground">
                  Arraste um arquivo ou <span className="text-primary">clique para selecionar</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  PDF, Word, Excel, Imagens · Máx. {maxSizeMB}MB
                </p>
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
