import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// This component will scroll the window to the top whenever
// the pathname changes (i.e., when navigation occurs)
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when path changes
    window.scrollTo(0, 0);
  }, [pathname]);

  // This component doesn't render anything
  return null;
}

export default ScrollToTop;
