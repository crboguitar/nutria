
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error: any) {
  console.error("Critical Render Error:", error);
  rootElement.innerHTML = `
    <div style="height: 100vh; display: flex; flex-direction: column; items-center; justify-content: center; font-family: sans-serif; text-align: center; padding: 20px;">
      <h1 style="color: #ef4444;">Erro de Inicialização</h1>
      <p style="color: #64748b;">O NutrIA encontrou um problema crítico ao carregar.</p>
      <pre style="background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 12px; max-width: 100%; overflow: auto; text-align: left;">${error.message || error}</pre>
      <button onclick="localStorage.clear(); location.reload();" style="margin-top: 20px; padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">LIMPAR CACHE E TENTAR NOVAMENTE</button>
    </div>
  `;
}
