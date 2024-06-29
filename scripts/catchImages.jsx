import React, { useEffect } from 'react';
import axios from 'axios';

const MyComponent = () => {

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtém todas as unidades
        const { data: units } = await axios.get('../data/content/fullunits.json');

        // Obtém todas as traduções para inglês para obter os nomes definidos
        const { data: engrishname } = await axios.get('../data/languages/fulllanguages.json');
        const USEN = engrishname.USEN;

        console.log("\n       - Downloading character art...");

        // Aqui continua o resto da conversão do código para JSX funcional
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Downloading Data...</h1>
      <p>Check console for progress and errors.</p>
    </div>
  );
};

export default MyComponent;
