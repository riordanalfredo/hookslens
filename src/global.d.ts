declare module "*.css";

declare const process: {
  env: {
    NODE_ENV?: "development" | "production" | "test" | string;
    [key: string]: string | undefined;
  };
};
