
import * as pdfjsLib from 'pdfjs-dist';
import { StudyFile, FileType } from '../types';

const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

const readPdfText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            if (event.target?.result) {
                try {
                    const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
                    const pdf = await pdfjsLib.getDocument(typedArray).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        fullText += textContent.items.map(item => 'str' in item ? item.str : '').join(' ') + '\n';
                    }
                    resolve(fullText);
                } catch (e) {
                    reject(e);
                }
            }
        };
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));
        reader.readAsArrayBuffer(file);
    });
};

export const processFiles = async (files: FileList): Promise<StudyFile[]> => {
    const supportedTypes: FileType[] = ['application/pdf', 'image/png', 'image/jpeg'];
    
    const filePromises = Array.from(files)
        .filter(file => supportedTypes.includes(file.type as FileType))
        .map(async (file): Promise<StudyFile> => {
            const fileType = file.type as FileType;
            let content: string;

            if (fileType === 'application/pdf') {
                content = await readPdfText(file);
            } else {
                content = await readFileAsBase64(file);
            }

            return {
                id: crypto.randomUUID(),
                name: file.name,
                type: fileType,
                content: content,
            };
        });
        
    return Promise.all(filePromises);
};
