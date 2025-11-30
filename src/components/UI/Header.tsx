import { useAppContext } from '../../context/AppContext';
import VisualizationSelector from './VisualizationSelector';
import ElectionSelector from './ElectionSelector';
import './Header.css';

function Header() {
    const { toggleSidebar, sidebarOpen } = useAppContext();

    return (
        <header className="app-header">
            <div className="header-left">
                <h1 className="app-title">
                    <span className="title-main">Croatian Elections</span>
                    <span className="title-sub">Interactive Visualization</span>
                </h1>
                <ElectionSelector />
            </div>

            <div className="header-center">
                <VisualizationSelector />
            </div>

            <div className="header-right">
                <button
                    className="sidebar-toggle"
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
                </button>
            </div>
        </header>
    );
}

export default Header;
