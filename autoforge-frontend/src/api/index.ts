import apiClient from './client'
import type {
  DamageResponse,
  RepairFeatures,
  TimeResponse,
  CostResponse,
  MechanicAssignRequest,
  MechanicAssignResponse,
  InventoryResponse,
  MessageRequest,
  MessageResponse,
  SentimentResponse,
} from '@/types'

// 1. Damage Detection — multipart image upload
export const predictDamage = async (imageFile: File): Promise<DamageResponse> => {
  const formData = new FormData()
  formData.append('image', imageFile)
  // Do NOT set Content-Type manually — axios must generate it with the multipart boundary
  const { data } = await apiClient.post<DamageResponse>('/predict-damage', formData)
  return data
}

// 2. Repair Time Prediction
export const predictTime = async (features: RepairFeatures): Promise<TimeResponse> => {
  const { data } = await apiClient.post<TimeResponse>('/predict-time', features)
  return data
}

// 3. Repair Cost Prediction
export const predictCost = async (features: RepairFeatures): Promise<CostResponse> => {
  const { data } = await apiClient.post<CostResponse>('/predict-cost', features)
  return data
}

// 4. Mechanic Assignment
export const assignMechanic = async (req: MechanicAssignRequest): Promise<MechanicAssignResponse> => {
  const { data } = await apiClient.post<MechanicAssignResponse>('/assign-mechanic', req)
  return data
}

// 5. Inventory Forecast
export const forecastInventory = async (
  part_category: string,
  days: number = 30
): Promise<InventoryResponse> => {
  const { data } = await apiClient.get<InventoryResponse>('/forecast-inventory', {
    params: { part_category, days },
  })
  return data
}

// 6. Generate Customer Message
export const generateMessage = async (req: MessageRequest): Promise<MessageResponse> => {
  const { data } = await apiClient.post<MessageResponse>('/generate-message', req)
  return data
}

// 7. Analyze Sentiment
export const analyzeSentiment = async (text: string): Promise<SentimentResponse> => {
  const { data } = await apiClient.post<SentimentResponse>('/analyze-sentiment', { text })
  return data
}
