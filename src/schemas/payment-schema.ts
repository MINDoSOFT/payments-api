import { z } from 'zod';
import { PaymentStatusEnum } from '../pocos/payment-object';

export const CreatePaymentSchema = z.object({
  payeeId: z.string().uuid(),
  payerId: z.string().uuid(),
  paymentSystem: z.string().min(1),
  paymentMethod: z.string().min(1),
  amount: z.number(),
  currency: z.string().min(1),
  comment: z.string()
});

export const PaymentSchema = CreatePaymentSchema.extend({
  id: z.string().uuid(),
  status: z.nativeEnum(PaymentStatusEnum),
  created: z.date(),
  updated: z.date()
});

export const GetPaymentSchema = z.object({
  id: z.string().uuid()
});

export const ApprovePaymentSchema = GetPaymentSchema;
export const CancelPaymentSchema = GetPaymentSchema;
