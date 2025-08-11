import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: number
  name: string
  description: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-start justify-between w-full mb-8">
        {steps.map((step, stepIdx) => (
          <li
            key={step.id}
            className={cn(
              'relative flex-1 flex flex-col items-center',
              stepIdx !== steps.length - 1 ? 'after:content-[""] after:absolute after:top-3 after:left-[calc(50%+12px)] after:w-[calc(100%-24px)] after:h-0.5 after:bg-pearl-200 dark:after:bg-gray-600' : ''
            )}
          >
            {step.id < currentStep ? (
              <>
                {stepIdx !== 0 && (
                  <div className="absolute top-3 left-0 w-[calc(50%-12px)] h-0.5 bg-emerald-500" />
                )}
                <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors z-10">
                  <Check className="h-3 w-3 text-white" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </div>
              </>
            ) : step.id === currentStep ? (
              <>
                {stepIdx !== 0 && (
                  <div className="absolute top-3 left-0 w-[calc(50%-12px)] h-0.5 bg-emerald-500" />
                )}
                <div
                  className="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-emerald-500 bg-white z-10"
                  aria-current="step"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </div>
              </>
            ) : (
              <>
                <div className="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-colors z-10">
                  <span
                    className="h-2 w-2 rounded-full bg-transparent"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step.name}</span>
                </div>
              </>
            )}
            <div className="mt-4 text-center max-w-[120px]">
              <span className="text-xs font-medium text-gray-800 dark:text-golden-400 block">
                {step.name}
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}