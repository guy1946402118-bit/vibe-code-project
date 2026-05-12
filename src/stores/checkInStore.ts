import { create } from 'zustand';
import { checkInApi, type CheckIn } from '../lib/api';

const USE_API = true;

interface CheckInState {
  todayCheckIns: CheckIn[];
  loading: boolean;
  totalPoints: number;
  streak: number;
  checkIn: (category: string) => Promise<void>;
  loadTodayCheckIns: () => Promise<void>;
  getTotalPoints: () => Promise<number>;
  loadStats: () => Promise<void>;
}

export const useCheckInStore = create<CheckInState>((set, get) => ({
  todayCheckIns: [],
  loading: false,
  totalPoints: 0,
  streak: 0,
  checkIn: async (category) => {
    if (USE_API) {
      try {
        const { checkIn: newCheckIn, totalPoints } = await checkInApi.create(category);
        set({
          todayCheckIns: [...get().todayCheckIns, newCheckIn],
          totalPoints,
        });
      } catch (e) {
        console.error('CheckIn error:', e);
      }
    }
  },
  loadTodayCheckIns: async () => {
    set({ loading: true });
    if (USE_API) {
      try {
        const checkIns = await checkInApi.getToday();
        set({ todayCheckIns: checkIns || [], loading: false });
      } catch (e) {
        console.error('Load check-ins error:', e);
        set({ todayCheckIns: [], loading: false });
      }
    } else {
      set({ loading: false });
    }
  },
  getTotalPoints: async () => {
    if (USE_API) {
      try {
        const stats = await checkInApi.getStats();
        set({ totalPoints: stats.totalPoints, streak: stats.streak });
        return stats.totalPoints;
      } catch (e) {
        console.error('Get stats error:', e);
        return 0;
      }
    }
    return 0;
  },
  loadStats: async () => {
    if (USE_API) {
      try {
        const stats = await checkInApi.getStats();
        set({ totalPoints: stats.totalPoints, streak: stats.streak });
      } catch (e) {
        console.error('Load stats error:', e);
      }
    }
  },
}));
