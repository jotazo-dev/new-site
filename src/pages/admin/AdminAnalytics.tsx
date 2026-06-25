import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BannerAnalyticsTab } from "@/components/admin/BannerAnalyticsTab";
import { PagesAnalyticsTab } from "@/components/admin/PagesAnalyticsTab";
import { FileText, Image as ImageIcon } from "lucide-react";

export default function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Analytics" subtitle="Métricas de acessos às páginas e cliques nos banners" />

      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="pages" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5" /> Páginas
          </TabsTrigger>
          <TabsTrigger value="banners" className="gap-1.5 text-xs sm:text-sm">
            <ImageIcon className="h-3.5 w-3.5" /> Banners
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="mt-6">
          <PagesAnalyticsTab />
        </TabsContent>
        <TabsContent value="banners" className="mt-6">
          <BannerAnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
