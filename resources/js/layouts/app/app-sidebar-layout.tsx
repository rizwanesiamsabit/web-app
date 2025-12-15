import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { FlashToast } from '@/components/flash-toast';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

interface AppSidebarLayoutProps extends PropsWithChildren {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppSidebarLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="pt-16 bg-gradient-to-tl from-teal-50 via-rose-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                    {children}
                </div>
            <FlashToast />
            </AppContent>
        </AppShell>
    );
}

export default AppSidebarLayout;
