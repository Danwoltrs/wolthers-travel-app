'use client'

import React, { useState } from 'react'
import { FileText, ChevronDown, ChevronUp, Info } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  bestFor: string
  content: string
}

interface NoteTemplatesProps {
  onInsertTemplate: (templateContent: string) => void
}

const templates: Template[] = [
  {
    id: 'cornell',
    name: 'Cornell Notes',
    description: 'Systematic format with note-taking area, cue column, and summary section.',
    bestFor: 'Lectures, meetings with action items, structured learning sessions',
    content: `<div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
<h3 style="margin: 0 0 16px 0; color: #1f2937;">Cornell Notes Template</h3>
<div style="display: flex; margin-bottom: 16px;">
  <div style="flex: 2; padding-right: 16px; border-right: 1px solid #d1d5db;">
    <h4 style="margin: 0 0 8px 0; color: #374151;">Main Notes</h4>
    <div style="min-height: 120px; padding: 8px; background: #f9fafb; border-radius: 4px;">
      <p style="margin: 0; color: #6b7280;">Write your main notes here during the meeting...</p>
    </div>
  </div>
  <div style="flex: 1; padding-left: 16px;">
    <h4 style="margin: 0 0 8px 0; color: #374151;">Cues/Questions</h4>
    <div style="min-height: 120px; padding: 8px; background: #fef3c7; border-radius: 4px;">
      <p style="margin: 0; color: #92400e;">Key points, questions, action items...</p>
    </div>
  </div>
</div>
<div style="border-top: 1px solid #d1d5db; padding-top: 16px;">
  <h4 style="margin: 0 0 8px 0; color: #374151;">Summary</h4>
  <div style="padding: 8px; background: #ecfdf5; border-radius: 4px;">
    <p style="margin: 0; color: #065f46;">Write a brief summary of the main takeaways...</p>
  </div>
</div>
</div>`
  },
  {
    id: '5w1h',
    name: '5W1H Template',
    description: 'Structured approach covering Who, What, When, Where, Why, and How.',
    bestFor: 'Project planning, incident reports, comprehensive meeting documentation',
    content: `<div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
<h3 style="margin: 0 0 16px 0; color: #1f2937;">5W1H Analysis Template</h3>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
  <div style="padding: 12px; background: #fef2f2; border-radius: 6px; border-left: 4px solid #ef4444;">
    <h4 style="margin: 0 0 8px 0; color: #dc2626;">WHO</h4>
    <p style="margin: 0; color: #7f1d1d; font-size: 14px;">Who is involved? Who is responsible?</p>
  </div>
  <div style="padding: 12px; background: #fff7ed; border-radius: 6px; border-left: 4px solid #f97316;">
    <h4 style="margin: 0 0 8px 0; color: #ea580c;">WHAT</h4>
    <p style="margin: 0; color: #9a3412; font-size: 14px;">What happened? What needs to be done?</p>
  </div>
  <div style="padding: 12px; background: #fefce8; border-radius: 6px; border-left: 4px solid #eab308;">
    <h4 style="margin: 0 0 8px 0; color: #ca8a04;">WHEN</h4>
    <p style="margin: 0; color: #713f12; font-size: 14px;">When did it occur? When is the deadline?</p>
  </div>
  <div style="padding: 12px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #22c55e;">
    <h4 style="margin: 0 0 8px 0; color: #16a34a;">WHERE</h4>
    <p style="margin: 0; color: #14532d; font-size: 14px;">Where did it happen? Where will it take place?</p>
  </div>
  <div style="padding: 12px; background: #eff6ff; border-radius: 6px; border-left: 4px solid #3b82f6;">
    <h4 style="margin: 0 0 8px 0; color: #2563eb;">WHY</h4>
    <p style="margin: 0; color: #1e3a8a; font-size: 14px;">Why did it happen? Why is it important?</p>
  </div>
  <div style="padding: 12px; background: #f5f3ff; border-radius: 6px; border-left: 4px solid #8b5cf6;">
    <h4 style="margin: 0 0 8px 0; color: #7c3aed;">HOW</h4>
    <p style="margin: 0; color: #581c87; font-size: 14px;">How will it be done? How can we improve?</p>
  </div>
</div>
</div>`
  },
  {
    id: 'action-focused',
    name: 'Action-Focused Template',
    description: 'Emphasizes decisions made, actions to take, and accountability.',
    bestFor: 'Business meetings, project reviews, status updates',
    content: `<div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
<h3 style="margin: 0 0 16px 0; color: #1f2937;">Action-Focused Meeting Notes</h3>
<div style="margin-bottom: 16px;">
  <h4 style="margin: 0 0 8px 0; color: #dc2626; display: flex; align-items: center;">
    <span style="width: 12px; height: 12px; background: #dc2626; border-radius: 50%; margin-right: 8px;"></span>
    Decisions Made
  </h4>
  <ul style="margin: 0; padding-left: 20px; color: #374151;">
    <li style="margin-bottom: 4px;">Decision 1...</li>
    <li style="margin-bottom: 4px;">Decision 2...</li>
  </ul>
</div>
<div style="margin-bottom: 16px;">
  <h4 style="margin: 0 0 8px 0; color: #f97316; display: flex; align-items: center;">
    <span style="width: 12px; height: 12px; background: #f97316; border-radius: 50%; margin-right: 8px;"></span>
    Action Items
  </h4>
  <div style="background: #fff7ed; padding: 12px; border-radius: 6px;">
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 1px solid #fed7aa;">
          <th style="text-align: left; padding: 4px; color: #9a3412;">Task</th>
          <th style="text-align: left; padding: 4px; color: #9a3412;">Owner</th>
          <th style="text-align: left; padding: 4px; color: #9a3412;">Due Date</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 4px; color: #9a3412;">Task 1</td>
          <td style="padding: 4px; color: #9a3412;">Person A</td>
          <td style="padding: 4px; color: #9a3412;">Date</td>
        </tr>
        <tr>
          <td style="padding: 4px; color: #9a3412;">Task 2</td>
          <td style="padding: 4px; color: #9a3412;">Person B</td>
          <td style="padding: 4px; color: #9a3412;">Date</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
<div style="margin-bottom: 16px;">
  <h4 style="margin: 0 0 8px 0; color: #2563eb; display: flex; align-items: center;">
    <span style="width: 12px; height: 12px; background: #2563eb; border-radius: 50%; margin-right: 8px;"></span>
    Key Discussion Points
  </h4>
  <div style="padding: 8px; background: #eff6ff; border-radius: 4px;">
    <p style="margin: 0; color: #1e3a8a;">Main topics discussed...</p>
  </div>
</div>
<div>
  <h4 style="margin: 0 0 8px 0; color: #7c3aed; display: flex; align-items: center;">
    <span style="width: 12px; height: 12px; background: #7c3aed; border-radius: 50%; margin-right: 8px;"></span>
    Next Meeting
  </h4>
  <div style="padding: 8px; background: #f5f3ff; border-radius: 4px;">
    <p style="margin: 0; color: #581c87;"><strong>Date/Time:</strong> [Insert next meeting details]</p>
    <p style="margin: 4px 0 0 0; color: #581c87;"><strong>Agenda:</strong> [Key topics for next time]</p>
  </div>
</div>
</div>`
  },
  {
    id: 'soar',
    name: 'SOAR Method',
    description: 'Strengths, Opportunities, Aspirations, and Results framework.',
    bestFor: 'Strategic planning, team retrospectives, project evaluations',
    content: `<div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
<h3 style="margin: 0 0 16px 0; color: #1f2937;">SOAR Analysis Template</h3>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
  <div style="padding: 16px; background: #f0fdf4; border-radius: 8px; border: 2px solid #22c55e;">
    <h4 style="margin: 0 0 12px 0; color: #15803d; text-align: center;">STRENGTHS</h4>
    <p style="margin: 0 0 8px 0; color: #166534; font-size: 14px; font-style: italic;">What are we doing well?</p>
    <ul style="margin: 0; padding-left: 16px; color: #166534;">
      <li style="margin-bottom: 4px;">Strength 1...</li>
      <li style="margin-bottom: 4px;">Strength 2...</li>
    </ul>
  </div>
  <div style="padding: 16px; background: #eff6ff; border-radius: 8px; border: 2px solid #3b82f6;">
    <h4 style="margin: 0 0 12px 0; color: #1d4ed8; text-align: center;">OPPORTUNITIES</h4>
    <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-style: italic;">What opportunities exist?</p>
    <ul style="margin: 0; padding-left: 16px; color: #1e40af;">
      <li style="margin-bottom: 4px;">Opportunity 1...</li>
      <li style="margin-bottom: 4px;">Opportunity 2...</li>
    </ul>
  </div>
  <div style="padding: 16px; background: #fef3c7; border-radius: 8px; border: 2px solid #f59e0b;">
    <h4 style="margin: 0 0 12px 0; color: #d97706; text-align: center;">ASPIRATIONS</h4>
    <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-style: italic;">What do we want to achieve?</p>
    <ul style="margin: 0; padding-left: 16px; color: #92400e;">
      <li style="margin-bottom: 4px;">Goal 1...</li>
      <li style="margin-bottom: 4px;">Goal 2...</li>
    </ul>
  </div>
  <div style="padding: 16px; background: #fdf2f8; border-radius: 8px; border: 2px solid #ec4899;">
    <h4 style="margin: 0 0 12px 0; color: #be185d; text-align: center;">RESULTS</h4>
    <p style="margin: 0 0 8px 0; color: #9d174d; font-size: 14px; font-style: italic;">How will we measure success?</p>
    <ul style="margin: 0; padding-left: 16px; color: #9d174d;">
      <li style="margin-bottom: 4px;">Metric 1...</li>
      <li style="margin-bottom: 4px;">Metric 2...</li>
    </ul>
  </div>
</div>
</div>`
  },
  {
    id: 'charting',
    name: 'The Charting Method',
    description: 'Systematic table format for organizing information in columns.',
    bestFor: 'Comparative analysis, data collection, structured information gathering',
    content: `<div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
<h3 style="margin: 0 0 16px 0; color: #1f2937;">Charting Method Template</h3>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
  <thead>
    <tr style="background: #f3f4f6;">
      <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; color: #374151;">Topic/Item</th>
      <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; color: #374151;">Key Points</th>
      <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; color: #374151;">Action Required</th>
      <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; color: #374151;">Owner</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #d1d5db; padding: 12px; color: #4b5563;">Item 1</td>
      <td style="border: 1px solid #d1d5db; padding: 12px; color: #4b5563;">Key information...</td>
      <td style="border: 1px solid #d1d5db; padding: 12px; color: #4b5563;">Next steps...</td>
      <td style="border: 1px solid #d1d5db; padding: 12px; color: #4b5563;">Person A</td>
    </tr>
    <tr style="background: #f9fafb;">
      <td style="border: 1px solid #d1d5db; padding: 12px; color: #4b5563;">Item 2</td>
      <td style="border: 1px solid #d1d5db; padding: 12px; color: #4b5563;">Key information...</td>
      <td style="border: 1px solid #d1d5db; padding: 12px; color: #4b5563;">Next steps...</td>
      <td style="border: 1px solid #d1d5db; padding: 12px; color: #4b5563;">Person B</td>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db; padding: 12px; color: #4b5563;">Item 3</td>
      <td style="border: 1px solid #d1d5db; padding: 12px; color: #4b5563;">Key information...</td>
      <td style="border: 1px solid #d1d5db; padding: 12px; color: #4b5563;">Next steps...</td>
      <td style="border: 1px solid #d1d5db; padding: 12px; color: #4b5563;">Person C</td>
    </tr>
  </tbody>
</table>
<div style="background: #f0f9ff; padding: 12px; border-radius: 6px; border-left: 4px solid #0ea5e9;">
  <p style="margin: 0; color: #0c4a6e; font-size: 14px;"><strong>Note:</strong> Add more rows as needed. Customize column headers to fit your meeting type.</p>
</div>
</div>`
  },
  {
    id: 'meeting-minutes',
    name: 'Meeting Minutes Template',
    description: 'Formal meeting documentation with attendance, agenda, and resolutions.',
    bestFor: 'Official meetings, board meetings, formal documentation requirements',
    content: `<div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
<h3 style="margin: 0 0 16px 0; color: #1f2937; text-align: center;">Meeting Minutes</h3>
<div style="margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 6px;">
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
    <div><strong>Date:</strong> [Meeting Date]</div>
    <div><strong>Time:</strong> [Start Time - End Time]</div>
    <div><strong>Location:</strong> [Meeting Location/Platform]</div>
    <div><strong>Chair:</strong> [Meeting Chair]</div>
  </div>
</div>
<div style="margin-bottom: 16px;">
  <h4 style="margin: 0 0 8px 0; color: #374151;">Attendees</h4>
  <div style="padding: 8px; background: #f1f5f9; border-radius: 4px;">
    <p style="margin: 0; color: #475569;">Present: [List attendees]</p>
    <p style="margin: 4px 0 0 0; color: #475569;">Absent: [List absent members]</p>
  </div>
</div>
<div style="margin-bottom: 16px;">
  <h4 style="margin: 0 0 8px 0; color: #374151;">Agenda Items</h4>
  <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
    <li style="margin-bottom: 12px;">
      <strong>Agenda Item 1</strong>
      <div style="margin-top: 4px; padding: 8px; background: #fefce8; border-radius: 4px;">
        <p style="margin: 0; color: #713f12;"><strong>Discussion:</strong> [Summary of discussion]</p>
        <p style="margin: 4px 0 0 0; color: #713f12;"><strong>Resolution:</strong> [Decision made]</p>
      </div>
    </li>
    <li style="margin-bottom: 12px;">
      <strong>Agenda Item 2</strong>
      <div style="margin-top: 4px; padding: 8px; background: #fefce8; border-radius: 4px;">
        <p style="margin: 0; color: #713f12;"><strong>Discussion:</strong> [Summary of discussion]</p>
        <p style="margin: 4px 0 0 0; color: #713f12;"><strong>Resolution:</strong> [Decision made]</p>
      </div>
    </li>
  </ol>
</div>
<div style="margin-bottom: 16px;">
  <h4 style="margin: 0 0 8px 0; color: #374151;">Action Items</h4>
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background: #f1f5f9;">
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; color: #475569;">Action</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; color: #475569;">Responsible</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; color: #475569;">Due Date</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 8px; color: #64748b;">Action item 1</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; color: #64748b;">Person A</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; color: #64748b;">[Date]</td>
      </tr>
    </tbody>
  </table>
</div>
<div>
  <h4 style="margin: 0 0 8px 0; color: #374151;">Next Meeting</h4>
  <div style="padding: 8px; background: #ecfdf5; border-radius: 4px;">
    <p style="margin: 0; color: #065f46;"><strong>Date/Time:</strong> [Next meeting date and time]</p>
    <p style="margin: 4px 0 0 0; color: #065f46;"><strong>Preliminary Agenda:</strong> [Topics for next meeting]</p>
  </div>
</div>
</div>`
  }
]

export default function NoteTemplates({ onInsertTemplate }: NoteTemplatesProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  return (
    <div className="border-r border-gray-300 dark:border-gray-600 pr-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="Note Templates"
      >
        <FileText className="w-4 h-4" />
        <span className="text-sm">Templates</span>
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {isExpanded && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
          <div className="p-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Note-Taking Templates</h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="relative group"
                  onMouseEnter={() => setShowTooltip(template.id)}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <button
                    onClick={() => {
                      onInsertTemplate(template.content)
                      setIsExpanded(false)
                    }}
                    className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {template.description}
                        </div>
                      </div>
                      <Info className="w-3 h-3 text-gray-400 ml-2" />
                    </div>
                  </button>

                  {/* Tooltip */}
                  {showTooltip === template.id && (
                    <div className="absolute left-full ml-2 top-0 w-64 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-lg z-30">
                      <div className="font-medium mb-1">Best for:</div>
                      <div>{template.bestFor}</div>
                      <div className="absolute left-0 top-3 transform -translate-x-1 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}