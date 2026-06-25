import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Image, MessageSquareQuote, HelpCircle, Globe, ImageIcon, PanelTop, PanelBottom, GalleryHorizontal } from "lucide-react";
import AdminBannersContent from "./AdminBanners";
import AdminDepoimentosContent from "./AdminDepoimentos";
import AdminFAQContent from "./AdminFAQ";
import AdminBannersTopoContent from "./AdminBannersTopo";
import { OgFaviconTab } from "@/components/admin/OgFaviconTab";
import { LogosTab } from "@/components/admin/LogosTab";
import { HeaderTab } from "@/components/admin/HeaderTab";
import { FooterTab } from "@/components/admin/FooterTab";


export default function AdminPersonalizacao() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Personalização" subtitle="Aparência, banners, depoimentos, FAQ e identidade visual do site" />

      <Tabs defaultValue="header" className="w-full">
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="header" className="gap-1.5 text-xs sm:text-sm">
            <PanelTop className="h-3.5 w-3.5" /> Header
          </TabsTrigger>
          <TabsTrigger value="footer" className="gap-1.5 text-xs sm:text-sm">
            <PanelBottom className="h-3.5 w-3.5" /> Footer
          </TabsTrigger>
          <TabsTrigger value="banners" className="gap-1.5 text-xs sm:text-sm">
            <Image className="h-3.5 w-3.5" /> Banners
          </TabsTrigger>
          <TabsTrigger value="banners-topo" className="gap-1.5 text-xs sm:text-sm">
            <GalleryHorizontal className="h-3.5 w-3.5" /> Banners do topo
          </TabsTrigger>
          <TabsTrigger value="depoimentos" className="gap-1.5 text-xs sm:text-sm">
            <MessageSquareQuote className="h-3.5 w-3.5" /> Depoimentos
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-1.5 text-xs sm:text-sm">
            <HelpCircle className="h-3.5 w-3.5" /> FAQ
          </TabsTrigger>
          <TabsTrigger value="logos" className="gap-1.5 text-xs sm:text-sm">
            <ImageIcon className="h-3.5 w-3.5" /> Logos
          </TabsTrigger>
          <TabsTrigger value="og-favicon" className="gap-1.5 text-xs sm:text-sm">
            <Globe className="h-3.5 w-3.5" /> OG & Favicon
          </TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="mt-6">
          <HeaderTab />
        </TabsContent>
        <TabsContent value="footer" className="mt-6">
          <FooterTab />
        </TabsContent>
        <TabsContent value="banners" className="mt-6">
          <AdminBannersContent />
        </TabsContent>
        <TabsContent value="banners-topo" className="mt-6">
          <AdminBannersTopoContent />
        </TabsContent>
        <TabsContent value="depoimentos" className="mt-6">
          <AdminDepoimentosContent />
        </TabsContent>
        <TabsContent value="faq" className="mt-6">
          <AdminFAQContent />
        </TabsContent>
        <TabsContent value="logos" className="mt-6">
          <LogosTab />
        </TabsContent>
        <TabsContent value="og-favicon" className="mt-6">
          <OgFaviconTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
