import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Operator {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface OperatorsState {
  operators: Operator[];
  currentOperatorId: string | null;
  addOperator: (operator: Operator) => void;
  updateOperator: (id: string, updates: Partial<Operator>) => void;
  deleteOperator: (id: string) => void;
  setCurrentOperator: (id: string | null) => void;
  getCurrentOperator: () => Operator | null;
}

export const useOperatorsStore = create<OperatorsState>()(
  persist(
    (set, get) => ({
      operators: [],
      currentOperatorId: null,
      
      addOperator: (operator) => set((state) => ({
        operators: [...state.operators, operator]
      })),
      
      updateOperator: (id, updates) => set((state) => ({
        operators: state.operators.map(op => 
          op.id === id ? { ...op, ...updates } : op
        )
      })),
      
      deleteOperator: (id) => set((state) => ({
        operators: state.operators.filter(op => op.id !== id),
        currentOperatorId: state.currentOperatorId === id ? null : state.currentOperatorId
      })),
      
      setCurrentOperator: (id) => set({ currentOperatorId: id }),
      
      getCurrentOperator: () => {
        const state = get();
        if (!state.currentOperatorId) return null;
        return state.operators.find(op => op.id === state.currentOperatorId) || null;
      }
    }),
    {
      name: 'operators-storage'
    }
  )
);
