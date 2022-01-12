import { ValidationError } from "./ValidationError";

export class PropertyRequiredError extends ValidationError {
    property : string;

    constructor(property: string) {
      super(`'${property}' field is required`);
      this.property = property;
    }
  }