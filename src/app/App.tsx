import { RouterProvider } from 'react-router';
import { useEffect, useState } from 'react';
import { router } from './routes';
import { Toaster } from 'sonner';
import Chatbot from './components/Chatbot';
import { AuthProvider } from './context/AuthContext';
import IntroAnimation from './components/IntroAnimation';

export default function App() {
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroDone(true), 2300);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      {!introDone && <IntroAnimation />}
      <RouterProvider router={router} />
      <Toaster position="top-right" />
      <Chatbot />
    </AuthProvider>
  );
}
