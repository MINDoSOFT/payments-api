import { MongoService } from "../../../services/mongo-service";
import { MongoPaymentRepo } from "./mongoPaymentRepo";

const mongoService = MongoService.getInstance();

const mongoPaymentRepo = new MongoPaymentRepo(mongoService);

export {
  mongoPaymentRepo
}