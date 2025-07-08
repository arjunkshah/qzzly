import React, { useState, useEffect } from 'react';
import { StudyFile, QuizQuestion } from '../../types/session';
import ViewContainer from '../ui/ViewContainer';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

const QuizView: React.FC<{ files: StudyFile[] }> = ({ files }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQuiz = async () => {
      if (files.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        // For now, create sample quiz questions
        const sampleQuestions: QuizQuestion[] = [
          {
          question: 'What is the main purpose of this document?',
          options: ['Study material', 'Entertainment', 'Technical manual', 'News article'],
          answer: 'Study material'
        },
        {
          question: 'How many files were uploaded for analysis?',
          options: ['1 file', '2 files', '3 files', `${files.length} files`],
          answer: `${files.length} files`
        },
        {
          question: 'What type of content analysis is being performed?',
          options: ['Text analysis', 'Image processing', 'Audio analysis', 'Video processing'],
          answer: 'Text analysis'
        }
        ];
        setQuestions(sampleQuestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate quiz');
      } finally {
        setIsLoading(false);
      }
    };

    generateQuiz();
  }, [files]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answer
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishQuiz = () => {
    setShowResults(true);
  };

  const getScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.answer) {
        correct++;
      }
    });
    return { correct, total: questions.length };
  };

  const isCorrect = (questionIndex: number) => {
    return selectedAnswers[questionIndex] === questions[questionIndex].answer;
  };

  if (isLoading) {
    return (
      <ViewContainer title="Quiz" isLoading={isLoading} error={error}>
        <div></div>
      </ViewContainer>
    );
  }

  if (error) {
    return (
      <ViewContainer title="Quiz" isLoading={isLoading} error={error}>
        <div></div>
      </ViewContainer>
    );
  }

  if (questions.length === 0) {
    return (
      <ViewContainer title="Quiz" isLoading={false} error={null}>
        <div className="text-center text-gray-500">No quiz questions available</div>
      </ViewContainer>
    );
  }

  if (showResults) {
    const score = getScore();
    return (
      <ViewContainer title="Quiz Results" isLoading={false} error={null}>
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
            <p className="text-lg">
              You got {score.correct} out of {score.total} questions correct.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {score.correct === score.total ? 'Perfect score!' : 'Keep studying!'}
            </p>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="font-semibold">Question {index + 1}: {question.question}</p>
                    <div className="space-y-1">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded-full border ${
                            option === question.answer ? 'bg-green-500 border-green-500' :
                            option === selectedAnswers[index] ? 'bg-red-500 border-red-500' :
                            'bg-gray-200 border-gray-300'
                          }`}></div>
                          <span className={option === question.answer ? 'text-green-600 font-semibold' : ''}>
                            {option}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={() => {
            setShowResults(false);
            setCurrentQuestionIndex(0);
            setSelectedAnswers({});
          }}>
            Retake Quiz
          </Button>
        </div>
      </ViewContainer>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <ViewContainer title="Quiz" isLoading={isLoading} error={error}>
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{currentQuestion.question}</h3>
              
              <RadioGroup
                value={selectedAnswers[currentQuestionIndex] || ''}
                onValueChange={handleAnswerSelect}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button onClick={prevQuestion} disabled={currentQuestionIndex === 0}>
            Previous
          </Button>
          
          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={finishQuiz} disabled={!selectedAnswers[currentQuestionIndex]}>
              Finish Quiz
            </Button>
          ) : (
            <Button onClick={nextQuestion} disabled={!selectedAnswers[currentQuestionIndex]}>
              Next
            </Button>
          )}
        </div>
      </div>
    </ViewContainer>
  );
};

export default QuizView; 