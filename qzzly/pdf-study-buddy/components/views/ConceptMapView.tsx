
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateConceptMap } from '../../services/geminiService';
import { StudyFile } from '../../types';
import ViewContainer from './ViewContainer';

const ConceptMapView: React.FC<{ files: StudyFile[] }> = ({ files }) => {
  const [mapDefinition, setMapDefinition] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mermaidContainerRef = useRef<HTMLDivElement>(null);

  const fetchConceptMap = useCallback(async () => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateConceptMap(files);
      if (!result) {
        setError("Could not generate a concept map. The document might not have enough content to analyze for key concepts.");
      }
      setMapDefinition(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate concept map.');
    } finally {
      setIsLoading(false);
    }
  }, [files]);

  useEffect(() => {
    fetchConceptMap();
  }, [fetchConceptMap]);

  useEffect(() => {
    const renderMermaid = async () => {
        if (mapDefinition && mermaidContainerRef.current) {
            try {
                // @ts-ignore
                const { svg } = await window.mermaid.render('mermaid-graph', mapDefinition);
                mermaidContainerRef.current.innerHTML = svg;
            } catch (e) {
                console.error("Mermaid rendering error:", e);
                setError("There was an error rendering the concept map. The AI may have generated an invalid format.");
                if (mermaidContainerRef.current) {
                    mermaidContainerRef.current.innerHTML = '';
                }
            }
        }
    };

    if(!isLoading && mapDefinition) {
        renderMermaid();
    }
  }, [mapDefinition, isLoading]);

  return (
    <ViewContainer title="Concept Map" isLoading={isLoading} error={error} generationText="Mapping out key concepts...">
      {!isLoading && !error && mapDefinition && (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto">
            <div ref={mermaidContainerRef} className="mermaid-container">
                {/* Mermaid will render the SVG here */}
            </div>
        </div>
      )}
       {!isLoading && !error && !mapDefinition && (
         <div className="text-center">No map to display.</div>
      )}
    </ViewContainer>
  );
};

export default ConceptMapView;
