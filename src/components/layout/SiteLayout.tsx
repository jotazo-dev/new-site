import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { WhatsAppFloatingButton } from "@/components/common/WhatsAppFloatingButton";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";
import { PopupManager } from "@/components/layout/PopupManager";
import { TrackingScripts } from "@/components/layout/TrackingScripts";
import { PageTopBanner } from "@/components/layout/PageTopBanner";
import { CityWelcomeStrip } from "@/components/layout/CityWelcomeStrip";
import { useTheme } from "@/hooks/useTheme";
import { usePageViewTracker } from "@/hooks/usePageViewTracker";
import { useMetaPageView } from "@/hooks/useMetaPageView";
import { useCartAutoSync } from "@/cart/useCartAutoSync";
import { Black4GBGiftDialogV2 } from "@/components/cart/Black4GBGiftDialogV2";

export function SiteLayout() {
  useTheme();
  usePageViewTracker();
  useMetaPageView();
  useCartAutoSync();
  return (
    <div data-theme-scope className="min-h-screen bg-background text-foreground">
      <TrackingScripts />
      <OrganizationJsonLd />
      <CityWelcomeStrip />
      <SiteHeader />
      <PageTopBanner />
      <main className="mx-auto w-full max-w-7xl px-4 py-10">
        <Suspense fallback={<div className="min-h-[60vh]" aria-hidden="true" />}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
      <WhatsAppFloatingButton />
      <PopupManager />
      <Black4GBGiftDialogV2 />
      <div data-prerendered-ready hidden aria-hidden="true" />
    </div>
  );
}
