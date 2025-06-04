import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FetchComponent = () => {
  interface Data {
    message: string;
  }

  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state

  useEffect(() => {
    // Fetch data from the Flask backend
    axios.get('http://127.0.0.1:5000/api/data')
      .then(response => {
        setData(response.data);
        
      })
      .catch(error => {
        console.error('Error fetching data:', error);
       
      });
  }, []);

  return (
    <div>
      <h1>Frontend</h1>
      {loading && <p>Loading...</p>} {/* Show loading message */}
      {error && <p style={{ color: 'red' }}>{error}</p>} {/* Show error message */}
      {data && <p>{data.message}</p>} {/* Show data if available */}
    </div>
  );
};

export default FetchComponent;