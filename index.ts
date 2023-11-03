import {Turbo} from "./router";

var turbo = new Turbo();

turbo
    .get("/:demo/:test",
        async (request, server) =>
            new Response(request.params.demo + " " + request.params.test))


turbo.listen(3000);

console.log(`Listening on http://localhost:${turbo.server!.port} ...`);
