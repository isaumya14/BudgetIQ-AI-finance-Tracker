import arcjet, { tokenBucket } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["userId"],
  rules: [
    tokenBucket({
      mode: "LIVE",
      refillRate: 10,   // tokens added per interval
      interval: 3600,   // in seconds (1 hour here)
      capacity: 10,     // bucket size
    }),
  ],
});

export default aj;
