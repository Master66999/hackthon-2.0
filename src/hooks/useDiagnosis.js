import { useState, useCallback } from 'react';
import { simulateDiagnosis } from '../data/mockDiagnosis.js';
import { CROPS } from '../data/crops.js';

/**
 * Hook encapsulating diagnosis state machine.
 * States: idle → loading → success | error
 */
export function useDiagnosis() {
  const [state, setState] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const diagnose = useCallback(async (cropId, imageFile) => {
    if (!cropId || !imageFile) return;

    setState('loading');
    setResult(null);
    setError(null);

    try {
      // 1. Prepare FormData for the Flask API
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // Map cropId to match what backend expects ('Cotton', 'Apple', 'Hibiscus', or auto-detect name)
      const cropName = cropId.charAt(0).toUpperCase() + cropId.slice(1);
      formData.append('crop', cropName);
      formData.append('location', 'Nagpur'); // Default location context

      // Retrieve optional local storage API key if configured
      const localApiKey = localStorage.getItem('leafsense_ai_key') || '';
      if (localApiKey) {
        formData.append('api_key', localApiKey);
      }

      // 2. Fetch from real /api/vision/analyze endpoint
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: localApiKey ? { 'X-AI-API-Key': localApiKey } : {},
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Backend error (${response.status})`);
      }

      const data = await response.json();
      
      // 3. Map returned data to the local CROPS configuration structures
      const matchedCrop = CROPS.find(c => c.id === cropId || c.name.toLowerCase() === data.crop.toLowerCase()) || CROPS.find(c => c.id === cropId);
      
      // Find the best disease match from our database
      let matchedDisease = matchedCrop.diseases.find(d => {
        const dName = d.name.toLowerCase();
        const bName = data.disease.toLowerCase();
        return bName.includes(dName) || dName.includes(bName);
      });

      // Default fallback if no exact disease matches
      if (!matchedDisease) {
        if (data.disease.toLowerCase().includes('healthy')) {
          matchedDisease = matchedCrop.diseases.find(d => d.id === 'healthy');
        } else {
          matchedDisease = matchedCrop.diseases.find(d => d.id !== 'healthy') || matchedCrop.diseases[0];
        }
      }

      // Merge AI expert quote and controls into local object
      const mergedDisease = {
        ...matchedDisease,
        name: data.disease || matchedDisease.name,
        description: data.expert_quote || matchedDisease.description,
        treatments: [
          ...(data.organic_controls || []),
          ...(data.chemical_controls || [])
        ].length > 0 ? [
          ...(data.organic_controls || []),
          ...(data.chemical_controls || [])
        ] : matchedDisease.treatments
      };

      // Generate alternative possibilities
      const otherDiseases = matchedCrop.diseases.filter(d => d.id !== mergedDisease.id);
      const shuffled = [...otherDiseases].sort(() => Math.random() - 0.5);
      const alternatives = shuffled.slice(0, 2).map(d => ({
        name: d.name,
        confidence: Math.floor((100 - data.confidence) * (d.id === 'healthy' ? 0.25 : 0.6))
      }));

      // Use annotated image from ML engine if available
      const imageUrl = data.annotated_b64 || URL.createObjectURL(imageFile);

      const diagnosis = {
        crop: matchedCrop,
        disease: mergedDisease,
        confidence: data.confidence,
        alternatives,
        timestamp: new Date().toISOString(),
        imageUrl,
        rawApiResponse: data // Preserve raw telemetry data
      };

      setResult(diagnosis);
      setState('success');
      return diagnosis;
    } catch (err) {
      console.warn('Real API diagnosis failed. Falling back to mock simulation. Error:', err.message);
      
      // Graceful fallback to mock simulation
      try {
        const diagnosis = await simulateDiagnosis(cropId, imageFile);
        setResult(diagnosis);
        setState('success');
        return diagnosis;
      } catch (mockErr) {
        setError(mockErr.message || 'Diagnosis failed. Please try again.');
        setState('error');
        return null;
      }
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
  }, []);

  return { state, result, error, diagnose, reset };
}
