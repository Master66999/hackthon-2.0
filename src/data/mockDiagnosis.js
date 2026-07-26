// ============================================================
// Mock Diagnosis Engine
// In production, replace simulateDiagnosis() with a real API call
// TODO: Replace with: POST /api/diagnose { crop, imageFile }
// ============================================================

import { getCropById } from './crops.js';

/**
 * Simulates an async AI diagnosis with variable latency.
 * @param {string} cropId - The selected crop ID
 * @param {File} imageFile - The uploaded image (not used in mock)
 * @returns {Promise<DiagnosisResult>}
 */
export async function simulateDiagnosis(cropId, imageFile) {
  // Simulate network + inference latency (2.5–4s)
  const delay = 2500 + Math.random() * 1500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const crop = getCropById(cropId);
  if (!crop) throw new Error(`Unknown crop: ${cropId}`);

  // Pick a weighted random disease (healthy weighted lower)
  const diseases = crop.diseases;
  const weights = diseases.map((d) => (d.id === 'healthy' ? 0.15 : 0.85 / (diseases.length - 1)));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let rand = Math.random() * totalWeight;
  let selectedDisease = diseases[0];
  for (let i = 0; i < diseases.length; i++) {
    rand -= weights[i];
    if (rand <= 0) {
      selectedDisease = diseases[i];
      break;
    }
  }

  // Generate realistic confidence score
  const isHealthy = selectedDisease.id === 'healthy';
  const confidence = isHealthy
    ? 88 + Math.floor(Math.random() * 9)
    : 65 + Math.floor(Math.random() * 28);

  // Generate plausible top-3 predictions
  const otherDiseases = diseases.filter((d) => d.id !== selectedDisease.id);
  const shuffled = [...otherDiseases].sort(() => Math.random() - 0.5);
  const alternatives = shuffled.slice(0, 2).map((d) => ({
    name: d.name,
    confidence: Math.floor(Math.random() * (100 - confidence) * 0.6),
  }));

  return {
    crop,
    disease: selectedDisease,
    confidence,
    alternatives,
    timestamp: new Date().toISOString(),
    imageUrl: imageFile ? URL.createObjectURL(imageFile) : null,
  };
}
