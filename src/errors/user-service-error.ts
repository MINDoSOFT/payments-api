class UserNotFoundError extends MyError {
    username: string;
    constructor(username: string) {
      super("Could not find user with username: " + username);
      this.username = username;
    }
  }

class UserPasswordInvalidError extends MyError {
    username: string;
    constructor(username: string) {
      super("Password does not match with password for username: " + username);
      this.username = username;
    }
  }