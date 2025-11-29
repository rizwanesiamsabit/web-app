import { SidebarInset } from '@/components/ui/sidebar';
import { type ComponentProps } from 'react';

interface AppContentProps extends ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({
    variant = 'header',
    children,
    className,
    ...props
}: AppContentProps) {
    return variant === 'sidebar' ? (
        <SidebarInset className={className} {...props}>
            {children}
        </SidebarInset>
    ) : (
        <main
            className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl"
            {...props}
        >
            {children}
        </main>
    );
}
