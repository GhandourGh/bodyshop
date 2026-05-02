// API response types matching FastAPI contract

export interface Detection {
  class: string
  confidence: number
  bbox: [number, number, number, number]
}

export interface DamageResponse {
  filename: string
  detections: Detection[]
  detection_count: number
  severity_score: number
}

export interface RepairFeatures {
  vehicle_type: 'sedan' | 'suv' | 'truck' | 'hatchback' | 'luxury' | 'van'
  damage_type: 'dent' | 'scratch' | 'crack' | 'paint' | 'multiple'
  severity: number
  parts_count: number
  mechanic_skill: number
}

export interface TimeResponse {
  predicted_hours: number
}

export interface CostResponse {
  predicted_cost_usd: number
}

export interface MechanicResult {
  mechanic_id: number
  name: string
  specialty: string
  skill_level: number
  workload: number
  score: number
}

export interface MechanicAssignResponse {
  ranked_mechanics: MechanicResult[]
}

export interface MechanicAssignRequest {
  job_type: string
  required_skill: number
  estimated_hours: number
}

export interface InventoryResponse {
  part_category: string
  days: number
  forecast_units: number
  daily_avg: number
  low_stock_alert: boolean
}

export interface MessageRequest {
  message_type: 'status_update' | 'delay' | 'completion' | 'follow_up'
  customer_name: string
  job_details: string
  language: 'en' | 'ar'
}

export interface MessageResponse {
  message: string
  language: string
  message_type: string
}

export interface SentimentResponse {
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
}

// Mock data types
export interface MockJob {
  id: string
  customer: string
  vehicle: string
  vehicleType: string
  damageType: string
  status: 'pending' | 'in_progress' | 'done'
  estimatedCost: number
  estimatedHours: number
  mechanic: string
  created: string
  severity: number
  partsCount: number
}

export interface MockCustomer {
  id: string
  name: string
  email: string
  phone: string
  vehicleCount: number
  totalJobs: number
  joinDate: string
  avatar?: string
}

export interface MockVehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
  owner: string
  status: 'active' | 'in_repair' | 'ready'
  color: string
}

export interface MockMechanic {
  id: string
  name: string
  specialty: string
  skillLevel: number
  workload: number
  jobsCompleted: number
  rating: number
  email: string
}

export interface MockPart {
  id: string
  name: string
  stock: number
  price: number
  category: string
  threshold: number
}
