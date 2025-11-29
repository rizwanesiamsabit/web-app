import { SidebarProvider } from '@/components/ui/sidebar';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';

interface AppShellProps {
    children: ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const { sidebarOpen } = usePage<SharedData>().props;

    return variant === 'sidebar' ? (
        <SidebarProvider defaultOpen={sidebarOpen}>
            {children}
        </SidebarProvider>
    ) : (
        <div className="flex min-h-screen w-full flex-col">
            {children}
        </div>
    );
}
