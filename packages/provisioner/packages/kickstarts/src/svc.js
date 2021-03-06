import Adapter from "moleculer-db-adapter-sequelize";
import Orm from "sequelize";
import Db from "moleculer-db";

export default {
  name: "kickstarts",
  actions: {
    getOverwrite: {
      params: {
        id: "string"
      },
      handler: async function(ctx) {
        const res = await ctx.call("kickstarts.get", {
          id: ctx.params.id
        });
        ctx.meta.$responseType = "text/plain";
        return res.text;
      }
    }
  },
  mixins: [Db],
  adapter: new Adapter(process.env.POSTGRES_URI),
  model: {
    name: "kickstart",
    define: {
      text: Orm.TEXT
    }
  },
  settings: {
    entityValidator: {
      text: "string"
    }
  }
};
