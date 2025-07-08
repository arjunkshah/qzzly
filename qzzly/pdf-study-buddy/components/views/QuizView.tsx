
import React, { useState, useEffect, useCallback } from 'react';
import { generateQuiz } from '../../services/geminiService';
import { QuizQuestion, StudyFile } from '../../types';
import ViewContainer from './ViewContainer';

const QuizView: React.FC<{ files: StudyFile[] }> = ({ files }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const fetchQuiz = useCallback(async () => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateQuiz(files);
       if (result.length === 0) {
        setError("Could not generate a quiz from the document. The content might not be suitable for quiz generation.");
      }
      setQuestions(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate quiz.');
    } finally {
      setIsLoading(false);
    }
  }, [files]);

  useEffect(() => {
    fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const handleAnswerSelect = (option: string) => {
    if (showFeedback) return;
    setSelectedAnswer(option);
  };
  
  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    if (selectedAnswer === questions[currentQuestionIndex].answer) {
      setScore(s => s + 1);
    }
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
      } else {
        setIsFinished(true);
      }
    }, 2000);
  };

  const handleRestart = () => {
      setCurrentQuestionIndex(0);
      setScore(0);
      setIsFinished(false);
      setSelectedAnswer(null);
      setShowFeedback(false);
      // Optional: re-fetch quiz for new questions
      // fetchQuiz(); 
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <ViewContainer title="Quiz" isLoading={isLoading} error={error}>
      {questions.length > 0 && !isFinished && (
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Question {currentQuestionIndex + 1} of {questions.length}</p>
          <h3 className="text-xl font-semibold mb-6">{currentQuestion.question}</h3>
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => {
              const isCorrect = option === currentQuestion.answer;
              const isSelected = option === selectedAnswer;
              
              let buttonClass = 'w-full text-left p-4 rounded-lg border-2 transition-colors duration-200 ';
              if(showFeedback) {
                  if(isCorrect) {
                      buttonClass += 'bg-green-100 dark:bg-green-900/50 border-green-500 text-green-800 dark:text-green-200';
                  } else if (isSelected && !isCorrect) {
                       buttonClass += 'bg-red-100 dark:bg-red-900/50 border-red-500 text-red-800 dark:text-red-200';
                  } else {
                      buttonClass += 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
                  }
              } else {
                  if (isSelected) {
                      buttonClass += 'bg-primary-100 dark:bg-primary-900 border-primary-500';
                  } else {
                      buttonClass += 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600';
                  }
              }

              return (
              <button key={index} onClick={() => handleAnswerSelect(option)} disabled={showFeedback} className={buttonClass}>
                <span className="font-medium">{option}</span>
              </button>
            )})}
          </div>
          <button onClick={handleSubmit} disabled={selectedAnswer === null || showFeedback} className="mt-8 w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
            {showFeedback ? 'Next Question...' : 'Submit Answer'}
          </button>
        </div>
      )}
      {isFinished && (
        <div className="text-center max-w-md mx-auto">
            <h3 className="text-3xl font-bold mb-4">Quiz Complete!</h3>
            <p className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-6">{Math.round((score / questions.length) * 100)}%</p>
            <p className="text-xl text-gray-600 dark:text-gray-300">You answered {score} out of {questions.length} questions correctly.</p>
            <button onClick={handleRestart} className="mt-8 bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors duration-300">
                Try Again
            </button>
        </div>
      )}
    </ViewContainer>
  );
};

export default QuizView;
