import {Server} from "bun";
import {
    HttpMethod,
    RouteHandler,
    RouteObject,
    RouteParameters,
    TurboRequest,
} from "./types/bun-route";


export class Turbo {
    private routes: Array<RouteObject<any, any>> = [];
    public server: Server | undefined;

    public listen(port: number) {
        const handle = this.handle;
        
         this.server = Bun.serve({
            port: port,
            async fetch(request, server) {
                return await handle(request, server);
            },
        });
       
    }
 
    public get<Route extends string, Response>(
        routeString: Route,
        method: RouteHandler<Route, Response>
    ) {
        const route: RouteObject<Route, Response> = {
            path: routeString,
            method: HttpMethod.GET,
            handler: method,
        };
        this.routes.push(route);
        this.routes.sort((a, b) => {
            const staticPartsA = (a.path as string).split("/").filter(part => !part.startsWith(":")).length;
            const staticPartsB = (b.path as string).split("/").filter(part => !part.startsWith(":")).length;
            return staticPartsB - staticPartsA;
        });

        return this;
    }

    private handle = async (request: Request, server: Server): Promise<Response> => {
        try {
            const url = new URL(request.url);

            const route = this.routes.find((route) => {
                return matchRoute(route.path, url.pathname);
            });

            if (!route) return new Response("Not found", {status: 404});

            if (!(route.method ?? "GET").includes(request.method as HttpMethod))
                return new Response("Method Not Allowed", {status: 405});

            const turboRequest = request as TurboRequest<
                RouteParameters<typeof route.path>
            >;
            turboRequest.params = extractParams(
                route.path,
                url.pathname
            ) as RouteParameters<typeof route.path>;
            return await route.handler(turboRequest, server);
        } catch (e) {
            console.error(e);
            return new Response("Internal Server Error", {status: 500});
        }
    }
}

function extractParams(routePattern: string, url: string): Record<string, string> {
    const routeParts = routePattern.replace(/^\//, "").split("/");
    const urlParts = url.replace(/^\//, "").split("/");

    let params: Record<string, string> = {};

    for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(":")) {
            const paramName = routeParts[i].replace(":", "").replace(/\?$/, "");
            if (i < urlParts.length) {
                params[paramName] = urlParts[i];
            }
        }
    }

    return params;
}

function matchRoute(routePattern: string, url: string): boolean {
    const routeParts = routePattern.replace(/^\//, "").split("/");
    const urlParts = url.replace(/^\//, "").split("/");
    if(urlParts.at(0) === "" && routeParts.at(0) !== ""){
        return false;
    }
    for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(":")) {
            if (routeParts[i].endsWith("?") && i >= urlParts.length) {
                continue;
            }
            if (i >= urlParts.length) {
                return false;
            }
        } else if (routeParts[i] !== urlParts[i]) {
            return false;
        }
    }
    return true;
}