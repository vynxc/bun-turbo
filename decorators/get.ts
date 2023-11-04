import {Turbo} from "..";
import {RouteHandler} from "../types/bun-route";


export function Get<Route extends string>(routeString: Route, server: Turbo) {
    return function (
        target: Object,
        propertyKey: string,
        descriptor: TypedPropertyDescriptor<RouteHandler<Route, Response>>
    ) {
        const method = descriptor.value!;
        server.get(routeString, method);
    };
}



