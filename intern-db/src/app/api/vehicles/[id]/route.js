export const dynamic = 'force-dynamic';
import { removeVehicle, editVehicle } from '@/controllers/vehicleController';
import { authenticate } from '@/middlewares/authMiddleware';

export async function DELETE(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  const { id } = await params;
  return removeVehicle(id);
}

export async function PUT(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  
  const { id } = await params;
  return editVehicle(id, request);
}
