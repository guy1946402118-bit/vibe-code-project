import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PomodoroState {
  mode: 'work' | 'break';
  seconds: number;
  isRunning: boolean;
  completedPomodoros: number;
  startTime: number | null;
  
  setMode: (mode: 'work' | 'break') => void;
  setSeconds: (seconds: number) => void;
  setIsRunning: (isRunning: boolean) => void;
  setCompletedPomodoros: (count: number) => void;
  setStartTime: (time: number | null) => void;
  
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  switchMode: () => void;
  completePomodoro: () => void;
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      mode: 'work',
      seconds: 25 * 60,
      isRunning: false,
      completedPomodoros: 0,
      startTime: null,

      setMode: (mode) => set({ mode }),
      setSeconds: (seconds) => set({ seconds }),
      setIsRunning: (isRunning) => set({ isRunning }),
      setCompletedPomodoros: (completedPomodoros) => set({ completedPomodoros }),
      setStartTime: (startTime) => set({ startTime }),

      startTimer: () => {
        const state = get();
        const now = Date.now();
        
        if (!state.startTime || !state.isRunning) {
          set({
            isRunning: true,
            startTime: now - ((state.mode === 'work' ? 25 * 60 : 5 * 60) - state.seconds) * 1000,
          });
        } else {
          set({ isRunning: true });
        }
      },

      pauseTimer: () => {
        set({ isRunning: false });
      },

      resetTimer: () => {
        const { mode } = get();
        set({
          seconds: mode === 'work' ? 25 * 60 : 5 * 60,
          isRunning: false,
          startTime: null,
        });
      },

      switchMode: () => {
        const { mode } = get();
        const newMode = mode === 'work' ? 'break' : 'work';
        set({
          mode: newMode,
          seconds: newMode === 'work' ? 25 * 60 : 5 * 60,
          isRunning: false,
          startTime: null,
        });
      },

      completePomodoro: () => {
        set((state) => ({
          completedPomodoros: state.completedPomodoros + 1,
          isRunning: false,
        }));
      },
    }),
    {
      name: 'growth-pomodoro',
      partialize: (state) => ({
        mode: state.mode,
        seconds: state.seconds,
        isRunning: state.isRunning,
        completedPomodoros: state.completedPomodoros,
        startTime: state.startTime,
      }),
    }
  )
);
