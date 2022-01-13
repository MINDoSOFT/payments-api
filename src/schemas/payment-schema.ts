import { z } from "zod";

export const PaymentStatusEnum = z.enum(["created", "approved", "cancelled"]);

export const CreatePaymentSchema = z.object({
    payeeId: z.string().uuid(),
    payerId: z.string().uuid(),
    paymentSystem: z.string().min(1),
    paymentMethod: z.string().min(1),
    amount: z.number(),
    currency: z.string().min(1),
    comment: z.string(),
});

export const PaymentSchema = CreatePaymentSchema.extend({
    id: z.string().uuid(),
    status: PaymentStatusEnum,
    created: z.date(),
    updated: z.date(),
})

export const GetPaymentSchema = z.object({
    id: z.string().uuid(),
})

export const ApprovePaymentSchema = GetPaymentSchema
export const CancelPaymentSchema = GetPaymentSchema