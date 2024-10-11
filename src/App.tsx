import React, { useState } from 'react'
import { Upload, BookOpen, FileText, AlertCircle } from 'lucide-react'
import FileUpload from './components/FileUpload'
import NoteDisplay from './components/NoteDisplay'
import { getProcessedContent, ProcessedContent } from './utils/pdfProcessor'

function App() {
  const [processedContent, setProcessedContent] = useState<ProcessedContent | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    setProgress(0)
    setError(null)
    try {
      const content = await getProcessedContent(file, (progress) => {
        setProgress(Math.min(progress, 100))
      })
      setProcessedContent(content)
    } catch (error: any) {
      console.error('Error processing PDF:', error)
      if (error.error?.type === 'tokens' && error.error?.code === 'rate_limit_exceeded') {
        setError('We\'re experiencing high demand. Please try again in a few minutes.')
      } else {
        setError('An error occurred while processing the PDF. Please try again.')
      }
    } finally {
      setIsLoading(false)
      setProgress(100)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex flex-col items-center justify-center p-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-indigo-800 mb-2">Interactive Notes Generator</h1>
        <p className="text-indigo-600">Upload your academic PDF and get engaging, interactive notes</p>
      </header>
      <main className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6">
        <FileUpload onFileUpload={handleFileUpload} />
        {isLoading ? (
          <div className="mt-8">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="animate-spin text-indigo-500 mr-2" />
              <p className="text-indigo-600">Generating interactive notes...</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center mt-2 text-sm text-gray-600">{progress}% complete</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center mt-8 text-red-500">
            <AlertCircle className="mr-2" />
            <p>{error}</p>
          </div>
        ) : processedContent ? (
          <NoteDisplay processedContent={processedContent} />
        ) : (
          <div className="flex flex-col items-center justify-center mt-8 text-gray-500">
            <FileText size={48} className="text-indigo-400" />
            <p className="mt-2">Upload a PDF to generate interactive notes</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App