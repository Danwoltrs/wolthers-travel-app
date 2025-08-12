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
      <ol className="flex items-start justify-between w-full mb-4 md:mb-8">
        {steps.map((step, stepIdx) => (
          <li
            key={step.id}
            className={cn(
              'relative flex-1 flex flex-col items-center',
              // Desktop connecting lines
              stepIdx !== steps.length - 1 ? 'hidden md:after:content-[""] md:after:absolute md:after:top-3 md:after:left-[calc(50%+12px)] md:after:w-[calc(100%-24px)] md:after:h-0.5 md:after:bg-pearl-200 md:dark:after:bg-gray-600' : '',
              // Mobile connecting lines (thinner and closer)
              stepIdx !== steps.length - 1 ? 'md:hidden after:content-[""] after:absolute after:top-2 after:left-[calc(50%+8px)] after:w-[calc(100%-16px)] after:h-0.5 after:bg-pearl-200 dark:after:bg-gray-600' : ''
            )}
          >
            {step.id < currentStep ? (
              <>
                {stepIdx !== 0 && (
                  <>
                    {/* Desktop completed line */}
                    <div className="hidden md:block absolute top-3 left-0 w-[calc(50%-12px)] h-0.5 bg-emerald-500" />
                    {/* Mobile completed line */}
                    <div className="md:hidden absolute top-2 left-0 w-[calc(50%-8px)] h-0.5 bg-emerald-500" />
                  </>
                )}
                {/* Desktop completed dot */}
                <div className="hidden md:flex relative h-6 w-6 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors z-10">
                  <Check className="h-3 w-3 text-white" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </div>
                {/* Mobile completed dot */}
                <div className="md:hidden relative flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 transition-colors z-10">
                  <Check className="h-2 w-2 text-white" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </div>
              </>
            ) : step.id === currentStep ? (
              <>
                {stepIdx !== 0 && (
                  <>
                    {/* Desktop active line */}
                    <div className="hidden md:block absolute top-3 left-0 w-[calc(50%-12px)] h-0.5 bg-emerald-500" />
                    {/* Mobile active line */}
                    <div className="md:hidden absolute top-2 left-0 w-[calc(50%-8px)] h-0.5 bg-emerald-500" />
                  </>
                )}
                {/* Desktop active dot */}
                <div
                  className="hidden md:flex relative h-6 w-6 items-center justify-center rounded-full border-2 border-emerald-500 bg-white dark:bg-gray-800 z-10"
                  aria-current="step"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </div>
                {/* Mobile active dot */}
                <div
                  className="md:hidden relative flex h-4 w-4 items-center justify-center rounded-full border-2 border-emerald-500 bg-white dark:bg-gray-800 z-10"
                  aria-current="step"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </div>
              </>
            ) : (
              <>
                {/* Desktop future dot */}
                <div className="hidden md:flex relative h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-colors z-10">
                  <span
                    className="h-2 w-2 rounded-full bg-transparent"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step.name}</span>
                </div>
                {/* Mobile future dot */}
                <div className="md:hidden relative flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 transition-colors z-10">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-transparent"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step.name}</span>
                </div>
              </>
            )}
            {/* Text labels - only show on desktop */}
            <div className="hidden md:block mt-4 text-center max-w-[120px]">
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