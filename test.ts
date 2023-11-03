import {Turbo} from "./index";
import {RouteParameters, TurboRequest, TurboServer} from "./types/bun-route.ts";
import {Get} from "./decorators/get.ts";

export const turbo = new Turbo();


turbo
    .get("/:demo/:test?",
        async (request, server) =>
            new Response(request.params.demo + " " + request.params.test))
turbo
    .get("name/:name/age/:age?",
        async (request, server) =>
            new Response(request.params.name + " " + request.params.age))

turbo.listen(3000);
console.log(`Listening on http://localhost:${turbo.server!.port} ...`);
const testRoute = '/testing/test'
const testRoute2 = '/testing/test'

const proxyRoute = "*"

export class Home {
    @Get(testRoute, turbo)
    public async test(request: TurboRequest<RouteParameters<typeof testRoute>>, server: TurboServer) {
        return new Response("Test Route");
    }

    @Get(testRoute2, turbo)
    public async test2(request: TurboRequest<RouteParameters<typeof testRoute2>>, server: TurboServer) {
        return new Response("Test2 Route");
    }

    @Get(proxyRoute, turbo)
    public async proxy(request: TurboRequest<RouteParameters<typeof proxyRoute>>, server: TurboServer) {

        const uri = new URL(request.url);
        const url = uri.pathname.substring(1);
        const query = uri.search;
        const finalUrl = url + query;
        const response = await fetch(finalUrl);
        response.headers.delete("Content-Security-Policy");
        response.headers.delete("Transfer-Encoding");
        response.headers.delete("Content-Encoding");
        return response;
    }
}

