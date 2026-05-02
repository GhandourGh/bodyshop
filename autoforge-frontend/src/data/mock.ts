import type { MockJob, MockCustomer, MockVehicle, MockMechanic, MockPart } from '@/types'

export const mockJobs: MockJob[] = [
  { id: 'j1', customer: 'Fadi Khalil', vehicle: '2022 BMW X5', vehicleType: 'suv', damageType: 'dent', status: 'in_progress', estimatedCost: 1240, estimatedHours: 6.5, mechanic: 'Fadi Karam', created: '2026-04-28', severity: 0.7, partsCount: 3 },
  { id: 'j2', customer: 'Sarah Mitchell', vehicle: '2021 Toyota Camry', vehicleType: 'sedan', damageType: 'scratch', status: 'pending', estimatedCost: 380, estimatedHours: 2.0, mechanic: 'Samir Khoury', created: '2026-04-30', severity: 0.3, partsCount: 1 },
  { id: 'j3', customer: 'Rami Haddad', vehicle: '2020 Mercedes C-Class', vehicleType: 'luxury', damageType: 'crack', status: 'done', estimatedCost: 2100, estimatedHours: 9.0, mechanic: 'Mike Wrench', created: '2026-04-15', severity: 0.85, partsCount: 5 },
  { id: 'j4', customer: 'Lina Nassar', vehicle: '2023 Jeep Cherokee', vehicleType: 'suv', damageType: 'multiple', status: 'pending', estimatedCost: 3200, estimatedHours: 14.0, mechanic: 'Lara Haddad', created: '2026-05-01', severity: 0.95, partsCount: 8 },
  { id: 'j5', customer: 'James O\'Brien', vehicle: '2019 Honda Civic', vehicleType: 'sedan', damageType: 'paint', status: 'in_progress', estimatedCost: 650, estimatedHours: 4.0, mechanic: 'Samir Khoury', created: '2026-04-29', severity: 0.4, partsCount: 2 },
  { id: 'j6', customer: 'Nadia Frem', vehicle: '2024 Audi A6', vehicleType: 'luxury', damageType: 'dent', status: 'done', estimatedCost: 1890, estimatedHours: 8.0, mechanic: 'Fadi Karam', created: '2026-04-10', severity: 0.65, partsCount: 4 },
  { id: 'j7', customer: 'Tom Barakat', vehicle: '2022 Ford F-150', vehicleType: 'truck', damageType: 'multiple', status: 'in_progress', estimatedCost: 4200, estimatedHours: 18.0, mechanic: 'Mike Wrench', created: '2026-04-27', severity: 0.9, partsCount: 10 },
  { id: 'j8', customer: 'Maya Rizk', vehicle: '2021 Kia Sportage', vehicleType: 'suv', damageType: 'scratch', status: 'pending', estimatedCost: 290, estimatedHours: 1.5, mechanic: 'Lara Haddad', created: '2026-05-01', severity: 0.2, partsCount: 1 },
]

export const mockCustomers: MockCustomer[] = [
  { id: 'c1', name: 'Fadi Khalil', email: 'fadi.khalil@gmail.com', phone: '+961 71 234 567', vehicleCount: 2, totalJobs: 4, joinDate: '2024-03-15' },
  { id: 'c2', name: 'Sarah Mitchell', email: 'sarah.mitchell@outlook.com', phone: '+1 617 555 0182', vehicleCount: 1, totalJobs: 2, joinDate: '2024-08-22' },
  { id: 'c3', name: 'Rami Haddad', email: 'rami.haddad@hotmail.com', phone: '+961 76 891 234', vehicleCount: 3, totalJobs: 7, joinDate: '2023-11-08' },
  { id: 'c4', name: 'Lina Nassar', email: 'lina.nassar@gmail.com', phone: '+961 70 345 678', vehicleCount: 1, totalJobs: 1, joinDate: '2026-04-30' },
  { id: 'c5', name: 'James O\'Brien', email: 'j.obrien@company.ie', phone: '+353 86 123 4567', vehicleCount: 2, totalJobs: 3, joinDate: '2025-01-14' },
  { id: 'c6', name: 'Nadia Frem', email: 'nadia.frem@gmail.com', phone: '+961 78 567 890', vehicleCount: 1, totalJobs: 5, joinDate: '2023-07-20' },
]

export const mockVehicles: MockVehicle[] = [
  { id: 'v1', make: 'BMW', model: 'X5', year: 2022, vin: '5UXCR6C09N9J12345', owner: 'Fadi Khalil', status: 'in_repair', color: '#1a1a2e' },
  { id: 'v2', make: 'Toyota', model: 'Camry', year: 2021, vin: '4T1B11HK0MU012345', owner: 'Sarah Mitchell', status: 'active', color: '#c0c0c0' },
  { id: 'v3', make: 'Mercedes-Benz', model: 'C-Class', year: 2020, vin: 'WDDWF4JB0LR123456', owner: 'Rami Haddad', status: 'ready', color: '#1c1c1c' },
  { id: 'v4', make: 'Jeep', model: 'Cherokee', year: 2023, vin: '1C4PJMLB0PD123456', owner: 'Lina Nassar', status: 'in_repair', color: '#2d4a22' },
  { id: 'v5', make: 'Honda', model: 'Civic', year: 2019, vin: '19XFC2F52KE123456', owner: 'James O\'Brien', status: 'in_repair', color: '#8b0000' },
]

export const mockMechanics: MockMechanic[] = [
  { id: 'm1', name: 'Fadi Karam', specialty: 'Body Repair', skillLevel: 5, workload: 0.75, jobsCompleted: 284, rating: 4.9, email: 'fadi.karam@autoforge.com' },
  { id: 'm2', name: 'Samir Khoury', specialty: 'Paint & Finishing', skillLevel: 4, workload: 0.6, jobsCompleted: 198, rating: 4.7, email: 'samir.khoury@autoforge.com' },
  { id: 'm3', name: 'Mike Wrench', specialty: 'Engine & Mechanical', skillLevel: 5, workload: 0.9, jobsCompleted: 341, rating: 4.8, email: 'mike.wrench@autoforge.com' },
  { id: 'm4', name: 'Lara Haddad', specialty: 'Electrical Systems', skillLevel: 3, workload: 0.4, jobsCompleted: 112, rating: 4.5, email: 'lara.haddad@autoforge.com' },
]

export const mockParts: MockPart[] = [
  { id: 'p1', name: 'Front Bumper Assembly', stock: 8, price: 420, category: 'bumpers', threshold: 10 },
  { id: 'p2', name: 'Headlight Unit (Left)', stock: 3, price: 280, category: 'headlights', threshold: 5 },
  { id: 'p3', name: 'Door Panel (Front Right)', stock: 12, price: 340, category: 'body-panels', threshold: 8 },
  { id: 'p4', name: 'Side Mirror Assembly', stock: 2, price: 95, category: 'mirrors', threshold: 6 },
  { id: 'p5', name: 'Windshield (OEM)', stock: 4, price: 650, category: 'windshields', threshold: 5 },
]

export const mockRevenue = [
  { month: 'Nov', revenue: 38400 },
  { month: 'Dec', revenue: 42100 },
  { month: 'Jan', revenue: 35800 },
  { month: 'Feb', revenue: 48200 },
  { month: 'Mar', revenue: 52600 },
  { month: 'Apr', revenue: 61400 },
]

export const mockJobsByStatus = [
  { name: 'Pending', value: 3, color: '#fbbf24' },
  { name: 'In Progress', value: 3, color: '#60a5fa' },
  { name: 'Done', value: 2, color: '#4ade80' },
]
