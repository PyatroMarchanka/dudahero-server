import express from "express";
import { logger } from "./logger";

// Function to log all registered routes
export const logRoutes = (app: express.Application) => {
  const routes: { path: string; methods: string[] }[] = [];

  const processStack = (stack: any[], basePath: string = "") => {
    logger.info("Registered Routes:");
    stack.forEach((middleware: any) => {
      if (middleware.route) {
        // Routes registered directly on the app
        routes.push({
          path: basePath + middleware.route.path,
          methods: Object.keys(middleware.route.methods).map((method) =>
            method.toUpperCase()
          ),
        });
      } else if (middleware.name === "router") {
        // Router middleware
        const routerPath = middleware.regexp.source
          .replace("^\\/", "")
          .replace("\\/?(?=\\/|$)", "")
          .replace(/\\\//g, "/");
        logger.info(`Router: ${routerPath}`);

        middleware.handle.stack.forEach((handler: any) => {
          if (handler.route) {
            const route = {
              path: basePath + "/" + routerPath + handler.route.path,
              methods: Object.keys(handler.route.methods).map((method) =>
                method.toUpperCase()
              ),
            };
            console.log(route);
            logger.warn(`${route.path} ${route.methods}`);
          }
        });
      }
    });
  };

  processStack(app._router.stack);
};
