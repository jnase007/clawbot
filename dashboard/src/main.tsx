import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { ClientProvider } from './components/ClientProvider';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="clawbot-theme">
      <ClientProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
