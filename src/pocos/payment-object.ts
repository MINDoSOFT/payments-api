export interface CreatePaymentObject {
    payeeId: string,
    payerId: string,
    paymentSystem: string,
    paymentMethod: string,
    amount: number,
    currency: string,
    status: string,
    comment: string,
}

export interface PaymentObject extends CreatePaymentObject {
    id: string,
    created: string,
    updated: string,    
}