exports.up = async function(knex, Promise) {
  await knex.schema.table("songbook", t => {
    t.timestamp("last_nav_action_taken_at");
  });

  return await knex.schema.table("song_entry", t => {
    t.decimal("play_time");
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.table("songbook", t => {
    t.dropColumn("last_nav_action_taken_at");
  });

  return await knex.schema.table("song_entry", t => {
    t.dropColumn("play_time");
  });
};
