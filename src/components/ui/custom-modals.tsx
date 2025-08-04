"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { Button } from "./button"
import { Input } from "./input"
import { cn } from "@/lib/utils"

// Modal Types
export type ModalType = "success" | "error" | "warning" | "info"

// Base Modal Props
interface BaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  type?: ModalType
}

// Alert Modal Props
interface AlertModalProps extends BaseModalProps {
  onConfirm?: () => void
  confirmText?: string
}

// Confirm Modal Props
interface ConfirmModalProps extends BaseModalProps {
  onConfirm: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

// Input Modal Props
interface InputModalProps extends BaseModalProps {
  onConfirm: (value: string) => void
  onCancel?: () => void
  defaultValue?: string
  placeholder?: string
  inputType?: string
  confirmText?: string
  cancelText?: string
}

// Icon mapping for different modal types
const getModalIcon = (type: ModalType) => {
  const iconClasses = "h-6 w-6 mb-4"
  
  switch (type) {
    case "success":
      return <CheckCircle className={cn(iconClasses, "text-emerald-600")} />
    case "error":
      return <XCircle className={cn(iconClasses, "text-red-600")} />
    case "warning":
      return <AlertTriangle className={cn(iconClasses, "text-amber-600")} />
    case "info":
    default:
      return <Info className={cn(iconClasses, "text-blue-600")} />
  }
}

// Get button variant based on modal type
const getButtonVariant = (type: ModalType, variant?: "default" | "destructive") => {
  if (variant === "destructive") return "destructive"
  
  switch (type) {
    case "error":
      return "destructive"
    case "success":
    case "info":
    case "warning":
    default:
      return "default"
  }
}

/**
 * AlertModal - For simple notifications and messages
 * Replaces browser alert() with custom styled modal
 */
export function AlertModal({
  open,
  onOpenChange,
  title = "Alert",
  description,
  type = "info",
  onConfirm,
  confirmText = "OK"
}: AlertModalProps) {
  const handleConfirm = () => {
    onConfirm?.()
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md glassmorphic-modal"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="text-center">
          <div className="flex justify-center">
            {getModalIcon(type)}
          </div>
          <DialogTitle className="text-lg font-semibold text-pearl-800">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-pearl-600 mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleConfirm}
            variant={getButtonVariant(type)}
            className="min-w-[100px]"
            autoFocus
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * ConfirmModal - For yes/no confirmations
 * Replaces browser confirm() with custom styled modal
 */
export function ConfirmModal({
  open,
  onOpenChange,
  title = "Confirm Action",
  description,
  type = "warning",
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md glassmorphic-modal"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="text-center">
          <div className="flex justify-center">
            {getModalIcon(type)}
          </div>
          <DialogTitle className="text-lg font-semibold text-pearl-800">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-pearl-600 mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="flex gap-3 sm:justify-center">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="min-w-[100px]"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant={getButtonVariant(type, variant)}
            className="min-w-[100px]"
            autoFocus
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * InputModal - For user input collection
 * Replaces browser prompt() with custom styled modal
 */
export function InputModal({
  open,
  onOpenChange,
  title = "Input Required",
  description,
  type = "info",
  onConfirm,
  onCancel,
  defaultValue = "",
  placeholder,
  inputType = "text",
  confirmText = "Confirm",
  cancelText = "Cancel"
}: InputModalProps) {
  const [value, setValue] = React.useState(defaultValue)

  React.useEffect(() => {
    if (open) {
      setValue(defaultValue)
    }
  }, [open, defaultValue])

  const handleConfirm = () => {
    onConfirm(value)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md glassmorphic-modal"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="text-center">
          <div className="flex justify-center">
            {getModalIcon(type)}
          </div>
          <DialogTitle className="text-lg font-semibold text-pearl-800">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-pearl-600 mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4">
          <Input
            type={inputType}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full"
            autoFocus
          />
        </div>
        <DialogFooter className="flex gap-3 sm:justify-center">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="min-w-[100px]"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant={getButtonVariant(type)}
            className="min-w-[100px]"
            disabled={!value.trim()}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}