import "reflect-metadata";

interface InjectableOptions {
  scope?: "singleton" | "transient";
}

function Injectable(options: InjectableOptions = { scope: "singleton" }) {
    return function (target: any) {
        Reflect.defineMetadata("custom:injectable", options, target);
        useContainer().register(target, target);
    };
}

function Inject(token: any): ParameterDecorator {
    return (target: any, _propertyKey: unknown, parameterIndex: number) => {
        // Store custom metadata for DI
        const existingDependencies = Reflect.getMetadata("design:paramtypes", target) || [];
        existingDependencies[parameterIndex] = token;
        Reflect.defineMetadata("design:paramtypes", existingDependencies, target);
    };
}


class Container {
    private registry = new Map();
    private instanceCache = new Map();

    // Registers a dependency
    register(token: any, provider: any) {
        this.registry.set(token, provider);
    }

    // Resolves a dependency
    resolve<T>(token: any): T {

      console.log("Try resolve: ", token);

      if (this.instanceCache.has(token)) {
        console.log('resolved from cache');
        return this.instanceCache.get(token);
      }

      const provider = this.registry.get(token);
      if (!provider) {
        throw new Error(`No provider found for ${token.toString()}`);
      }

      const options: InjectableOptions = Reflect.getMetadata("custom:injectable", provider) || {};
      const scope = options.scope || "singleton";
  
      // Resolve dependencies recursively
      if (scope === "singleton") {
        if (this.instanceCache.has(token)) {
          return this.instanceCache.get(token);
        }
  
        // Create and cache the singleton instance
        const dependencies = this.resolveDependencies(provider);
        const instance = new provider(...dependencies);
        this.instanceCache.set(token, instance);
        return instance;
      }
  
      // Handle transient scope (create a new instance)
      const dependencies = this.resolveDependencies(provider);
      return new provider(...dependencies);
    }

    private resolveDependencies(provider: any): any[] {
      const dependencies = Reflect.getMetadata("design:paramtypes", provider) || [];
      return dependencies.map((dep: any) => this.resolve(dep));
    }
}

const useContainer = (() => {
  const container = new Container();
  return () => container;
})();


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


export function testDI() {

    const container = useContainer();

    const userService = container.resolve<UserService>(UserService);
    const user = userService.getUser();
    console.log(user);

    const userService2 = container.resolve<UserService2>(UserService2);
    const user2 = userService2.getUser();
    console.log(user2);

}
 