import {Server} from "bun";

export interface BunRoute {
    path: string;
    method?: HttpMethod | HttpMethod[];
    handler: (request: Request, server: Server) => Promise<Response>;
}

export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    HEAD = 'HEAD'
}

export interface TurboServer extends Server {
}

export interface TurboRequest<RouteParameters> extends Request {
    params: RouteParameters;
}

export type RouteParameters<Route extends string> = string extends Route ? ParamsDictionary
    : Route extends `${string}(${string}` ? ParamsDictionary
        : Route extends `${string}:${infer Rest}` ?
            & (
                GetRouteParameter<Rest> extends never ? ParamsDictionary
                    : GetRouteParameter<Rest> extends `${infer ParamName}?` ? { [P in ParamName]?: string }
                        : { [P in GetRouteParameter<Rest>]: string }
                )
            & (Rest extends `${GetRouteParameter<Rest>}${infer Next}` ? RouteParameters<Next> : unknown)
            : {};

type RemoveTail<S extends string, Tail extends string> = S extends `${infer P}${Tail}` ? P : S;
type GetRouteParameter<S extends string> = RemoveTail<
    RemoveTail<RemoveTail<S, `/${string}`>, `-${string}`>,
    `.${string}`
>;

export interface ParamsDictionary {
    [key: string]: string;
}


export type RouteObject<Route extends string, Response> = {
    path: Route;
    routePartsMeta: RoutePartMeta[];
    method: HttpMethod;
    handler: RouteHandler<Route, Response>;
};

export interface RouteHandler<Route extends string, Response> {
    (request: TurboRequest<RouteParameters<Route>>, server: TurboServer): Promise<Response>;
}

export interface RoutePartMeta {
    part:string;
    startsWithColon: boolean;
    endsWithQuestionMark: boolean;
    paramName: string;
}