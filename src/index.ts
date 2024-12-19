import { Inject, Injectable, useContainer } from "./di";


@Injectable({ scope: 'singleton' })
class LoggerService {

  constructor() {
    console.log('LOGGER CREATED');
  }

  log(message: string) {
    console.log(`[Logger]: ${message}`);
  }
}

@Injectable({ scope: 'transient' })
class LoggerService2 {

  constructor() {
    console.log('LOGGER 2 CREATED');
  }

  log(message: string) {
    console.log(`[Logger2]: ${message}`);
  }
}

@Injectable()
class UserService {
    constructor(
        @Inject(LoggerService) private logger: LoggerService,
        @Inject(LoggerService2) private logger2: LoggerService2
    ) {}

    getUser() {
        this.logger.log("Fetching user...");
        this.logger2.log("Fetching user...");
        return { id: 1, name: "John Doe" };
    }
}

@Injectable()
class UserService2 {
    constructor(
        @Inject(LoggerService) private logger: LoggerService,
        @Inject(LoggerService2) private logger2: LoggerService2
    ) {}

    getUser() {
        this.logger.log("Fetching user... 2");
        this.logger2.log("Fetching user...");
        return { id: 2, name: "John Doe 2" };
    }
}


function testDI() {

    const container = useContainer();

    const userService = container.resolve<UserService>(UserService);
    const user = userService.getUser();
    console.log(user);

    const userService2 = container.resolve<UserService2>(UserService2);
    const user2 = userService2.getUser();
    console.log(user2);

}

testDI();
