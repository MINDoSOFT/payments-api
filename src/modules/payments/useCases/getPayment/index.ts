import { MongoService } from "../../../../services/mongo-service";
import { MongoPaymentRepo } from "../../repos/mongoPaymentRepo";
import { GetPayment } from "./getPayment";
import { GetPaymentController } from "./getPaymentController";

const mongoService = MongoService.getInstance();

const mongoPaymentRepo = new MongoPaymentRepo(mongoService);

const getPayment = new GetPayment(mongoPaymentRepo)

const getPaymentController = new GetPaymentController(getPayment);

export {
  getPaymentController
}