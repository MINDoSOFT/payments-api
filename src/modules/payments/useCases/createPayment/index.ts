import { MongoService } from "../../../../services/mongo-service";
import { MongoPaymentRepo } from "../../repos/mongoPaymentRepo";
import { CreatePayment } from "./createPayment";
import { CreatePaymentController } from "./createPaymentController";

const mongoService = MongoService.getInstance();

const mongoPaymentRepo = new MongoPaymentRepo(mongoService);

const createPayment = new CreatePayment(mongoPaymentRepo)

const createPaymentController = new CreatePaymentController(createPayment);

export {
  createPaymentController
}