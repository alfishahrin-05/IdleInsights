import { useEffect } from 'react';
import { useSessionContext } from '../contexts/SessionContext';

/**
 * Hook to detect when user leaves/returns to the app during an active session
 * Uses Page Visibility API and window focus events
 */
export const useFocusDetection = (onFocusRegained) => {
    const { isActive, recordFocusLost, focusLostAt } = useSessionContext();

    useEffect(() => {
        if (!isActive) return;

        // Handle visibility change (tab switching)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // User left the tab
                recordFocusLost();
            } else {
                // User returned to tab
                if (focusLostAt) {
                    const awayDuration = Math.floor((new Date() - new Date(focusLostAt)) / 1000 / 60);
                    
                    // Only show prompt if away for at least 5 minutes
                    if (awayDuration >= 5 && onFocusRegained) {
                        onFocusRegained(awayDuration);
                    }
                }
            }
        };

        // Handle window blur/focus as backup
        const handleBlur = () => {
            if (!document.hidden) {
                recordFocusLost();
            }
        };

        const handleFocus = () => {
            if (focusLostAt && onFocusRegained) {
                const awayDuration = Math.floor((new Date() - new Date(focusLostAt)) / 1000 / 60);
                if (awayDuration >= 5) {
                    onFocusRegained(awayDuration);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [isActive, recordFocusLost, focusLostAt, onFocusRegained]);
};
