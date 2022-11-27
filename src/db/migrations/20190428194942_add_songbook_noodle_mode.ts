exports.up = async function(knex, Promise) {
  await knex.schema.table("songbook", t => {
    t.boolean("is_noodle_mode");
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.table("songbook", t => {
    t.dropColumn("is_noodle_mode");
  });
};
