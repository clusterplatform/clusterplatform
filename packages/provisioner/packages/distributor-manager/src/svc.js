const Db = require("moleculer-db");
const Adapter = require("moleculer-db-adapter-sequelize");
const Orm = require("sequelize");

module.exports = {
  name: "distributor-manager",
  mixins: [Db],
  adapter: new Adapter(process.env.POSTGRES_URI),
  model: {
    name: "distributor",
    define: {
      nodeId: Orm.STRING,
      tag: Orm.STRING
    }
  },
  actions: {
    listOverwrite: async function(ctx) {
      const allDistributors = (await ctx.call("distributor-manager.list")).rows;
      const nonPingableDistributors = [];
      for (distributor of allDistributors) {
        const pingable = await this.broker.ping(distributor.nodeId, 1000);
        if (!pingable) {
          nonPingableDistributors.push(distributor);
        }
      }
      for (distributor of nonPingableDistributors) {
        await ctx.call("distributor-manager.remove", {
          id: distributor.id
        });
      }
      return await ctx.call("distributor-manager.list");
    },
    updateDistributor: {
      params: {
        ipxePxeUefiUrl: "string",
        ipxePxeBiosUrl: "string",
        id: "number",
        device: "string",
        domain: "string"
      },
      handler: async function(ctx) {
        const distributor = await ctx.call("distributor-manager.get", {
          id: ctx.params.id
        });
        await ctx.call("distributor-worker.update", ctx.params, {
          nodeId: distributor.nodeId
        });
        return distributor;
      }
    }
  },
  settings: {
    entityValidator: {
      nodeId: "string",
      tag: "string"
    }
  }
};