import {Turbo} from "./index";
import {RouteParameters, TurboRequest, TurboServer} from "./types/bun-route.ts";
import {Get} from "./decorators/get.ts";

export const turbo = new Turbo();


turbo
    .get("/fibonacci/:number",
        async (request, server) =>{
            const number = request.params.number;
            if (number === undefined) {
                return new Response("Please provide a number");
            }
            const n = parseInt(number);
            if (isNaN(n)) {
                return new Response("Please provide a number");
            }
            const result = slowFibonacci(n);
            return new Response(result.toString());
        }).get("/:name/:age?", async (request, server) => {return new Response("Hello " + request.params.name + " you are " + request.params.age + " years old")});


turbo.listen(5000);

console.log(`Listening on http://localhost:${turbo.server!.port} ...`);
function slowFibonacci(n: number): number {
    if (n <= 0) {
      return 0;
    } else if (n === 1) {
      return 1;
    } else {
      return slowFibonacci(n - 1) + slowFibonacci(n - 2);
    }
  }
// const testRoute2 = '/testing/test2'

// const proxyRoute = "*"

// export class Home {
//     @Get(testRoute, turbo)
//     public async test(request: TurboRequest<RouteParameters<typeof testRoute>>, server: TurboServer) {
//         return new Response("Test Route");
//     }

//     @Get(testRoute2, turbo)
//     public async test2(request: TurboRequest<RouteParameters<typeof testRoute2>>, server: TurboServer) {
//         return new Response("Test2 Route");
//     }

//     @Get(proxyRoute, turbo)
//     public async proxy(request: TurboRequest<RouteParameters<typeof proxyRoute>>, server: TurboServer) {

//         const uri = new URL(request.url);
//         const url = uri.pathname.substring(1);
//         const query = uri.search;
//         const finalUrl = url + query;
//         const response = await fetch(finalUrl);
//         response.headers.delete("Content-Security-Policy");
//         response.headers.delete("Transfer-Encoding");
//         response.headers.delete("Content-Encoding");
//         return response;
//     }
// }

turbo.listen(3000);
