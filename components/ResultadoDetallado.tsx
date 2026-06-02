import React from 'react';

interface ResultadoDetalladoProps {
  resultado: string;
  gasEstimate: string;
  language: 'es' | 'en' | 'fr' | 'de';
}

const ResultadoDetallado: React.FC<ResultadoDetalladoProps> = ({ resultado, gasEstimate, language }) => {
  const translations = {
    es: {
      detailedResult: "Resultado Detallado",
      gasEstimate: "Estimación de gas:"
    },
    en: {
      detailedResult: "Detailed Result",
      gasEstimate: "Gas Estimate:"
    },
    fr: {
      detailedResult: "Résultat Détaillé",
      gasEstimate: "Estimation du gaz :"
    },
    de: {
      detailedResult: "Detailliertes Ergebnis",
      gasEstimate: "Gasschätzung:"
    }
  };

  const t = translations[language];

  if (!resultado) return null;

  // Formatea valores que vienen crudos de la blockchain (solo enteros sin decimales)
  const formatearValoresBlockchain = (key: string, value: string): string => {
    let textoFormateado = value;

    // 1. Temperatura: solo si es un entero >= 2 dígitos pegado a °C (ej: 134°C -> 13.4°C)
    //    Si ya tiene punto decimal (ej: 13.4°C) no lo toca
    textoFormateado = textoFormateado.replace(/(-?\d{2,})(?=°C)/g, (match) => {
      if (match.includes('.')) return match;
      return (Number(match) / 10).toFixed(1);
    });

    // 3. Precipitación: solo si es un entero >= 2 dígitos pegado a mm
    textoFormateado = textoFormateado.replace(/(\d{2,})(?=mm)/g, (match) => {
      if (match.includes('.')) return match;
      return (Number(match) / 10).toFixed(1);
    });

    return textoFormateado;
  };

  const lines = resultado.split('\n').filter(line => line.trim() !== '');
  const parsedResult: { [key: string]: string } = {};

  lines.forEach(line => {
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();
    
    // Aplicamos el formateo de decimales antes de guardar el resultado en la lista
    parsedResult[key.trim()] = formatearValoresBlockchain(key.trim(), value);
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-4">
      <h2 className="text-xl font-bold mb-4">{t.detailedResult}</h2>
      <ul className="space-y-2">
        {Object.entries(parsedResult).map(([key, value], index) => (
          <li key={index} className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-2">
            <span className="font-semibold text-gray-700">{key}:</span>
            <span className="text-gray-600 sm:text-right">{value}</span>
          </li>
        ))}
      </ul>
      {gasEstimate && (
        <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-200">
          <span className="font-semibold text-gray-700">{t.gasEstimate}</span>
          <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            {gasEstimate}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultadoDetallado;