
import React from 'react';
import * as ReactRouterDom from 'react-router-dom';
import { IconBookOpen, IconCopy, IconHelpCircle, IconFileText, IconList, IconMessageSquare } from '../constants';

const FeatureCard = ({ icon, title, description }: { icon: React.FC<any>, title: string, description: string }) => {
    const Icon = icon;
    return (
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-lg hover:shadow-primary-500/20 hover:-translate-y-1 transition-all duration-300">
            <Icon className="w-10 h-10 text-primary-500 mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </div>
    );
}

const LandingPage: React.FC = () => {
    const navigate = ReactRouterDom.useNavigate();

    return (
        <div className="bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
            <header className="absolute top-0 left-0 right-0 p-4 z-10">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Study Buddy</h1>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="bg-primary-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Get Started
                    </button>
                </div>
            </header>

            <main>
                <section className="min-h-screen flex items-center justify-center text-center bg-white dark:bg-gray-900 pt-20 pb-10 px-4">
                    <div className="max-w-4xl">
                        <h2 className="text-5xl md:text-7xl font-extrabold text-primary-600 dark:text-primary-400">
                            Supercharge Your Studies with AI
                        </h2>
                        <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Upload your course materials—PDFs, lecture notes, even diagrams—and let our AI generate summaries, flashcards, quizzes, and more to help you learn faster and smarter.
                        </p>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="mt-10 bg-primary-600 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-primary-700 transition-transform hover:scale-105 duration-300"
                        >
                            Start a Study Session
                        </button>
                    </div>
                </section>
                
                <section className="py-20 px-4">
                    <div className="container mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold">Everything You Need to Succeed</h2>
                            <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">From quick overviews to in-depth practice.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard icon={IconBookOpen} title="AI Summaries" description="Get the key points from dense documents in seconds." />
                            <FeatureCard icon={IconFileText} title="Structured Notes" description="Generate well-organized notes with headings and key terms." />
                            <FeatureCard icon={IconList} title="Document Outlines" description="Understand the structure of your materials at a glance." />
                            <FeatureCard icon={IconCopy} title="Interactive Flashcards" description="Create flashcards automatically to test your knowledge." />
                            <FeatureCard icon={IconHelpCircle} title="Practice Quizzes" description="Challenge yourself with AI-generated multiple-choice questions." />
                            <FeatureCard icon={IconMessageSquare} title="Chat with Documents" description="Ask specific questions and get answers based on your uploaded content." />
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-8 bg-gray-200 dark:bg-gray-900 text-center">
                <p className="text-gray-600 dark:text-gray-400">&copy; {new Date().getFullYear()} Study Buddy. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
