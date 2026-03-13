import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogoTab } from "@/components/esquadrias/CatalogoTab";
import { ConfiguradorTab } from "@/components/esquadrias/ConfiguradorTab";
import { ProjetosTab } from "@/components/esquadrias/ProjetosTab";
import { Box, Settings2, FolderOpen } from "lucide-react";

const EsquadriasModule = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Módulo de Esquadrias</h1>
          <p className="text-sm text-muted-foreground">Catálogo, configurador paramétrico e lista de corte</p>
        </div>

        <Tabs defaultValue="configurador" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="configurador" className="gap-2">
              <Settings2 className="h-4 w-4" /> Configurador
            </TabsTrigger>
            <TabsTrigger value="catalogo" className="gap-2">
              <Box className="h-4 w-4" /> Catálogo
            </TabsTrigger>
            <TabsTrigger value="projetos" className="gap-2">
              <FolderOpen className="h-4 w-4" /> Projetos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configurador">
            <ConfiguradorTab />
          </TabsContent>

          <TabsContent value="catalogo">
            <CatalogoTab />
          </TabsContent>

          <TabsContent value="projetos">
            <ProjetosTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default EsquadriasModule;
