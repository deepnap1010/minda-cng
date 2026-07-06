import { create } from "zustand";

export const useCompanyUI = create((set) => ({
    selectedCompanyId: null,
    setSelectedCompanyId: (id) => set({ selectedCompanyId: id }),

    isModalOpen: false,
    openModal: () => set({ isModalOpen: true }),
    closeModal: () => set({ isModalOpen: false })
}));
