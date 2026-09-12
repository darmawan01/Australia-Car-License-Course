import { VehicleState, LicenseStage, LevelProgress, TestFault, TestMode } from '../types';

export interface SavedGameState {
  id: string;
  saveName: string;
  savedAt: string;
  formattedDate: string;
  currentLevelId: number;
  currentMode: TestMode;
  activeCheckpointIndex: number;
  completedCheckpointIds: number[];
  vehicleState: VehicleState;
  minorFaults: TestFault[];
  criticalFailItem: string | null;
  timeElapsed: number;
  licenseStage: LicenseStage;
  levelProgress: Record<number, LevelProgress>;
  scoreSnapshot: number;
}

const STORAGE_KEY = 'australian_drive_test_saves_v1';
const AUTO_SAVE_ID = 'autosave_latest';

export class SaveGameService {
  /**
   * Retrieve all saved games from storage
   */
  public static getSavedGames(): SavedGameState[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return [];
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to load saved games:', e);
      return [];
    }
  }

  /**
   * Save game session to storage
   */
  public static saveGame(
    data: Omit<SavedGameState, 'id' | 'savedAt' | 'formattedDate'>,
    customId?: string
  ): SavedGameState {
    const saves = this.getSavedGames();
    const id = customId || `save_${Date.now()}`;
    const now = new Date();

    const newSave: SavedGameState = {
      ...data,
      id,
      savedAt: now.toISOString(),
      formattedDate: `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    };

    // Replace if id exists, or prepend
    const existingIdx = saves.findIndex(s => s.id === id);
    if (existingIdx >= 0) {
      saves[existingIdx] = newSave;
    } else {
      saves.unshift(newSave);
    }

    // Keep max 10 saved sessions
    const trimmed = saves.slice(0, 10);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to persist game state:', e);
    }

    return newSave;
  }

  /**
   * Quick autosave slot
   */
  public static autoSave(data: Omit<SavedGameState, 'id' | 'savedAt' | 'formattedDate'>): SavedGameState {
    return this.saveGame(data, AUTO_SAVE_ID);
  }

  /**
   * Load specific save
   */
  public static loadGame(id?: string): SavedGameState | null {
    const saves = this.getSavedGames();
    if (saves.length === 0) return null;
    if (!id) return saves[0]; // Most recent
    return saves.find(s => s.id === id) || null;
  }

  /**
   * Delete a save slot
   */
  public static deleteSave(id: string): void {
    const saves = this.getSavedGames().filter(s => s.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    } catch (e) {
      console.error('Failed to remove save slot:', e);
    }
  }

  /**
   * Export save state as downloadable JSON file
   */
  public static exportToJSON(save: SavedGameState): void {
    try {
      const jsonStr = JSON.stringify(save, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `australia-driver-save-${save.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
    }
  }

  /**
   * Import save state from JSON string
   */
  public static importFromJSON(jsonString: string): SavedGameState | null {
    try {
      const parsed = JSON.parse(jsonString) as SavedGameState;
      if (!parsed || !parsed.vehicleState || typeof parsed.currentLevelId !== 'number') {
        throw new Error('Invalid save file format');
      }
      parsed.id = `imported_${Date.now()}`;
      const saves = this.getSavedGames();
      saves.unshift(parsed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves.slice(0, 10)));
      return parsed;
    } catch (e) {
      console.error('Failed to import save:', e);
      return null;
    }
  }
}
