import { PaymentObject } from "../../../pocos/payment-object";

export function getTestPayment() : {payment: PaymentObject} {
    const testPayment : PaymentObject = {
		id: "2cb2e5bc-d499-484a-a779-367f54d2154e",
		payeeId: "25b79ada-cad6-4d40-b2f2-64bcb278aa95",
		payerId: "082de763-3f1d-432d-8020-df508996e851",
		paymentSystem: "ingenico",
		paymentMethod: "mastercard",
		amount: 100500.42,
		currency: "USD",
		status: "approved",
		comment: "Salary for March",
		created: new Date(),
		updated: new Date()
	};
    return { payment: testPayment };
}