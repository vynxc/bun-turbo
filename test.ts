import {Turbo} from "./index";
import {RouteParameters, TurboRequest, TurboServer} from "./types/bun-route.ts";
import {Get} from "./types/decorators/get.ts";

export const turbo = new Turbo();


turbo
    .get("/:demo/:test",
        async (request, server) =>
            new Response(request.params.demo + " " + request.params.test))

turbo.listen(3000);
console.log(`Listening on http://localhost:${turbo.server!.port} ...`);
const testRoute = '/testing/test'
const testRoute2 = '/testing/test'


export class Home {
    @Get(testRoute,turbo)
    public async test(request:TurboRequest<RouteParameters<typeof testRoute>>, server:TurboServer) {
        return new Response("Test Route");
    }
    @Get(testRoute2,turbo)
    public async test2(request:TurboRequest<RouteParameters<typeof testRoute2>>, server:TurboServer) {
        return new Response("Test2 Route");
    }
}