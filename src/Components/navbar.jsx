import { useState, useEffect } from 'react';
import MobileNavbar from './MobileNavbar';
import DesktopNavbar from './DesktopNavbar';

const useViewport = () => {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return { width };
};

const Navbar = () => {
    const { width } = useViewport();
    const breakpoint = 730;

    return (
        <nav>
            {width < breakpoint ? (
                <MobileNavbar />
            ) : (
                <DesktopNavbar />
            )}
        </nav>
    );
};

export default Navbar;