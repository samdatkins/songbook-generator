exports.up = async function(knex, Promise) {
  return await knex.schema.table("songbook", t => {
    t.integer("max_active_songs");
  });
};

exports.down = async function(knex, Promise) {
  return await knex.schema.table("songbook", t => {
    t.dropColumn("max_active_songs");
  });
};
