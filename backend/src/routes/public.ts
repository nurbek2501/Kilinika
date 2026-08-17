import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/services', async (_req, res) => {
  try {
    const services = await prisma.servicePrice.findMany({
      where: { isActive: true },
      orderBy: { nameUz: 'asc' },
    });
    sendSuccess(res, services);
  } catch {
    sendError(res, 'Failed to load services', 500);
  }
});

router.get('/doctors', async (_req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR', isActive: true },
      select: { id: true, name: true, specialty: true },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, doctors);
  } catch {
    sendError(res, 'Failed to load doctors', 500);
  }
});

const appointmentSchema = z.object({
  patientName: z.string().min(1),
  patientPhone: z.string().min(1),
  doctorId: z.string().uuid(),
  serviceType: z.string().optional(),
});

router.post('/appointments', validate(appointmentSchema), async (req, res) => {
  try {
    // Ensure the target is a real, active doctor — a random UUID would hit an FK
    // error (500) and a valid non-doctor id would pollute that user's queue.
    const doctor = await prisma.user.findFirst({
      where: { id: req.body.doctorId, role: 'DOCTOR', isActive: true },
      select: { id: true },
    });
    if (!doctor) {
      sendError(res, 'Doctor not found', 400);
      return;
    }

    const appointment = await prisma.appointment.create({
      data: {
        ...req.body,
        source: 'WEB',
        status: 'PENDING',
      },
    });
    sendSuccess(res, appointment, 'Appointment booked', 201);
  } catch {
    sendError(res, 'Failed to book appointment', 500);
  }
});

export default router;
