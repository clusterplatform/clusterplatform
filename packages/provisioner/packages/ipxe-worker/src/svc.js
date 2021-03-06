import Queue from "moleculer-bull";
import Ipxe from "./lib";

export default {
  name: "ipxe-worker",
  queues: {
    "ipxe-worker.create": async function(job) {
      await this.logger.info("Creating new ipxe artifact", job.data);
      await job.progress(0);
      const ipxe = new Ipxe({
        downloaddir: "/tmp/clusterplatform/app/ipxe/downloaddir",
        builddir: `/tmp/clusterplatform/app/ipxe/builddir`,
        distdir: `/tmp/clusterplatform/app/ipxe/distdir`,
        artifactId: job.data.artifactId
      });
      await job.progress(10);
      await ipxe.download({
        remote: "https://github.com/pojntfx/ipxe.git" // Use fork to fix bug in build system
      });
      await job.progress(20);
      if (job.data.platform === "bin-arm64-efi") {
        await ipxe.patchForAarch64();
      }
      await job.progress(30);
      await ipxe.build(job.data);
      await job.progress(50);
      await ipxe.package();
      await job.progress(70);
      await ipxe.upload({
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
  },
  mixins: [
    Queue({
      redis: {
        host: process.env.REDIS_HOST
      }
    })
  ]
};
