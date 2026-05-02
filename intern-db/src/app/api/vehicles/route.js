export const dynamic = 'force-dynamic';
import { listVehicles, addVehicle } from '@/controllers/vehicleController';
import { authenticate } from '@/middlewares/authMiddleware';

export async function GET(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  return listVehicles(request);
}

export async function POST(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  return addVehicle(request);
}
