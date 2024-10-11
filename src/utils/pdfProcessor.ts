import * as pdfjs from 'pdfjs-dist';
import OpenAI from 'openai';

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Interfaces
interface ContentChunk {
  text: string;
  metadata: {
    page: number;
  };
}

export interface ProcessedContent {
  baseSummaries: string[];
  sectionSummaries: string[];
  chapterSummaries: string[];
  executiveSummary: string;
  knowledgeBase: {
    concepts: Record<string, string>;
    themes: string[];
    references: string[];
  };
}

// OpenAI configuration
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function processPDF(file: File, onProgress: (progress: number) => void): Promise<ProcessedContent> {
  const chunks = await extractTextFromPDF(file, onProgress);
  const processedContent = await processHierarchically(chunks, onProgress);
  return processedContent;
}

async function extractTextFromPDF(file: File, onProgress: (progress: number) => void): Promise<ContentChunk[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument(arrayBuffer).promise;
  const chunks: ContentChunk[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(' ');
    chunks.push({ text, metadata: { page: i } });
    onProgress((i / pdf.numPages) * 20); // Text extraction is 20% of the total progress
  }

  return chunks;
}

async function processHierarchically(chunks: ContentChunk[], onProgress: (progress: number) => void): Promise<ProcessedContent> {
  const totalSteps = chunks.length + 3; // base summaries + section + chapter + executive
  let currentStep = 0;

  const updateProgress = () => {
    currentStep++;
    onProgress(20 + (currentStep / totalSteps) * 80); // Processing is 80% of the total progress
  };

  const baseSummaries = await processBaseSummaries(chunks, updateProgress);
  const sectionSummaries = await processSectionSummaries(baseSummaries, updateProgress);
  const chapterSummaries = await processChapterSummaries(sectionSummaries, updateProgress);
  const executiveSummary = await createExecutiveSummary(chapterSummaries);
  updateProgress();

  return {
    baseSummaries,
    sectionSummaries,
    chapterSummaries,
    executiveSummary,
    knowledgeBase: {
      concepts: {},
      themes: [],
      references: []
    }
  };
}

async function processBaseSummaries(chunks: ContentChunk[], updateProgress: () => void): Promise<string[]> {
  const summaries: string[] = [];
  for (const chunk of chunks) {
    const summary = await processWithAI(chunk.text, 'base_summary', chunk.metadata);
    summaries.push(summary);
    updateProgress();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
  return summaries;
}

async function processSectionSummaries(baseSummaries: string[], updateProgress: () => void): Promise<string[]> {
  const sectionSummaries: string[] = [];
  for (let i = 0; i < baseSummaries.length; i += 3) {
    const sectionChunks = baseSummaries.slice(i, i + 3);
    const summary = await processWithAI(sectionChunks.join('\n\n'), 'section_summary');
    sectionSummaries.push(summary);
    updateProgress();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
  return sectionSummaries;
}

async function processChapterSummaries(sectionSummaries: string[], updateProgress: () => void): Promise<string[]> {
  const chapterSummaries: string[] = [];
  for (let i = 0; i < sectionSummaries.length; i += 3) {
    const chapterChunks = sectionSummaries.slice(i, i + 3);
    const summary = await processWithAI(chapterChunks.join('\n\n'), 'chapter_summary');
    chapterSummaries.push(summary);
    updateProgress();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
  return chapterSummaries;
}

async function createExecutiveSummary(chapterSummaries: string[]): Promise<string> {
  const executiveSummary = await processWithAI(chapterSummaries.join('\n\n'), 'executive_summary');
  return executiveSummary;
}

async function processWithAI(text: string, type: string, metadata?: any): Promise<string> {
  const prompt = generatePrompt(text, type, metadata);
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 500
  });

  return response.choices[0].message.content || '';
}

function generatePrompt(text: string, type: string, metadata?: any): string {
  switch (type) {
    case 'base_summary':
      return `Summarize the following text from page ${metadata.page}:\n\n${text}`;
    case 'section_summary':
      return `Create a concise summary of the following section:\n\n${text}`;
    case 'chapter_summary':
      return `Provide a comprehensive summary of this chapter:\n\n${text}`;
    case 'executive_summary':
      return `Create an executive summary of the entire document based on these chapter summaries:\n\n${text}`;
    default:
      return `Summarize the following text:\n\n${text}`;
  }
}

export async function getProcessedContent(file: File, onProgress: (progress: number) => void): Promise<ProcessedContent> {
  return processPDF(file, onProgress);
}