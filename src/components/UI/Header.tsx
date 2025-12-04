import { useAppContext } from '../../context/AppContext';
import VisualizationSelector from './VisualizationSelector';
import ElectionSelector from './ElectionSelector';
import { Button } from '@/components/ui/button';

function Header() {
    const { toggleSidebar, sidebarOpen } = useAppContext();

    return (
        <header className="absolute top-0 left-0 right-0 z-50 p-6 flex items-start justify-between pointer-events-none max-md:p-2 max-md:flex-col max-md:gap-2">
            <div className="pointer-events-auto bg-[#1a1a2e]/90 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl flex flex-col gap-3 max-md:w-full">
                <h1 className="flex flex-col gap-0">
                    <span className="text-2xl font-extrabold bg-gradient-to-br from-white to-[#e94560] bg-clip-text text-transparent leading-tight">
                        Croatian Elections
                    </span>
                    <span className="text-xs text-[#b8b8b8] font-normal">
                        Interactive Visualization
                    </span>
                </h1>
                <ElectionSelector />
            </div>

            <div className="pointer-events-auto bg-[#1a1a2e]/90 backdrop-blur-md border border-white/10 rounded-xl p-1.5 shadow-xl max-md:w-full">
                <VisualizationSelector />
            </div>

            <div className="pointer-events-auto max-md:absolute max-md:top-2 max-md:right-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="bg-[#1a1a2e]/90 backdrop-blur-md border border-white/10 hover:bg-[#1a1a2e] hover:border-[#e94560] hover:scale-105 transition-all shadow-xl h-12 w-12 rounded-xl"
                    onClick={toggleSidebar}
                    aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        {sidebarOpen ? (
                            <>
                                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                            </>
                        ) : (
                            <>
                                <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round" />
                            </>
                        )}
                    </svg>
                </Button>
            </div>
        </header>
    );
}

export default Header;


