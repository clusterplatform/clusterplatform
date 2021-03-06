import Queue from "moleculer-bull";
import Syslinux from "./lib";
import { Errors } from "moleculer";

export default {
  name: "syslinux-worker",
  queues: {
    "syslinux-worker.create": async function(job) {
      await this.logger.info("Creating new syslinux artifact", job.data);
      await job.progress(0);
      const syslinux = new Syslinux({
        builddir: `/tmp/clusterplatform/app/syslinux/builddir`,
        distdir: `/tmp/clusterplatform/app/syslinux/distdir`,
        artifactId: job.data.artifactId
      });
      await job.progress(10);
      const builded = await syslinux.build(job.data);
      if (!builded) {
        this.logger.error("ERR_FRAGMENT_NOT_FOUND", job.data);
        throw new Errors.MoleculerError(
          "Fragment not found",
          404,
          "ERR_FRAGMENT_NOT_FOUND"
        );
      } else {
        await job.progress(50);
        await syslinux.package();
        await job.progress(80);
        await syslinux.upload({
          endpoint: process.env.MINIO_ENDPOINT,
          port: parseInt(process.env.MINIO_PORT),
          region: process.env.MINIO_REGION,
          bucket: process.env.MINIO_BUCKET,
          accessKey: process.env.MINIO_ACCESS_KEY,
          secretKey: process.env.MINIO_SECRET_KEY
        });
        await job.progress(100);
        return {
          artifactId: job.data.artifactId
        };
      }
    }
  },
  mixins: [
    Queue({
      redis: {
        host: process.env.REDIS_HOST
      }
    })
  ]
};
