import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'
import { logger } from '../utils/logger'

interface FileUploadProps {
  onFileUpload: (file: File) => void
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > MAX_FILE_SIZE) {
        logger.warn('File size exceeds limit:', file.size);
        alert('File is too large. Please upload a PDF smaller than 50 MB.');
        return;
      }
      onFileUpload(file)
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    maxSize: MAX_FILE_SIZE,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto text-indigo-400 mb-4" size={48} />
      {isDragActive ? (
        <p className="text-indigo-500">Drop the PDF here</p>
      ) : (
        <div>
          <p className="text-gray-500">Drag and drop a PDF here, or click to select a file</p>
          <p className="text-sm text-gray-400 mt-2">Maximum file size: 50 MB</p>
        </div>
      )}
    </div>
  )
}

export default FileUpload