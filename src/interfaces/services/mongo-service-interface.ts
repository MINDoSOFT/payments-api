import { MongoServiceType } from "../../services/mongo-service";

export interface initMongoInput {
  mongoType: MongoServiceType;
  username: string;
  password: string;
}

export interface initMongoOutput {
  success: boolean;
}
