import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ProcessedContent } from '../utils/pdfProcessor'

interface NoteDisplayProps {
  processedContent: ProcessedContent
}

const NoteDisplay: React.FC<NoteDisplayProps> = ({ processedContent }) => {
  const [activeTab, setActiveTab] = useState<'executive' | 'chapter' | 'section' | 'base'>('executive')
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({})

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const renderContent = (content: string, title: string) => (
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-indigo-700 mb-2 cursor-pointer flex items-center" onClick={() => toggleSection(title)}>
        {expandedSections[title] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        {title}
      </h3>
      {expandedSections[title] && (
        <div className="pl-4 border-l-2 border-indigo-200">
          <div className="prose prose-indigo max-w-none" dangerouslySetInnerHTML={{ __html: formatText(content) }} />
        </div>
      )}
    </div>
  )

  return (
    <div className="mt-8">
      <div className="mb-4 flex space-x-2">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'executive' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}
          onClick={() => setActiveTab('executive')}
        >
          Executive Summary
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'chapter' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}
          onClick={() => setActiveTab('chapter')}
        >
          Chapter Summaries
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'section' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}
          onClick={() => setActiveTab('section')}
        >
          Section Summaries
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'base' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}
          onClick={() => setActiveTab('base')}
        >
          Detailed Notes
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        {activeTab === 'executive' && renderContent(processedContent.executiveSummary, 'Executive Summary')}
        {activeTab === 'chapter' && processedContent.chapterSummaries.map((summary, index) => 
          renderContent(summary, `Chapter ${index + 1} Summary`)
        )}
        {activeTab === 'section' && processedContent.sectionSummaries.map((summary, index) => 
          renderContent(summary, `Section ${index + 1} Summary`)
        )}
        {activeTab === 'base' && processedContent.baseSummaries.map((summary, index) => 
          renderContent(summary, `Detailed Notes ${index + 1}`)
        )}
      </div>
    </div>
  )
}

function formatText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/(Discussion Question:.*)/g, '<p class="text-indigo-600 font-semibold">$1</p>')
}

export default NoteDisplay