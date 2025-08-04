"use client"

import * as React from "react"
import { AlertModal, ConfirmModal, InputModal, ModalType } from "@/components/ui/custom-modals"

// Modal State Types
interface AlertState {
  type: "alert"
  title?: string
  description?: string
  modalType?: ModalType
  confirmText?: string
  onConfirm?: () => void
}

interface ConfirmState {
  type: "confirm"
  title?: string
  description?: string
  modalType?: ModalType
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  onConfirm: () => void
  onCancel?: () => void
}

interface InputState {
  type: "input"
  title?: string
  description?: string
  modalType?: ModalType
  defaultValue?: string
  placeholder?: string
  inputType?: string
  confirmText?: string
  cancelText?: string
  onConfirm: (value: string) => void
  onCancel?: () => void
}

type ModalState = AlertState | ConfirmState | InputState | null

// Modal Context
interface ModalContextType {
  showAlert: (options: Omit<AlertState, "type">) => void
  showConfirm: (options: Omit<ConfirmState, "type">) => void
  showInput: (options: Omit<InputState, "type">) => void
  closeModal: () => void
}

const ModalContext = React.createContext<ModalContextType | undefined>(undefined)

// Modal Provider Component
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = React.useState<ModalState>(null)

  const showAlert = React.useCallback((options: Omit<AlertState, "type">) => {
    setModalState({ type: "alert", ...options })
  }, [])

  const showConfirm = React.useCallback((options: Omit<ConfirmState, "type">) => {
    setModalState({ type: "confirm", ...options })
  }, [])

  const showInput = React.useCallback((options: Omit<InputState, "type">) => {
    setModalState({ type: "input", ...options })
  }, [])

  const closeModal = React.useCallback(() => {
    setModalState(null)
  }, [])

  const contextValue = React.useMemo(
    () => ({
      showAlert,
      showConfirm,
      showInput,
      closeModal,
    }),
    [showAlert, showConfirm, showInput, closeModal]
  )

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      
      {/* Alert Modal */}
      {modalState?.type === "alert" && (
        <AlertModal
          open={true}
          onOpenChange={closeModal}
          title={modalState.title}
          description={modalState.description}
          type={modalState.modalType}
          confirmText={modalState.confirmText}
          onConfirm={modalState.onConfirm}
        />
      )}

      {/* Confirm Modal */}
      {modalState?.type === "confirm" && (
        <ConfirmModal
          open={true}
          onOpenChange={closeModal}
          title={modalState.title}
          description={modalState.description}
          type={modalState.modalType}
          confirmText={modalState.confirmText}
          cancelText={modalState.cancelText}
          variant={modalState.variant}
          onConfirm={modalState.onConfirm}
          onCancel={modalState.onCancel}
        />
      )}

      {/* Input Modal */}
      {modalState?.type === "input" && (
        <InputModal
          open={true}
          onOpenChange={closeModal}
          title={modalState.title}
          description={modalState.description}
          type={modalState.modalType}
          defaultValue={modalState.defaultValue}
          placeholder={modalState.placeholder}
          inputType={modalState.inputType}
          confirmText={modalState.confirmText}
          cancelText={modalState.cancelText}
          onConfirm={modalState.onConfirm}
          onCancel={modalState.onCancel}
        />
      )}
    </ModalContext.Provider>
  )
}

// Custom Hook
export function useModal() {
  const context = React.useContext(ModalContext)
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider")
  }
  return context
}

// Convenience functions that mimic browser dialog APIs
export function useDialogs() {
  const modal = useModal()

  const alert = React.useCallback(
    (message: string, title?: string, type?: ModalType) => {
      return new Promise<void>((resolve) => {
        modal.showAlert({
          title: title || "Alert",
          description: message,
          modalType: type || "info",
          onConfirm: () => resolve(),
        })
      })
    },
    [modal]
  )

  const confirm = React.useCallback(
    (message: string, title?: string, type?: ModalType) => {
      return new Promise<boolean>((resolve) => {
        modal.showConfirm({
          title: title || "Confirm",
          description: message,
          modalType: type || "warning",
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        })
      })
    },
    [modal]
  )

  const prompt = React.useCallback(
    (message: string, defaultValue?: string, title?: string) => {
      return new Promise<string | null>((resolve) => {
        modal.showInput({
          title: title || "Input Required",
          description: message,
          defaultValue: defaultValue || "",
          onConfirm: (value) => resolve(value),
          onCancel: () => resolve(null),
        })
      })
    },
    [modal]
  )

  return { alert, confirm, prompt }
}