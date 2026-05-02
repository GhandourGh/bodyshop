export const dynamic = 'force-dynamic';
import { authenticate } from '@/middlewares/authMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import prisma from '@/lib/db';

export async function GET(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const customer = await prisma.customers.findUnique({
      where: { id },
      include: {
        users: { select: { name: true, email: true, created_at: true } },
        vehicles: true,
        jobs: {
          orderBy: { created_at: 'desc' },
          include: { vehicles: { select: { make: true, model: true, year: true } } }
        }
      }
    });

    if (!customer) return errorResponse('Customer not found', 404);

    return successResponse({
      id: customer.id,
      name: customer.users?.name,
      email: customer.users?.email,
      phone: customer.phone,
      memberSince: customer.users?.created_at,
      vehicles: customer.vehicles,
      jobs: customer.jobs.map(j => ({
        id: j.id,
        vehicle: j.vehicles ? `${j.vehicles.year} ${j.vehicles.make} ${j.vehicles.model}` : 'Unknown',
        status: j.status,
        estimatedCost: j.estimated_cost,
        created: j.created_at,
      })),
    }, 'Customer retrieved');
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function DELETE(request, { params }) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    await prisma.customers.delete({ where: { id } });
    return successResponse(null, 'Customer deleted');
  } catch (err) {
    return errorResponse(err.message, 400);
  }
}
