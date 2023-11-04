import { Server } from "bun";
import {
  HttpMethod,
  RouteHandler,
  RouteObject,
  RouteParameters,
  RoutePartMeta,
  TurboRequest,
} from "./types/bun-route";
import { TObject, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

export class Turbo {
  private routes: Array<RouteObject<any, any, any>> = [];
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
    const routeParts = routeString.replace(/^\//, "").split("/");

    const routePartsMeta = routeParts.map((part) => {
      return {
        part: part,
        startsWithColon: part.startsWith(":"),
        paramName: part.replace(":", "").replace(/\?$/, ""),
        endsWithQuestionMark: part.endsWith("?"),
      } satisfies RoutePartMeta;
    });
    const route: RouteObject<Route, Response> = {
      routePartsMeta: routePartsMeta,
      path: routeString,
      method: HttpMethod.GET,
      handler: method,
    };
    this.routes.push(route);
    this.routes.sort((a, b) => {
      if (a.path === "*") return -1;
      if (b.path === "*") return 1;
      const staticPartsA = (a.path as string)
        .split("/")
        .filter((part) => !part.startsWith(":")).length;
      const staticPartsB = (b.path as string)
        .split("/")
        .filter((part) => !part.startsWith(":")).length;
      return staticPartsB - staticPartsA;
    });

    return this;
  }

  public post<Route extends string, Response, Scheme extends TObject>(
    routeString: Route,
    method: RouteHandler<Route, Response, Scheme>,
    bodyScheme?: Scheme
  ) {
    const routeParts = routeString.replace(/^\//, "").split("/");

    const routePartsMeta = routeParts.map((part) => {
      return {
        part: part,
        startsWithColon: part.startsWith(":"),
        paramName: part.replace(":", "").replace(/\?$/, ""),
        endsWithQuestionMark: part.endsWith("?"),
      } satisfies RoutePartMeta;
    });
    const route: RouteObject<Route, Response, Scheme> = {
      routePartsMeta: routePartsMeta,
      path: routeString,
      method: HttpMethod.POST,
      handler: method,
      bodyScheme: bodyScheme,
    };
    this.routes.push(route);
    this.routes.sort((a, b) => {
      if (a.path === "*") return -1;
      if (b.path === "*") return 1;
      const staticPartsA = (a.path as string)
        .split("/")
        .filter((part) => !part.startsWith(":")).length;
      const staticPartsB = (b.path as string)
        .split("/")
        .filter((part) => !part.startsWith(":")).length;
      return staticPartsB - staticPartsA;
    });

    return this;
  }

  private handle = async (
    request: Request,
    server: Server
  ): Promise<Response> => {
    try {
      const url = new URL(request.url);
      let route = this.routes.find((route) => {
        return matchRoute(route.routePartsMeta, url.pathname);
      });

      if (!route && this.routes.at(0)?.path === "*") {
        route = this.routes[0];
      } else if (!route) return new Response("Not found", { status: 404 });

      if (
        ![route.method ?? HttpMethod.GET, HttpMethod.HEAD].includes(
          request.method as HttpMethod
        )
      ) {
        return new Response("Method Not Allowed", { status: 405 });
      }
      const turboRequest = request as TurboRequest<
        RouteParameters<typeof route.path>
      >;
      turboRequest.params = extractParams(route.routePartsMeta, url.pathname);

      if (request.method === HttpMethod.GET) {
        return await route.handler(turboRequest, server);
      }
      if (request.method === HttpMethod.POST) {
        try {
          const body = await request.json();
          if (route.bodyScheme) {
            if (!Value.Check(route.bodyScheme, body)) {
              const error = Value.Errors(route.bodyScheme, body).First();
              if (error) {
                const { path, value, message } = error;
                return new Response(
                  `Invalid Body: ${message} at ${path} with value ${value}`,
                  { status: 400 }
                );
              }
              return new Response("Invalid Body", { status: 400 });
            }
          }
          return await route.handler(turboRequest, server, body);
        } catch (e) {
          if (e instanceof Error)
            return new Response("Invalid Body:" + e.message, { status: 400 });
          
          return new Response("Invalid Body", { status: 400 });
        }
      }
      if (request.method === HttpMethod.HEAD) {
        const handler = await route.handler(turboRequest, server);
        return new Response(null, {
          status: handler.status,
          statusText: handler.statusText,
          headers: handler.headers,
        });
      } else {
        return new Response("No Method Found", { status: 500 });
      }
    } catch (e) {
      console.error(e);
      return new Response("Internal Server Error", { status: 500 });
    }
  };
}

function extractParams(
  routeParts: RoutePartMeta[],
  url: string
): Record<string, string> {
  const urlParts = url.split("/").filter(Boolean);
  let params: Record<string, string> = {};
  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWithColon) {
      const paramName = routeParts[i].paramName;
      if (i < urlParts.length) {
        params[paramName] = urlParts[i];
      }
    }
  }

  return params;
}

function matchRoute(routeParts: RoutePartMeta[], url: string) {
  const urlParts = url.split("/").filter(Boolean);
  const partsLength = routeParts.length;

  for (let i = 0; i < partsLength; i++) {
    const { startsWithColon, endsWithQuestionMark, part } = routeParts[i];
    const urlPart = urlParts[i];

    if (startsWithColon) {
      if (endsWithQuestionMark && !urlPart) {
        continue;
      }
      if (!urlPart) {
        return false;
      }
    } else if (part !== urlPart) {
      return false;
    }
  }

  return urlParts.length <= partsLength;
}
