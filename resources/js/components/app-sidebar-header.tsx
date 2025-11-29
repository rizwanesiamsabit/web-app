import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem } from '@/types';
import { useState, useRef, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useAppearance } from '@/hooks/use-appearance';

interface AppSidebarHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppSidebarHeader({ breadcrumbs = [] }: AppSidebarHeaderProps) {
    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const { appearance, setAppearance } = useAppearance();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfile(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="fixed top-0 left-64 right-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 bg-white dark:bg-gray-900 px-6 transition-[left] duration-200 ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 group-has-data-[state=collapsed]/sidebar-wrapper:left-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            
            <div className="flex items-center gap-4">
                <div className="hidden md:block relative">
                    <Input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 w-64"
                    />
                    <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                

                <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setAppearance(appearance === 'dark' ? 'light' : 'dark')}
                >
                    {appearance === 'dark' ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </Button>
                
                <div className="relative" ref={profileRef}>
                    <Button
                        variant="ghost"
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-2 px-2"
                    >
                        <img
                            src="https://picsum.photos/seed/user/32/32"
                            alt="User"
                            className="w-8 h-8 rounded-full"
                        />
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </Button>
                    
                    {showProfile && (
                        <div className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg py-2 z-50">
                            <div className="px-4 py-2 border-b">
                                <p className="font-medium">{(usePage().props.auth as any)?.user?.name || 'User'}</p>
                                <p className="text-sm text-muted-foreground">{(usePage().props.auth as any)?.user?.email || 'user@example.com'}</p>
                            </div>
                            <Button variant="ghost" className="w-full justify-start px-4 py-2">
                                Profile
                            </Button>
                            <Button variant="ghost" className="w-full justify-start px-4 py-2">
                                Settings
                            </Button>
                            <div className="border-t mt-2 pt-2">
                                <Button 
                                    variant="ghost" 
                                    className="w-full justify-start px-4 py-2 text-red-600"
                                    onClick={() => router.post('/logout')}
                                >
                                    Logout
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
