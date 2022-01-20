import { EntityRepository } from "@mikro-orm/core";
import { Payment } from "../entities/Payment";
import { PaymentObject, CreatePaymentObject } from "../pocos/payment-object";
import { MongoService } from "../services/mongo-service";
import { IPaymentRepo } from "./payment-repo";

export class MongoPaymentRepo implements IPaymentRepo {
    private paymentRepository : EntityRepository<Payment>;

    constructor (mongoService : MongoService) {
        this.paymentRepository = mongoService.getEntityManager().getRepository(Payment);
    }

    async findById(id: string): Promise<PaymentObject | undefined> {
        const payment = await this.paymentRepository.findOne({ _id : id })
        if (payment == null)
            return;

        const paymentObject = payment.mapEntityToObject();

        return paymentObject;
    }

    async list(): Promise<PaymentObject[]> {
        const payments = await this.paymentRepository.findAll();
        if (payments == null)
            return [];

        const paymentObjects : PaymentObject[] = [];

        payments.forEach(payment => {
            paymentObjects.push(payment.mapEntityToObject());
        });

        return paymentObjects;
    }

    async create(paymentToCreate: CreatePaymentObject): Promise<PaymentObject> {
        const payment = new Payment(paymentToCreate);

        await this.paymentRepository.persist(payment).flush();

        return payment.mapEntityToObject();
    }

    async update(paymentToUpdate: PaymentObject): Promise<boolean> {
        const payment = await this.paymentRepository.findOne({ _id : paymentToUpdate.id })

        if (payment) {
            payment.status = paymentToUpdate.status;
            await this.paymentRepository.persist(payment).flush();
        }

        return true;
    }

}