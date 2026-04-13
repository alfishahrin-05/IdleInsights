import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import API from '../services/api';

// Configuration
const CHECK_IN_INTERVAL_MINUTES = 1; // Set to 1 for testing, 15 for production for notification
const CHECK_IN_TIMEOUT_MINUTES = 0.5; // Time to respond before marking as missed (0.17 = 10 seconds for quick testing)

const SessionContext = createContext();

export const useSessionContext = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSessionContext must be used within SessionProvider');
    }
    return context;
};

export const SessionProvider = ({ children }) => {
    const [activeSession, setActiveSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [focusLostAt, setFocusLostAt] = useState(null);
    const [showDistractionPrompt, setShowDistractionPrompt] = useState(false);
    const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState(null);
    const [lastCheckInTime, setLastCheckInTime] = useState(null);
    const [checkInResponded, setCheckInResponded] = useState(false);
    
    // Mode integration
    const [activeMode, setActiveMode] = useState(null);
    const [subTaskElapsedSeconds, setSubTaskElapsedSeconds] = useState(0);
    const [showSubTaskPrompt, setShowSubTaskPrompt] = useState(false);
    const [showAllTasksCompletePrompt, setShowAllTasksCompletePrompt] = useState(false);
    const [promptedSubTaskId, setPromptedSubTaskId] = useState(null);
    
    // Digital Friction Mode state
    const [distractionStartTime, setDistractionStartTime] = useState(null);
    const [distractionElapsed, setDistractionElapsed] = useState(0);
    const [distractionCategory, setDistractionCategory] = useState(null);
    const [showFrictionPause, setShowFrictionPause] = useState(false);
    const [frictionPauseCount, setFrictionPauseCount] = useState(0);
    const [showFrictionWidget, setShowFrictionWidget] = useState(false);
    const [frictionWidgetCategory, setFrictionWidgetCategory] = useState(null);

    // Register service worker on mount
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                    setServiceWorkerRegistration(registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
            
            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                console.log('Message from Service Worker:', event.data);
                
                if (event.data.type === 'CHECK_IN_RESPONSE') {
                    setCheckInResponded(true);
                    setLastCheckInTime(null);
                    
                    if (event.data.status === 'success') {
                        recordCheckIn('success');
                    } else if (event.data.status === 'distracted') {
                        setShowDistractionPrompt(true);
                    }
                }
            });
        }
    }, []);

    // Fetch active session on mount (only if logged in)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchActiveSession();
        } else {
            setIsLoading(false);
        }
    }, []);

    // Timer logic - update every second
    useEffect(() => {
        let interval;
        
        if (activeSession && activeSession.status === 'active') {
            interval = setInterval(() => {
                const startTime = new Date(activeSession.startTime);
                const now = new Date();
                const seconds = Math.floor((now - startTime) / 1000);
                setElapsedSeconds(seconds);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeSession]);

    // Sub-task timer logic - runs whenever there's an active incomplete sub-task
    useEffect(() => {
        let interval;
        
        if (activeSession && activeSession.status === 'active' && activeMode) {
            const currentSubTask = activeMode.subTasks?.[activeMode.currentSubTaskIndex];
            
            if (currentSubTask && !currentSubTask.completed) {
                interval = setInterval(() => {
                    setSubTaskElapsedSeconds(prev => prev + 1);
                }, 1000);
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeSession, activeMode, activeMode?.currentSubTaskIndex]);

    // Sub-task time-up prompt (only once per sub-task)
    useEffect(() => {
        if (!activeMode || !activeSession) return;
        
        const currentSubTask = activeMode.subTasks?.[activeMode.currentSubTaskIndex];
        if (currentSubTask && !currentSubTask.completed && currentSubTask.estimatedMinutes) {
            const estimatedSeconds = currentSubTask.estimatedMinutes * 60;
            
            // Only show prompt once per sub-task (check if we already prompted for this sub-task)
            if (subTaskElapsedSeconds >= estimatedSeconds && promptedSubTaskId !== currentSubTask._id) {
                setShowSubTaskPrompt(true);
                setPromptedSubTaskId(currentSubTask._id);
            }
        }
    }, [subTaskElapsedSeconds, activeMode, activeSession, promptedSubTaskId]);

    // Check-in reminder timer
    useEffect(() => {
        let checkInInterval;
        
        if (activeSession && activeSession.status === 'active') {
            console.log('Check-in timer: Session active');
            console.log('Notification permission:', Notification.permission);
            
            if (Notification.permission === 'granted') {
                console.log('Starting check-in timer with interval:', CHECK_IN_INTERVAL_MINUTES, 'minutes');
                
                // Send first notification immediately (after a short delay)
                const firstNotificationTimeout = setTimeout(() => {
                    sendCheckInNotification();
                }, CHECK_IN_INTERVAL_MINUTES * 60 * 1000);
                
                // Then send at regular intervals
                checkInInterval = setInterval(() => {
                    sendCheckInNotification();
                }, CHECK_IN_INTERVAL_MINUTES * 60 * 1000);
                
                return () => {
                    clearTimeout(firstNotificationTimeout);
                    if (checkInInterval) clearInterval(checkInInterval);
                };
            } else {
                console.warn('Notification permission not granted. Current permission:', Notification.permission);
            }
        }
    }, [activeSession]);

    // Handle check-in timeout (2 minutes to respond)
    useEffect(() => {
        let missedTimeout;
        
        if (lastCheckInTime && !checkInResponded) {
            console.log(`Check-in timeout started: ${CHECK_IN_TIMEOUT_MINUTES} minutes to respond`);
            
            missedTimeout = setTimeout(() => {
                if (!checkInResponded) {
                    console.log('Check-in missed - no response within timeout period');
                    recordCheckIn('missed');
                    setCheckInResponded(false);
                    setLastCheckInTime(null);
                    
                    // Close any lingering notifications
                    if (serviceWorkerRegistration) {
                        serviceWorkerRegistration.getNotifications({ tag: 'check-in' })
                            .then(notifications => {
                                notifications.forEach(notification => notification.close());
                            });
                    }
                }
            }, CHECK_IN_TIMEOUT_MINUTES * 60 * 1000);
        }
        
        return () => {
            if (missedTimeout) clearTimeout(missedTimeout);
        };
    }, [lastCheckInTime, checkInResponded, serviceWorkerRegistration]);

    // Digital Friction: Distraction timer
    useEffect(() => {
        if (!distractionStartTime || !activeMode || activeMode.activeMode !== 'DIGITAL_FRICTION') return;

        const interval = setInterval(() => {
            setDistractionElapsed(prev => {
                const newElapsed = prev + 1;
                
                // Check if we hit the trigger time (default 5 minutes = 300 seconds)
                const triggerSeconds = (activeMode.settings?.triggerAfterMinutes || 5) * 60;
                const nextTrigger = triggerSeconds + (frictionPauseCount * 5 * 60); // Add 5 min per continue
                
                if (newElapsed >= nextTrigger && !showFrictionPause) {
                    setShowFrictionPause(true);
                }
                
                return newElapsed;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [distractionStartTime, activeMode, frictionPauseCount, showFrictionPause]);

    const sendCheckInNotification = () => {
        if (!activeSession) {
            console.log('Check-in: No active session');
            return;
        }
        
        console.log('Sending check-in notification...');
        
        // Reset check-in response tracking
        setCheckInResponded(false);
        setLastCheckInTime(Date.now());
        
        if (serviceWorkerRegistration) {
            // Use Service Worker for notifications with action buttons
            serviceWorkerRegistration.showNotification('Still working on your task?', {
                body: `Check-in: ${activeSession.intendedTaskId?.title || 'Current Task'}`,
                icon: '/favicon.ico',
                tag: 'check-in',
                requireInteraction: true,
                actions: [
                    { action: 'focused', title: '✅ Still Focused' },
                    { action: 'distracted', title: '❌ Got Distracted' }
                ]
            }).then(() => {
                console.log('Notification shown via Service Worker');
            }).catch(error => {
                console.error('Failed to show notification:', error);
            });
        } else {
            // Fallback to regular notification (without action buttons)
            console.warn('Service Worker not available, using fallback notification');
            const notification = new Notification('Still working on your task?', {
                body: `Check-in: ${activeSession.intendedTaskId?.title || 'Current Task'}\nClick to respond`,
                icon: '/favicon.ico',
                tag: 'check-in',
                requireInteraction: true
            });
            
            notification.onclick = () => {
                notification.close();
                window.focus();
                const stillFocused = window.confirm(
                    `Check-in: Are you still focused on "${activeSession.intendedTaskId?.title}"?\n\n` +
                    `Click OK if still focused, Cancel if you got distracted.`
                );
                
                if (stillFocused) {
                    recordCheckIn('success');
                } else {
                    setShowDistractionPrompt(true);
                }
            };
        }

        // If no response in 2 minutes, record as missed
        setTimeout(() => {
            if (!responded && !notification.closed) {
                recordCheckIn('missed');
                notification.close();
            }
        }, 2 * 60 * 1000);
    };

    const recordCheckIn = async (status) => {
        if (!activeSession) return;
        
        try {
            await API.post(`/sessions/${activeSession._id}/check-in`, { status });
        } catch (error) {
            console.error('Failed to record check-in:', error);
        }
    };

    const fetchActiveSession = async () => {
        try {
            setIsLoading(true);
            const res = await API.get('/sessions/active');
            if (res.data) {
                setActiveSession(res.data);
                // Calculate initial elapsed time
                const startTime = new Date(res.data.startTime);
                const now = new Date();
                const seconds = Math.floor((now - startTime) / 1000);
                setElapsedSeconds(seconds);
                
                // Fetch active mode if session is for a task with mode, pass elapsed time
                await fetchActiveMode(res.data.intendedTaskId?._id, seconds);
            }
        } catch (error) {
            console.error('Failed to fetch active session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchActiveMode = async (taskId, sessionElapsed = 0) => {
        if (!taskId) return;
        
        try {
            const res = await API.get('/modes/active');
            if (res.data) {
                // Task-specific modes (e.g. Task Deconstructor): must match session task
                // Non-task-specific modes (e.g. Digital Friction): always activate
                const isTaskSpecific = res.data.taskId && res.data.taskId._id;
                if (!isTaskSpecific || res.data.taskId._id === taskId) {
                    console.log('Setting activeMode from fetchActiveMode:', res.data);
                    console.log('Setting subTaskElapsedSeconds to:', sessionElapsed);
                    flushSync(() => {
                        setActiveMode(res.data);
                        setSubTaskElapsedSeconds(sessionElapsed);
                    });
                } else {
                    setActiveMode(null);
                }
            } else {
                setActiveMode(null);
            }
        } catch (error) {
            console.error('Failed to fetch active mode:', error);
            setActiveMode(null);
        }
    };

    const startSession = async (taskId) => {
        try {
            const res = await API.post('/sessions/start', { intendedTaskId: taskId });
            setActiveSession(res.data);
            setElapsedSeconds(0);
            
            // Fetch mode for this task
            await fetchActiveMode(taskId);
            
            // Request notification permission for check-ins
            if (Notification.permission === 'default') {
                await Notification.requestPermission();
            }
            
            return res.data;
        } catch (error) {
            console.error('Failed to start session:', error);
            throw error;
        }
    };

    const pauseSession = async () => {
        if (!activeSession) return;
        
        try {
            const res = await API.patch(`/sessions/${activeSession._id}/pause`);
            setActiveSession(res.data);
        } catch (error) {
            console.error('Failed to pause session:', error);
            throw error;
        }
    };

    const resumeSession = async () => {
        if (!activeSession) return;
        
        try {
            const res = await API.patch(`/sessions/${activeSession._id}/resume`);
            setActiveSession(res.data);
        } catch (error) {
            console.error('Failed to resume session:', error);
            throw error;
        }
    };

    const logDistraction = async ({ activityCategory, durationMinutes, activityDetail }) => {
        if (!activeSession) return;
        
        try {
            const res = await API.post(`/sessions/${activeSession._id}/distraction`, {
                activityCategory,
                durationMinutes,
                activityDetail
            });
            setActiveSession(res.data);
            
            // Check if Digital Friction mode should show widget for this category
            if (activeMode?.activeMode === 'DIGITAL_FRICTION') {
                const enabledCategories = activeMode.settings?.enabledCategories || [];
                if (enabledCategories.includes(activityCategory)) {
                    setFrictionWidgetCategory(activityCategory);
                    setShowFrictionWidget(true);
                }
            }
            
            return res.data;
        } catch (error) {
            console.error('Failed to log distraction:', error);
            throw error;
        }
    };

    // Digital Friction: Start tracking a distraction
    const startDistractionTracking = async (category) => {
        if (!activeMode || activeMode.activeMode !== 'DIGITAL_FRICTION') return;
        
        const enabledCategories = activeMode.settings?.enabledCategories || [];
        if (!enabledCategories.includes(category)) return; // Not monitored
        
        try {
            // Record start in backend
            await API.post(`/modes/${activeMode._id}/distraction-session`, {
                category,
                sessionId: activeSession._id
            });
            
            setDistractionStartTime(Date.now());
            setDistractionElapsed(0);
            setDistractionCategory(category);
            setFrictionPauseCount(0);
            setShowFrictionPause(false);
            setShowFrictionWidget(false); // Hide widget when tracking starts
        } catch (error) {
            console.error('Failed to start distraction tracking:', error);
        }
    };

    // Digital Friction: End tracking and log distraction
    const endDistractionTracking = async () => {
        if (!distractionStartTime) return;
        
        const durationMinutes = Math.max(1, Math.round(distractionElapsed / 60)); // At least 1 minute
        const trackedCategory = distractionCategory;
        
        try {
            // Log the tracked distraction duration
            await logDistraction({
                activityCategory: trackedCategory,
                durationMinutes,
                activityDetail: `Tracked by Digital Friction Mode (${frictionPauseCount} pause${frictionPauseCount !== 1 ? 's' : ''} taken)`
            });
            
            // Don't re-show the widget — this was an auto-log from ending tracking
            setShowFrictionWidget(false);
            
            // Record end in backend
            await API.post(`/modes/${activeMode._id}/distraction-session/end`, {
                sessionId: activeSession._id,
                totalSeconds: distractionElapsed
            });
        } catch (error) {
            console.error('Failed to end distraction tracking:', error);
        } finally {
            // Always reset state, even if API calls fail
            setDistractionStartTime(null);
            setDistractionElapsed(0);
            setDistractionCategory(null);
            setFrictionPauseCount(0);
            setShowFrictionPause(false);
        }
    };

    // Digital Friction: Handle continue browsing
    const continueBrowsing = async () => {
        setShowFrictionPause(false);
        setFrictionPauseCount(prev => prev + 1);
        
        try {
            // Record pause in backend
            await API.post(`/modes/${activeMode._id}/friction-pause`, {
                sessionId: activeSession._id,
                durationSeconds: getCurrentFrictionPauseDuration()
            });
        } catch (error) {
            console.error('Failed to record friction pause:', error);
        }
    };

    const getCurrentFrictionPauseDuration = () => {
        const baseDuration = activeMode?.settings?.pauseDuration || 10;
        return Math.min(20, baseDuration + (frictionPauseCount * 5));
    };

    const recordFocusLost = async () => {
        if (!activeSession || activeSession.status !== 'active') return;
        
        try {
            setFocusLostAt(new Date());
            await API.post(`/sessions/${activeSession._id}/focus-lost`);
        } catch (error) {
            console.error('Failed to record focus lost:', error);
        }
    };

    const recordFocusRegained = async (classification, distractedMinutes = 0) => {
        if (!activeSession || !focusLostAt) return;
        
        try {
            const awayDurationMinutes = Math.floor((new Date() - focusLostAt) / 1000 / 60);
            
            // If partial distraction, log it as a distraction event
            if (classification === 'partial_distraction' && distractedMinutes > 0) {
                await API.post(`/sessions/${activeSession._id}/distraction`, {
                    activityCategory: 'other',
                    durationMinutes: distractedMinutes,
                    activityDetail: 'Mixed period - guesstimated distraction time'
                });
                classification = 'working_elsewhere'; // Rest is work
            } else if (classification === 'distraction' && distractedMinutes > 0) {
                // Full distraction
                await API.post(`/sessions/${activeSession._id}/distraction`, {
                    activityCategory: 'other',
                    durationMinutes: distractedMinutes,
                    activityDetail: 'Full distraction period'
                });
            }
            
            const res = await API.post(`/sessions/${activeSession._id}/focus-regained`, {
                awayDurationMinutes,
                userClassification: classification
            });
            
            setActiveSession(res.data);
            setFocusLostAt(null);
            
            return { awayDurationMinutes };
        } catch (error) {
            console.error('Failed to record focus regained:', error);
            throw error;
        }
    };

    const endSession = async () => {
        if (!activeSession) return;
        
        try {
            const res = await API.post(`/sessions/${activeSession._id}/end`);
            const completedSession = res.data;
            // Don't clear activeSession here - let SessionWidget handle it after showing summary
            setElapsedSeconds(0);
            setFocusLostAt(null);
            return completedSession;
        } catch (error) {
            console.error('Failed to end session:', error);
            throw error;
        }
    };

    const clearSession = () => {
        setActiveSession(null);
        setElapsedSeconds(0);
        setFocusLostAt(null);
        setActiveMode(null);
        setSubTaskElapsedSeconds(0);
    };

    const completeSubTask = async (subTaskId) => {
        if (!activeMode) return;
        
        try {
            const res = await API.post(`/modes/${activeMode._id}/complete-subtask`, { subTaskId });
            setActiveMode(res.data);
            setSubTaskElapsedSeconds(0); // Reset timer for next sub-task
            setShowSubTaskPrompt(false);
            setPromptedSubTaskId(null); // Reset prompt flag for next sub-task
            
            // Check if all sub-tasks are completed
            const allCompleted = res.data.subTasks.every(st => st.completed);
            if (allCompleted) {
                setShowAllTasksCompletePrompt(true);
            }
        } catch (error) {
            console.error('Failed to complete sub-task:', error);
        }
    };

    const refreshMode = async () => {
        if (!activeMode) return;
        
        try {
            const res = await API.get('/modes/active');
            if (res.data && res.data._id === activeMode._id) {
                setActiveMode(res.data);
            }
        } catch (error) {
            console.error('Failed to refresh mode:', error);
        }
    };

    const activateExistingMode = async (taskId) => {
        if (!activeSession || !taskId) return;
        
        try {
            // Activate mode for task with existing template
            const res = await API.post('/modes/activate', {
                activeMode: 'TASK_DECONSTRUCTOR',
                taskId
            });
            
            console.log('Mode activated:', res.data);
            setActiveMode(res.data);
            setPromptedSubTaskId(null); // Reset prompt tracking
            
            // Calculate elapsed time for first sub-task based on session elapsed time
            // Set to actual session elapsed (not capped) so overtime can be shown
            const sessionElapsed = elapsedSeconds;
            setSubTaskElapsedSeconds(sessionElapsed);
            
            console.log('Sub-task timer initialized to:', sessionElapsed, 'seconds');
        } catch (error) {
            console.error('Failed to activate existing mode:', error);
            throw error;
        }
    };

    const value = {
        activeSession,
        isLoading,
        elapsedSeconds,
        focusLostAt,
        showDistractionPrompt,
        setShowDistractionPrompt,
        isActive: activeSession?.status === 'active',
        isPaused: activeSession?.status === 'paused',
        // Mode integration
        activeMode,
        subTaskElapsedSeconds,
        showSubTaskPrompt,
        setShowSubTaskPrompt,
        showAllTasksCompletePrompt,
        setShowAllTasksCompletePrompt,
        completeSubTask,
        refreshMode,
        activateExistingMode,
        // Digital Friction Mode
        distractionStartTime,
        distractionElapsed,
        distractionCategory,
        showFrictionPause,
        setShowFrictionPause,
        frictionPauseCount,
        showFrictionWidget,
        setShowFrictionWidget,
        frictionWidgetCategory,
        startDistractionTracking,
        endDistractionTracking,
        continueBrowsing,
        getCurrentFrictionPauseDuration,
        // Session methods
        startSession,
        pauseSession,
        resumeSession,
        logDistraction,
        recordFocusLost,
        recordFocusRegained,
        endSession,
        clearSession,
        refreshSession: fetchActiveSession
    };

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
};
